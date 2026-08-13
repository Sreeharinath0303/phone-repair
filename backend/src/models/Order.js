const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  orderNumber: { type: String, unique: true },
  referenceNumber: { type: String, default: '' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String, required: true },
  deviceCategory: { type: String, enum: ['smartphone', 'laptop', 'tablet', 'smartwatch'], required: true },
  deviceBrand: { type: String, required: true },
  deviceModel: { type: String, required: true },
  repairTypes: [{ type: String }],
  issueDescription: { type: String, default: '' },
  serviceType: { type: String, enum: ['dropoff', 'pickup', 'walkin'], required: true },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  pincode: { type: String, default: '' },
  preferredDate: { type: Date, default: null },
  preferredTimeSlot: { type: String, default: '' },
  status: { type: String, default: 'Quote Approved' },
  quotationStatus: { type: String, default: 'Approved by Customer' },
  workflowPhase: { type: String, default: 'partner_locked' },
  assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', default: null },
  approxAmount: { type: Number, default: 0 },
  quotationAmount: { type: Number, default: 0 },
  partnerPayout: { type: Number, default: 0 },
  partnerQuotedAmount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  appliedOfferCode: { type: String, default: '' },
  estimatedTime: { type: String, default: '' },
  warrantyPeriod: { type: String, default: '3 Months' },
  repairSummary: { type: String, default: '' },
  termsAndConditions: { type: String, default: '' },
  finalAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Partial', 'Refunded'], default: 'Pending' },
  paymentDate: { type: Date, default: null },
  invoiceNumber: { type: String, default: null },
  invoiceDate: { type: Date, default: null },
  timeline: [{
    stage: { type: String, default: '' },
    note: { type: String, default: '' },
    date: { type: Date, default: Date.now }
  }],
  approvedAt: { type: Date, default: Date.now }
}, { timestamps: true });

orderSchema.index({ referenceNumber: 1 });
orderSchema.index({ status: 1, assignedTechnician: 1 });

orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    const year = new Date().getFullYear();
    this.orderNumber = `ORD-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
