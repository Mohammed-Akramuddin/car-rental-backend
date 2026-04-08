const nodemailer = require('nodemailer');

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function sendEmail({ to, subject, html, text }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('SMTP not configured: email skipped');
    return { skipped: true };
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text,
  });

  return { skipped: false };
}

function buildVerificationEmail({ name, verificationUrl }) {
  const safeName = name || 'there';
  const title = 'Verify Your DRIVE Account';
  const subtitle = 'Complete your account setup to start booking premium rides.';
  return {
    subject: 'Verify your DRIVE account',
    text: `Hi ${safeName}, verify your email: ${verificationUrl}`,
    html: buildDriveTemplate({
      title,
      subtitle,
      content: `
        <p style="margin:0 0 14px;">Hi ${safeName},</p>
        <p style="margin:0 0 18px;">Thanks for joining DRIVE. Verify your email to activate sign-in and bookings.</p>
        <p style="margin:0 0 22px;">
          <a href="${verificationUrl}" style="display:inline-block;padding:12px 20px;background:linear-gradient(135deg,#0ea5e9,#1d4ed8);color:#fff;text-decoration:none;border-radius:999px;font-weight:600;">Verify Email</a>
        </p>
        <p style="margin:0;color:#64748b;font-size:13px;">If the button does not work, use this link:</p>
        <p style="margin:8px 0 0;word-break:break-all;font-size:13px;color:#0f172a;">${verificationUrl}</p>
      `,
    }),
  };
}

function buildBookingCreatedEmail({ name, carName, pickupDate, dropDate, totalPrice }) {
  const safeName = name || 'Customer';
  return {
    subject: 'Your DRIVE booking is confirmed',
    text: `Hi ${safeName}, your booking for ${carName} is confirmed. ${pickupDate} to ${dropDate}. Total: Rs ${totalPrice}.`,
    html: buildDriveTemplate({
      title: 'Booking Confirmed',
      subtitle: 'Your ride is locked in. We are ready when you are.',
      content: `
        <p style="margin:0 0 14px;">Hi ${safeName}, your booking is confirmed.</p>
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

function buildBookingCancelledEmail({ name, carName, pickupDate, dropDate }) {
  const safeName = name || 'Customer';
  return {
    subject: 'Your DRIVE booking was cancelled',
    text: `Hi ${safeName}, your booking for ${carName} (${pickupDate} to ${dropDate}) has been cancelled.`,
    html: buildDriveTemplate({
      title: 'Booking Cancelled',
      subtitle: 'Your reservation was cancelled successfully.',
      content: `
        <p style="margin:0 0 14px;">Hi ${safeName}, your booking has been cancelled.</p>
        ${buildInfoGrid([
          ['Car', carName],
          ['Pickup', pickupDate],
          ['Drop', dropDate],
        ])}
      `,
    }),
  };
}

function buildInfoGrid(items) {
  return `
    <div style="margin-top:12px;border:1px solid #dbeafe;border-radius:14px;overflow:hidden;">
      ${items
        .map(
          ([k, v], idx) => `
            <div style="display:flex;justify-content:space-between;gap:12px;padding:11px 14px;background:${idx % 2 ? '#f8fafc' : '#ffffff'};">
              <span style="color:#475569;font-size:13px;">${k}</span>
              <strong style="color:#0f172a;font-size:13px;">${v}</strong>
            </div>
          `
        )
        .join('')}
    </div>
  `;
}

function buildDriveTemplate({ title, subtitle, content }) {
  return `
    <div style="margin:0;padding:24px 0;background:linear-gradient(135deg,#e0f2fe,#ffffff 45%,#dbeafe);font-family:Outfit,Arial,sans-serif;color:#0f172a;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center">
            <table role="presentation" width="600" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 20px 45px rgba(15,23,42,.12);">
              <tr>
                <td style="padding:20px 24px;background:linear-gradient(135deg,#0ea5e9,#1d4ed8);color:#fff;">
                  <div style="letter-spacing:2px;font-size:12px;opacity:.9;">DRIVE</div>
                  <h1 style="margin:8px 0 6px;font-size:26px;line-height:1.2;">${title}</h1>
                  <p style="margin:0;font-size:14px;opacity:.92;">${subtitle}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:22px 24px 24px;line-height:1.6;font-size:14px;">
                  ${content}
                  <p style="margin:22px 0 0;color:#64748b;font-size:12px;">Need help? Reply to this email and the DRIVE team will assist you.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function buildDriveTemplate({ title, subtitle, content }) {
  return `
    <div style="margin:0;padding:24px 0;background:linear-gradient(135deg,#e0f2fe,#ffffff 45%,#dbeafe);font-family:Outfit,Arial,sans-serif;color:#0f172a;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center">
            <table role="presentation" width="600" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 20px 45px rgba(15,23,42,.12);">
              <tr>
                <td style="padding:20px 24px;background:linear-gradient(135deg,#0ea5e9,#1d4ed8);color:#fff;">
                  <div style="letter-spacing:2px;font-size:12px;opacity:.9;">DRIVE</div>
                  <h1 style="margin:8px 0 6px;font-size:26px;line-height:1.2;">${title}</h1>
                  <p style="margin:0;font-size:14px;opacity:.92;">${subtitle}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:22px 24px 24px;line-height:1.6;font-size:14px;">
                  ${content}
                  <p style="margin:22px 0 0;color:#64748b;font-size:12px;">Need help? Reply to this email and the DRIVE team will assist you.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

module.exports = {
  sendEmail,
  buildVerificationEmail,
  buildBookingCreatedEmail,
  buildBookingCancelledEmail,
};

