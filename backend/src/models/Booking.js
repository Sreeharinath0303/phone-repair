const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  referenceNumber: { type: String, unique: true },
  // Device Info
  deviceCategory: { type: String, required: true, enum: ['smartphone', 'laptop', 'tablet', 'smartwatch'] },
  deviceBrand:    { type: String, required: true },
  deviceModel:    { type: String, required: true },
  repairTypes:    [{ type: String, required: true }],
  issueDescription: { type: String, default: '' },
  // Customer Info
  customerName:   { type: String, required: true },
  customerPhone:  { type: String, required: true },
  customerEmail:  { type: String, required: true },
  serviceType:    { type: String, enum: ['dropoff', 'pickup', 'walkin'], required: true },
  address:        { type: String, required: true },
  city:           { type: String, required: true },
  state:          { type: String, required: true },
  pincode:        { type: String, required: true },
  preferredDate:  { type: Date, required: true },
  preferredTimeSlot: { type: String, required: true },
  // Repair Status
  status: {
    type: String,
    enum: ['Received', 'Diagnosed', 'Awaiting Approval', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Received'
  },
  assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', default: null },
  // Timeline
  timeline: [{
    stage:     { type: String },
    note:      { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  // Financials
  quotationAmount: { type: Number, default: 0 },
  quotationStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Not Issued'], default: 'Not Issued' },
  discount:        { type: Number, default: 0 },
  estimatedTime:   { type: String, default: '' },
  warrantyPeriod:  { type: String, default: '3 Months' },
  technicianNote:  { type: String, default: '' },
}, { timestamps: true });

// Auto-generate reference number before saving
bookingSchema.pre('save', async function (next) {
  if (!this.referenceNumber) {
    const count = await mongoose.model('Booking').countDocuments();
    const year = new Date().getFullYear();
    this.referenceNumber = `RV-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
