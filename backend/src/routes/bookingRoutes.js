const router = require('express').Router();
const {
  createBooking, getAllBookings, getBookingByRef, updateStatus,
  issueQuotation, quotationAction, getDashboardStats, deleteBooking
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

const adminOnly = authorize('superadmin', 'admin', 'sales', 'services');
const adminOrPartner = authorize('superadmin', 'admin', 'sales', 'services', 'Technician');

router.get('/stats',             protect, adminOnly, getDashboardStats);
router.get('/',                  protect, adminOnly, getAllBookings);
router.post('/',                          createBooking);
router.get('/:ref',                       getBookingByRef);
router.put('/:ref/quote-action',          quotationAction);
router.put('/:id/status',        protect, adminOrPartner, updateStatus);
router.put('/:id/quotation',     protect, adminOnly, issueQuotation);
router.delete('/:id',            protect, adminOnly, deleteBooking);

module.exports = router;
