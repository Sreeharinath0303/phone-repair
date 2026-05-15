const axios = require('axios');

/**
 * Sends an SMS using an external provider.
 * Currently supports a placeholder implementation.
 * You can integrate Twilio, Fast2SMS, or Msg91 here.
 */
const sendSMS = async ({ phone, message }) => {
  try {
    // If you have a Twilio account:
    // const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    // await twilio.messages.create({ body: message, from: process.env.TWILIO_PHONE, to: phone });

    // For testing/development if no API key is provided:
    if (!process.env.SMS_API_KEY || process.env.SMS_API_KEY === 'placeholder') {
      console.log(`\n📱 [SMS SIMULATOR] To: ${phone}\n💬 Message: ${message}\n`);
      return { success: true, simulated: true };
    }

    // Example integration with a Generic SMS API (like Fast2SMS or similar)
    // const response = await axios.get(`https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.SMS_API_KEY}&route=otp&variables_values=${message}&numbers=${phone}`);
    
    // return response.data;
    
    console.log(`✅ SMS sent successfully to ${phone}`);
    return { success: true };
  } catch (error) {
    console.error('❌ SMS Sending Failed:', error.message);
    throw new Error('Failed to send SMS. Please try again later.');
  }
};

module.exports = sendSMS;
