const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || process.env.GMAIL_USER;
const SENDER_NAME = 'MITE Placement Cell';
const { getValidatedFrontendUrl } = require('../utils/urlValidator');
const { logger } = require('../config/logger');

/**
 * Escape HTML special characters to prevent XSS in email templates.
 * Converts &, <, >, ", ' to their safe HTML entity equivalents.
 * @param {*} value - The value to escape (coerced to string)
 * @returns {string} HTML-safe string
 */
const escapeHtml = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, String.fromCharCode(39) + 'quot;'); // Use numeric entity for single quote
};

/**
 * Send an email via Brevo's HTTP API (bypasses Render's SMTP block)
 * @param {object} options - { to, subject, html, senderName }
 */
const sendViaBrev = async ({ to, subject, html, senderName }) => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName || SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Brevo API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data;
};

/**
 * Send OTP verification email
 * @param {string} fullName - User's full name
 * @param {string} email - User's email
 * @param {string} otp - 6-digit OTP code
 */
const sendOTPEmail = async (fullName, email, otp) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#F8F9FA;font-family:'Inter',Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;">
        <!-- Header -->
        <tr>
          <td style="background-color:#09529B;padding:24px 32px;text-align:center;">
            <h1 style="color:#ffffff;font-size:32px;margin:0;font-weight:800;letter-spacing:1px;font-family:'Montserrat',Arial,sans-serif;">MITE</h1>
            <p style="color:#ffffff;font-size:14px;margin:8px 0 0;font-weight:600;letter-spacing:0.5px;opacity:0.9;">Placement Portal</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background-color:#ffffff;padding:40px 32px;">
            <p style="color:#1A1D21;font-size:16px;font-weight:600;margin:0 0 8px;">Hi ${escapeHtml(fullName)},</p>
            <p style="color:#495057;font-size:14px;line-height:1.6;margin:0 0 24px;">
              Use the code below to verify your email address and activate your placement portal account.
            </p>
            <!-- OTP Block -->
            <div style="text-align:center;margin:0 0 24px;">
              <div style="display:inline-block;background-color:#F48120;border-radius:12px;padding:16px 32px;">
                <span style="font-family:'JetBrains Mono','Courier New',monospace;font-size:32px;font-weight:700;color:#ffffff;letter-spacing:8px;">${otp}</span>
              </div>
            </div>
            <p style="color:#495057;font-size:13px;line-height:1.5;margin:0 0 8px;text-align:center;">
              This code expires in <strong>10 minutes</strong>.
            </p>
            <p style="color:#6C757D;font-size:12px;line-height:1.5;margin:24px 0 0;">
              If you didn't create an account, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color:#063872;padding:20px 32px;text-align:center;">
            <p style="color:#9DB5D1;font-size:11px;line-height:1.5;margin:0;">
              This is an automated message from MITE Placement Cell.<br>
              Do not reply to this email.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const data = await sendViaBrev({
      to: email,
      subject: `Your Verification Code: ${otp}`,
      html,
    });
    logger.info({ email, messageId: data?.messageId }, 'OTP email sent');
  } catch (error) {
    logger.error({ err: error, email, message: error.message }, 'Failed to send OTP email');
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};

/**
 * Send password reset email
 * @param {string} fullName - User's full name
 * @param {string} email - User's email
 * @param {string} resetURL - Full URL for password reset
 */
