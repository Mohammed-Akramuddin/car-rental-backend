const { getCarById } = require('../models/carModel');
const { createBooking, getBookingsByUser, isCarAvailable } = require('../models/bookingModel');

async function createBookingController(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      carId,
      pickupDate,
      dropDate,
      deliveryOption, // 'showroom' | 'home'
      address,
    } = req.body;

    if (!carId || !pickupDate || !dropDate || !deliveryOption) {
      return res.status(400).json({
        message: 'carId, pickupDate, dropDate and deliveryOption are required',
      });
    }

    if (!['showroom', 'home'].includes(deliveryOption)) {
      return res.status(400).json({ message: 'Invalid delivery option' });
    }

    const car = await getCarById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const start = new Date(pickupDate);
    const end = new Date(dropDate);
    const msPerDay = 1000 * 60 * 60 * 24;
    const totalDays = Math.round((end - start) / msPerDay);

    if (!pickupDate || !dropDate || isNaN(totalDays) || totalDays <= 0) {
      return res.status(400).json({ message: 'Invalid pickup/drop dates' });
    }

    const available = await isCarAvailable({ carId, pickupDate, dropDate });
    if (!available) {
      return res.status(409).json({ message: 'Car not available for selected dates' });
    }

    const deliveryFeeByCategory = {
      budget: 500,
      premium: 1000,
      luxury: 2000,
    };
    const deliveryCharge =
      deliveryOption === 'home' ? deliveryFeeByCategory[car.category] || 0 : 0;
    const totalPrice = totalDays * car.price_per_day + deliveryCharge;

    const booking = await createBooking({
      userId,
      carId,
      pickupDate,
      dropDate,
      deliveryOption,
      address,
      totalDays,
      totalPrice,
    });

    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
}

async function getMyBookings(req, res, next) {
  try {
    const userId = req.user.id;
    const bookings = await getBookingsByUser(userId);
    res.json(bookings);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createBooking: createBookingController,
  getMyBookings,
};

