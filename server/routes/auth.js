const express = require('express');
const router = express.Router();
const db = require('../db');

// In-memory OTP storage for validation
const activeOtps = new Map();

// Generate or send 4-digit OTP
router.post('/otp/send', (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number is required.' });
  }

  // Consistent 4-digit demo OTP for quick testing, or random
  const otp = '7284';
  activeOtps.set(phone, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes validity
  });

  console.log(`[SMS Gateway Simulated] Verification OTP for ${phone}: ${otp}`);

  res.json({
    success: true,
    message: `Verification code sent to ${phone}`,
    phone,
    otpNotice: `Demo OTP: ${otp} (Valid for 5 mins)`
  });
});

// Verify OTP & Authenticate Patient
router.post('/otp/verify', (req, res) => {
  const { phone, otp, name, age, gender, height, weight, mpin } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number is required.' });
  }

  // Check stored OTP or default demo OTPs (7284 or any 4 digits in testing)
  const stored = activeOtps.get(phone);
  const isValidOtp = (stored && stored.otp === otp) || otp === '7284' || (otp && otp.length === 4);

  if (!isValidOtp) {
    return res.status(400).json({ success: false, message: 'Invalid OTP code. Please try again.' });
  }

  // Find patient by phone or name
  let patient = db.get('patients').find(p => 
    p.phone === phone || (name && p.name.toLowerCase() === name.trim().toLowerCase())
  );

  if (!patient) {
    // Auto-register new villager patient
    const randomAbha = `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newId = `pat-${Date.now()}`;
    patient = {
      id: newId,
      name: name || "Villager Patient",
      age: Number(age) || 50,
      gender: gender || "M",
      phone: phone,
      height: height || "165 cm",
      weight: weight || "60 kg",
      village: "Bishnupur Village",
      ward: "Ward 1",
      abhaId: randomAbha,
      subCenter: "Bishnupur Sub-Center 4",
      assignedAshaId: "asha-001",
      mpin: mpin || "1234",
      currentRiskScore: 45,
      riskLevel: "Moderate Risk",
      actionAdvised: "Schedule clinic screening at next village camp",
      glucoseHistory: [],
      vitalsHistory: []
    };
    db.insert('patients', patient);
  } else {
    // Optionally update fields if supplied
    const updates = {};
    if (age) updates.age = Number(age);
    if (height) updates.height = height;
    if (weight) updates.weight = weight;
    if (mpin) updates.mpin = mpin;
    if (Object.keys(updates).length > 0) {
      patient = db.update('patients', patient.id, updates);
    }
  }

  // Create lightweight session token
  const token = `token-patient-${patient.id}-${Date.now()}`;

  res.json({
    success: true,
    message: `Welcome back, ${patient.name}!`,
    token,
    user: {
      role: 'patient',
      id: patient.id,
      name: patient.name,
      phone: patient.phone,
      abhaId: patient.abhaId,
      village: patient.village,
      ward: patient.ward,
      subCenter: patient.subCenter,
      currentRiskScore: patient.currentRiskScore,
      riskLevel: patient.riskLevel,
      actionAdvised: patient.actionAdvised
    }
  });
});

// ASHA Worker Login
router.post('/login/asha', (req, res) => {
  const { ashaId, passcode } = req.body;

  if (!ashaId || !passcode) {
    return res.status(400).json({ success: false, message: 'Government ASHA ID and Passcode are required.' });
  }

  const ashaList = db.get('ashaWorkers');
  const asha = ashaList.find(a => 
    a.govtId.toUpperCase() === ashaId.trim().toUpperCase()
  );

  if (!asha) {
    return res.status(401).json({ success: false, message: 'ASHA Official ID not found in health registry.' });
  }

  if (asha.passcode !== passcode) {
    return res.status(401).json({ success: false, message: 'Invalid portal passcode. Please check credentials.' });
  }

  const token = `token-asha-${asha.id}-${Date.now()}`;

  res.json({
    success: true,
    message: `ASHA Didi verified. Welcome, ${asha.name}!`,
    token,
    user: {
      role: 'asha',
      id: asha.id,
      name: asha.name,
      govtId: asha.govtId,
      subCenter: asha.subCenter,
      subCenterShort: asha.subCenterShort,
      totalAssignedVillagers: asha.totalAssignedVillagers,
      screenedToday: asha.screenedToday,
      pendingToday: asha.pendingToday,
      avatar: asha.avatar,
      phone: asha.phone
    }
  });
});

// Current User Details
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // Default to Rajesh Sharma (pat-001) for ease of exploration
    const patient = db.findById('patients', 'pat-001');
    return res.json({ success: true, user: { role: 'patient', ...patient } });
  }

  if (authHeader.includes('asha')) {
    const asha = db.findById('ashaWorkers', 'asha-001');
    return res.json({ success: true, user: { role: 'asha', ...asha } });
  }

  const patient = db.findById('patients', 'pat-001');
  return res.json({ success: true, user: { role: 'patient', ...patient } });
});

module.exports = router;
