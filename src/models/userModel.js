const { pool } = require('../config/db');

async function createUser({ name, email, passwordHash }) {
  const result = await pool.query(
    `
    INSERT INTO users (name, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, name, email, avatar_url, loyalty_points, created_at
    `,
    [name, email.toLowerCase(), passwordHash]
  );
  return result.rows[0];
}

async function createGoogleUser({ name, email, googleId, avatarUrl }) {
  const result = await pool.query(
    `
    INSERT INTO users (name, email, google_id, avatar_url, password_hash)
    VALUES ($1, $2, $3, $4, NULL)
    RETURNING id, name, email, avatar_url, loyalty_points, created_at
    `,
    [name, email.toLowerCase(), googleId, avatarUrl || null]
  );
  return result.rows[0];
}

async function findUserByGoogleId(googleId) {
  const result = await pool.query(
    `
    SELECT id, name, email, password_hash, google_id, avatar_url, loyalty_points, created_at
    FROM users
    WHERE google_id = $1
    `,
    [googleId]
  );
  return result.rows[0] || null;
}

async function findUserByEmail(email) {
  const result = await pool.query(
    `
    SELECT id, name, email, password_hash, google_id, avatar_url, loyalty_points, created_at
    FROM users
    WHERE email = $1
    `,
    [email.toLowerCase()]
  );
  return result.rows[0] || null;
}

async function findUserById(id) {
  const result = await pool.query(
    `
    SELECT id, name, email, avatar_url, loyalty_points, created_at
    FROM users
    WHERE id = $1
    `,
    [id]
  );
  return result.rows[0] || null;
}

async function updateUserProfile(id, { name, avatarUrl }) {
  const result = await pool.query(
    `
    UPDATE users
    SET
      name = COALESCE($2, name),
      avatar_url = COALESCE($3, avatar_url)
    WHERE id = $1
    RETURNING id, name, email, avatar_url, loyalty_points, created_at
    `,
    [id, name, avatarUrl]
  );
  return result.rows[0] || null;
}

module.exports = {
  createUser,
  createGoogleUser,
  findUserByEmail,
  findUserByGoogleId,
  findUserById,
  updateUserProfile,
};

