const Technician = require('../models/Technician');
const PartnerQuote = require('../models/PartnerQuote');
const PartnerIncident = require('../models/PartnerIncident');
const { buildPartnerVisibleBooking, recalculatePartnerRisk } = require('../utils/workflow');

exports.getAllTechnicians = async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {}; // Not forcing isActive: true to allow admin to see inactive ones if needed
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }

    const technicians = await Technician.find(filter).sort({ name: 1 });
    res.json({ success: true, data: technicians });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const sendEmail = require('../utils/sendEmail');

exports.createTechnician = async (req, res) => {
  try {
    const tech = await Technician.create(req.body);
    
    // Step 6: Add Partner Assignment Events (New Partner Creation Triggers)
    if (req.body.password && req.body.email) {
      const message = `Welcome to the RepairVafe Partner Network, ${tech.name}!\n\nAn administrator has explicitly provisioned your service account.\n\nYour secure login credentials are:\nEmail: ${tech.email}\nPassword: ${req.body.password}\n\nPlease log in immediately at your Partner Portal to begin accepting assignments.`;
      
      try {
        // 1. Partner Onboarding Alert (Email + Mocks)
        console.log(`[SMS WEBHOOK DISPATCH] -> Texting +91${tech.phone || '999999999'}: "Welcome to RepairVafe! Your Service Partner account is active. Check your email for login keys."`);
        console.log(`[WHATSAPP API DISPATCH] -> Messaging +91${tech.phone || '999999999'}: "RepairVafe Network Alert: Partner Profile '${tech.name}' initialized. 🔧🚀"`);
        await sendEmail({
          email: tech.email,
          subject: 'RepairVafe - Your Partner Credentials',
          message: message
        });
        
        // 2. Admin Alert Logic
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@repairvafe.com';
        await sendEmail({
          email: adminEmail,
          subject: `[EVENT] New Partner Onboarded: ${tech.name}`,
          message: `An event was triggered: NEW PARTNER CREATION.\n\nTechnician: ${tech.name}\nEmail: ${tech.email}\nPhone: ${tech.phone || 'N/A'}\n\nPartner successfully integrated into Master execution array.`
        });
        
      } catch (emailErr) {
        console.error('Partner onboarded natively, but credential notification skipped/failed: ', emailErr.message);
      }
    }
    
    res.status(201).json({ success: true, data: tech, message: 'Technician added and credentials dispatched' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateTechnician = async (req, res) => {
  try {
    const tech = await Technician.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!tech) return res.status(404).json({ success: false, message: 'Technician not found' });
    res.json({ success: true, data: tech });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteTechnician = async (req, res) => {
  try {
    await Technician.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Technician removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const Booking = require('../models/Booking');
const ALLOWED_PARTNER_STATUS_FLOW = {
  'Assigned to Partner': 'Confirmed',
  'Confirmed': 'Picked Up',
  'Picked Up': 'In Repair',
  'In Repair': 'Completed',
  'Completed': 'Delivered'
};

// @desc  Get Partner Dashboard Stats
// @route GET /api/technicians/dashboard-stats
// @access Private (Technician)
exports.getPartnerDashboardStats = async (req, res) => {
  try {
    const techId = req.user.id;
    const tech = await Technician.findById(techId);
    
    const assigned = await Booking.countDocuments({ assignedTechnician: techId, status: 'Assigned to Partner' });
    const pending = await Booking.countDocuments({ assignedTechnician: techId, status: { $in: ['Pending', 'Offer Sent'] } });
    const active = await Booking.countDocuments({ assignedTechnician: techId, status: { $nin: ['Completed', 'Repair Completed', 'Closed', 'Job Closed', 'Cancelled', 'Assigned to Partner', 'Pending', 'Offer Sent'] } });
    const completed = await Booking.countDocuments({ assignedTechnician: techId, status: { $in: ['Completed', 'Repair Completed', 'Closed', 'Job Closed'] } });
    
    const payouts = tech?.payoutBalance || 0;

    // Calculate pending actionable notifications (Newly Assigned + Recently Approved waiting for progress)
    const notifications = assigned + await Booking.countDocuments({ assignedTechnician: techId, status: 'Offer Sent', quotationStatus: 'Approved by Customer' });

    res.json({ success: true, data: { assigned, active, completed, pending, payouts, notifications } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all orders assigned to the logged-in partner
// @route GET /api/technicians/my-orders
// @access Private (Technician)
exports.getAssignedOrders = async (req, res) => {
  try {
    const techId = req.user.id;
    const orders = await Booking.find({ assignedTechnician: techId }).sort({ createdAt: -1 });
    res.json({ success: true, data: orders.map(buildPartnerVisibleBooking) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update assigned order status (partner scoped)
// @route PUT /api/technicians/my-orders/:id/status
// @access Private (Technician)
exports.updateMyOrderStatus = async (req, res) => {
  try {
    const techId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const booking = await Booking.findOne({ _id: id, assignedTechnician: techId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Assigned order not found' });
    }

    const allowedNextStatus = ALLOWED_PARTNER_STATUS_FLOW[booking.status];
    if (!allowedNextStatus || status !== allowedNextStatus) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from '${booking.status}' to '${status}'`
      });
    }

    if (!booking.handoffVerifiedAt && ['Picked Up', 'Device Received', 'In Repair', 'Completed', 'Delivered'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Complete handoff OTP verification before continuing fulfillment statuses.' });
    }

    booking.status = status;
    if (status === 'Picked Up' || status === 'Device Received') {
      await recalculatePartnerRisk(techId);
    }
    await booking.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: booking
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
