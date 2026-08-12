const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });

const normalizePhone = (value) => String(value || '').replace(/\D/g, '').trim();

exports.getAccountStatus = async (req, res) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    const phone = normalizePhone(req.query.phone);
    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'Email or phone is required' });
    }

    const [emailUser, phoneUser] = await Promise.all([
      email ? User.findOne({ email }).select('_id email phone name isActive') : null,
      phone ? User.findOne({ phone }).select('_id email phone name isActive') : null
    ]);

    const matchedUser = emailUser || phoneUser;
    const sameUser = Boolean(emailUser && phoneUser && String(emailUser._id) === String(phoneUser._id));
    const conflict = Boolean(emailUser && phoneUser && !sameUser);

    res.json({
      success: true,
      data: {
        exists: Boolean(matchedUser),
        email,
        phone,
        name: matchedUser?.name || '',
        isActive: matchedUser?.isActive ?? true,
        matchedBy: conflict
          ? 'conflict'
          : sameUser
            ? 'email_and_phone'
            : emailUser
              ? 'email'
              : phoneUser
                ? 'phone'
                : '',
        conflict,
        message: conflict
          ? 'This email and mobile number are linked to different customer accounts. Please sign in with the existing account details.'
          : emailUser
            ? 'A customer account already exists for this email.'
            : phoneUser
              ? 'A customer account already exists for this mobile number.'
              : ''
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── EMAIL & PASSWORD FLOW (Steps 4 & 5) ──────────────────────

// Register via Email & Password
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPhone = normalizePhone(req.body.phone);

    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    if (normalizedPhone && !/^[0-9]{10}$/.test(normalizedPhone)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit mobile number.' });
    }

    // Password strength validation (relaxed to 6+ characters to reduce friction)
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    const [emailUser, phoneUser] = await Promise.all([
      User.findOne({ email: normalizedEmail }).select('+password'),
      normalizedPhone ? User.findOne({ phone: normalizedPhone }).select('+password') : null
    ]);

    if (emailUser && phoneUser && String(emailUser._id) !== String(phoneUser._id)) {
      return res.status(409).json({
        success: false,
        message: 'This email and mobile number are already linked to different customer accounts. Please sign in with the existing account.',
        meta: { matchedBy: 'conflict' }
      });
    }

    let user = emailUser || phoneUser;
    if (user) {
      if (user.password) {
        return res.status(409).json({
          success: false,
          message: emailUser
            ? 'This email is already registered. Please sign in instead.'
            : 'This mobile number is already linked to an existing customer account. Please sign in instead.',
          meta: { matchedBy: emailUser ? 'email' : 'phone' }
        });
      }

      user.name = name || user.name || 'Customer';
      user.email = normalizedEmail;
      if (normalizedPhone) {
        user.phone = normalizedPhone;
      }
      user.password = password;
      user.isVerified = true;
      await user.save();

      return res.status(201).json({
        success: true,
        message: 'Customer account completed successfully. Please login.',
        data: { email: user.email }
      });
    }

    user = await User.create({
      name: name || 'Customer',
      email: normalizedEmail,
      phone: normalizedPhone || undefined,
      password,
      isVerified: true // Auto-verify all new accounts
    });

    res.status(201).json({ 
      success: true, 
      message: 'Registration successful. Please login.', 
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
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check account status before verifying password
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact support.' });
    }

    // Auto-unlock expired locks
    if (user.isLocked && user.lockedUntil && user.lockedUntil <= new Date()) {
      user.isLocked = false;
      user.lockedUntil = undefined;
      user.loginAttempts = 0;
    }

    if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
      const mins = Math.ceil((user.lockedUntil - new Date()) / 60000);
      return res.status(403).json({ success: false, message: `Account is temporarily locked. Try again in ${mins} minute(s).` });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // ✅ Login success
    user.lastLogin = new Date();
    user.loginAttempts = 0;

    // Ensure older accounts are marked as verified
    if (!user.isVerified) {
      user.isVerified = true;
    }

    await user.save();

    const token = signToken(user._id);
    const mustReset = user.mustResetPassword || false;
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
        message: `Your erepaircafe login OTP is: ${otp}. Valid for 10 minutes.`
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
    const email = String(req.body.email || req.body.loginId || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email }).select('+otp +otpExpiry');

    if (!user) return res.status(404).json({ success: false, message: 'No user found' });

    const otp = user.generateOTP();
    await user.save();

    try {
      await sendEmail({
        email,
        type: 'otp',
        data: { name: user.name || 'Customer', otp }
      });
    } catch (sendErr) {
      return res.status(500).json({ success: false, message: sendErr.message });
    }

    res.json({ success: true, message: 'Password reset OTP sent to your email' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.exchangeEmailAccessToken = async (req, res) => {
  try {
    const token = String(req.body.token || '').trim();
    if (!token) {
      return res.status(400).json({ success: false, message: 'Email access token is required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== 'customer-email-access' || !decoded.id) {
      return res.status(400).json({ success: false, message: 'Invalid email access token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer account not found' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Customer account is inactive' });
    }

    user.lastLogin = new Date();
    user.loginAttempts = 0;
    if (!user.isVerified) {
      user.isVerified = true;
    }
    await user.save();

    const sessionToken = signToken(user._id);
    res.json({
      success: true,
      token: sessionToken,
      message: 'Customer session restored successfully',
      data: { id: user._id, name: user.name, email: user.email, phone: user.phone },
      meta: {
        bookingId: decoded.bookingId || null,
        quoteAction: decoded.quoteAction || ''
      }
    });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Email access link is invalid or expired' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+otp +otpExpiry +password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.verifyOTP(otp)) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long'
      });
    }

    user.password = newPassword;
    user.mustResetPassword = false;
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


