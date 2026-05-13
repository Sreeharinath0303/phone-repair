const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  booking:      { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  orderId:      { type: String, required: true }, // referenceNumber
  type:         { type: String, enum: ['customer', 'partner'], required: true },
  fromId:       { type: mongoose.Schema.Types.ObjectId, required: true }, // User or Technician ID
  fromName:     { type: String, required: true },
  
  // Customer Specific Fields (Step 3)
  rating:       { type: Number, min: 1, max: 5 }, // Overall Rating
  review:       { type: String },
  serviceQuality: { type: Number, min: 1, max: 5 },
  pickupExperience: { type: Number, min: 1, max: 5 },
  technicianBehavior: { type: Number, min: 1, max: 5 },
  timeliness: { type: Number, min: 1, max: 5 },
  overallSatisfaction: { type: Number, min: 1, max: 5 },

  // Partner Specific Fields (Step 4)
  orderQuality: { type: Number, min: 1, max: 5 },
  customerCooperation: { type: Number, min: 1, max: 5 },
  deviceCondition: { type: String },
  adminCoordination: { type: Number, min: 1, max: 5 },
  partsNotes: { type: String },

  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure one feedback per type per booking
feedbackSchema.index({ booking: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
