const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  eventName: { 
     type: String, 
     required: true 
  }, // e.g. 'NEW_BOOKING', 'OFFER_SENT'
  recipient: { 
     type: String, 
     required: true 
  }, // email or phone
  channel: { 
     type: String, 
     enum: ['EMAIL', 'SMS', 'WHATSAPP', 'PUSH'] 
  },
  deliveryStatus: { 
     type: String, 
     enum: ['SENT', 'FAILED', 'PENDING'],
     default: 'SENT'
  },
  errorMessage: {
     type: String
  },
  sentAt: { 
     type: Date, 
     default: Date.now 
  }
});

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
