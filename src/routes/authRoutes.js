const express = require('express');
const {
  signup,
  login,
  googleLogin,
  googleClientId,
  googleLoginCompat,
  verifyEmail,
  resendVerification,
  getMe,
  updateProfile,
} = require('../controllers/authController');
const { authRequired } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', signup);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/google
router.post('/google', googleLogin);

// POST /auth/google-login (frontend compatibility)
router.post('/google-login', googleLoginCompat);

// GET /api/auth/google/client-id
router.get('/google/client-id', googleClientId);

// GET /api/auth/verify-email?token=...
router.get('/verify-email', verifyEmail);

// POST /api/auth/resend-verification
router.post('/resend-verification', resendVerification);

// GET /api/auth/me
router.get('/me', authRequired, getMe);

// PATCH /api/auth/profile
router.patch('/profile', authRequired, updateProfile);

// POST /api/auth/resend-verification
router.post('/resend-verification', resendVerification);

// GET /api/auth/me
router.get('/me', authRequired, getMe);

// PATCH /api/auth/profile
router.patch('/profile', authRequired, updateProfile);

// POST /api/auth/resend-verification
router.post('/resend-verification', resendVerification);

// GET /api/auth/me
router.get('/me', authRequired, getMe);

// PATCH /api/auth/profile
router.patch('/profile', authRequired, updateProfile);

module.exports = router;

