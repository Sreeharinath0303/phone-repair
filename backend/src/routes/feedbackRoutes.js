const router = require('express').Router();
const { 
  submitPartnerFeedback, 
  getAllFeedback,
  getFeedbackAnalytics,
  getMyFeedback,
  submitCustomerFeedback
} = require('../controllers/feedbackController');
const { protect, authorize } = require('../middleware/auth');

// Customer Feedback (Step 2 & 6)
router.post('/customer', protect, submitCustomerFeedback);

// Partner Feedback (Step 4 & 6)
router.post('/partner', protect, submitPartnerFeedback);

// My Feedback (Step 14 & 15)
router.get('/my', protect, getMyFeedback);

// Admin View (Steps 8-11)
router.get('/', protect, authorize('admin', 'superadmin'), getAllFeedback);
router.get('/stats', protect, authorize('admin', 'superadmin'), getFeedbackAnalytics);

module.exports = router;
