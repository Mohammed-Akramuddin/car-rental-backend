# DRIVE Backend API

Backend for the **DRIVE** car rental application.

## Tech Stack

- Node.js + Express
- PostgreSQL (via `pg`)
- JWT authentication (`jsonwebtoken`)
- CORS protection (`cors`)
- Google Sign-In verification (`google-auth-library`)
- Email delivery (`nodemailer`, Brevo SMTP compatible)

## Project Structure

- `src/server.js` - application entrypoint (starts server + initializes DB)
- `src/app.js` - express app (middleware, routes, CORS, error handling)
- `src/config/db.js` - DB initialization + table creation
- `src/routes/*` - API route definitions
- `src/controllers/*` - route handlers (auth, cars, bookings)
- `src/middleware/*` - `authRequired` + centralized error handling
- `src/models/*` - DB access helpers
- `src/scripts/seedCars.js` - seeds initial car data

## Getting Started (Local)

1. Install dependencies:
   - `npm install`
2. Configure environment variables:
   - Create a file named `.env` in `backend/`
   - Copy values from `.env.example`
3. Start the server:
   - `npm run start`
   - (or dev mode) `npm run dev`

Server start will also initialize the database (create tables if they don’t exist).

## Environment Variables

Required:
- `PORT` - server port (default: `5000`)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - secret used to sign/verify JWT tokens
- `JWT_EXPIRES_IN` - token expiration (default: `7d`)
- `FRONTEND_ORIGIN` - comma-separated list of allowed frontend origins for CORS
- `GOOGLE_CLIENT_ID` - Google OAuth client id used to verify Google ID tokens
- `FRONTEND_VERIFY_URL` - verification redirect URL used in email links
- `SMTP_HOST` - SMTP host (Brevo: `smtp-relay.brevo.com`)
- `SMTP_PORT` - SMTP port (`587` or `465`)
- `SMTP_USER` - SMTP username/login
- `SMTP_PASS` - SMTP key/password
- `EMAIL_FROM` - sender email address

Example:

```env
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d
FRONTEND_ORIGIN=http://localhost:5500,https://your-frontend-domain.com
GOOGLE_CLIENT_ID=1063....apps.googleusercontent.com
FRONTEND_VERIFY_URL=http://localhost:5000/verify-email.html
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-key
EMAIL_FROM=drive.rentalsoffical@gmail.com
```

## CORS (Important)

Your backend allows only the origins listed in:
- local defaults:
  - `http://localhost:5500`
  - `http://127.0.0.1:5500`
  - `http://localhost:5000`
  - `http://127.0.0.1:5000`
- plus any origins from `FRONTEND_ORIGIN`

Email verification links should use **`FRONTEND_VERIFY_URL`** pointing at the same host that serves your frontend files. In local dev the API also serves the `Frontend/` folder, so use `http://localhost:5000/verify-email.html` (same port as the backend).

`FRONTEND_ORIGIN` must be set as a **comma-separated allowlist**. Example:

`FRONTEND_ORIGIN=http://localhost:5500,https://carrentalfrontend.example.com`

## Database

`src/config/db.js` runs on startup and creates these tables if they don’t exist:
- `users`
- `cars`
- `bookings`

## Seed Cars

Optional (to pre-populate the `cars` table):

- `npm run seed:cars`

## Authentication

### Signup

- `POST /api/auth/signup`
- Body: `{ "name": string, "email": string, "password": string }`
- Sends verification email and returns confirmation message

### Login

- `POST /api/auth/login`
- Body: `{ "email": string, "password": string }`
- Returns: `{ token, user }`
- Requires `email_verified = true` for password-based accounts

### Google Login (ID Token Verification)

- `GET /api/auth/google/client-id`
  - Returns: `{ clientId, configured }`
- `POST /api/auth/google`
  - Body: `{ "credential": "<google_id_token>" }`
  - Returns: `{ token, user }`

### Google Compatibility Route (Frontend)

- `POST /auth/google-login`
- Body: `{ "token": "<google_id_token>" }` (or `{ "credential": ... }`)
- Returns: `{ token, user }`

### Email Verification

- `GET /api/auth/verify-email?token=<token>`
  - Marks user email as verified if token is valid and not expired
- `POST /api/auth/resend-verification`
  - Body: `{ "email": string }`
  - Resends verification email for unverified users

## JWT Required Routes (Bookings)

All routes under `/api/bookings` require:

- `Authorization: Bearer <JWT_TOKEN>`

Middleware: `src/middleware/authMiddleware.js`

## API Endpoints

### Health

- `GET /api/health`
- Response: `{ "status": "ok", "service": "drive-backend" }`

### Cars

- `GET /api/cars`
  - Optional query: `?category=budget|premium|luxury`
  - Returns car records from DB.

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/auth/google/client-id`
- `POST /auth/google-login` (compat)

### Bookings

- `POST /api/bookings`
  - Body:
    - `carId` (UUID)
    - `pickupDate` (YYYY-MM-DD)
    - `dropDate` (YYYY-MM-DD)
    - `deliveryOption` (`"showroom"` or `"home"`)
    - `address` (optional; used when delivery is `"home"`)
  - Response: booking record
- `GET /api/bookings/me`
  - Returns bookings for the logged-in user
- `DELETE /api/bookings/:bookingId/cancel`
  - Cancels user booking and sends cancellation notification email

## Email Notifications

The backend sends emails for:
- account verification after signup
- booking confirmation after successful booking
- booking cancellation when user cancels booking

## Error Handling

- Unknown routes return `404` with `{ message: "Route not found" }`
- Errors return JSON with:
  - `message`: error message (or `Internal server error`)

## Scripts

- `npm run dev` - `nodemon src/server.js`
- `npm run start` - `node src/server.js`
- `npm run seed:cars` - seeds cars table

