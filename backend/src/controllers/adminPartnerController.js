const Technician = require('../models/Technician');
const Booking = require('../models/Booking');
const PartnerIncident = require('../models/PartnerIncident');
const PartnerApplication = require('../models/PartnerApplication');

// @desc  Get all partner applications
// @route GET /api/admin/partner-applications
exports.getAllPartnerApplications = async (req, res) => {
  try {
    const applications = await PartnerApplication.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: applications.length, data: applications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update partner application
// @route PUT /api/admin/partner-applications/:id
exports.updatePartnerApplication = async (req, res) => {
  try {
    const app = await PartnerApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    const { name, businessName, phone, email, specialization, serviceAreas, experienceYears, adminNotes } = req.body;
    
    if (name) app.name = name;
    if (businessName) app.businessName = businessName;
    if (phone) app.phone = phone;
    if (email) app.email = email;
    if (specialization) app.specialization = specialization;
    if (serviceAreas) app.serviceAreas = Array.isArray(serviceAreas) ? serviceAreas : serviceAreas.split(',').map(s => s.trim());
    if (experienceYears !== undefined) app.experienceYears = experienceYears;
    if (adminNotes !== undefined) app.adminNotes = adminNotes;

    await app.save();
    res.json({ success: true, data: app });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Approve partner application
// @route POST /api/admin/partner-applications/:id/approve
exports.approvePartnerApplication = async (req, res) => {
  try {
    const app = await PartnerApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    if (app.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Application is already approved' });
    }

    app.status = 'approved';
    if (req.body.adminNotes) app.adminNotes = req.body.adminNotes;
    
    await app.save();

    // Check if partner already exists
    let partner = await Technician.findOne({ email: app.email });
    if (!partner) {
      partner = await Technician.create({
        name: app.name,
        businessName: app.businessName || 'Independent Technician',
        email: app.email,
        phone: app.phone,
        specialization: app.specialization,
        serviceAreas: app.serviceAreas,
        password: app.phone, // Default password is phone number
        commissionRate: 10,
        address: app.address,
        city: app.city,
        state: app.state,
        pincode: app.pincode
      });
    }

    res.json({ success: true, message: 'Application approved and Partner account created', data: partner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Reject partner application
// @route POST /api/admin/partner-applications/:id/reject
exports.rejectPartnerApplication = async (req, res) => {
  try {
    const app = await PartnerApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    app.status = 'rejected';
    if (req.body.adminNotes) app.adminNotes = req.body.adminNotes;
    
    await app.save();

    res.json({ success: true, message: 'Application rejected', data: app });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// @desc  Get all partners
// @route GET /api/admin/partners
exports.getAllPartners = async (req, res) => {
  try {
    const partners = await Technician.find().sort({ createdAt: -1 }).lean();
    const partnerIds = partners.map((partner) => partner._id);
    const incidents = await PartnerIncident.find({
      partnerId: { $in: partnerIds },
      reviewStatus: 'confirmed'
    }).sort({ createdAt: -1 }).lean();

    const incidentMap = incidents.reduce((acc, incident) => {
      const key = String(incident.partnerId);
      if (!acc[key]) acc[key] = [];
      if (acc[key].length < 5) acc[key].push(incident);
      return acc;
    }, {});

    const data = partners.map((partner) => ({
      ...partner,
      recentConfirmedIncidents: incidentMap[String(partner._id)] || []
    }));

    res.json({ success: true, count: data.length, data });
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
      status: { $in: ['In Progress', 'Device Received', 'Diagnosis In Progress', 'Repair Ongoing', 'Repair In Progress', 'Assigned to Partner'] }
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
    const incidents = await PartnerIncident.find({ partnerId: partner._id, reviewStatus: 'confirmed' })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        partner,
        repairs,
        incidents,
        stats: {
          total: partner.totalRepairs,
          completed: partner.completedRepairs,
          avgRating: partner.averageRating,
          warningStatus: partner.warningStatus,
          confirmedIncidentCount: partner.confirmedIncidentCount,
          successfulRecoveryCount: partner.successfulRecoveryCount
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
