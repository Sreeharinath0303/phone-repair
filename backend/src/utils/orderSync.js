const Order = require('../models/Order');

const buildOrderPayload = (booking) => ({
  referenceNumber: booking.referenceNumber || '',
  customerId: booking.customerId || null,
  customerName: booking.customerName,
  customerPhone: booking.customerPhone,
  customerEmail: booking.customerEmail,
  deviceCategory: booking.deviceCategory,
  deviceBrand: booking.deviceBrand,
  deviceModel: booking.deviceModel,
  repairTypes: Array.isArray(booking.repairTypes) ? booking.repairTypes : [],
  issueDescription: booking.issueDescription || '',
  serviceType: booking.serviceType,
  address: booking.address || '',
  city: booking.city || '',
  state: booking.state || '',
  pincode: booking.pincode || '',
  preferredDate: booking.preferredDate || null,
  preferredTimeSlot: booking.preferredTimeSlot || '',
  status: booking.status,
  quotationStatus: booking.quotationStatus || 'Approved by Customer',
  workflowPhase: booking.workflowPhase || 'partner_locked',
  assignedTechnician: booking.assignedTechnician || null,
  approxAmount: Number(booking.approxAmount || 0),
  quotationAmount: Number(booking.quotationAmount || 0),
  partnerPayout: Number(booking.partnerPayout || 0),
  partnerQuotedAmount: Number(booking.partnerQuotedAmount || 0),
  discount: Number(booking.discount || 0),
  appliedOfferCode: booking.appliedOfferCode || '',
  estimatedTime: booking.estimatedTime || '',
  warrantyPeriod: booking.warrantyPeriod || '3 Months',
  repairSummary: booking.repairSummary || '',
  termsAndConditions: booking.termsAndConditions || '',
  finalAmount: Number(booking.finalAmount || 0),
  paymentStatus: booking.paymentStatus || 'Pending',
  paymentDate: booking.paymentDate || null,
  invoiceNumber: booking.invoiceNumber || null,
  invoiceDate: booking.invoiceDate || null,
  timeline: Array.isArray(booking.timeline) ? booking.timeline : []
});

const syncOrderForBooking = async (booking) => {
  if (!booking) return null;

  const order = await Order.findOne({ bookingId: booking._id });
  if (!order) return null;

  Object.assign(order, buildOrderPayload(booking));
  await order.save();
  return order;
};

const ensureOrderForBooking = async (booking) => {
  if (!booking) return null;

  let order = await Order.findOne({ bookingId: booking._id });
  if (!order) {
    order = await Order.create({
      bookingId: booking._id,
      approvedAt: booking.assignmentLockedAt || new Date(),
      ...buildOrderPayload(booking)
    });
  } else {
    Object.assign(order, buildOrderPayload(booking));
    await order.save();
  }

  let bookingChanged = false;
  if (!booking.orderId || String(booking.orderId) !== String(order._id)) {
    booking.orderId = order._id;
    bookingChanged = true;
  }
  if (!booking.convertedToOrderAt) {
    booking.convertedToOrderAt = new Date();
    bookingChanged = true;
  }
  if (bookingChanged) {
    await booking.save();
  }

  return order;
};

module.exports = {
  buildOrderPayload,
  syncOrderForBooking,
  ensureOrderForBooking
};
