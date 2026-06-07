const Booking = require('../models/Booking');
const PartnerIncident = require('../models/PartnerIncident');
const Technician = require('../models/Technician');

const WARNING_THRESHOLD = 3;
const RECOVERY_TARGET = 5;

const maskPhone = (phone = '') => {
  const raw = String(phone || '');
  if (raw.length < 4) return raw;
  return `${raw.slice(0, 2)}XXXX${raw.slice(-2)}`;
};

const buildPartnerVisibleBooking = (bookingDoc) => {
  const booking = bookingDoc.toObject ? bookingDoc.toObject() : { ...bookingDoc };
  const handoffVerified = Boolean(booking.handoffVerifiedAt);

  if (!handoffVerified) {
    booking.customerPhone = maskPhone(booking.customerPhone);
    booking.address = booking.city || booking.address;
    booking.customerEmail = undefined;
  }

  return booking;
};

const computeCommercials = ({ partnerQuotedAmount = 0, markupType, markupValue = 0, quotationAmount }) => {
  const partnerBase = Number(partnerQuotedAmount) || 0;
  const markup = Number(markupValue) || 0;

  if (markupType === 'direct_admin_quote') {
    const customerQuote = Number(quotationAmount) || 0;
    return {
      quotationAmount: customerQuote,
      partnerPayoutLocked: partnerBase,
      platformMargin: Math.max(customerQuote - partnerBase, 0)
    };
  }

  const customerQuote = markupType === 'percentage'
    ? Math.round((partnerBase + (partnerBase * markup / 100)) * 100) / 100
    : partnerBase + markup;

  return {
    quotationAmount: customerQuote,
    partnerPayoutLocked: partnerBase,
    platformMargin: Math.max(customerQuote - partnerBase, 0)
  };
};

const recalculatePartnerRisk = async (partnerId) => {
  const confirmedIncidentCount = await PartnerIncident.countDocuments({
    partnerId,
    reviewStatus: 'confirmed'
  });

  const successfulRecoveryCount = await Booking.countDocuments({
    assignedTechnician: partnerId,
    handoffVerifiedAt: { $ne: null },
    status: { $in: ['Picked Up', 'Device Received', 'Diagnosis In Progress', 'Repair Ongoing', 'Ready For Return', 'Delivered / Returned', 'Settlement Pending', 'Settlement Completed', 'Completed', 'Delivered', 'Closed'] }
  });

  const warningStatus = confirmedIncidentCount >= WARNING_THRESHOLD && successfulRecoveryCount < RECOVERY_TARGET
    ? 'yellow'
    : 'normal';

  await Technician.findByIdAndUpdate(partnerId, {
    confirmedIncidentCount,
    successfulRecoveryCount,
    warningStatus
  });

  return { confirmedIncidentCount, successfulRecoveryCount, warningStatus };
};

const addTimelineEntry = (booking, stage, note) => {
  booking.timeline.push({ stage, note, date: new Date() });
};

module.exports = {
  WARNING_THRESHOLD,
  RECOVERY_TARGET,
  buildPartnerVisibleBooking,
  computeCommercials,
  recalculatePartnerRisk,
  addTimelineEntry
};
