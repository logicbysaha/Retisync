const express = require('express');
const router = express.Router();
const db = require('../db');

// Sync status check
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'Operational',
    cloudConnected: true,
    serverTime: new Date().toISOString(),
    recordsCount: {
      patients: db.get('patients').length,
      screenings: db.get('screenings').length,
      visits: db.get('visits').length,
      campBookings: db.get('campBookings').length
    }
  });
});

// Offline-First Sync Endpoint
router.post('/', (req, res) => {
  const { offlineRecords = [], deviceId = 'MotoG54-ASHA', lastSyncAt } = req.body;
  let syncedCount = 0;
  const syncResults = [];

  for (const record of offlineRecords) {
    try {
      if (record.type === 'patient' && record.data) {
        const existing = db.findById('patients', record.data.id);
        if (!existing) {
          db.insert('patients', record.data);
          syncedCount++;
          syncResults.push({ id: record.data.id, type: 'patient', action: 'created' });
        }
      } else if (record.type === 'glucose' && record.patientId && record.value) {
        const patient = db.findById('patients', record.patientId);
        if (patient) {
          const list = patient.glucoseHistory || [];
          list.unshift({
            id: `glu-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            value: Number(record.value),
            timing: record.timing || 'Post-Meal',
            timestamp: record.timestamp || new Date().toISOString(),
            category: record.category || 'Logged Offline',
            loggedBy: record.loggedBy || 'ASHA Offline Sync'
          });
          db.update('patients', patient.id, { glucoseHistory: list });
          syncedCount++;
          syncResults.push({ patientId: record.patientId, type: 'glucose', action: 'synced' });
        }
      } else if (record.type === 'screening' && record.data) {
        db.insert('screenings', record.data);
        syncedCount++;
        syncResults.push({ id: record.data.id, type: 'screening', action: 'created' });
      } else if (record.type === 'vital' && record.patientId) {
        const patient = db.findById('patients', record.patientId);
        if (patient) {
          const vitals = patient.vitalsHistory || [];
          vitals.unshift(record.data);
          db.update('patients', patient.id, { vitalsHistory: vitals });
          syncedCount++;
          syncResults.push({ patientId: record.patientId, type: 'vital', action: 'synced' });
        }
      }
    } catch (err) {
      console.error('Error processing offline record:', err);
    }
  }

  // Snapshot of latest server data for mobile cache refresh
  res.json({
    success: true,
    message: `Sync completed. ${syncedCount} offline record(s) reconciled with central ABHA vault.`,
    syncedAt: new Date().toISOString(),
    syncedRecordsCount: syncedCount,
    results: syncResults,
    serverSnapshot: {
      patients: db.get('patients'),
      camps: db.get('camps'),
      visits: db.get('visits')
    }
  });
});

module.exports = router;
