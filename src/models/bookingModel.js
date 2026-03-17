const { pool } = require('../config/db');

async function createBooking({
  userId,
  carId,
  pickupDate,
  dropDate,
  deliveryOption,
  address,
  totalDays,
  totalPrice,
}) {
  const result = await pool.query(
    `
    INSERT INTO bookings (
      user_id,
      car_id,
      pickup_date,
      drop_date,
      delivery_option,
      address,
      total_days,
      total_price
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
    `,
    [
      userId,
      carId,
      pickupDate,
      dropDate,
      deliveryOption,
      address || null,
      totalDays,
      totalPrice,
    ]
  );
  return result.rows[0];
}

async function getBookingsByUser(userId) {
  const result = await pool.query(
    `
    SELECT
      b.id,
      b.pickup_date,
      b.drop_date,
      b.delivery_option,
      b.address,
      b.total_days,
      b.total_price,
      b.status,
      b.created_at,
      c.id AS car_id,
      c.name AS car_name,
      c.category,
      c.image_url
    FROM bookings b
    JOIN cars c ON c.id = b.car_id
    WHERE b.user_id = $1
    ORDER BY b.created_at DESC
    `,
    [userId]
  );
  return result.rows;
}

async function isCarAvailable({ carId, pickupDate, dropDate }) {
  const result = await pool.query(
    `
    SELECT 1
    FROM bookings
    WHERE
      car_id = $1
      AND NOT (drop_date <= $2 OR pickup_date >= $3)
    LIMIT 1
    `,
    [carId, pickupDate, dropDate]
  );
  return result.rowCount === 0;
}

module.exports = {
  createBooking,
  getBookingsByUser,
  isCarAvailable,
};

