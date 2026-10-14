const express = require('express');
const router = express.Router();
const db = require('../db');
const { evaluateGlucose, calculateRetinopathyRisk } = require('../aiEngine');

// List all patients (with search & filter)
router.get('/', (req, res) => {
  const { search, priority, ward } = req.query;
  let list = db.get('patients');

  if (search) {
    const s = search.toLowerCase();
    list = list.filter(p => 
      p.name.toLowerCase().includes(s) ||
      (p.abhaId && p.abhaId.toLowerCase().includes(s)) ||
      (p.phone && p.phone.includes(s)) ||
      (p.ward && p.ward.toLowerCase().includes(s))
    );
  }

  if (priority) {
    list = list.filter(p => p.priority && p.priority.toLowerCase() === priority.toLowerCase());
  }

  if (ward) {
    list = list.filter(p => p.ward && p.ward.toLowerCase().includes(ward.toLowerCase()));
  }

  res.json({ success: true, count: list.length, patients: list });
});

// Get patient by ID
router.get('/:id', (req, res) => {
  const patient = db.findById('patients', req.params.id);
  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }

  const asha = patient.assignedAshaId ? db.findById('ashaWorkers', patient.assignedAshaId) : null;
  const recentScreenings = db.find('screenings', s => s.patientId === patient.id);
  const activeVisits = db.find('visits', v => v.patientId === patient.id);

  res.json({
    success: true,
    patient,
    assignedAsha: asha,
    screenings: recentScreenings,
    visits: activeVisits
  });
});

// Register new patient
router.post('/', (req, res) => {
  const { name, age, gender, phone, ward, abhaId, height, weight, systolic, diastolic } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Patient name is required.' });
  }

  const randomAbha = abhaId || `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const newPatient = {
    id: `pat-${Date.now()}`,
    name,
    age: Number(age) || 45,
    gender: gender || 'F',
    phone: phone || '+91 98765 00000',
    height: height || '160 cm',
    weight: weight || '58 kg',
    village: 'Bishnupur Village',
    ward: ward || 'Ward 3',
    abhaId: randomAbha,
    subCenter: 'Bishnupur Sub-Center 4',
    assignedAshaId: 'asha-001',
    mpin: '1234',
    currentRiskScore: 35,
    riskLevel: 'Mild Risk',
    priority: 'Routine',
    actionAdvised: 'Initial screening scheduled',
    glucoseHistory: [],
    vitalsHistory: systolic && diastolic ? [{
      id: `vit-${Date.now()}`,
      systolic: Number(systolic),
      diastolic: Number(diastolic),
      pulse: 75,
      weightKg: Number(weight) || 58,
      timestamp: new Date().toISOString(),
      recordedBy: 'ASHA Registration Desk'
    }] : []
  };

  db.insert('patients', newPatient);

  // Update ASHA assigned stats
  const asha = db.findById('ashaWorkers', 'asha-001');
  if (asha) {
    db.update('ashaWorkers', 'asha-001', {
      totalAssignedVillagers: (asha.totalAssignedVillagers || 24) + 1,
      pendingToday: (asha.pendingToday || 10) + 1
    });
  }

  res.status(201).json({
    success: true,
    message: `Patient ${name} registered successfully.`,
    patient: newPatient
  });
});

// Update patient
router.put('/:id', (req, res) => {
  const patient = db.findById('patients', req.params.id);
  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }

  const updated = db.update('patients', req.params.id, req.body);
  res.json({ success: true, message: 'Patient details updated.', patient: updated });
});

// Log blood glucose reading
router.post('/:id/glucose', (req, res) => {
  const { value, timing, loggedBy } = req.body;
  const patient = db.findById('patients', req.params.id);

  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }

  const numericValue = Number(value);
  if (!numericValue || numericValue <= 0) {
    return res.status(400).json({ success: false, message: 'Please provide a valid glucose value.' });
  }

  const evalResult = evaluateGlucose(numericValue, timing || 'Post-Meal');

  const newLog = {
    id: `glu-${Date.now()}`,
    value: numericValue,
    timing: timing || 'Post-Meal',
    timestamp: new Date().toISOString(),
    category: evalResult.category,
    isCritical: evalResult.isCritical,
    loggedBy: loggedBy || (patient.name + ' (Patient)')
  };

  const history = patient.glucoseHistory || [];
  history.unshift(newLog);

  // Re-calculate retinopathy risk
  const latestVitals = (patient.vitalsHistory && patient.vitalsHistory[0]) || { systolic: 120, diastolic: 80 };
  const riskResult = calculateRetinopathyRisk({
    glucose: numericValue,
    timing: timing || 'Post-Meal',
    systolic: latestVitals.systolic,
    diastolic: latestVitals.diastolic,
    age: patient.age
  });

  const updatedPatient = db.update('patients', patient.id, {
    glucoseHistory: history,
    currentRiskScore: riskResult.riskScore,
    riskLevel: riskResult.riskLevel,
    actionAdvised: riskResult.actionAdvised
  });

  res.json({
    success: true,
    message: `Blood glucose reading ${numericValue} mg/dL saved.`,
    entry: newLog,
    riskAssessment: riskResult,
    patient: updatedPatient
  });
});

// Record vitals (BP, pulse, weight)
router.post('/:id/vitals', (req, res) => {
  const { systolic, diastolic, pulse, weightKg, recordedBy } = req.body;
  const patient = db.findById('patients', req.params.id);

  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }

  const newVital = {
    id: `vit-${Date.now()}`,
    systolic: Number(systolic) || 120,
    diastolic: Number(diastolic) || 80,
    pulse: Number(pulse) || 72,
    weightKg: Number(weightKg) || (patient.weight ? parseInt(patient.weight) : 60),
    timestamp: new Date().toISOString(),
    recordedBy: recordedBy || 'Sandhya Rani Mondal (ASHA)'
  };

  const vitals = patient.vitalsHistory || [];
  vitals.unshift(newVital);

  // Recalculate Risk
  const latestGlucose = (patient.glucoseHistory && patient.glucoseHistory[0]) || { value: 140, timing: 'Post-Meal' };
  const riskResult = calculateRetinopathyRisk({
    glucose: latestGlucose.value,
    timing: latestGlucose.timing,
    systolic: newVital.systolic,
    diastolic: newVital.diastolic,
    age: patient.age
  });

  const updatedPatient = db.update('patients', patient.id, {
    vitalsHistory: vitals,
    currentRiskScore: riskResult.riskScore,
    riskLevel: riskResult.riskLevel,
    actionAdvised: riskResult.actionAdvised
  });

  res.json({
    success: true,
    message: `Blood pressure ${newVital.systolic}/${newVital.diastolic} mmHg recorded.`,
    vital: newVital,
    riskAssessment: riskResult,
    patient: updatedPatient
  });
});

// Get real-time Risk assessment
router.get('/:id/risk', (req, res) => {
  const patient = db.findById('patients', req.params.id);
  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }

  const latestGlucose = (patient.glucoseHistory && patient.glucoseHistory[0]) || { value: 140, timing: 'Post-Meal' };
  const latestVitals = (patient.vitalsHistory && patient.vitalsHistory[0]) || { systolic: 120, diastolic: 80 };

  const risk = calculateRetinopathyRisk({
    glucose: latestGlucose.value,
    timing: latestGlucose.timing,
    systolic: latestVitals.systolic,
    diastolic: latestVitals.diastolic,
    age: patient.age
  });

  res.json({
    success: true,
    patientId: patient.id,
    patientName: patient.name,
    glucose: latestGlucose,
    vitals: latestVitals,
    riskAssessment: risk
  });
});

module.exports = router;
