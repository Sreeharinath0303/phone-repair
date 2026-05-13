const router = require('express').Router();
const { createEnquiry, getAllEnquiries, updateEnquiry, deleteEnquiry } = require('../controllers/enquiryController');
const { protect, authorize } = require('../middleware/auth');

// Public route for submitting enquiries
router.post('/', createEnquiry);

// Admin routes
router.get('/admin', protect, authorize('admin', 'superadmin'), getAllEnquiries);
router.put('/admin/:id', protect, authorize('admin', 'superadmin'), updateEnquiry);
router.delete('/admin/:id', protect, authorize('admin', 'superadmin'), deleteEnquiry);

module.exports = router;
