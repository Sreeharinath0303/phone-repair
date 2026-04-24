const router = require('express').Router();
const {
  createBooking, getAllBookings, getBookingByRef, updateStatus,
  issueQuotation, quotationAction, getDashboardStats, deleteBooking
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.get('/stats',             protect, getDashboardStats);
router.get('/',                  protect, getAllBookings);
router.post('/',                          createBooking);
router.get('/:ref',                       getBookingByRef);
router.put('/:ref/quote-action',          quotationAction);
router.put('/:id/status',        protect, updateStatus);
router.put('/:id/quotation',     protect, issueQuotation);
router.delete('/:id',            protect, deleteBooking);

module.exports = router;
