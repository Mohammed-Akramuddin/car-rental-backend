const nodemailer = require('nodemailer');

/**
 * Create SMTP transporter
 */
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465); // default 465
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // ✅ true for 465

    auth: { user, pass },

    // ✅ Prevent long delays (IMPORTANT)
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,

    // ✅ Fix TLS issues on cloud
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Send email safely (won’t crash API)
 */
async function sendEmail({ to, subject, html, text }) {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn('SMTP not configured: email skipped');
    return { skipped: true };
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text,
    });

    return { skipped: false };
  } catch (error) {
    console.error("❌ Email failed:", error.message);

    // ✅ Prevent API failure
    return { skipped: true, error: error.message };
  }
}

/**
 * Verification Email
 */
function buildVerificationEmail({ name, verificationUrl }) {
  const safeName = name || 'there';

  return {
    subject: 'Verify your DRIVE account',
    text: `Hi ${safeName}, verify your email: ${verificationUrl}`,
    html: buildDriveTemplate({
      title: 'Verify Your DRIVE Account',
      subtitle: 'Complete your account setup to start booking premium rides.',
      content: `
        <p>Hi ${safeName},</p>
        <p>Thanks for joining DRIVE. Verify your email to activate your account.</p>
        <p>
          <a href="${verificationUrl}" style="padding:12px 20px;background:#1d4ed8;color:#fff;border-radius:999px;text-decoration:none;">
            Verify Email
          </a>
        </p>
        <p>If button doesn’t work:</p>
        <p>${verificationUrl}</p>
      `,
    }),
  };
}

/**
 * Booking Confirmed Email
 */
function buildBookingCreatedEmail({ name, carName, pickupDate, dropDate, totalPrice }) {
  const safeName = name || 'Customer';

  return {
    subject: 'Your DRIVE booking is confirmed',
    text: `Hi ${safeName}, your booking for ${carName} is confirmed.`,
    html: buildDriveTemplate({
      title: 'Booking Confirmed',
      subtitle: 'Your ride is locked in.',
      content: `
        <p>Hi ${safeName}, your booking is confirmed.</p>
        ${buildInfoGrid([
          ['Car', carName],
          ['Pickup', pickupDate],
          ['Drop', dropDate],
          ['Total', `Rs ${totalPrice}`],
        ])}
      `,
    }),
  };
}

/**
 * Booking Cancelled Email
 */
function buildBookingCancelledEmail({ name, carName, pickupDate, dropDate }) {
  const safeName = name || 'Customer';

  return {
    subject: 'Your DRIVE booking was cancelled',
    text: `Hi ${safeName}, your booking was cancelled.`,
    html: buildDriveTemplate({
      title: 'Booking Cancelled',
      subtitle: 'Your reservation was cancelled successfully.',
      content: `
        <p>Hi ${safeName}, your booking has been cancelled.</p>
        ${buildInfoGrid([
          ['Car', carName],
          ['Pickup', pickupDate],
          ['Drop', dropDate],
        ])}
      `,
    }),
  };
}

/**
 * Info Grid UI
 */
function buildInfoGrid(items) {
  return `
    <div style="border:1px solid #ddd;border-radius:10px;overflow:hidden;margin-top:10px;">
      ${items.map(([k, v], i) => `
        <div style="display:flex;justify-content:space-between;padding:10px;background:${i % 2 ? '#f9f9f9' : '#fff'};">
          <span>${k}</span>
          <strong>${v}</strong>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Email Template
 */
function buildDriveTemplate({ title, subtitle, content }) {
  return `
    <div style="font-family:Arial;padding:20px;background:#f1f5f9;">
      <div style="max-width:600px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;">
        
        <div style="background:#1d4ed8;color:#fff;padding:20px;">
          <h2>${title}</h2>
          <p>${subtitle}</p>
        </div>

        <div style="padding:20px;">
          ${content}
          <p style="margin-top:20px;font-size:12px;color:#555;">
            Need help? Reply to this email.
          </p>
        </div>

      </div>
    </div>
  `;
}

module.exports = {
  sendEmail,
  buildVerificationEmail,
  buildBookingCreatedEmail,
  buildBookingCancelledEmail,
};