const sendResetEmail = async (fullName, email, resetURL) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#F8F9FA;font-family:'Inter',Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;">
        <!-- Header -->
        <tr>
          <td style="background-color:#09529B;padding:24px 32px;text-align:center;">
            <h1 style="color:#ffffff;font-size:32px;margin:0;font-weight:800;letter-spacing:1px;font-family:'Montserrat',Arial,sans-serif;">MITE</h1>
            <p style="color:#ffffff;font-size:14px;margin:8px 0 0;font-weight:600;letter-spacing:0.5px;opacity:0.9;">Placement Portal</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background-color:#ffffff;padding:40px 32px;">
            <p style="color:#1A1D21;font-size:16px;font-weight:600;margin:0 0 8px;">Hi ${escapeHtml(fullName)},</p>
            <p style="color:#495057;font-size:14px;line-height:1.6;margin:0 0 24px;">
              We received a request to reset your password. Click the button below to set a new password.
            </p>
            <!-- CTA Button -->
            <div style="text-align:center;margin:0 0 24px;">
              <a href="${resetURL}" style="display:inline-block;background-color:#F48120;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 40px;border-radius:8px;">
                Reset Password
              </a>
            </div>
            <p style="color:#495057;font-size:13px;line-height:1.5;margin:0 0 8px;text-align:center;">
              This link expires in <strong>15 minutes</strong>.
            </p>
            <p style="color:#6C757D;font-size:12px;line-height:1.5;margin:24px 0 0;">
              If you didn't request a password reset, you can safely ignore this email. Your account remains secure.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color:#063872;padding:20px 32px;text-align:center;">
            <p style="color:#9DB5D1;font-size:11px;line-height:1.5;margin:0;">
              This is an automated message from MITE Placement Cell.<br>
              Do not reply to this email.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const data = await sendViaBrev({
      to: email,
      subject: 'Reset your portal password',
      html,
    });
    logger.info({ email, messageId: data?.messageId }, 'Reset email sent');
  } catch (error) {
    logger.error({ err: error, email, message: error.message }, 'Failed to send reset email');
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};

/**
 * Send Admin login OTP email (security-themed)
 * @param {string} fullName - Admin's full name
 * @param {string} email - Admin's email
 * @param {string} otp - 6-digit OTP code
 */
const sendAdminOTPEmail = async (fullName, email, otp) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#0F0F0F;font-family:'Inter',Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:28px 32px;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:10px;">
              <span style="font-size:22px;">🛡️</span>
              <h1 style="color:#ffffff;font-size:22px;margin:0;font-weight:800;letter-spacing:1px;">MITE Admin Portal</h1>
            </div>
            <p style="color:#94a3b8;font-size:12px;margin:8px 0 0;font-weight:500;letter-spacing:1px;text-transform:uppercase;">Security Verification</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background-color:#1e1e2e;padding:40px 32px;">
            <p style="color:#e2e8f0;font-size:16px;font-weight:600;margin:0 0 8px;">Hi ${escapeHtml(fullName)},</p>
            <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 28px;">
              A sign-in attempt was made on the <strong style="color:#e2e8f0;">MITE Admin Dashboard</strong>.
              Use the code below to complete your login. This code is valid for <strong style="color:#f59e0b;">10 minutes</strong>.
            </p>
            <!-- OTP Block -->
            <div style="text-align:center;margin:0 0 28px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#1e40af,#7c3aed);border-radius:14px;padding:20px 40px;">
                <span style="font-family:'JetBrains Mono','Courier New',monospace;font-size:36px;font-weight:700;color:#ffffff;letter-spacing:10px;">${otp}</span>
              </div>
            </div>
            <div style="background:#2d1b0e;border:1px solid #92400e;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
              <p style="color:#fbbf24;font-size:13px;margin:0;line-height:1.6;">
                ⚠️ <strong>Security Notice:</strong> If you did not attempt to log in, your credentials may be compromised.
                Please contact the system administrator immediately and change your password.
              </p>
            </div>
            <p style="color:#64748b;font-size:12px;line-height:1.5;margin:0;text-align:center;">
              This code will expire automatically. Do not share it with anyone.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color:#0f0f1a;padding:20px 32px;text-align:center;border-top:1px solid #1e293b;">
            <p style="color:#475569;font-size:11px;line-height:1.5;margin:0;">
              MITE Placement Cell — Automated Security Alert<br>
              Do not reply to this email.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const data = await sendViaBrev({
      to: email,
      subject: `[ADMIN] Login Verification Code: ${otp}`,
      html,
      senderName: 'MITE Placement Cell — Security',
    });
    logger.info({ email, messageId: data?.messageId }, 'Admin OTP email sent');
  } catch (error) {
    logger.error({ err: error, email, message: error.message }, 'Failed to send admin OTP email');
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};

/**
 * Send application status update email to a student
 * @param {string} fullName       - Student's full name
 * @param {string} email          - Student's email
 * @param {string} companyName    - Company the student applied to
 * @param {string} jobRole        - Job role title
 * @param {string} newStatus      - New application status value (e.g. 'shortlisted')
 * @param {string} [remarks]      - Optional admin remarks
 */
