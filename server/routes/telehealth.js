const express = require('express');
const router = express.Router();
const db = require('../db');

// List on-duty PHC Medical Officers
router.get('/doctors', (req, res) => {
  const doctors = db.get('doctors');
  res.json({ success: true, count: doctors.length, doctors });
});

// List teleconsultation referrals
router.get('/referrals', (req, res) => {
  const list = db.get('teleconsultations');
  res.json({ success: true, count: list.length, referrals: list });
});

// Create teleconsultation referral
router.post('/referrals', (req, res) => {
  const { patientName, drStage, glucose, notes } = req.body;

  const referral = {
    id: `tele-${Date.now()}`,
    patientName: patientName || 'Rabin Das',
    drStage: drStage || 'Stage 2: Moderate NPDR',
    glucose: glucose || 168,
    urgency: 'Immediate',
    referredToDoctorId: 'doc-001',
    doctorName: 'Dr. S. Roy (PHC Medical Officer)',
    notes: notes || 'Critical retina lesion identified during field triage.',
    status: 'Escalated to PHC',
    createdAt: new Date().toISOString()
  };

  db.insert('teleconsultations', referral);

  res.status(201).json({
    success: true,
    message: `Case escalated to Dr. S. Roy (PHC Medical Officer). Call initiated.`,
    referral
  });
});

module.exports = router;
