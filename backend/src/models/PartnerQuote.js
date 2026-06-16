const mongoose = require('mongoose');

const partnerQuoteSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  bookingReference: { type: String, required: true, index: true },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true, index: true },
  quoteAmount: { type: Number, default: 0 },
  eta: { type: String, default: '' },
  warranty: { type: String, default: '' },
  notes: { type: String, default: '' },
  status: {
    type: String,
    enum: ['requested', 'submitted', 'declined', 'expired', 'selected', 'rejected'],
    default: 'requested'
  },
  requestPayload: {
    deviceCategory: { type: String, default: '' },
    deviceBrand: { type: String, default: '' },
    deviceModel: { type: String, default: '' },
    repairTypes: [{ type: String }],
    issueDescription: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    serviceType: { type: String, default: '' }
  },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  selectedAt: { type: Date, default: null }
}, { timestamps: true });

partnerQuoteSchema.index({ bookingId: 1, partnerId: 1 }, { unique: true });

module.exports = mongoose.model('PartnerQuote', partnerQuoteSchema);
