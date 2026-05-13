const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  eventName: { 
     type: String, 
     required: true 
  }, // e.g., 'otp', 'booking_confirmation'
  eventType: { 
     type: String 
  }, // e.g., 'TRANSACTIONAL', 'MARKETING'
  recipient: { 
     type: String, 
     required: true 
  }, // email or phone
  channel: { 
     type: String, 
     enum: ['EMAIL', 'SMS', 'WHATSAPP'], 
     default: 'EMAIL' 
  },
  deliveryStatus: { 
     type: String, 
     enum: ['SENT', 'FAILED', 'PENDING'],
     default: 'PENDING'
  },
  providerId: { 
     type: String 
  }, // Resend ID
  errorMessage: {
     type: String
  },
  sentAt: { 
     type: Date, 
     default: Date.now 
  }
});

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
