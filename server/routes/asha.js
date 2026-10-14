const express = require('express');
const router = express.Router();
const db = require('../db');

// ASHA Dashboard summary
router.get('/dashboard', (req, res) => {
  const asha = db.findById('ashaWorkers', 'asha-001') || {
    id: 'asha-001',
    name: 'Sandhya Rani Mondal',
    subCenter: 'Bishnupur Sub-Center 4',
    totalAssignedVillagers: 24,
    screenedToday: 14,
    pendingToday: 10
  };

  const patients = db.get('patients');
  const visits = db.get('visits');
  const screenings = db.get('screenings');

  const urgentPatients = patients.filter(p => 
    p.currentRiskScore >= 70 || p.priority === 'Priority 1' || p.priority === 'Priority 2'
  );

  const pendingVisits = visits.filter(v => v.status === 'Booked');

  const totalAssigned = asha.totalAssignedVillagers || patients.length;
  const screened = asha.screenedToday || 14;
  const pending = Math.max(0, totalAssigned - screened);
  const percentage = Math.min(100, Math.round((screened / totalAssigned) * 100));

  res.json({
    success: true,
    ashaWorker: asha,
    stats: {
      totalAssignedVillagers: totalAssigned,
      screenedToday: screened,
      pendingToday: pending,
      progressPercentage: percentage,
      urgentCasesCount: urgentPatients.length,
      pendingHomeVisitsCount: pendingVisits.length,
      totalScreeningsConducted: screenings.length
    },
    urgentFocus: urgentPatients.slice(0, 3),
    recentScreenings: screenings.slice(0, 5)
  });
});

// Triage Queue List
router.get('/queue', (req, res) => {
  const patients = db.get('patients');
  const visits = db.get('visits');

  const queue = patients.map(p => {
    const latestGlucose = (p.glucoseHistory && p.glucoseHistory[0]) ? p.glucoseHistory[0].value : null;
    const latestVitals = (p.vitalsHistory && p.vitalsHistory[0]) ? p.vitalsHistory[0] : null;
    const hasVisitBooked = visits.some(v => (v.patientId === p.id || v.patientName === p.name) && v.status === 'Booked');

    let priorityBadge = 'Routine';
    let priorityClass = 'bg-slate-400 text-white';
    let description = `${p.age}${p.gender} • Regular checkup`;

    if (p.currentRiskScore >= 75 || p.priority === 'Priority 1') {
      priorityBadge = 'Priority 1';
      priorityClass = 'bg-red-600 text-white';
      description = `Sugar ${latestGlucose || 168} • High Eye Risk (${p.currentRiskScore}%)`;
    } else if (p.currentRiskScore >= 60 || p.priority === 'Priority 2') {
      priorityBadge = 'Priority 2';
      priorityClass = 'bg-amber-600 text-white';
      description = `Sugar ${latestGlucose || 174} • BP Spike (${latestVitals ? `${latestVitals.systolic}/${latestVitals.diastolic}` : '154/96'})`;
    } else if (hasVisitBooked) {
      priorityBadge = 'Booked';
      priorityClass = 'bg-blue-600 text-white';
      description = `Sugar ${latestGlucose || 245} • Home Visit Requested`;
    } else {
      priorityBadge = 'Routine';
      priorityClass = 'bg-slate-400 text-white';
      description = `Sugar ${latestGlucose || 132} • Annual Eye Checkup`;
    }

    return {
      id: p.id,
      name: p.name,
      demographics: `${p.name} (${p.age}${p.gender})`,
      ward: p.ward || 'Bishnupur Sector 3',
      latestGlucose,
      latestVitals,
      riskScore: p.currentRiskScore,
      priorityBadge,
      priorityClass,
      description,
      hasVisitBooked
    };
  });

  // Sort: Priority 1 first, Priority 2 second, Booked third, Routine last
  const priorityOrder = { 'Priority 1': 1, 'Priority 2': 2, 'Booked': 3, 'Routine': 4 };
  queue.sort((a, b) => (priorityOrder[a.priorityBadge] || 5) - (priorityOrder[b.priorityBadge] || 5));

  res.json({
    success: true,
    totalCount: queue.length,
    queue
  });
});

module.exports = router;
