const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Info
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  phone:    { type: String, required: true, unique: true },

  // Authentication
  role:     { type: String, enum: ['customer'], default: 'customer' },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  // OTP Management
  otp:      { type: String, select: false },
  otpExpiry: { type: Date, select: false },
  otpAttempts: { type: Number, default: 0, select: false },
  otpVerificationAttempts: { type: Number, default: 0, select: false },

  // Profile Information
  address:  { type: String, default: '' },
  city:     { type: String, default: '' },
  state:    { type: String, default: '' },
  pincode:  { type: String, default: '' },

  savedAddresses: [{
    label: { type: String, default: 'Home' },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
  }],

  // Account Status
  lastLogin: { type: Date },
  lastOtpSent: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false },
  lockedUntil: { type: Date },

  // Preferences
  enableEmailNotifications: { type: Boolean, default: true },
  enableSmsNotifications: { type: Boolean, default: true },
  preferredCommunication: { type: String, enum: ['email', 'sms', 'both'], default: 'both' },

  // Additional Info
  totalRepairs: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

// Generate OTP
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  this.otpAttempts = 0;
  return otp;
};

// Verify OTP
userSchema.methods.verifyOTP = function (enteredOtp) {
  if (!this.otp || !this.otpExpiry) return false;
  if (this.otpExpiry < new Date()) return false;
  if (this.otpVerificationAttempts >= 3) return false;

  this.otpVerificationAttempts++;
  return this.otp === String(enteredOtp);
};

// Clear OTP after successful verification
userSchema.methods.clearOTP = function () {
  this.otp = undefined;
  this.otpExpiry = undefined;
  this.otpAttempts = 0;
  this.otpVerificationAttempts = 0;
};

module.exports = mongoose.model('User', userSchema);
