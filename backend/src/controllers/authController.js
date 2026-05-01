const Admin = require('../models/Admin');
const jwt   = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// @desc  Universal login (Admin, Customer, Technician)
// @route POST /api/auth/login
// @access Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    const lowerEmail = email.toLowerCase();
    
    // 1. Try finding an Admin
    let account = await Admin.findOne({ email: lowerEmail }).select('+password');
    let role = 'admin';

    // 2. Try finding a User (Customer)
    if (!account) {
      const User = require('../models/User');
      account = await User.findOne({ email: lowerEmail }).select('+password');
      role = 'customer';
    }

    // 3. Try finding a Technician (Partner)
    if (!account) {
      const Technician = require('../models/Technician');
      account = await Technician.findOne({ email: lowerEmail }).select('+password');
      role = 'partner';
    }

    if (!account) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify Password against whatever model was hit (all use bcrypt/matchPassword logic)
    const isMatch = await account.matchPassword ? await account.matchPassword(password) : await require('bcryptjs').compare(password, account.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (account.isActive === false) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const token = signToken(account._id);
    
    // Handle model-specific login touches
    if (role === 'admin') {
      account.lastLogin = new Date();
      await account.save();
    }

    res.json({
      success: true,
      token,
      data: { id: account._id, name: account.name, email: account.email, role: account.role || role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Forgot Password - Send OTP
// @route POST /api/auth/forgot-password
// @access Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    const otp = admin.generateOTP();
    await admin.save();

    await sendEmail({
      email: admin.email,
      subject: 'Password Reset OTP - RepairVafe',
      message: `Your OTP for password reset is: ${otp}. It expires in 10 minutes.`,
      html: `<h3>Password Reset OTP</h3><p>Your OTP for password reset is: <strong>${otp}</strong></p><p>It expires in 10 minutes.</p>`
    });

    res.json({ success: true, message: 'OTP sent to email' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Verify OTP
// @route POST /api/auth/verify-otp
// @access Public
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiry');
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    if (!admin.verifyOTP(otp)) {
      await admin.save(); // Increment attempts
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    await admin.save();
    
    // Step 9: Add Security Events (OTP Verification)
    try {
        console.log(`[SECURITY EVENT ROUTER] -> Secure OTP Token precisely validated by Admin Engine for user: ${admin.email}`);
    } catch(e) { /* ignore */ }

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Reset Password
// @route POST /api/auth/reset-password
// @access Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP and new password are required' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiry');
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    if (!admin.verifyOTP(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    admin.password = newPassword;
    admin.clearOTP();
    // Step 9: Add Security Events (Password Reset Webhooks)
    try {
       await sendEmail({
         email: admin.email,
         subject: 'RepairVafe Security: Password Reset Successfully',
         message: `Your administrative password was successfully reset just now.\n\nIf you did not authorize this change, please contact SuperAdmin immediately as your access limits may be compromised.`
       });
       
       // Log to Master System Array
       console.log(`[SECURITY EVENT ROUTER] -> Password securely mutated for Admin ${admin.email}`);
    } catch(e) {
       console.error('Password reset security webhook fallback:', e.message);
    }

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Register admin (first-time setup)
// @route POST /api/auth/register
// @access Public (should be protected in production)
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }
    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ success: false, message: 'Admin already exists' });

    const admin = await Admin.create({ name, email, password, role });
    const token = signToken(admin._id);
    res.status(201).json({ success: true, token, data: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Get current admin profile
// @route GET /api/auth/me
// @access Private
exports.getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.json({ success: true, data: admin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
