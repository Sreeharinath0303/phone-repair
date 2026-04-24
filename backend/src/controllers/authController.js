const Admin = require('../models/Admin');
const jwt   = require('jsonwebtoken');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// @desc  Admin login
// @route POST /api/auth/login
// @access Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
    if (!admin || !(await admin.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = signToken(admin._id);
    res.json({
      success: true,
      token,
      data: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
    });
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
  const admin = await Admin.findById(req.user.id);
  res.json({ success: true, data: admin });
};
