const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  referenceNumber: { type: String, unique: true },
  // Customer Link
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  convertedToOrderAt: { type: Date, default: null },
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
  pickupScheduleDate: { type: Date, default: null },
  pickupScheduleTimeSlot: { type: String, default: null },
  deliveryScheduleDate: { type: Date, default: null },
  deliveryScheduleTimeSlot: { type: String, default: null },
  // Repair Status
  status: {
    type: String,
    enum: [
      'Pending', 'Under Review', 'Quote Prepared', 'Offer Sent', 'Awaiting Customer Approval', 
      'Approved by Customer', 'Rejected by Customer', 'Assigned to Partner', 
      'Pickup Scheduled', 'Picked Up', 'Device Received',
      'Diagnosis In Progress', 'Repair Ongoing', 'Waiting for Part', 'Order Paused', 
      'Repair Completed', 'Quality Check Done', 'Ready for Dispatch', 'Out for Delivery / Ready for Pickup', 
      'Delivered', 'Completed', 'Feedback Pending', 'Closed', 'Cancelled', 
      'In Diagnosis', 'In Progress', 'Repair In Progress', 'Ready for Delivery', 'Job Closed', 'Device Picked Up', 'Assigned', 'Awaiting Approval',
      'Ongoing', 'Waiting for Spare Part', 'Ready for Return',
      'Lead Received', 'Sent For Partner Quote', 'Partner Quote Received', 'Quote Sent To Customer',
      'Quote Approved', 'Quote Rejected', 'Partner Locked', 'Store Visit Scheduled',
      'Handoff Started', 'Revised Quote Required', 'Repair In Progress', 'Delivered / Returned',
      'Settlement Pending', 'Settlement Completed', 'Disputed'
    ],
    default: 'Pending'
  },
  assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', default: null },
  workflowPhase: {
    type: String,
    enum: ['intake', 'partner_quote_collection', 'commercial_review', 'customer_approval', 'partner_locked', 'handoff', 'repair', 'return', 'settlement'],
    default: 'intake'
  },
  // Timeline
  timeline: [{
    stage:     { type: String },
    note:      { type: String },
    date: { type: Date, default: Date.now }
  }],
  // Financials
  // Approximate estimate shown immediately after booking submission (system-calculated).
  approxAmount: { type: Number, default: 0 },
  quotationAmount: { type: Number, default: 0 },
  partnerPayout:   { type: Number, default: 0 }, // Amount assigned by Admin to the partner
  partnerQuotedAmount: { type: Number, default: 0 },
  quotedByPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', default: null },
  markupType: { type: String, enum: ['fixed', 'percentage', 'direct_admin_quote', null], default: null },
  markupValue: { type: Number, default: 0 },
  partnerPayoutLocked: { type: Number, default: 0 },
  platformMargin: { type: Number, default: 0 },
  assignmentLockedAt: { type: Date, default: null },
  assignmentLockReason: { type: String, default: '' },
  quotationStatus: { type: String, enum: ['Pending', 'Quote Prepared', 'Offer Sent', 'Awaiting Customer Approval', 'Approved by Customer', 'Rejected by Customer', 'Not Issued', 'Approved', 'Rejected'], default: 'Not Issued' },
  discount:        { type: Number, default: 0 },
  appliedOfferCode: { type: String, default: '' },
  appliedOfferId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', default: null },
  estimatedTime:   { type: String, default: '' },
  warrantyPeriod:  { type: String, default: '3 Months' },
  technicianNote:  { type: String, default: '' },
  repairSummary:   { type: String, default: '' },
  termsAndConditions: { type: String, default: '' },
  partnerRemarks:  [{
    note: { type: String },
    date: { type: Date, default: Date.now }
  }],
  // Step 3: Tracking Page OTP Security
  trackingOtp: { type: String, select: false },
  trackingOtpExpiry: { type: Date, select: false },
  pickupOtp: { type: String, select: false },
  pickupOtpExpiry: { type: Date, select: false },
  returnOtp: { type: String, select: false },
  returnOtpExpiry: { type: Date, select: false },
  handoffStartedAt: { type: Date, default: null },
  handoffVerifiedAt: { type: Date, default: null },
  handoffVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', default: null },
  handoffMode: { type: String, enum: ['pickup', 'dropoff', 'walkin', null], default: null },
  handoffAttempts: { type: Number, default: 0 },
  lastHandoffAttemptAt: { type: Date, default: null },
  handoffFailureReason: { type: String, default: '' },
  handoffFailureHistory: [{
    attemptNumber: { type: Number, default: 0 },
    incidentType: { type: String, enum: ['customer_cancelled_at_handoff', 'customer_no_show'] },
    note: { type: String, default: '' },
    reportedAt: { type: Date, default: Date.now }
  }],
  // Step 7: Rejected Quote Tracking
  rejectionReason: { type: String, default: null },
  followUpStatus:  { type: String, enum: ['Not Applicable', 'Follow-Up Pending', 'Followed Up', 'Reopened Quotes', 'Cancelled Cases'], default: 'Not Applicable' },
  followUpNotes:   { type: String, default: '' },
  // Invoice
  invoiceNumber: { type: String, default: null },
  invoiceDate: { type: Date, default: null },
  finalAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Partial', 'Refunded'], default: 'Pending' },
  paymentDate: { type: Date, default: null },
  // ─── Location Intelligence ─────────────────────────────────
  latitude:       { type: Number, default: null },
  longitude:      { type: Number, default: null },
  ipCity:         { type: String, default: null },  // IP-based approximate city
  locationSource: { type: String, enum: ['gps', 'ip', 'manual', null], default: null },
  // Step 7: Feedback Status Control
  customerFeedbackStatus: { type: String, enum: ['Feedback Pending', 'Feedback Submitted'], default: 'Feedback Pending' },
  showInCustomerFeedbackSection: { type: Boolean, default: true },
  partnerFeedbackStatus:  { type: String, enum: ['Feedback Pending', 'Feedback Submitted'], default: 'Feedback Pending' },
  convertedFromLead:      { type: Boolean, default: false },
}, { timestamps: true });

// Step 17: Performance Optimization Indexes
bookingSchema.index({ customerName: 'text', customerEmail: 'text', customerPhone: 'text' });
bookingSchema.index({ status: 1, quotationStatus: 1, assignedTechnician: 1 });
bookingSchema.index({ city: 1, state: 1, pincode: 1 });
bookingSchema.index({ createdAt: -1 });

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
