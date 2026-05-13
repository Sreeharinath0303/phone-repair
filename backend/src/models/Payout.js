const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Processed', 'Failed'], default: 'Pending' },
  method: { type: String, enum: ['Bank Transfer', 'UPI', 'Cash'], default: 'UPI' },
  transactionId: { type: String },
  orderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  processedAt: { type: Date },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Payout', payoutSchema);
