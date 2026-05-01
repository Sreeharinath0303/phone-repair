const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });

// @desc  Customer Registration (Step 1: Save info and send OTP)
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, address, city, state, pincode } = req.body;

    // Check if user exists
    const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
    if (existing) {
      if (existing.isVerified) {
        return res.status(400).json({ success: false, message: 'User already exists with this email or phone' });
      } else {
        // User exists but not verified, update and resend OTP
        existing.name = name;
        existing.password = password;
        existing.address = address;
        existing.city = city;
        existing.state = state;
        existing.pincode = pincode;
        const otp = existing.generateOTP();
        await existing.save();
        await sendOTP(existing.email, otp);
        return res.json({ success: true, message: 'OTP sent for verification', data: { email: existing.email } });
      }
    }

    const user = await User.create({
      name, email: email.toLowerCase(), phone, password, address, city, state, pincode, isVerified: false
    });

    const otp = user.generateOTP();
    await user.save();
    await sendOTP(user.email, otp);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify OTP sent to your email.',
      data: { email: user.email }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Verify Registration OTP
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
    res.json({
      success: true,
      token,
      message: 'Account verified successfully',
      data: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Customer Login (Step 1: Check password and send OTP)
exports.login = async (req, res) => {
  try {
    const { loginId, password } = req.body; // loginId can be email or phone
    if (!loginId || !password) return res.status(400).json({ success: false, message: 'Login ID and password required' });

    const user = await User.findOne({ 
      $or: [{ email: loginId.toLowerCase() }, { phone: loginId }] 
    }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      const otp = user.generateOTP();
      await user.save();
      await sendOTP(user.email, otp);
      return res.status(403).json({ success: false, message: 'Account not verified. OTP sent to email.', unverified: true });
    }

    // For secure login requested, we send OTP even for verified users
    const otp = user.generateOTP();
    await user.save();
    await sendOTP(user.email, otp);

    res.json({
      success: true,
      message: 'OTP sent to your registered email for login verification',
      data: { email: user.email }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Verify Login OTP
exports.verifyLogin = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiry');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.verifyOTP(otp)) {
      await user.save();
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.clearOTP();
    await user.save();

    const token = signToken(user._id);
    res.json({
      success: true,
      token,
      data: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Forgot Password - Send OTP
exports.forgotPassword = async (req, res) => {
  try {
    const { loginId } = req.body;
    const user = await User.findOne({ 
      $or: [{ email: loginId.toLowerCase() }, { phone: loginId }] 
    });

    if (!user) return res.status(404).json({ success: false, message: 'No user found with this email/phone' });

    const otp = user.generateOTP();
    await user.save();
    await sendOTP(user.email, otp);

    res.json({ success: true, message: 'OTP sent for password reset' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiry');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.verifyOTP(otp)) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    user.password = newPassword;
    user.clearOTP();
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get current customer profile
// @route GET /api/customer-auth/me
// @access Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Helper: Send OTP
async function sendOTP(email, otp) {
  await sendEmail({
    email,
    subject: 'Verification OTP - RepairVafe',
    html: `<h3>Your Verification OTP</h3><p>Your OTP is: <strong>${otp}</strong>. It expires in 10 minutes.</p>`
  });
}
