const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { 
    type: String, 
    required: true, 
    select: false
  },
  role:     { type: String, enum: ['superadmin', 'admin', 'sales', 'services'], default: 'admin' },
  isActive: { type: Boolean, default: true },
  // Permissions
  permissions: {
    manageCustomers: { type: Boolean, default: true },
    managePartners: { type: Boolean, default: true },
    manageOrders: { type: Boolean, default: true },
    viewIncompleteLeads: { type: Boolean, default: true },
    assignOrders: { type: Boolean, default: true },
    setServiceQuote: { type: Boolean, default: true },
    setPartnerPayout: { type: Boolean, default: true },
    updateStatuses: { type: Boolean, default: true },
    sendEmailNotifications: { type: Boolean, default: true },
    viewFullServiceHistory: { type: Boolean, default: true },
    viewFeedback: { type: Boolean, default: true },
    searchAndFilter: { type: Boolean, default: true },
    resetPasswords: { type: Boolean, default: true },
    viewAnalytics: { type: Boolean, default: true },
    exportData: { type: Boolean, default: true },
    manageEmailTemplates: { type: Boolean, default: false },
    manageCommunicationSettings: { type: Boolean, default: false },
    manageRepairTypes: { type: Boolean, default: false },
    manageBrands: { type: Boolean, default: false },
    manageModels: { type: Boolean, default: false },
    manageOffers: { type: Boolean, default: false }
  },
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false },
  lockedUntil: { type: Date },
  // OTP Management
  otp:      { type: String, select: false },
  otpExpiry: { type: Date, select: false },
  otpAttempts: { type: Number, default: 0, select: false },
  otpVerificationAttempts: { type: Number, default: 0, select: false },
}, { timestamps: true });

// Hash password before save
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
adminSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

// Generate OTP
adminSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  this.otpAttempts = 0;
  this.otpVerificationAttempts = 0;
  return otp;
};

// Verify OTP
adminSchema.methods.verifyOTP = function (enteredOtp) {
  if (!this.otp || !this.otpExpiry) return false;
  if (this.otpExpiry < new Date()) return false;
  if (this.otpVerificationAttempts >= 3) return false;

  this.otpVerificationAttempts++;
  return this.otp === String(enteredOtp);
};

// Clear OTP after successful verification
adminSchema.methods.clearOTP = function () {
  this.otp = undefined;
  this.otpExpiry = undefined;
  this.otpAttempts = 0;
  this.otpVerificationAttempts = 0;
};

module.exports = mongoose.model('Admin', adminSchema);
