const express = require('express');
const { createBooking, getMyBookings } = require('../controllers/bookingController');
const { authRequired } = require('../middleware/authMiddleware');

const router = express.Router();

// All booking routes require auth
router.use(authRequired);

// POST /api/bookings
router.post('/', createBooking);

// GET /api/bookings/me
router.get('/me', getMyBookings);

module.exports = router;

