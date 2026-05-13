const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' },
  deviceInfo: {
    category: String,
    brand: String,
    model: String,
    serialNumber: String
  },
  repairDetails: [{
    service: String,
    price: Number
  }],
  status: {
    type: String,
    enum: ['Received', 'Confirmed', 'Picked Up', 'In Repair', 'Completed', 'Delivered', 'Cancelled'],
    default: 'Received'
  },
  payment: {
    amount: Number,
    status: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
    method: String,
    transactionId: String
  },
  timeline: [{
    status: String,
    note: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${Date.now().toString().slice(-4)}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
