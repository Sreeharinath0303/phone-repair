const Booking = require('../models/Booking');
const PartnerQuote = require('../models/PartnerQuote');
const PartnerIncident = require('../models/PartnerIncident');
const { buildPartnerVisibleBooking, addTimelineEntry, recalculatePartnerRisk } = require('../utils/workflow');
const { logActivity } = require('../utils/logger');

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.getQuoteRequests = async (req, res) => {
  try {
    const quotes = await PartnerQuote.find({ partnerId: req.user._id, status: { $in: ['requested', 'submitted'] } })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: quotes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.submitQuoteRequest = async (req, res) => {
  try {
    const { quoteAmount, eta, warranty, notes, status } = req.body;
    const quote = await PartnerQuote.findOne({ _id: req.params.id, partnerId: req.user._id });
    if (!quote) return res.status(404).json({ success: false, message: 'Quote request not found' });

    quote.status = status === 'declined' ? 'declined' : 'submitted';
    quote.quoteAmount = Number(quoteAmount) || quote.quoteAmount;
    quote.eta = eta || quote.eta;
    quote.warranty = warranty || quote.warranty;
    quote.notes = notes || quote.notes;
    await quote.save();

    const booking = await Booking.findById(quote.bookingId);
    if (booking && quote.status === 'submitted') {
      booking.status = 'Partner Quote Received';
      booking.workflowPhase = 'commercial_review';
      addTimelineEntry(booking, 'Partner Quote Received', `Partner ${req.user.name} submitted a quote.`);
      await booking.save();
    }

    await logActivity({
      action: 'PARTNER_QUOTE_SUBMITTED',
      entityType: 'PartnerQuote',
      entityId: quote._id,
      req,
      description: `Partner ${quote.status} quote request`
    });

    res.json({ success: true, data: quote });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.startHandoff = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, assignedTechnician: req.user._id });
    if (!booking) return res.status(404).json({ success: false, message: 'Assigned booking not found' });

    booking.handoffStartedAt = new Date();
    booking.handoffAttempts += 1;
    booking.lastHandoffAttemptAt = new Date();
    booking.handoffMode = booking.serviceType;
    booking.workflowPhase = 'handoff';
    booking.status = 'Handoff Started';

    const otp = generateOtp();
    if (booking.serviceType === 'pickup') {
      booking.pickupOtp = otp;
      booking.pickupOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    } else {
      booking.pickupOtp = otp;
      booking.pickupOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    }

    addTimelineEntry(booking, 'Handoff Started', `Handoff attempt ${booking.handoffAttempts} started.`);
    await booking.save();

    res.json({
      success: true,
      message: 'Handoff started. OTP dispatched to customer.',
      data: { bookingId: booking._id, handoffAttempts: booking.handoffAttempts, serviceType: booking.serviceType }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyHandoffOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const booking = await Booking.findOne({ _id: req.params.id, assignedTechnician: req.user._id }).select('+pickupOtp +pickupOtpExpiry');
    if (!booking) return res.status(404).json({ success: false, message: 'Assigned booking not found' });
    if (!otp || !booking.pickupOtp || booking.pickupOtp !== String(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    if (booking.pickupOtpExpiry && booking.pickupOtpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    booking.pickupOtp = undefined;
    booking.pickupOtpExpiry = undefined;
    booking.handoffVerifiedAt = new Date();
    booking.handoffVerifiedBy = req.user._id;
    booking.status = booking.serviceType === 'pickup' ? 'Picked Up' : 'Device Received';
    booking.workflowPhase = 'repair';
    addTimelineEntry(booking, booking.status, 'Handoff verified by OTP.');
    await booking.save();
    await recalculatePartnerRisk(req.user._id);

    res.json({ success: true, data: buildPartnerVisibleBooking(booking) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.reportIncident = async (req, res) => {
  try {
    const { incidentType, partnerNote, proofMetadata } = req.body;
    if (!['customer_cancelled_at_handoff', 'customer_no_show'].includes(incidentType)) {
      return res.status(400).json({ success: false, message: 'Invalid incident type' });
    }

    const booking = await Booking.findOne({ _id: req.params.id, assignedTechnician: req.user._id });
    if (!booking) return res.status(404).json({ success: false, message: 'Assigned booking not found' });

    const incident = await PartnerIncident.create({
      bookingId: booking._id,
      partnerId: req.user._id,
      serviceMode: booking.serviceType,
      incidentType,
      attemptNumber: booking.handoffAttempts || 1,
      reportedBy: req.user._id,
      partnerNote: partnerNote || '',
      proofMetadata: proofMetadata || {}
    });

    booking.handoffFailureReason = incidentType;
    booking.handoffFailureHistory.push({
      attemptNumber: booking.handoffAttempts || 1,
      incidentType,
      note: partnerNote || '',
      reportedAt: new Date()
    });
    addTimelineEntry(booking, 'Handoff Started', `Partner reported ${incidentType}. Awaiting admin review.`);
    await booking.save();

    await logActivity({
      action: 'PARTNER_INCIDENT_REPORTED',
      entityType: 'PartnerIncident',
      entityId: incident._id,
      req,
      description: `Partner reported ${incidentType}`
    });

    res.status(201).json({ success: true, data: incident });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
