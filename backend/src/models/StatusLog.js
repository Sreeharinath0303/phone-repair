const mongoose = require('mongoose');

const statusLogSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  status: { type: String, required: true },
  note: { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'updaterModel' },
  updaterModel: { type: String, enum: ['Admin', 'Technician', 'User'] },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('StatusLog', statusLogSchema);
