const express = require('express');
const { signup, login, googleLogin, googleClientId, googleLoginCompat } = require('../controllers/authController');

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

module.exports = router;

