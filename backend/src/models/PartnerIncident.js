const mongoose = require('mongoose');

const partnerIncidentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true, index: true },
  serviceMode: { type: String, enum: ['pickup', 'dropoff', 'walkin'], required: true },
  incidentType: {
    type: String,
    enum: ['customer_cancelled_at_handoff', 'customer_no_show'],
    required: true
  },
  attemptNumber: { type: Number, default: 1 },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true },
  partnerNote: { type: String, default: '' },
  proofMetadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  reviewStatus: { type: String, enum: ['pending', 'confirmed', 'rejected'], default: 'pending' },
  confirmedAt: { type: Date, default: null },
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null }
}, { timestamps: true });

partnerIncidentSchema.index({ partnerId: 1, reviewStatus: 1, createdAt: -1 });

module.exports = mongoose.model('PartnerIncident', partnerIncidentSchema);
