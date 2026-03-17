const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { createUser, createGoogleUser, findUserByEmail, findUserByGoogleId } = require('../models/userModel');
const { pool } = require('../config/db');

function signToken(user) {
  const payload = {
    sub: user.id,
    email: user.email,
  };
  const secret = process.env.JWT_SECRET || 'dev-secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn });
}

async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await createUser({ name, email, passwordHash: hash });
    const token = signToken(user);

    res.status(201).json({
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.password_hash) {
      return res.status(401).json({ message: 'Use Google sign-in for this account' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user);
    // Do not expose password_hash
    delete user.password_hash;

    res.json({
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
}

async function googleLogin(req, res, next) {
  try {
    const { credential } = req.body; // Google ID token
    if (!credential) {
      return res.status(400).json({ message: 'credential is required' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ message: 'Google login not configured' });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name || 'Drive User';
    const avatarUrl = payload.picture || null;

    // 1) Prefer existing Google account
    let user = await findUserByGoogleId(googleId);

    // 2) If same email already exists, link it (only if not already linked)
    if (!user) {
      const existingByEmail = await findUserByEmail(email);
      if (existingByEmail) {
        // If this email is already a password account, allow Google login but do not overwrite password.
        // We link google_id if missing.
        if (!existingByEmail.google_id) {
          const { pool } = require('../config/db');
          await pool.query(`UPDATE users SET google_id = $2, avatar_url = COALESCE(avatar_url, $3) WHERE id = $1`, [
            existingByEmail.id,
            googleId,
            avatarUrl,
          ]);
        }
        user = await findUserByEmail(email);
      } else {
        user = await createGoogleUser({ name, email, googleId, avatarUrl });
      }
    }

    // Do not expose password_hash
    delete user.password_hash;

    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
}

function googleClientId(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ message: 'Google login not configured' });
  }
  return res.json({ clientId });
}

// POST /auth/google-login
// Body: { token: "<google_id_token>" }
async function googleLoginCompat(req, res) {
  const googleToken = req.body && (req.body.token || req.body.credential);
  if (!googleToken) {
    return res.status(400).json({ message: 'token is required' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ message: 'Google login not configured' });
  }

  let payload;
  try {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid Google token' });
  }

  const name = payload.name || 'Drive User';
  const email = (payload.email || '').toLowerCase();
  const picture = payload.picture || null;

  if (!email) {
    return res.status(400).json({ message: 'Google token missing email' });
  }

  try {
    // Find-or-create by email (production-safe, avoids race conditions)
    const result = await pool.query(
      `
      INSERT INTO users (name, email, avatar_url, password_hash)
      VALUES ($1, $2, $3, NULL)
      ON CONFLICT (email)
      DO UPDATE SET
        name = EXCLUDED.name,
        avatar_url = COALESCE(users.avatar_url, EXCLUDED.avatar_url)
      RETURNING id, name, email, avatar_url, created_at
      `,
      [name, email, picture]
    );

    const userRow = result.rows[0];
    const token = signToken(userRow);

    // Frontend-friendly user shape
    return res.json({
      token,
      user: {
        id: userRow.id,
        name: userRow.name,
        email: userRow.email,
        avatar: userRow.avatar_url,
        created_at: userRow.created_at,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Database error' });
  }
}

module.exports = {
  signup,
  login,
  googleLogin,
  googleClientId,
  googleLoginCompat,
};

