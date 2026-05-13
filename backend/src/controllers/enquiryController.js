const Enquiry = require('../models/Enquiry');
const Booking = require('../models/Booking');
const AuditLog = require('../models/AuditLog');
const sendEmail = require('../utils/sendEmail');
const { getEnquiryTemplate } = require('../utils/enquiryTemplates');

// @desc    Submit a new enquiry (Public)
// @route   POST /api/enquiries
exports.createEnquiry = async (req, res) => {
  try {
    const { 
      name, email, phone, type, 
      company, requirementDetails, message,
      issueType, description, orderReference,
      interest, campaignSource 
    } = req.body;

    if (!name || !email || !phone || !type) {
      return res.status(400).json({ success: false, message: 'Name, email, phone, and type are required' });
    }

    // Optional: Link to booking if orderReference is provided for support
    let orderId = null;
    if (type === 'support' && orderReference) {
      const booking = await Booking.findOne({ referenceNumber: orderReference });
      if (booking) orderId = booking._id;
    }

    const enquiry = await Enquiry.create({
      name, email, phone, type,
      company, requirementDetails, message,
      issueType, description, orderId, orderReference,
      interest, campaignSource
    });

    // Step 17: Notify Admin of new enquiry
    try {
      await sendEmail({
        email: process.env.ADMIN_EMAIL || 'admin@repairvafe.com',
        subject: `NEW ENQUIRY: ${type.toUpperCase()} from ${name}`,
        message: `A new ${type} enquiry has been submitted.\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nPlease check the admin dashboard for details.`
      });
    } catch (err) { console.error('Admin notification failed'); }

    // Step 11: Send notification for new enquiry to customer
    try {
      await sendEmail({
        email: enquiry.email,
        subject: `Enquiry Received: ${type.toUpperCase()} | RepairVafe`,
        html: getEnquiryTemplate(type, enquiry)
      });
    } catch (err) {
      console.error('Notification failed:', err.message);
    }

    res.status(201).json({ 
      success: true, 
      message: 'Enquiry submitted successfully. We will get back to you soon.',
      data: enquiry 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all enquiries (Admin)
// @route   GET /api/admin/enquiries
exports.getAllEnquiries = async (req, res) => {
  try {
    const { type, status, search, startDate, endDate } = req.query;
    let filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const enquiries = await Enquiry.find(filter)
      .populate('orderId', 'referenceNumber status')
      .populate('assignedAdmin', 'name')
      .sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      count: enquiries.length, 
      data: enquiries 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update enquiry status/notes (Admin)
// @route   PUT /api/admin/enquiries/:id
exports.updateEnquiry = async (req, res) => {
  try {
    const { status, priority, adminNotes, assignedAdmin, replyMessage } = req.body;
    const enquiry = await Enquiry.findById(req.params.id);

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    if (status) enquiry.status = status;
    if (priority) enquiry.priority = priority;
    if (adminNotes) enquiry.adminNotes = adminNotes;
    if (assignedAdmin) enquiry.assignedAdmin = assignedAdmin;

    // Step 14: Reply logic
    if (replyMessage) {
      enquiry.responses.push({
        adminId: req.user.id,
        message: replyMessage
      });
      
      // Auto-set status to in_progress if it was new
      if (enquiry.status === 'new') enquiry.status = 'in_progress';

      // Notify customer of reply
      try {
        await sendEmail({
          email: enquiry.email,
          subject: `Reply to your ${enquiry.type} enquiry | RepairVafe`,
          html: getEnquiryTemplate('admin_response', {
            name: enquiry.name,
            type: enquiry.type,
            responseNotes: replyMessage,
            status: enquiry.status
          })
        });
      } catch (err) { console.error('Reply email failed'); }
    }

    await enquiry.save();

    // Audit Log
    await AuditLog.create({
      adminId: req.user.id,
      action: 'UPDATE_ENQUIRY',
      targetType: 'enquiry',
      targetId: enquiry._id,
      details: replyMessage ? `Replied and updated status to ${enquiry.status}` : `Updated enquiry details`,
      ipAddress: req.ip
    });

    res.json({ success: true, data: enquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete enquiry (Admin)
// @route   DELETE /api/admin/enquiries/:id
exports.deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });

    res.json({ success: true, message: 'Enquiry removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
