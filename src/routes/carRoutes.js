const express = require('express');
const { listCars } = require('../controllers/carController');

const router = express.Router();

// GET /api/cars
// GET /api/cars?category=budget|premium|luxury
router.get('/', listCars);

module.exports = router;

