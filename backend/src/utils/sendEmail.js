const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create transporter
  // For production, use actual SMTP settings
  // In development, you can use Mailtrap or similar
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
    port: process.env.EMAIL_PORT || 2525,
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || '',
    },
  });

  const mailOptions = {
    from: `RepairVafe <${process.env.FROM_EMAIL || 'noreply@repairvafe.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${options.email}`);
    
    // Step 17: Create Notification Logs and Audit History natively
    try {
       const NotificationLog = require('../models/NotificationLog');
       await NotificationLog.create({
          eventName: options.subject.split(':')[0] || 'GENERAL_EMAIL',
          recipient: options.email,
          channel: 'EMAIL',
          deliveryStatus: 'SENT'
       });
    } catch(logErr) { console.error('Silent log ingestion bypassed'); }

  } catch (error) {
    console.error('Email sending failed:', error.message);
    
    // Step 17: Failed State Log
    try {
       const NotificationLog = require('../models/NotificationLog');
       await NotificationLog.create({
          eventName: options.subject.split(':')[0] || 'GENERAL_EMAIL',
          recipient: options.email,
          channel: 'EMAIL',
          deliveryStatus: 'FAILED',
          errorMessage: error.message
       });
    } catch(logErr) { console.error('Silent failure log ingestion bypassed'); }
    // In dev, we still want to log the OTP
    if (process.env.NODE_ENV === 'development') {
      console.log('--- DEVELOPMENT MODE: Email Content ---');
      console.log(`To: ${options.email}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Message: ${options.message}`);
      console.log('---------------------------------------');
    }
    // Don't throw if we are in dev so it doesn't break the flow
    if (process.env.NODE_ENV !== 'development') {
      throw error;
    }
  }
};

module.exports = sendEmail;
