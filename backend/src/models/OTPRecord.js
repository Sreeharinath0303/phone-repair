const mongoose = require('mongoose');

const otpRecordSchema = new mongoose.Schema({
  recipient: { type: String, required: true }, // Email or Phone
  otp: { type: String, required: true },
  type: { type: String, enum: ['login', 'password_reset', 'verification', 'tracking'], required: true },
  isUsed: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 }
}, { timestamps: true });

// Auto-expire after expiry date
otpRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OTPRecord', otpRecordSchema);
