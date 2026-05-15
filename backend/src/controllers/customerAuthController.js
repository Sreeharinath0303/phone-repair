const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });

// ─── EMAIL & PASSWORD FLOW (Steps 4 & 5) ──────────────────────

// Register via Email & Password
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 8 characters long, and include at least one uppercase letter, one lowercase letter, one number and one special character' 
      });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) return res.status(400).json({ success: false, message: 'Email already registered' });

    user = await User.create({
      name: name || 'Customer',
      email: email.toLowerCase(),
      password,
      isVerified: false
    });

    const otp = user.generateOTP();
    await user.save();

    // Send Verification Email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Verify your RepairVafe Account',
        message: `Your verification OTP is: ${otp}. It expires in 10 minutes.`
      });
    } catch (e) {
      console.log('Verification email failed, skipping');
    }

    res.status(201).json({ 
      success: true, 
      message: 'Registration successful. OTP sent to email.', 
      data: { email: user.email }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Login via Email & Password
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact support.' });
    }

    if (user.isLocked && (!user.lockedUntil || user.lockedUntil > new Date())) {
      return res.status(403).json({ success: false, message: 'Account is locked. Please contact support.' });
    }

    if (!user.isVerified) {
      const otp = user.generateOTP();
      await user.save();
      try {
        await sendEmail({
          email: user.email,
          subject: 'Verify your RepairVafe Account',
          message: `Your verification OTP is: ${otp}. It expires in 10 minutes.`
        });
      } catch (e) {}
      return res.status(403).json({ success: false, message: 'Account not verified. OTP sent to email.', unverified: true });
    }

    user.lastLogin = new Date();
    user.loginAttempts = 0;
    await user.save();

    const token = signToken(user._id);
    const mustReset = user.mustResetPassword;
    res.json({ 
      success: true, 
      token, 
      mustResetPassword: mustReset,
      message: mustReset ? 'Login successful. Please reset your password.' : 'Login successful',
      data: { id: user._id, name: user.name, email: user.email, phone: user.phone } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Verify Email Registration OTP
exports.verifyRegistration = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiry');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.verifyOTP(otp)) {
      await user.save();
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.clearOTP();
    await user.save();

    const token = signToken(user._id);
    res.json({ success: true, token, message: 'Account verified successfully', data: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── MOBILE OTP FLOW (Steps 3 & 5) ────────────────────────────

// Request Mobile Login/Registration OTP
exports.requestMobileOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Mobile number required' });

    let user = await User.findOne({ phone });
    if (!user) {
      // First time user via mobile -> Register them
      user = await User.create({ phone, isVerified: false });
    }

    const otp = user.generateOTP();
    await user.save();

    // Send ACTUAL SMS
    try {
      await sendSMS({
        phone,
        message: `Your RepairVafe login OTP is: ${otp}. Valid for 10 minutes.`
      });
    } catch (e) {
      console.log('SMS sending failed, but continuing for dev logs');
    }

    res.json({ 
      success: true, 
      message: 'OTP sent to your mobile number.', 
      isNewUser: !user.isVerified
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Verify Mobile Login/Registration OTP
exports.verifyMobileOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const user = await User.findOne({ phone }).select('+otp +otpExpiry');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.verifyOTP(otp)) {
      await user.save();
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.lastLogin = new Date();
    user.loginAttempts = 0;
    user.clearOTP();
    await user.save();

    const token = signToken(user._id);
    res.json({ success: true, token, message: 'Authentication successful', data: { id: user._id, name: user.name, phone: user.phone, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── UTILS ──────────────────────────────────────────────────

exports.forgotPassword = async (req, res) => {
  try {
    const { loginId } = req.body;
    const user = await User.findOne({ $or: [{ email: loginId.toLowerCase() }, { phone: loginId }] });

    if (!user) return res.status(404).json({ success: false, message: 'No user found' });

    const otp = user.generateOTP();
    await user.save();
    console.log(`[FORGOT PASSWORD OTP] sent to ${loginId}: ${otp}`);

    res.json({ success: true, message: 'OTP sent for password reset' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phone: email }] }).select('+otp +otpExpiry');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.verifyOTP(otp)) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 8 characters long, and include at least one uppercase letter, one lowercase letter, one number and one special character' 
      });
    }

    user.password = newPassword;
    user.clearOTP();
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const checkPass = currentPassword || oldPassword;
    if (!checkPass || !(await user.matchPassword(checkPass))) {
      return res.status(401).json({ success: false, message: 'Incorrect current password' });
    }

    user.password = newPassword;
    user.mustResetPassword = false;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

