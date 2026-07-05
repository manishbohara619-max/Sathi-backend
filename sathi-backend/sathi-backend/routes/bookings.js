// routes/bookings.js
// Customers request a booking with a verified helper. Admin (and later,
// the helper themselves via a helper app) can update its status.

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const VALID_STATUSES = ['requested', 'confirmed', 'completed', 'cancelled'];

// ---------------------------------------------------------------------
// POST /api/bookings
// body: { helperId, customerName, customerPhone, date, duration, notes }
// ---------------------------------------------------------------------
router.post('/', (req, res) => {
  const { helperId, customerName, customerPhone, date, duration, notes } = req.body;

  if (!helperId || !customerName || !customerPhone || !date) {
    return res.status(400).json({
      error: 'helperId, customerName, customerPhone, and date are required.',
    });
  }

  const helper = db.getHelperById(helperId);
  if (!helper || helper.status !== 'verified') {
    return res.status(404).json({ error: 'That helper is not available for booking.' });
  }

  const booking = {
    id: uuidv4(),
    helperId,
    helperName: helper.name,
    customerName,
    customerPhone,
    date,
    duration: duration || 'Not specified',
    notes: notes || '',
    status: 'requested',
    createdAt: new Date().toISOString(),
  };

  db.insertBooking(booking);

  // TODO: notify the helper (SMS/app push) that a new booking request came in.
  res.status(201).json({ message: 'Booking request sent to helper.', booking });
});

// GET /api/bookings/:id  - anyone with the booking id can check its status
router.get('/:id', (req, res) => {
  const booking = db.getBookingById(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  res.json(booking);
});

// ---------------------------------------------------------------------
// ADMIN: view and manage all bookings
// ---------------------------------------------------------------------

// GET /api/bookings/admin/all
router.get('/admin/all', requireAdmin, (req, res) => {
  res.json({ bookings: db.getAllBookings() });
});

// POST /api/bookings/:id/status   body: { status: "confirmed" }
router.post('/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `status must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  const booking = db.getBookingById(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });

  const updated = db.updateBooking(booking.id, { status });
  res.json({ message: `Booking marked as ${status}.`, booking: updated });
});

module.exports = router;
