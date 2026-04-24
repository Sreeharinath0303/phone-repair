const Booking = require('../models/Booking');
const { Lead, LEAD_STAGES } = require('../models/Lead');
const mongoose = require('mongoose');

// @desc  Create new booking
// @route POST /api/bookings
// @access Public
exports.createBooking = async (req, res) => {
  try {
    const { deviceCategory, deviceBrand, deviceModel, repairTypes, issueDescription,
            customerName, customerPhone, customerEmail, serviceType, address, city, state, pincode,
            preferredDate, preferredTimeSlot, leadId } = req.body;

    const requiredFields = [
      { key: 'deviceCategory', value: deviceCategory },
      { key: 'deviceBrand', value: deviceBrand },
      { key: 'deviceModel', value: deviceModel },
      { key: 'customerName', value: customerName },
      { key: 'customerPhone', value: customerPhone },
      { key: 'customerEmail', value: customerEmail },
      { key: 'serviceType', value: serviceType },
      { key: 'address', value: address },
      { key: 'city', value: city },
      { key: 'state', value: state },
      { key: 'pincode', value: pincode },
      { key: 'preferredDate', value: preferredDate },
      { key: 'preferredTimeSlot', value: preferredTimeSlot }
    ];
    const missing = requiredFields.find(field => !String(field.value || '').trim());
    if (missing) {
      return res.status(400).json({ success: false, message: `Missing required field: ${missing.key}` });
    }
    if (!Array.isArray(repairTypes) || repairTypes.length === 0) {
      return res.status(400).json({ success: false, message: 'Select at least one repair type.' });
    }
    if (!/^\+?[0-9]{10,15}$/.test(String(customerPhone).replace(/\s+/g, ''))) {
      return res.status(400).json({ success: false, message: 'Invalid mobile number format.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(customerEmail).trim())) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }
    if (!/^[0-9]{6}$/.test(String(pincode).trim())) {
      return res.status(400).json({ success: false, message: 'Pincode must be 6 digits.' });
    }

    const booking = await Booking.create({
      deviceCategory, deviceBrand, deviceModel, repairTypes, issueDescription,
      customerName, customerPhone, customerEmail, serviceType, address, city, state, pincode,
      preferredDate, preferredTimeSlot,
      timeline: [{ stage: 'Booking Received', note: 'Repair request submitted by customer.' }]
    });

    if (leadId && mongoose.Types.ObjectId.isValid(leadId)) {
      const lead = await Lead.findById(leadId);
      if (lead) {
        lead.bookingCompleted = true;
        lead.stage = LEAD_STAGES.BOOKING_COMPLETED;
        lead.bookingId = booking._id;
        lead.bookingReference = booking.referenceNumber;
        lead.convertedAt = new Date();
        lead.lastActivityAt = new Date();
        lead.stageHistory.push({ stage: LEAD_STAGES.BOOKING_COMPLETED, note: 'Customer submitted booking successfully' });
        await lead.save();
      }
    } else {
      const normalizedMobile = String(customerPhone).replace(/\s+/g, '');
      const lead = await Lead.findOne({ normalizedMobile, bookingCompleted: false }).sort({ updatedAt: -1 });
      if (lead) {
        lead.bookingCompleted = true;
        lead.stage = LEAD_STAGES.BOOKING_COMPLETED;
        lead.bookingId = booking._id;
        lead.bookingReference = booking.referenceNumber;
        lead.convertedAt = new Date();
        lead.lastActivityAt = new Date();
        lead.stageHistory.push({ stage: LEAD_STAGES.BOOKING_COMPLETED, note: 'Booking linked via mobile number match' });
        await lead.save();
      }
    }

    res.status(201).json({ success: true, data: booking, message: 'Booking submitted successfully!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Get all bookings (admin)
// @route GET /api/bookings
// @access Private (Admin)
exports.getAllBookings = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { referenceNumber: new RegExp(search, 'i') },
        { customerName:    new RegExp(search, 'i') },
        { deviceModel:     new RegExp(search, 'i') },
        { customerPhone:   new RegExp(search, 'i') },
      ];
    }

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('assignedTechnician', 'name specialization')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single booking by reference number
// @route GET /api/bookings/:ref
// @access Public
exports.getBookingByRef = async (req, res) => {
  try {
    const booking = await Booking.findOne({ referenceNumber: req.params.ref.toUpperCase() })
      .populate('assignedTechnician', 'name specialization phone');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update booking status
// @route PUT /api/bookings/:id/status
// @access Private (Admin)
exports.updateStatus = async (req, res) => {
  try {
    const { status, note, technicianId } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.status = status;
    booking.timeline.push({ stage: status, note: note || `Status updated to ${status}` });
    if (technicianId) booking.assignedTechnician = technicianId;

    await booking.save();
    res.json({ success: true, data: booking, message: 'Status updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Issue quotation for a booking
// @route PUT /api/bookings/:id/quotation
// @access Private (Admin)
exports.issueQuotation = async (req, res) => {
  try {
    const { quotationAmount, discount, estimatedTime, warrantyPeriod, technicianNote } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.quotationAmount  = quotationAmount;
    booking.discount         = discount || 0;
    booking.estimatedTime    = estimatedTime;
    booking.warrantyPeriod   = warrantyPeriod || '3 Months';
    booking.technicianNote   = technicianNote;
    booking.quotationStatus  = 'Pending';
    booking.status           = 'Awaiting Approval';
    booking.timeline.push({ stage: 'Awaiting Approval', note: `Quotation of ₹${quotationAmount} issued.` });

    await booking.save();
    res.json({ success: true, data: booking, message: 'Quotation issued successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Approve or reject quotation (customer action)
// @route PUT /api/bookings/:ref/quote-action
// @access Public
exports.quotationAction = async (req, res) => {
  try {
    const { action } = req.body; // 'approve' | 'reject'
    const booking = await Booking.findOne({ referenceNumber: req.params.ref.toUpperCase() });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.quotationStatus !== 'Pending')
      return res.status(400).json({ success: false, message: 'Quotation already actioned' });

    if (action === 'approve') {
      booking.quotationStatus = 'Approved';
      booking.status = 'In Progress';
      booking.timeline.push({ stage: 'In Progress', note: 'Customer approved the quotation. Repair started.' });
      const lead = await Lead.findOne({ bookingReference: booking.referenceNumber });
      if (lead) {
        lead.stage = LEAD_STAGES.CONVERTED_TO_ORDER;
        lead.bookingCompleted = true;
        lead.convertedAt = new Date();
        lead.lastActivityAt = new Date();
        lead.stageHistory.push({ stage: LEAD_STAGES.CONVERTED_TO_ORDER, note: 'Quotation approved and order confirmed' });
        await lead.save();
      }
    } else {
      booking.quotationStatus = 'Rejected';
      booking.status = 'Cancelled';
      booking.timeline.push({ stage: 'Cancelled', note: 'Customer declined the quotation.' });
      const lead = await Lead.findOne({ bookingReference: booking.referenceNumber });
      if (lead) {
        lead.stage = LEAD_STAGES.LOST_INACTIVE;
        lead.lostAt = new Date();
        lead.lastActivityAt = new Date();
        lead.stageHistory.push({ stage: LEAD_STAGES.LOST_INACTIVE, note: 'Quotation rejected by customer' });
        await lead.save();
      }
    }

    await booking.save();
    res.json({ success: true, data: booking, message: `Quotation ${action}d successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get dashboard stats
// @route GET /api/bookings/stats
// @access Private (Admin)
exports.getDashboardStats = async (req, res) => {
  try {
    const total = await Booking.countDocuments();
    const pending = await Booking.countDocuments({ status: 'Awaiting Approval' });
    const inProgress = await Booking.countDocuments({ status: 'In Progress' });
    const completed = await Booking.countDocuments({ status: 'Completed' });

    const revenueResult = await Booking.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$quotationAmount', '$discount'] } } } }
    ]);
    const revenue = revenueResult[0]?.total || 0;

    const recent = await Booking.find().sort({ createdAt: -1 }).limit(5)
      .select('referenceNumber customerName deviceModel status quotationAmount createdAt');

    res.json({ success: true, data: { total, pending, inProgress, completed, revenue, recent } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete booking
// @route DELETE /api/bookings/:id
// @access Private (Admin)
exports.deleteBooking = async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
