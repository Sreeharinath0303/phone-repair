const router = require('express').Router();
const { 
  getAllTechnicians, createTechnician, updateTechnician, deleteTechnician,
  getPartnerDashboardStats, getAssignedOrders, updateMyOrderStatus
} = require('../controllers/technicianController');
const {
  getQuoteRequests,
  submitQuoteRequest,
  startHandoff,
  verifyHandoffOtp,
  reportIncident
} = require('../controllers/technicianWorkflowController');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard-stats', protect, getPartnerDashboardStats);
router.get('/my-orders', protect, getAssignedOrders);
router.put('/my-orders/:id/status', protect, updateMyOrderStatus);
router.get('/quote-requests', protect, getQuoteRequests);
router.post('/quote-requests/:id/submit', protect, submitQuoteRequest);
router.post('/bookings/:id/start-handoff', protect, startHandoff);
router.post('/bookings/:id/verify-handoff-otp', protect, verifyHandoffOtp);
router.post('/bookings/:id/report-incident', protect, reportIncident);

router.get('/',         protect, getAllTechnicians);
router.post('/',        protect, authorize('admin', 'superadmin'), createTechnician);
router.put('/:id',      protect, authorize('admin', 'superadmin'), updateTechnician);
router.delete('/:id',   protect, authorize('admin', 'superadmin'), deleteTechnician);

module.exports = router;
