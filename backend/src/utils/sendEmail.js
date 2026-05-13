const { Resend } = require('resend');
const { getEmailTemplate } = require('./emailTemplates');

const sendEmail = async (options, retryCount = 0) => {
  const MAX_RETRIES = 2;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const fromName = process.env.FROM_NAME || 'RepairVafe';

  let { email, subject, message, html, type, data } = options;

  // Step 9: Template Selection Logic
  if (type) {
    const templateData = await getEmailTemplate(type, data || {});
    subject = templateData.subject;
    html = templateData.html;
  }

  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    to: email,
    subject: subject,
    text: message || 'Please view this email in an HTML compatible viewer.',
    html: html,
  };

  try {
    const { data: resData, error } = await resend.emails.send(mailOptions);

    if (error) throw new Error(error.message);

    console.log(`Email sent via Resend to ${email}. ID: ${resData.id}`);
    
    // Step 11: Create Email Logs
    try {
       const NotificationLog = require('../models/NotificationLog');
       await NotificationLog.create({
          eventName: subject.split('|')[0].trim(),
          eventType: type || 'TRANSACTIONAL',
          recipient: email,
          channel: 'EMAIL',
          deliveryStatus: 'SENT',
          providerId: resData.id
       });
    } catch(logErr) { console.error('Silent log ingestion bypassed'); }

  } catch (error) {
    console.error(`Email attempt ${retryCount + 1} failed:`, error.message);
    
    // Step 12: Create Retry Mechanism
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
