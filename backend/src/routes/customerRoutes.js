// Customer routes — derived from booking data (no separate Customer model needed)
const router = require('express').Router();
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

// Get all unique customers (admin)
router.get('/', protect, async (req, res) => {
  try {
    const customers = await Booking.aggregate([
      { $group: {
          _id: '$customerEmail',
          name:        { $first: '$customerName' },
          email:       { $first: '$customerEmail' },
          phone:       { $first: '$customerPhone' },
          totalOrders: { $sum: 1 },
          totalSpent:  { $sum: { $subtract: ['$quotationAmount', '$discount'] } },
          lastDevice:  { $last: '$deviceModel' },
          lastRepair:  { $last: '$createdAt' },
      }},
      { $sort: { lastRepair: -1 } }
    ]);
    res.json({ success: true, total: customers.length, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get bookings for a specific customer by email
router.get('/:email/bookings', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ customerEmail: req.params.email }).sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
