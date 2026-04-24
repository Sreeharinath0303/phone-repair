const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  booking:      { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  referenceNumber: { type: String, required: true },
  customerName: { type: String, required: true },
  deviceName:   { type: String, required: true },
  // Ratings (1–5)
  overallRating:  { type: Number, required: true, min: 1, max: 5 },
  qualityRating:  { type: Number, min: 1, max: 5 },
  timeRating:     { type: Number, min: 1, max: 5 },
  valueRating:    { type: Number, min: 1, max: 5 },
  staffRating:    { type: Number, min: 1, max: 5 },
  // Written
  comment:        { type: String, default: '' },
  wouldRecommend: { type: String, enum: ['yes', 'maybe', 'no'], default: 'yes' },
  contactConsent: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