const sendStatusUpdateEmail = async (fullName, email, companyName, jobRole, newStatus, remarks) => {
  // Map raw status to human-readable label + UI colour for the email badge
  const statusMap = {
    'shortlisted':          { label: 'Shortlisted 🎉',           color: '#059669', bg: '#D1FAE5' },
    'not-shortlisted':      { label: 'Not Shortlisted',          color: '#DC2626', bg: '#FEE2E2' },
    'test-cleared':         { label: 'Online Test Cleared ✅',   color: '#0284C7', bg: '#E0F2FE' },
    'test-failed':          { label: 'Online Test Not Cleared',  color: '#DC2626', bg: '#FEE2E2' },
    'interview-scheduled':  { label: 'Interview Scheduled 📅',  color: '#7C3AED', bg: '#EDE9FE' },
    'selected':             { label: 'Selected — Offer Extended 🏆', color: '#D97706', bg: '#FEF3C7' },
    'rejected':             { label: 'Application Closed',       color: '#6B7280', bg: '#F3F4F6' },
  };

  const statusInfo = statusMap[newStatus] || { label: newStatus, color: '#09529B', bg: '#EFF6FF' };

  const remarksBlock = remarks
    ? `<div style="background:#F8F9FA;border-left:3px solid #F48120;border-radius:6px;padding:14px 18px;margin:20px 0;">
         <p style="color:#495057;font-size:13px;margin:0 0 4px;font-weight:600;">Remarks from Placement Cell:</p>
         <p style="color:#495057;font-size:14px;margin:0;line-height:1.6;">${escapeHtml(remarks)}</p>
       </div>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#F8F9FA;font-family:'Inter',Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;">
        <!-- Header -->
        <tr>
          <td style="background-color:#09529B;padding:24px 32px;text-align:center;">
            <h1 style="color:#ffffff;font-size:32px;margin:0;font-weight:800;letter-spacing:1px;font-family:'Montserrat',Arial,sans-serif;">MITE</h1>
            <p style="color:#ffffff;font-size:14px;margin:8px 0 0;font-weight:600;letter-spacing:0.5px;opacity:0.9;">Placement Portal</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background-color:#ffffff;padding:40px 32px;">
            <p style="color:#1A1D21;font-size:16px;font-weight:600;margin:0 0 8px;">Hi ${escapeHtml(fullName)},</p>
            <p style="color:#495057;font-size:14px;line-height:1.6;margin:0 0 24px;">
              There has been an update on your application for
              <strong>${escapeHtml(jobRole)}</strong> at <strong>${escapeHtml(companyName)}</strong>.
            </p>
            <!-- Status Badge -->
            <div style="text-align:center;margin:0 0 24px;">
              <div style="display:inline-block;background-color:${statusInfo.bg};border-radius:12px;padding:14px 32px;border:1px solid ${statusInfo.color}30;">
                <span style="font-size:20px;font-weight:700;color:${statusInfo.color};letter-spacing:0.5px;">
                  ${statusInfo.label}
                </span>
              </div>
            </div>
            ${remarksBlock}
            <p style="color:#495057;font-size:14px;line-height:1.6;margin:0 0 8px;">
              Log in to the Placement Portal to view your full application status and next steps.
            </p>
            ${(() => {
              const frontendUrl = getValidatedFrontendUrl();
              return `<div style="text-align:center;margin:24px 0 0;">
                <a href="${frontendUrl}/dashboard/student/applications"
                   style="display:inline-block;background-color:#F48120;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 40px;border-radius:8px;">
                  View My Applications
                </a>
              </div>`;
            })()}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color:#063872;padding:20px 32px;text-align:center;">
            <p style="color:#9DB5D1;font-size:11px;line-height:1.5;margin:0;">
              This is an automated message from MITE Placement Cell.<br>
              Do not reply to this email.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const data = await sendViaBrev({
      to: email,
      subject: `Application Update: ${escapeHtml(companyName)} — ${statusInfo.label}`,
      html,
    });
    logger.info({ email, status: newStatus, messageId: data?.messageId }, 'Status update email sent');
  } catch (error) {
    // Log but do NOT throw — email failure should never fail the status update API call
    logger.error({ err: error, email, status: newStatus, message: error.message }, 'Failed to send status update email');
  }
};

module.exports = {
  sendOTPEmail,
  sendResetEmail,
  sendAdminOTPEmail,
  sendStatusUpdateEmail,
};
