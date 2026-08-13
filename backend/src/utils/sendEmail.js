const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const { getEmailTemplate } = require('./emailTemplates');

const buildSmtpTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT || 587),
    secure: String(process.env.EMAIL_PORT || 587) === '465',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

const sendViaResend = async ({ from, to, subject, text, html }) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const response = await resend.emails.send({
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    text,
    html,
  });

  if (response.error) {
    throw new Error(response.error.message || 'Resend email dispatch failed');
  }

  return {
    provider: 'Resend',
    providerId: response.data?.id || '',
  };
};

const sendViaSmtp = async (transporter, mailOptions) => {
  const info = await transporter.sendMail(mailOptions);

  return {
    provider: 'SMTP',
    providerId: info.messageId || '',
  };
};

const sendEmail = async (options, retryCount = 0) => {
  const MAX_RETRIES = 2;
  const resendApiKey = process.env.RESEND_API_KEY;
  const transporter = buildSmtpTransporter();

  if (!resendApiKey && !transporter) {
    console.error('\n[EMAIL ERROR]: Neither Resend nor SMTP credentials are configured.');
    throw new Error('Email provider missing. Configure RESEND_API_KEY or EMAIL_USER and EMAIL_PASS in backend/.env');
  }

  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'notifications@erepaircafe.com';
  const fromName = process.env.FROM_NAME || 'eRepaircafe';

  let { email, subject, message, html, type, data } = options;

  if (type) {
    const templateData = await getEmailTemplate(type, data || {});
    subject = templateData.subject;
    html = templateData.html;
  }

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: email,
    subject,
    text: message || 'Please view this email in an HTML compatible viewer.',
    html: html || message,
  };

  try {
    const delivery = resendApiKey
      ? await sendViaResend(mailOptions)
      : await sendViaSmtp(transporter, mailOptions);

    console.log(
      `Email sent successfully via ${delivery.provider} to ${email}.${delivery.providerId ? ` ProviderId: ${delivery.providerId}` : ''}`
    );

    try {
      const NotificationLog = require('../models/NotificationLog');
      await NotificationLog.create({
        eventName: (subject || 'GENERAL_EMAIL').split('|')[0].trim(),
        eventType: type || 'TRANSACTIONAL',
        recipient: email,
        channel: 'EMAIL',
        deliveryStatus: 'SENT',
        providerId: delivery.providerId,
      });
    } catch (logErr) {
      console.error('Silent log ingestion bypassed');
    }
  } catch (error) {
    console.error(`Email attempt ${retryCount + 1} failed:`, error.message);

    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return sendEmail(options, retryCount + 1);
    }

    try {
      const NotificationLog = require('../models/NotificationLog');
      await NotificationLog.create({
        eventName: subject || 'GENERAL_EMAIL',
        eventType: type || 'TRANSACTIONAL',
        recipient: email,
        channel: 'EMAIL',
        deliveryStatus: 'FAILED',
        errorMessage: error.message,
      });
    } catch (logErr) {
      console.error('Silent failure log ingestion bypassed');
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('--- DEVELOPMENT MODE: Final Email Failure ---');
      console.log(`To: ${email} | Subject: ${subject}`);
    }

    if (process.env.NODE_ENV !== 'development') {
      throw error;
    }
  }
};

module.exports = sendEmail;
