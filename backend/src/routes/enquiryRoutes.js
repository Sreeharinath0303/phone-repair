const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { createEnquiry, getAllEnquiries, updateEnquiry, deleteEnquiry } = require('../controllers/enquiryController');
const { protect, authorize } = require('../middleware/auth');

// Rate limiting for public enquiry submissions to prevent spam
const enquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per 15 minutes
  message: { success: false, message: 'Too many enquiries submitted from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public route for submitting enquiries
router.post('/', enquiryLimiter, createEnquiry);

// Admin routes
router.get('/admin', protect, authorize('admin', 'superadmin'), getAllEnquiries);
router.put('/admin/:id', protect, authorize('admin', 'superadmin'), updateEnquiry);
router.delete('/admin/:id', protect, authorize('admin', 'superadmin'), deleteEnquiry);

module.exports = router;
