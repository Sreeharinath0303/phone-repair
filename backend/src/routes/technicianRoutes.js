const router = require('express').Router();
const { 
  getAllTechnicians, createTechnician, updateTechnician, deleteTechnician,
  getPartnerDashboardStats, getAssignedOrders, updateMyOrderStatus
} = require('../controllers/technicianController');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard-stats', protect, getPartnerDashboardStats);
router.get('/my-orders', protect, getAssignedOrders);
router.put('/my-orders/:id/status', protect, updateMyOrderStatus);

router.get('/',         protect, getAllTechnicians);
router.post('/',        protect, authorize('admin', 'superadmin'), createTechnician);
router.put('/:id',      protect, authorize('admin', 'superadmin'), updateTechnician);
router.delete('/:id',   protect, authorize('admin', 'superadmin'), deleteTechnician);

module.exports = router;
