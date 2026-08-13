const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { getAllOrders, deleteOrder } = require('../controllers/orderController');

const adminOnly = authorize('superadmin', 'admin', 'sales', 'services');

router.use(protect);
router.get('/', adminOnly, getAllOrders);
router.delete('/:id', adminOnly, deleteOrder);

module.exports = router;
