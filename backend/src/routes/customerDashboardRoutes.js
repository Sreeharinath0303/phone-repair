const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  getMyBookings,
  getStats,
  approveQuote,
  rejectQuote
} = require('../controllers/customerController');

// All routes require customer login
router.use(protect);

router.get('/my-bookings', getMyBookings);
router.get('/stats', getStats);
router.put('/approve-quote/:id', approveQuote);
router.put('/reject-quote/:id', rejectQuote);

// Profile and Feedback
const { updateProfile, submitFeedback, getMyFeedback, addAddress, updateAddress, deleteAddress } = require('../controllers/customerController');
router.put('/profile', updateProfile);
router.post('/feedback', submitFeedback);
router.get('/my-feedback', getMyFeedback);

// Addresses
router.post('/address', addAddress);
router.put('/address/:id', updateAddress);
router.delete('/address/:id', deleteAddress);

module.exports = router;
