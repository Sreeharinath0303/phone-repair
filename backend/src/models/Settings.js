const mongoose = require('mongoose');

// Repair Types
const repairTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { type: String, enum: ['smartphone', 'laptop', 'tablet', 'smartwatch', 'general'], default: 'general' },
  applicableModels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Model' }],
  description: String,
  basePrice: { type: Number, default: 0 },
  basePayout: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Device Brands
const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { type: String, enum: ['smartphone', 'laptop', 'tablet', 'smartwatch'], required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Device Models
const modelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
  category: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Email Templates
const emailTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  subject: { type: String, required: true },
  header: { type: String }, // Custom header text/HTML
  body: { type: String, required: true }, // Main content with placeholders like {{customerName}}
  footer: { type: String }, // Custom footer text/HTML
  ctaText: { type: String }, // Text for the action button
  ctaLink: { type: String }, // Base link or placeholder for action button
  variables: [String], // e.g., ['customerName', 'orderId', 'brand', 'model']
  type: { 
    type: String, 
    enum: ['booking', 'quotation', 'status_update', 'feedback_request', 'invoice', 'otp', 'password_reset', 'partner_assigned', 'marketing'], 
    required: true 
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// OTP & Communication Settings
const communicationSettingsSchema = new mongoose.Schema({
  otpExpiry: { type: Number, default: 10 }, // minutes
  maxOtpAttempts: { type: Number, default: 3 },
  smtpEnabled: { type: Boolean, default: true },
  smsEnabled: { type: Boolean, default: false },
  whatsappEnabled: { type: Boolean, default: false },
  emailNotifications: { type: Boolean, default: true },
  smsNotifications: { type: Boolean, default: false },
  slackWebhookAlerts: { type: Boolean, default: false },
  slackWebhookUrl: { type: String, default: '' },
  autoFollowup: { type: Boolean, default: true },
  followupDays: { type: Number, default: 3 },
  facebookLink: { type: String, default: 'https://www.facebook.com/share/192QskMjUo/' },
  instagramLink: { type: String, default: 'https://www.instagram.com/erepaircafe?igsh=MWV6Z242eDl5MXl0cg==' },
  youtubeLink: { type: String, default: 'https://youtube.com/@erepaircafe?si=XyuvL8OX4-Jjj2Wl' },
  trustpilotLink: { type: String, default: 'https://www.trustpilot.com/review/erepaircafe.com' },
  linkedinLink: { type: String, default: 'https://www.linkedin.com/company/erepaircafe/' },
  twitterLink: { type: String, default: 'https://x.com/ErepairCafe' },
  googleSearchLink: { type: String, default: 'https://www.google.com/search?kgmid=%2Fg%2F11hz37hgnj&hl=en-IN&q=eRepairCafe%20-%20Mobile%20Repair%20%26%20Phone%20Screen%20Repair%20Specialized&shem=epsd1%2Cltac%2Crimspwouoe&shndl=30&source=sh%2Fx%2Floc%2Fosrp%2Fm1%2F2&kgs=0832192f0912660b' },
  whatsappLink: { type: String, default: 'https://wa.me/message/N6IZQBNEIYG7O1' },
  updatedAt: { type: Date, default: Date.now }
});

// Promotions & Offers
const offerSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  description: String,
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true },
  maxUses: { type: Number, default: null }, // null = unlimited
  usedCount: { type: Number, default: 0 },
  minOrderValue: { type: Number, default: 0 },
  applicableCategories: [String], // e.g., ['smartphone', 'laptop']
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = {
  RepairType: mongoose.models.RepairType || mongoose.model('RepairType', repairTypeSchema),
  Brand: mongoose.models.Brand || mongoose.model('Brand', brandSchema),
  Model: mongoose.models.Model || mongoose.model('Model', modelSchema),
  EmailTemplate: mongoose.models.EmailTemplate || mongoose.model('EmailTemplate', emailTemplateSchema),
  CommunicationSettings: mongoose.models.CommunicationSettings || mongoose.model('CommunicationSettings', communicationSettingsSchema),
  Offer: mongoose.models.Offer || mongoose.model('Offer', offerSchema)
};
