const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g., 'LEAD_CREATED', 'BOOKING_UPDATED', 'QUOTE_APPROVED'
  entityType: { type: String, enum: ['Lead', 'Booking', 'Order', 'User', 'Admin', 'Technician', 'Quotation', 'Feedback'], required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  
  performedBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'performerModel' },
  performerModel: { type: String, enum: ['Admin', 'User', 'Technician', 'System'], default: 'System' },
  performerRole: { type: String }, // redundant but helpful for quick display

  description: { type: String },
  previousValue: { type: mongoose.Schema.Types.Mixed },
  updatedValue: { type: mongoose.Schema.Types.Mixed },
  
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for fast searching by entity or performer
auditLogSchema.index({ entityId: 1, entityType: 1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

// Step 12: Security Rules - Prevent editing or deleting logs
auditLogSchema.pre('save', function(next) {
  if (!this.isNew) {
    const err = new Error('Audit logs are immutable and cannot be modified.');
    return next(err);
  }
  next();
});

auditLogSchema.pre(['remove', 'deleteOne', 'findOneAndDelete'], function(next) {
  const err = new Error('Audit logs are permanent and cannot be deleted.');
  return next(err);
});

module.exports = mongoose.model('AuditLog', auditLogSchema);

