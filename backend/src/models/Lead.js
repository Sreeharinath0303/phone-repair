const mongoose = require('mongoose');

const LEAD_STAGES = Object.freeze({
  NEW_LEAD: 'New lead',
  INCOMPLETE_BOOKING: 'Incomplete booking',
  BOOKING_COMPLETED: 'Booking completed',
  FOLLOW_UP_SENT: 'Follow-up sent',
  CONVERTED_TO_ORDER: 'Converted to order',
  LOST_INACTIVE: 'Lost / inactive'
});

const leadSchema = new mongoose.Schema({
  customerName: { type: String, required: true, trim: true },
  mobileNumber: { type: String, required: true, trim: true },
  normalizedMobile: { type: String, required: true, index: true },
  email: { type: String, default: '', trim: true },
  address: { type: String, default: '', trim: true },
  city: { type: String, default: '', trim: true },
  state: { type: String, default: '', trim: true },
  pincode: { type: String, default: '', trim: true },
  deviceCategory: { type: String, default: '' },
  deviceBrand: { type: String, default: '' },
  deviceModel: { type: String, default: '' },
  repairTypes: [{ type: String }],
  source: { type: String, default: 'website' },
  stage: {
    type: String,
    enum: Object.values(LEAD_STAGES),
    default: LEAD_STAGES.NEW_LEAD
  },
  bookingCompleted: { type: Boolean, default: false },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  bookingReference: { type: String, default: '' },
  abandonedAt: { type: Date, default: null },
  convertedAt: { type: Date, default: null },
  followUpSentAt: { type: Date, default: null },
  lostAt: { type: Date, default: null },
  lastActivityAt: { type: Date, default: Date.now },
  stageHistory: [{
    stage: { type: String, enum: Object.values(LEAD_STAGES) },
    note: { type: String, default: '' },
    changedAt: { type: Date, default: Date.now }
  }],
  followUpMessages: [{
    channel: { type: String, enum: ['email', 'sms', 'whatsapp'], required: true },
    templateKey: { type: String, default: '' },
    message: { type: String, required: true, trim: true },
    sentAt: { type: Date, default: Date.now },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  }]
}, { timestamps: true });

leadSchema.index({ normalizedMobile: 1, bookingCompleted: 1 });

module.exports = {
  Lead: mongoose.model('Lead', leadSchema),
  LEAD_STAGES
};
