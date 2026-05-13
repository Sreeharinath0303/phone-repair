const Technician = require('../models/Technician');
const Booking = require('../models/Booking');

// @desc  Get all partners
// @route GET /api/admin/partners
exports.getAllPartners = async (req, res) => {
  try {
    const partners = await Technician.find().sort({ createdAt: -1 });
    res.json({ success: true, count: partners.length, data: partners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Create new partner
// @route POST /api/admin/partners
exports.createPartner = async (req, res) => {
  try {
    const { name, email, phone, specialization, serviceAreas, password, commissionRate } = req.body;
    
    if (!name || !email || !phone || !specialization || !password) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    const exists = await Technician.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ success: false, message: 'Partner already exists' });

    const partner = await Technician.create({
      name,
      email: email.toLowerCase(),
      phone,
      specialization,
      serviceAreas: Array.isArray(serviceAreas) ? serviceAreas : (serviceAreas ? serviceAreas.split(',').map(s => s.trim()) : []),
      password,
      commissionRate: commissionRate || 10
    });

    res.status(201).json({ success: true, data: partner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update partner details
// @route PUT /api/admin/partners/:id
exports.updatePartner = async (req, res) => {
  try {
    const { name, email, phone, specialization, serviceAreas, status, commissionRate, isActive } = req.body;
    
    const partner = await Technician.findById(req.params.id);
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

    if (name) partner.name = name;
    if (email) partner.email = email.toLowerCase();
    if (phone) partner.phone = phone;
    if (specialization) partner.specialization = specialization;
    if (serviceAreas) partner.serviceAreas = Array.isArray(serviceAreas) ? serviceAreas : serviceAreas.split(',').map(s => s.trim());
    if (status) partner.status = status;
    if (commissionRate !== undefined) partner.commissionRate = commissionRate;
    if (isActive !== undefined) partner.isActive = isActive;

    await partner.save();
    res.json({ success: true, data: partner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete partner
// @route DELETE /api/admin/partners/:id
exports.deletePartner = async (req, res) => {
  try {
    const partner = await Technician.findById(req.params.id);
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

    // Check if they have assigned repairs
    const hasActiveRepairs = await Booking.countDocuments({ 
      assignedTechnician: partner._id,
      status: { $in: ['In Progress', 'Received', 'Diagnosed'] }
    });

    if (hasActiveRepairs > 0) {
      return res.status(400).json({ success: false, message: 'Partner has active repairs. Reassign or complete them first.' });
    }

    await partner.deleteOne();
    res.json({ success: true, message: 'Partner removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Set partner payout or work amount manually
// @route POST /api/admin/partners/:id/payout
exports.managePayout = async (req, res) => {
  try {
    const { amount, action, note } = req.body; // action: 'add' (work done) | 'subtract' (paid out)
    
    const partner = await Technician.findById(req.params.id);
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

    if (action === 'add') {
      partner.payoutBalance += Number(amount);
      partner.totalEarned += Number(amount);
    } else if (action === 'subtract') {
      partner.payoutBalance -= Number(amount);
    }

    await partner.save();
    res.json({ success: true, data: partner, message: 'Payout updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Reset partner password
// @route POST /api/admin/partners/:id/reset-password
exports.resetPartnerPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 chars' });
    }

    const partner = await Technician.findById(req.params.id);
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

    partner.password = newPassword;
    await partner.save();

    res.json({ success: true, message: 'Partner password reset successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get partner performance and repairs
// @route GET /api/admin/partners/:id/performance
exports.getPartnerPerformance = async (req, res) => {
  try {
    const partner = await Technician.findById(req.params.id);
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

    const repairs = await Booking.find({ assignedTechnician: partner._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: {
        partner,
        repairs,
        stats: {
          total: partner.totalRepairs,
          completed: partner.completedRepairs,
          avgRating: partner.averageRating
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
