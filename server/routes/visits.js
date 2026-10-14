const express = require('express');
const router = express.Router();
const db = require('../db');

// List visits
router.get('/', (req, res) => {
  const { status, patientId, priority } = req.query;
  let list = db.get('visits');

  if (status) {
    list = list.filter(v => v.status && v.status.toLowerCase() === status.toLowerCase());
  }

  if (patientId) {
    list = list.filter(v => v.patientId === patientId);
  }

  if (priority) {
    list = list.filter(v => v.priority && v.priority.toLowerCase() === priority.toLowerCase());
  }

  res.json({ success: true, count: list.length, visits: list });
});

// Patient requests home visit
router.post('/request', (req, res) => {
  const { patientId, patientName, phone, village, ward, reason } = req.body;

  let patient = null;
  if (patientId) {
    patient = db.findById('patients', patientId);
  }

  const pName = patient ? patient.name : (patientName || 'Rajesh Sharma');
  const pPhone = patient ? patient.phone : (phone || '+91 98765 43210');
  const pVillage = patient ? patient.village : (village || 'Bishnupur Village');
  const pWard = patient ? patient.ward : (ward || 'Ward 1');

  // Check if there's already an active visit request
  const existing = db.find('visits', v => 
    (v.patientId === (patient ? patient.id : null) || v.patientName === pName) &&
    v.status === 'Booked'
  );

  if (existing.length > 0) {
    return res.json({
      success: true,
      message: 'Home visit request is already scheduled with Sandhya Didi.',
      visit: existing[0],
      isDuplicate: true
    });
  }

  const newVisit = {
    id: `vis-${Date.now()}`,
    patientId: patient ? patient.id : 'pat-001',
    patientName: pName,
    phone: pPhone,
    village: pVillage,
    ward: pWard,
    reason: reason || 'Patient requested home retinal scan & glycemic check',
    requestedAt: new Date().toISOString(),
    status: 'Booked',
    priority: 'Urgent',
    assignedAshaId: 'asha-001',
    notes: 'Home visit queued in ASHA Didi schedule'
  };

  db.insert('visits', newVisit);

  res.status(201).json({
    success: true,
    message: 'Home visit requested successfully! Sandhya Didi has been notified.',
    visit: newVisit
  });
});

// Update visit status (ASHA worker action)
router.patch('/:id', (req, res) => {
  const { status, notes } = req.body;
  const visit = db.findById('visits', req.params.id);

  if (!visit) {
    return res.status(404).json({ success: false, message: 'Visit record not found' });
  }

  const updates = {};
  if (status) updates.status = status;
  if (notes) updates.notes = notes;
  if (status === 'Completed') {
    updates.completedAt = new Date().toISOString();
  }

  const updated = db.update('visits', req.params.id, updates);

  res.json({
    success: true,
    message: `Visit marked as ${status || 'updated'}.`,
    visit: updated
  });
});

module.exports = router;
