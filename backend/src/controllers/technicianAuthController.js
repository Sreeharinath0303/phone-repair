const Technician = require('../models/Technician');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc  Login for technicians (Partners)
// @route POST /api/technician-auth/login
// @access Public
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or phone

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email/phone and password' });
    }

    // Check for technician by email or phone
    const tech = await Technician.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
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
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

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
      data: tech
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

    if (req.body.password) {
      tech.password = await bcrypt.hash(req.body.password, 12);
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
