const { pool } = require('../config/db');

async function getAllCars() {
  const result = await pool.query(
    `
    SELECT id, name, category, price_per_day, image_url, specs, is_active
    FROM cars
    WHERE is_active = TRUE
    ORDER BY category, price_per_day ASC
    `
  );
  return result.rows;
}

async function getCarsByCategory(category) {
  const result = await pool.query(
    `
    SELECT id, name, category, price_per_day, image_url, specs, is_active
    FROM cars
    WHERE is_active = TRUE AND category = $1
    ORDER BY price_per_day ASC
    `,
    [category]
  );
  return result.rows;
}

async function getCarById(id) {
  const result = await pool.query(
    `
    SELECT id, name, category, price_per_day, image_url, specs, is_active
    FROM cars
    WHERE id = $1 AND is_active = TRUE
    `,
    [id]
  );
  return result.rows[0] || null;
}

// For future admin panel – create car
async function createCar({ name, category, pricePerDay, imageUrl, specs }) {
  const result = await pool.query(
    `
    INSERT INTO cars (name, category, price_per_day, image_url, specs)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, category, price_per_day, image_url, specs, is_active
    `,
    [name, category, pricePerDay, imageUrl, specs || []]
  );
  return result.rows[0];
}

module.exports = {
  getAllCars,
  getCarsByCategory,
  getCarById,
  createCar,
};

