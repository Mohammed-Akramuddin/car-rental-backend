const { getAllCars, getCarsByCategory } = require('../models/carModel');

async function listCars(req, res, next) {
  try {
    const { category } = req.query;
    if (category) {
      const normalized = category.toLowerCase();
      if (!['budget', 'premium', 'luxury'].includes(normalized)) {
        return res.status(400).json({ message: 'Invalid category' });
      }
      const cars = await getCarsByCategory(normalized);
      return res.json(cars);
    }

    const cars = await getAllCars();
    res.json(cars);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCars,
};

