const express = require('express');
const router = express.Router();
const db = require('../db');

// List upcoming camps
router.get('/', (req, res) => {
  const camps = db.get('camps');
  res.json({ success: true, count: camps.length, camps });
});

// Get camp detail
router.get('/:id', (req, res) => {
  const camp = db.findById('camps', req.params.id);
  if (!camp) {
    return res.status(404).json({ success: false, message: 'Eye camp not found' });
  }
  const bookings = db.find('campBookings', b => b.campId === camp.id);
  res.json({ success: true, camp, bookingsCount: bookings.length });
});

// Book free slot at eye camp
router.post('/:id/book', (req, res) => {
  const camp = db.findById('camps', req.params.id);
  if (!camp) {
    return res.status(404).json({ success: false, message: 'Eye camp not found' });
  }

  const { patientId, patientName } = req.body;
  const pName = patientName || 'Rajesh Sharma';
  const pId = patientId || 'pat-001';

  // Check if patient already booked
  const existingBooking = db.find('campBookings', b => 
    b.campId === camp.id && (b.patientId === pId || b.patientName === pName)
  );

  if (existingBooking.length > 0) {
    return res.json({
      success: true,
      message: `You already have a booked slot (${existingBooking[0].tokenNumber}) for this eye camp!`,
      booking: existingBooking[0],
      isAlreadyBooked: true
    });
  }

  const currentBooked = camp.bookedSlots || 18;
  const nextTokenNum = currentBooked + 1;
  const tokenNumber = `T-${String(nextTokenNum).padStart(3, '0')}`;

  const newBooking = {
    id: `cb-${Date.now()}`,
    campId: camp.id,
    patientId: pId,
    patientName: pName,
    tokenNumber,
    bookedAt: new Date().toISOString(),
    status: 'Confirmed'
  };

  db.insert('campBookings', newBooking);

  // Increment camp slot count
  db.update('camps', camp.id, {
    bookedSlots: nextTokenNum
  });

  res.status(201).json({
    success: true,
    message: `Free slot booked successfully! Token Number: ${tokenNumber}`,
    booking: newBooking
  });
});

module.exports = router;
