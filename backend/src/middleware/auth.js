const jwt   = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized. No token provided.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check Admin first, then User, then Technician
    let user = await Admin.findById(decoded.id);
    if (!user) {
      user = await User.findById(decoded.id);
    }
    if (!user) {
      const Technician = require('../models/Technician');
      user = await Technician.findById(decoded.id);
    }
    
    if (!user) return res.status(401).json({ success: false, message: 'Identity not found' });
    req.user = user;
    req.user.role = req.user.role || req.user.constructor.modelName;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Access denied: Role '${req.user.role}' unauthorized.` });
    }
    next();
  };
};

exports.hasPermission = (perm) => {
  return (req, res, next) => {
    if (req.user.role === 'superadmin') return next();
    if (req.user.permissions && req.user.permissions[perm]) return next();
    res.status(403).json({ success: false, message: `Access denied: Missing '${perm}' permission.` });
  };
};
