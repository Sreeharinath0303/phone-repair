const Feedback = require('../models/Feedback');
const Booking  = require('../models/Booking');

// @desc  Submit feedback
// @route POST /api/feedback
// @access Public
exports.submitFeedback = async (req, res) => {
  try {
    const { referenceNumber, overallRating, qualityRating, timeRating,
            valueRating, staffRating, comment, wouldRecommend, contactConsent } = req.body;

    const booking = await Booking.findOne({ referenceNumber: referenceNumber.toUpperCase() });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status !== 'Completed')
      return res.status(400).json({ success: false, message: 'Repair must be completed before leaving feedback' });

    // Check if feedback already exists
    const existing = await Feedback.findOne({ referenceNumber: referenceNumber.toUpperCase() });
    if (existing) return res.status(400).json({ success: false, message: 'Feedback already submitted for this booking' });

    const feedback = await Feedback.create({
      booking: booking._id, referenceNumber: booking.referenceNumber,
      customerName: booking.customerName,
      deviceName: `${booking.deviceBrand} ${booking.deviceModel}`,
      overallRating, qualityRating, timeRating, valueRating, staffRating,
      comment, wouldRecommend, contactConsent
    });

    res.status(201).json({ success: true, data: feedback, message: 'Thank you for your feedback!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Get all feedback (admin)
// @route GET /api/feedback
// @access Private (Admin)
exports.getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    const avgRating = feedbacks.length
      ? (feedbacks.reduce((s, f) => s + f.overallRating, 0) / feedbacks.length).toFixed(1)
      : 0;

    res.json({ success: true, total: feedbacks.length, avgRating, data: feedbacks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get feedback for a booking
// @route GET /api/feedback/:ref
// @access Public
exports.getFeedbackByRef = async (req, res) => {
  try {
    const feedback = await Feedback.findOne({ referenceNumber: req.params.ref.toUpperCase() });
    if (!feedback) return res.status(404).json({ success: false, message: 'No feedback found' });
    res.json({ success: true, data: feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
