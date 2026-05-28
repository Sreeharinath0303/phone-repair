const Feedback = require('../models/Feedback');
const Booking  = require('../models/Booking');

// @desc  Submit Customer Feedback
// @route POST /api/feedback/customer
// @access Private (Customer)
exports.submitCustomerFeedback = async (req, res) => {
  try {
    const { 
      bookingId, 
      rating, review, serviceQuality, 
      pickupExperience, technicianBehavior, 
      timeliness, overallSatisfaction 
    } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Step 2: Only after completion
    if (!['Completed', 'Delivered', 'Repair Completed', 'Closed', 'Job Closed', 'Ready for Delivery'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Feedback can only be submitted after service completion.' });
    }

    // Step 5: Link Feedback to Order
    const feedback = await Feedback.create({
      booking: booking._id,
      orderId: booking.referenceNumber,
      type: 'customer',
      fromId: req.user.id,
      fromName: req.user.name || 'Customer',
      rating,
      review,
      serviceQuality,
      pickupExperience,
      technicianBehavior,
      timeliness,
      overallSatisfaction
    });

    // Update Booking Status (Step 7)
    booking.customerFeedbackStatus = 'Feedback Submitted';
    await booking.save();

    res.status(201).json({ success: true, data: feedback, message: 'Customer feedback submitted successfully!' });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'You have already submitted feedback for this order.' });
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Submit Partner Feedback
// @route POST /api/feedback/partner
// @access Private (Technician)
exports.submitPartnerFeedback = async (req, res) => {
  try {
    const { 
      bookingId, 
      orderQuality, customerCooperation, 
      deviceCondition, adminCoordination, partsNotes 
    } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Step 5: Link Feedback to Order
    const feedback = await Feedback.create({
      booking: booking._id,
      orderId: booking.referenceNumber,
      type: 'partner',
      fromId: req.user.id,
      fromName: req.user.name || 'Partner',
      orderQuality,
      customerCooperation,
      deviceCondition,
      adminCoordination,
      partsNotes
    });

    // Update Booking Status (Step 7)
    booking.partnerFeedbackStatus = 'Feedback Submitted';
    await booking.save();

    res.status(201).json({ success: true, data: feedback, message: 'Partner feedback submitted successfully!' });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Partner feedback already exists for this order.' });
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all feedback (admin)
exports.getAllFeedback = async (req, res) => {
  try {
    const { type, rating, fromDate, toDate, search } = req.query;
    let query = {};

    if (type) query.type = type;
    if (rating) query.rating = { $gte: parseInt(rating) };
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { fromName: { $regex: search, $options: 'i' } }
      ];
    }

    const feedbacks = await Feedback.find(query).populate('booking').sort({ createdAt: -1 });
    res.json({ success: true, count: feedbacks.length, data: feedbacks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get Feedback Analytics (Step 10)
exports.getFeedbackAnalytics = async (req, res) => {
  try {
    const customerFb = await Feedback.find({ type: 'customer' });
    const partnerFb = await Feedback.find({ type: 'partner' });

    const stats = {
      overallAvg: 0,
      customerAvg: 0,
      partnerAvg: 0,
      totalCustomer: customerFb.length,
      totalPartner: partnerFb.length,
      qualityAvg: 0,
      timeAvg: 0,
      behaviorAvg: 0,
      cooperationAvg: 0
    };

    if (customerFb.length > 0) {
      stats.customerAvg = (customerFb.reduce((s, f) => s + (f.rating || 0), 0) / customerFb.length).toFixed(1);
      stats.qualityAvg = (customerFb.reduce((s, f) => s + (f.serviceQuality || 0), 0) / customerFb.length).toFixed(1);
      stats.timeAvg = (customerFb.reduce((s, f) => s + (f.timeliness || 0), 0) / customerFb.length).toFixed(1);
      stats.behaviorAvg = (customerFb.reduce((s, f) => s + (f.technicianBehavior || 0), 0) / customerFb.length).toFixed(1);
    }

    if (partnerFb.length > 0) {
      stats.partnerAvg = (partnerFb.reduce((s, f) => s + (f.orderQuality || 0), 0) / partnerFb.length).toFixed(1);
      stats.cooperationAvg = (partnerFb.reduce((s, f) => s + (f.customerCooperation || 0), 0) / partnerFb.length).toFixed(1);
    }

    stats.overallAvg = ((parseFloat(stats.customerAvg) + parseFloat(stats.partnerAvg)) / (stats.customerAvg > 0 && stats.partnerAvg > 0 ? 2 : 1)).toFixed(1);

    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get my feedback (Customer or Partner) - Step 14 & 15
exports.getMyFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ fromId: req.user.id }).populate('booking').sort({ createdAt: -1 });
    res.json({ success: true, count: feedbacks.length, data: feedbacks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
