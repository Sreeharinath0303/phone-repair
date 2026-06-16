const router = require('express').Router();
const {
  createBooking, getAllBookings, getBookingByRef, updateStatus,
  issueQuotation, quotationAction, requestQuoteOtp, getDashboardStats, deleteBooking,
  getPublicBrands, getPublicModels
} = require('../controllers/bookingController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

const adminOnly = authorize('superadmin', 'admin', 'sales', 'services');
const adminOrPartner = authorize('superadmin', 'admin', 'sales', 'services', 'Technician');

router.get('/stats',             protect, adminOnly, getDashboardStats);
router.get('/catalog/brands',             getPublicBrands);
router.get('/catalog/models',             getPublicModels);
router.get('/',                  protect, adminOnly, getAllBookings);
router.post('/',                  optionalAuth,   createBooking);
router.get('/:ref',                       getBookingByRef);
router.post('/:ref/quote-otp',            requestQuoteOtp);
router.post('/:ref/request-approval-otp', requestQuoteOtp);
router.put('/:ref/quote-action',          quotationAction);
router.put('/:id/status',        protect, adminOrPartner, updateStatus);
router.put('/:id/quotation',     protect, adminOnly, issueQuotation);
router.delete('/:id',            protect, adminOnly, deleteBooking);

module.exports = router;
