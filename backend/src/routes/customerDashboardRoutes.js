const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getMyBookings,
  getMyOrders,
  getOrderByRef,
  getStats,
  getInvoiceHtml,
  approveQuote,
  rejectQuote,
  verifyReturnOtp,
  updateProfile,
  submitFeedback,
  getMyFeedback,
  addAddress,
  updateAddress,
  deleteAddress
} = require('../controllers/customerController');

// All routes require customer login and customer role
router.use(protect, authorize('customer'));

router.get('/my-bookings', getMyBookings);
router.get('/orders', getMyOrders);
router.get('/order/:ref', getOrderByRef);
router.get('/stats', getStats);
router.get('/invoice/:id/html', getInvoiceHtml);
router.put('/approve-quote/:id', approveQuote);
router.put('/reject-quote/:id', rejectQuote);
router.post('/bookings/:id/verify-return-otp', verifyReturnOtp);

// Profile and Feedback
router.put('/profile', updateProfile);
router.post('/feedback', submitFeedback);
router.get('/my-feedback', getMyFeedback);

// Addresses
router.post('/address', addAddress);
router.put('/address/:id', updateAddress);
router.delete('/address/:id', deleteAddress);

module.exports = router;
