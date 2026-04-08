const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const {
  createUser,
  createGoogleUser,
  findUserByEmail,
  findUserByGoogleId,
  findUserById,
  updateUserProfile,
} = require('../models/userModel');
const { pool } = require('../config/db');
const {
  sendEmail,
  buildVerificationEmail,
} = require('../services/emailService');

function signToken(user) {
  const payload = {
    sub: user.id,
    email: user.email,
  };
  const secret = process.env.JWT_SECRET || 'dev-secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn });
}

function getFrontendBaseUrl() {
  const fromEnv = (process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return fromEnv[0] || 'http://localhost:5500';
}

async function sendVerificationEmail({ email, name, token }) {
  const verifyBase = process.env.FRONTEND_VERIFY_URL || `${getFrontendBaseUrl()}/verify-email.html`;
  const separator = verifyBase.includes('?') ? '&' : '?';
  const verificationUrl = `${verifyBase}${separator}verifyToken=${encodeURIComponent(token)}`;
  const mail = buildVerificationEmail({ name, verificationUrl });
  await sendEmail({ to: email, ...mail });
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
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

    await pool.query(
      `
      UPDATE users
      SET email_verification_token = $2, email_verification_expires = $3
      WHERE id = $1
      `,
      [user.id, verifyToken, expiresAt]
    );

    await sendVerificationEmail({ email: user.email, name: user.name, token: verifyToken });

    res.status(201).json({ message: 'Account created. Please verify your email before login.' });
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

    if (!user.email_verified) {
      return res.status(403).json({ message: 'Please verify your email before login' });
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
        if (!existingByEmail.email_verified) {
          await pool.query(`UPDATE users SET email_verified = TRUE WHERE id = $1`, [existingByEmail.id]);
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
  const clientId = process.env.GOOGLE_CLIENT_ID || null;
  return res.json({
    clientId,
    configured: Boolean(clientId),
  });
}

async function verifyEmail(req, res, next) {
  try {
    const token = (req.query.token || '').trim();
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    const result = await pool.query(
      `
      UPDATE users
      SET
        email_verified = TRUE,
        email_verification_token = NULL,
        email_verification_expires = NULL
      WHERE email_verification_token = $1
        AND email_verification_expires > NOW()
      RETURNING id
      `,
      [token]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification link' });
    }

    return res.json({ message: 'Email verified successfully. You can now login.' });
  } catch (err) {
    return next(err);
  }
}

async function resendVerification(req, res, next) {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (user.email_verified) {
      return res.json({ message: 'Email already verified' });
    }

    const verifyToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await pool.query(
      `
      UPDATE users
      SET email_verification_token = $2, email_verification_expires = $3
      WHERE id = $1
      `,
      [user.id, verifyToken, expiresAt]
    );

    await sendVerificationEmail({ email: user.email, name: user.name, token: verifyToken });
    return res.json({ message: 'Verification email sent' });
  } catch (err) {
    return next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, avatarUrl } = req.body || {};

    const normalizedName = typeof name === 'string' ? name.trim() : null;
    const normalizedAvatarUrl = typeof avatarUrl === 'string' ? avatarUrl.trim() : null;

    if (!normalizedName && !normalizedAvatarUrl) {
      return res.status(400).json({ message: 'Provide name or avatarUrl' });
    }

    // Accept either regular URL or a small data URL for local uploads.
    if (normalizedAvatarUrl && normalizedAvatarUrl.length > 1_500_000) {
      return res.status(400).json({ message: 'Avatar image is too large' });
    }

    const updated = await updateUserProfile(userId, {
      name: normalizedName || null,
      avatarUrl: normalizedAvatarUrl || null,
    });

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user: updated });
  } catch (err) {
    return next(err);
  }
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
        avatar_url = COALESCE(users.avatar_url, EXCLUDED.avatar_url),
        email_verified = TRUE,
        email_verification_token = NULL,
        email_verification_expires = NULL
      RETURNING id, name, email, email_verified, avatar_url, created_at
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
  verifyEmail,
  resendVerification,
  getMe,
  updateProfile,
};

