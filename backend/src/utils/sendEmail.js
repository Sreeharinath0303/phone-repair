const nodemailer = require('nodemailer');
const { getEmailTemplate } = require('./emailTemplates');

const sendEmail = async (options, retryCount = 0) => {
  const MAX_RETRIES = 2;
  
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  
  if (!emailUser || !emailPass) {
    console.error('\n❌ [SMTP ERROR]: EMAIL_USER or EMAIL_PASS is missing in your .env file!');
    console.error('❌ Cannot send OTP to real email addresses without valid SMTP credentials.');
    throw new Error('SMTP credentials missing. Please configure EMAIL_USER and EMAIL_PASS in backend/.env');
  }

  // Set up Nodemailer Transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  const fromEmail = process.env.EMAIL_FROM || emailUser || 'onboarding@repairvafe.com';
  const fromName = process.env.FROM_NAME || 'RepairVafe';

  let { email, subject, message, html, type, data } = options;

  // Step 9: Template Selection Logic
  if (type) {
    const templateData = await getEmailTemplate(type, data || {});
    subject = templateData.subject;
    html = templateData.html;
  }

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: email,
    subject: subject,
    text: message || 'Please view this email in an HTML compatible viewer.',
    html: html || message, // Fallback to raw message if no HTML template
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully via Nodemailer to ${email}. MessageId: ${info.messageId}`);
    
    // Create Email Logs
    try {
       const NotificationLog = require('../models/NotificationLog');
       await NotificationLog.create({
          eventName: subject.split('|')[0].trim(),
          eventType: type || 'TRANSACTIONAL',
          recipient: email,
          channel: 'EMAIL',
          deliveryStatus: 'SENT',
          providerId: info.messageId
       });
    } catch(logErr) { console.error('Silent log ingestion bypassed'); }

  } catch (error) {
    console.error(`Email attempt ${retryCount + 1} failed:`, error.message);
    
    // Create Retry Mechanism
    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(res => setTimeout(res, delay));
      return sendEmail(options, retryCount + 1);
    }

    // Final Failure Log
    try {
       const NotificationLog = require('../models/NotificationLog');
       await NotificationLog.create({
          eventName: subject || 'GENERAL_EMAIL',
          eventType: type || 'TRANSACTIONAL',
          recipient: email,
          channel: 'EMAIL',
          deliveryStatus: 'FAILED',
          errorMessage: error.message
       });
    } catch(logErr) { console.error('Silent failure log ingestion bypassed'); }

    if (process.env.NODE_ENV === 'development') {
      console.log('--- DEVELOPMENT MODE: Final Email Failure ---');
      console.log(`To: ${email} | Subject: ${subject}`);
    }

    if (process.env.NODE_ENV !== 'development') throw error;
  }
};

module.exports = sendEmail;

module.exports = sendEmail;
