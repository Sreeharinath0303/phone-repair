const Booking = require('../models/Booking');
const Technician = require('../models/Technician');
const PartnerQuote = require('../models/PartnerQuote');
const PartnerIncident = require('../models/PartnerIncident');
const { computeCommercials, recalculatePartnerRisk, addTimelineEntry } = require('../utils/workflow');
const { logActivity } = require('../utils/logger');

exports.requestPartnerQuotes = async (req, res) => {
  try {
    const { bookingId, partnerIds } = req.body;
    if (!bookingId || !Array.isArray(partnerIds) || partnerIds.length === 0) {
      return res.status(400).json({ success: false, message: 'bookingId and partnerIds are required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const partners = await Technician.find({ _id: { $in: partnerIds }, isActive: true });
    if (!partners.length) {
      return res.status(404).json({ success: false, message: 'No eligible partners found' });
    }

    const quotes = [];
    for (const partner of partners) {
      const quote = await PartnerQuote.findOneAndUpdate(
        { bookingId: booking._id, partnerId: partner._id },
        {
          bookingReference: booking.referenceNumber,
          partnerId: partner._id,
          requestedBy: req.user._id,
          status: 'requested',
          requestPayload: {
            deviceCategory: booking.deviceCategory,
            deviceBrand: booking.deviceBrand,
            deviceModel: booking.deviceModel,
            repairTypes: booking.repairTypes,
            issueDescription: booking.issueDescription,
            city: booking.city,
            state: booking.state,
            serviceType: booking.serviceType
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      quotes.push(quote);
    }

    booking.workflowPhase = 'partner_quote_collection';
    booking.status = 'Sent For Partner Quote';
    addTimelineEntry(booking, 'Sent For Partner Quote', `Quote requests sent to ${quotes.length} partner(s) without customer PII.`);
    await booking.save();

    await logActivity({
      action: 'PARTNER_QUOTES_REQUESTED',
      entityType: 'Booking',
      entityId: booking._id,
      req,
      description: `Requested partner quotes from ${quotes.length} partner(s)`,
      updated: { workflowPhase: booking.workflowPhase, status: booking.status }
    });

    res.json({ success: true, data: quotes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPartnerQuotesForBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const quotes = await PartnerQuote.find({ bookingId: booking._id })
      .populate('partnerId', 'name businessName specialization city warningStatus confirmedIncidentCount successfulRecoveryCount')
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: quotes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBookingIncidents = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const incidents = await PartnerIncident.find({ bookingId: booking._id })
      .populate('partnerId', 'name specialization warningStatus')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: incidents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.selectPartnerQuote = async (req, res) => {
  try {
    const quote = await PartnerQuote.findById(req.params.id).populate('partnerId', 'name');
    if (!quote) return res.status(404).json({ success: false, message: 'Partner quote not found' });

    const booking = await Booking.findById(quote.bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    await PartnerQuote.updateMany(
      { bookingId: booking._id, _id: { $ne: quote._id } },
      { $set: { status: 'rejected' } }
    );

    quote.status = 'selected';
    quote.selectedAt = new Date();
    await quote.save();

    booking.partnerQuotedAmount = Number(quote.quoteAmount) || 0;
    booking.quotedByPartnerId = quote.partnerId._id;
    booking.estimatedTime = quote.eta || booking.estimatedTime;
    booking.warrantyPeriod = quote.warranty || booking.warrantyPeriod;
    booking.workflowPhase = 'commercial_review';
    booking.status = 'Partner Quote Received';
    addTimelineEntry(booking, 'Partner Quote Received', `Partner quote selected from ${quote.partnerId.name}.`);
    await booking.save();

    await logActivity({
      action: 'PARTNER_QUOTE_SELECTED',
      entityType: 'Booking',
      entityId: booking._id,
      req,
      description: `Selected partner quote from ${quote.partnerId.name}`,
      updated: { quotedByPartnerId: booking.quotedByPartnerId, partnerQuotedAmount: booking.partnerQuotedAmount }
    });

    res.json({ success: true, data: { booking, quote } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.reviewPartnerIncident = async (req, res) => {
  try {
    const { incidentId, reviewStatus, adminNote } = req.body;
    if (!incidentId || !['confirmed', 'rejected'].includes(reviewStatus)) {
      return res.status(400).json({ success: false, message: 'incidentId and valid reviewStatus are required' });
    }

    const incident = await PartnerIncident.findById(incidentId);
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found' });

    const booking = await Booking.findById(incident.bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    incident.reviewStatus = reviewStatus;
    incident.confirmedAt = reviewStatus === 'confirmed' ? new Date() : null;
    incident.confirmedBy = reviewStatus === 'confirmed' ? req.user._id : null;
    if (adminNote) {
      incident.proofMetadata = { ...(incident.proofMetadata || {}), adminNote };
    }
    await incident.save();

    if (reviewStatus === 'confirmed') {
      booking.handoffFailureReason = incident.incidentType;
      booking.status = booking.serviceType === 'pickup' ? 'Pickup Scheduled' : 'Store Visit Scheduled';
      addTimelineEntry(booking, 'Handoff Started', `Confirmed handoff failure: ${incident.incidentType}. ${adminNote || ''}`.trim());
      await booking.save();
    }

    const risk = await recalculatePartnerRisk(incident.partnerId);
    await logActivity({
      action: 'PARTNER_INCIDENT_REVIEWED',
      entityType: 'PartnerIncident',
      entityId: incident._id,
      req,
      description: `Incident ${reviewStatus}`,
      updated: risk
    });

    res.json({ success: true, data: { incident, risk } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.overrideAssignment = async (req, res) => {
  try {
    const { technicianId, reason } = req.body;
    if (!technicianId || !reason) {
      return res.status(400).json({ success: false, message: 'technicianId and reason are required' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const tech = await Technician.findById(technicianId);
    if (!tech) return res.status(404).json({ success: false, message: 'Technician not found' });

    booking.assignedTechnician = tech._id;
    booking.quotedByPartnerId = tech._id;
    booking.assignmentLockedAt = new Date();
    booking.assignmentLockReason = reason;
    booking.workflowPhase = 'partner_locked';
    booking.status = 'Partner Locked';
    addTimelineEntry(booking, 'Partner Locked', `Admin override assignment to ${tech.name}. Reason: ${reason}`);
    await booking.save();

    await logActivity({
      action: 'ASSIGNMENT_OVERRIDE',
      entityType: 'Booking',
      entityId: booking._id,
      req,
      description: `Admin override assignment to ${tech.name}`,
      updated: { assignedTechnician: tech._id, reason }
    });

    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.applyQuoteCommercials = async (booking, payload) => {
  const {
    quotationAmount,
    markupType,
    markupValue,
    partnerQuotedAmount,
    estimatedTime,
    warrantyPeriod,
    repairSummary,
    termsAndConditions,
    technicianNote
  } = payload;

  const effectiveMarkupType = markupType || (booking.quotedByPartnerId ? 'fixed' : 'direct_admin_quote');
  const partnerBase = booking.quotedByPartnerId
    ? (Number(partnerQuotedAmount) || Number(booking.partnerQuotedAmount) || 0)
    : (Number(partnerQuotedAmount) || 0);
  const finalQuotationAmount = Number(quotationAmount) || 0;
  let normalizedMarkupValue = Number(markupValue) || 0;

  if (effectiveMarkupType !== 'direct_admin_quote' && partnerBase > 0 && finalQuotationAmount > 0) {
    if (effectiveMarkupType === 'percentage') {
      normalizedMarkupValue = Math.round((((finalQuotationAmount - partnerBase) / partnerBase) * 100) * 100) / 100;
    } else {
      normalizedMarkupValue = Math.round((finalQuotationAmount - partnerBase) * 100) / 100;
    }
  }

  const commercials = computeCommercials({
    partnerQuotedAmount: partnerBase,
    markupType: effectiveMarkupType,
    markupValue: normalizedMarkupValue,
    quotationAmount: finalQuotationAmount
  });

  booking.partnerQuotedAmount = partnerBase;
  booking.markupType = effectiveMarkupType;
  booking.markupValue = normalizedMarkupValue;
  booking.quotationAmount = commercials.quotationAmount;
  booking.partnerPayoutLocked = commercials.partnerPayoutLocked;
  booking.partnerPayout = commercials.partnerPayoutLocked;
  booking.platformMargin = commercials.platformMargin;
  booking.estimatedTime = estimatedTime || booking.estimatedTime;
  booking.warrantyPeriod = warrantyPeriod || booking.warrantyPeriod || '3 Months';
  booking.repairSummary = repairSummary || booking.repairSummary || '';
  booking.termsAndConditions = termsAndConditions || booking.termsAndConditions || 'Standard repair conditions apply.';
  booking.technicianNote = technicianNote || booking.technicianNote || '';
  booking.workflowPhase = 'customer_approval';
  booking.status = 'Quote Sent To Customer';
  booking.quotationStatus = 'Awaiting Customer Approval';
  return booking;
};
