const Technician = require('../models/Technician');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const OTPRecord = require('../models/OTPRecord');

// @desc  Login for technicians (Partners)
// @route POST /api/technician-auth/login
// @access Public
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or phone

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email/phone and password' });
    }

    const normalizedIdentifier = String(identifier).trim();
    const normalizedEmail = normalizedIdentifier.toLowerCase();

    // Check for technician by email or phone
    let tech = await Technician.findOne({
      $or: [{ email: normalizedEmail }, { phone: normalizedIdentifier }],
      isActive: true
    }).select('+password');

    if (!tech) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or account inactive' });
    }

    if (tech.isLocked && (!tech.lockedUntil || tech.lockedUntil > new Date())) {
      return res.status(403).json({ success: false, message: 'Account is locked. Please contact support.' });
    }

    // Passwords for technicians are set by admin and hashed.
    const isMatch = await bcrypt.compare(password, tech.password);
    if (!isMatch) {
      // Increment login attempts
      tech.loginAttempts = (tech.loginAttempts || 0) + 1;
      if (tech.loginAttempts >= 5) {
        tech.isLocked = true;
        tech.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
      }
      await tech.save();
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Reset login attempts on success
    tech.loginAttempts = 0;
    tech.isLocked = false;
    tech.lockedUntil = undefined;
    await tech.save();

    // Create token payload
    const token = jwt.sign({ id: tech._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '30d'
    });

    const mustReset = tech.mustResetPassword;
    tech.password = undefined;

    res.json({
      success: true,
      message: mustReset ? 'Login successful. Please reset your password.' : 'Login successful',
      token,
      mustResetPassword: mustReset,
      data: {
        id: tech._id,
        name: tech.name,
        email: tech.email,
        phone: tech.phone,
        role: 'partner',
        businessName: tech.businessName,
        city: tech.city,
        specialization: tech.specialization
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get current technician profile
// @route GET /api/technician-auth/me
// @access Private (Technician)
exports.getMe = async (req, res) => {
  try {
    const tech = await Technician.findById(req.user.id);
    if (!tech) return res.status(404).json({ success: false, message: 'Technician not found' });
    res.json({ success: true, data: tech });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update technician profile
// @route PUT /api/technician-auth/profile
// @access Private (Technician)
exports.updateProfile = async (req, res) => {
  try {
    const tech = await Technician.findById(req.user.id);
    if (!tech) return res.status(404).json({ success: false, message: 'Technician not found' });

    if (req.body.name) tech.name = req.body.name;
    if (req.body.phone) tech.phone = req.body.phone;
    if (req.body.address) tech.address = req.body.address;
    if (req.body.city) tech.city = req.body.city;
    if (req.body.specialization) tech.specialization = req.body.specialization;
    if (req.body.serviceAreas) tech.serviceAreas = req.body.serviceAreas;

    if (req.body.password) {
      tech.password = req.body.password;
    }

    await tech.save();
    res.json({ success: true, data: tech, message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Change technician password
// @route PUT /api/technician-auth/update-password
// @access Private (Technician)
exports.updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const tech = await Technician.findById(req.user.id).select('+password');
    
    if (!tech) return res.status(404).json({ success: false, message: 'Technician not found' });

    const isMatch = await bcrypt.compare(oldPassword, tech.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    tech.password = newPassword;
    tech.mustResetPassword = false; // Clear flag if they changed it themselves
    await tech.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Forgot password for technicians
// @route POST /api/technician-auth/forgot-password
// @access Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Please provide your email' });

    const tech = await Technician.findOne({ email, isActive: true });
    if (!tech) {
      // Don't reveal if the email exists
      return res.json({ success: true, message: 'If this email is registered, an OTP has been sent.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP
    await OTPRecord.findOneAndDelete({ recipient: email, type: 'password_reset' });
    await OTPRecord.create({
      recipient: email,
      otp,
      type: 'password_reset',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 min expiry
    });

    // Try to send email
    try {
      const sendEmail = require('../utils/sendEmail');
      await sendEmail({
        email: tech.email,
        subject: 'erepaircafe Partner - Password Reset OTP',
        message: `Hello ${tech.name},\n\nYour password reset OTP is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.\n\n- erepaircafe Team`
      });
    } catch (emailErr) {
      console.log(`[PARTNER RESET OTP] Email: ${email}, OTP: ${otp} (Email send failed: ${emailErr.message})`);
    }

    // Always log OTP in dev for testing
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n🔑 [PARTNER RESET OTP] Email: ${email} | OTP: ${otp}\n`);
    }

    res.json({ success: true, message: 'If this email is registered, an OTP has been sent.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Reset password with OTP for technicians
// @route POST /api/technician-auth/reset-password
// @access Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    // Verify OTP
    const record = await OTPRecord.findOne({ recipient: email, otp, type: 'password_reset', isUsed: false });
    if (!record) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    if (record.expiresAt && record.expiresAt < new Date()) {
      await OTPRecord.findByIdAndDelete(record._id);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Update password
    const tech = await Technician.findOne({ email, isActive: true });
    if (!tech) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    tech.password = newPassword; // Will be hashed by pre-save hook
    tech.mustResetPassword = false;
    tech.loginAttempts = 0;
    tech.isLocked = false;
    tech.lockedUntil = undefined;
    await tech.save();

    // Delete used OTP
    await OTPRecord.findByIdAndDelete(record._id);

    res.json({ success: true, message: 'Password reset successfully. Please login with your new password.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

