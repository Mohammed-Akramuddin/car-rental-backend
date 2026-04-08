const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const authRoutes = require('./routes/authRoutes');
const carRoutes = require('./routes/carRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Basic security hardening
app.use(helmet());

// CORS
// IMPORTANT: Browsers will reject `Access-Control-Allow-Origin: *` when `credentials: true`.
// So we explicitly allow common local dev origins + any origins you list in FRONTEND_ORIGIN.
const defaultDevOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
];
const envOrigins = (process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const allowedOrigins = new Set([...defaultDevOrigins, ...envOrigins]);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients (curl/postman) with no Origin header
      if (!origin) return callback(null, true);

      // Allow local file:// usage (Origin: "null") during development
      if (origin === 'null') return callback(null, true);

      if (allowedOrigins.has(origin)) return callback(null, true);

      // Reject unknown origins
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// Body parsing
app.use(express.json());

// Logging (skip in test)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'drive-backend' });
});

// Routes
app.use('/api/auth', authRoutes);
// Compatibility routes for frontend expecting /auth/*
app.use('/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);

// Serve frontend static files (so /login.html works for email verification links on same port as API)
const frontendDir = path.join(__dirname, '..', '..', 'Frontend');
app.use(express.static(frontendDir));

// 404 + error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

