const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  quotationNumber: { type: String, unique: true },
  amount: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true },
  items: [{
    description: String,
    price: Number
  }],
  status: { 
    type: String, 
    enum: ['Pending', 'Sent', 'Approved', 'Rejected', 'Expired'], 
    default: 'Pending' 
  },
  rejectionReason: { type: String },
  validUntil: { type: Date },
  terms: { type: String },
  notes: { type: String },
  sentAt: { type: Date },
  respondedAt: { type: Date }
}, { timestamps: true });

// Auto-generate quotation number
quotationSchema.pre('save', async function (next) {
  if (!this.quotationNumber) {
    const count = await mongoose.model('Quotation').countDocuments();
    this.quotationNumber = `QT-${Date.now().toString().slice(-4)}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Quotation', quotationSchema);
