const jwt = require('jsonwebtoken');
const User = require('../models/User');

const DEFAULT_PORTAL_URL = 'https://www.erepaircafe.com';
const EMAIL_ACCESS_EXPIRY = process.env.CUSTOMER_EMAIL_ACCESS_EXPIRES_IN || '7d';

const isLocalUrl = (value) => /localhost|127\.0\.0\.1/i.test(String(value || ''));

const getCustomerPortalBaseUrl = () => {
  const explicit = String(process.env.CUSTOMER_PORTAL_URL || process.env.CLIENT_URL || '').trim();
  if (!explicit || isLocalUrl(explicit)) {
    return DEFAULT_PORTAL_URL;
  }
  return explicit.replace(/\/+$/, '');
};

const buildCustomerPortalUrl = (path = '/', query = {}) => {
  const url = new URL(path.startsWith('/') ? path : `/${path}`, `${getCustomerPortalBaseUrl()}/`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

const formatServiceType = (serviceType) => {
  if (serviceType === 'dropoff') return 'Store Dropoff';
  if (serviceType === 'walkin') return 'Store Visit';
  return 'Pickup';
};

const formatDate = (value) => {
  if (!value) return 'Not scheduled';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const normalizeEmail = (value) => {
  const email = String(value || '').trim().toLowerCase();
  if (!email || email.endsWith('@repairvafe.local')) {
    return '';
  }
  return email;
};

const normalizePhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 10 ? digits : '';
};

const ensurePortalUserForBooking = async (booking) => {
  let user = null;

  if (booking.customerId) {
    user = await User.findById(booking.customerId);
  }

  const email = normalizeEmail(booking.customerEmail);
  const phone = normalizePhone(booking.customerPhone);

  if (!user && email) {
    user = await User.findOne({ email });
  }
  if (!user && phone) {
    user = await User.findOne({ phone });
  }

  if (!user) {
    user = new User({
      name: booking.customerName || 'Customer',
      email: email || undefined,
      phone: phone || undefined,
      role: 'customer',
      isVerified: true,
      isActive: true,
      address: booking.address || '',
      city: booking.city || '',
      state: booking.state || '',
      pincode: booking.pincode || ''
    });
  } else {
    user.name = booking.customerName || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.address = booking.address || user.address;
    user.city = booking.city || user.city;
    user.state = booking.state || user.state;
    user.pincode = booking.pincode || user.pincode;
    user.role = 'customer';
    if (!user.isVerified) user.isVerified = true;
    if (!user.isActive) user.isActive = true;
  }

  await user.save();

  if (!booking.customerId || String(booking.customerId) !== String(user._id)) {
    booking.customerId = user._id;
    await booking.save();
  }

  return user;
};

const signCustomerEmailAccessToken = ({ userId, bookingId, quoteAction }) =>
  jwt.sign(
    {
      id: userId,
      bookingId,
      quoteAction: quoteAction || '',
      purpose: 'customer-email-access'
    },
    process.env.JWT_SECRET,
    { expiresIn: EMAIL_ACCESS_EXPIRY }
  );

const buildQuoteReturnPath = ({ referenceNumber, quoteAction }) => {
  const params = new URLSearchParams({ quoteRef: referenceNumber });
  if (quoteAction) {
    params.set('quoteAction', quoteAction);
  }
  return `/dashboard?${params.toString()}`;
};

const buildQuoteAccessUrl = ({ token, referenceNumber, quoteAction }) =>
  buildCustomerPortalUrl('/customer-login', {
    emailAccessToken: token,
    returnTo: buildQuoteReturnPath({ referenceNumber, quoteAction })
  });

const buildQuotationEmailData = async (booking) => {
  const user = await ensurePortalUserForBooking(booking);
  const token = signCustomerEmailAccessToken({
    userId: user._id,
    bookingId: booking._id,
    quoteAction: ''
  });
  const reviewEstimateUrl = buildQuoteAccessUrl({
    token,
    referenceNumber: booking.referenceNumber
  });
  const acceptEstimateUrl = buildQuoteAccessUrl({
    token,
    referenceNumber: booking.referenceNumber,
    quoteAction: 'approve'
  });
  const rejectEstimateUrl = buildQuoteAccessUrl({
    token,
    referenceNumber: booking.referenceNumber,
    quoteAction: 'reject'
  });
  const address = [booking.address, booking.city, booking.state, booking.pincode].filter(Boolean).join(', ');

  return {
    customerName: booking.customerName || 'Customer',
    orderId: booking.referenceNumber,
    brand: booking.deviceBrand || '',
    model: booking.deviceModel || '',
    quotationAmount: formatCurrency(booking.quotationAmount),
    warrantyPeriod: booking.warrantyPeriod || '3 Months',
    estimatedTime: booking.estimatedTime || 'To be confirmed after approval',
    serviceType: formatServiceType(booking.serviceType),
    repairType: Array.isArray(booking.repairTypes) && booking.repairTypes.length
      ? booking.repairTypes.join(', ')
      : 'General diagnosis',
    repairSummary: booking.repairSummary || booking.technicianNote || 'Detailed diagnosis will be shared during service.',
    technicianNote: booking.technicianNote || 'No additional technician note provided.',
    termsAndConditions: booking.termsAndConditions || 'Standard repair terms apply.',
    preferredDate: formatDate(booking.preferredDate),
    preferredTimeSlot: booking.preferredTimeSlot || 'To be scheduled',
    pickupStore: address || 'Not provided',
    reviewEstimateUrl,
    acceptEstimateUrl,
    rejectEstimateUrl,
    additionalActions: [
      { label: 'Accept Estimate', href: acceptEstimateUrl, variant: 'success' },
      { label: 'Reject Estimate', href: rejectEstimateUrl, variant: 'danger' }
    ]
  };
};

module.exports = {
  getCustomerPortalBaseUrl,
  buildCustomerPortalUrl,
  ensurePortalUserForBooking,
  signCustomerEmailAccessToken,
  buildQuotationEmailData
};
