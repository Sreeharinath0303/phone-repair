// Quotation routes — proxies to booking controller actions
const router = require('express').Router();
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

// Get quotation by ref (public — customer views their quote)
router.get('/:ref', async (req, res) => {
  try {
    const booking = await Booking.findOne({ referenceNumber: req.params.ref.toUpperCase() })
      .populate('assignedTechnician', 'name specialization');
    if (!booking) return res.status(404).json({ success: false, message: 'Quotation not found' });
    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all quotations (admin)
router.get('/', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ quotationStatus: { $ne: 'Not Issued' } })
      .sort({ createdAt: -1 })
      .select('referenceNumber customerName deviceBrand deviceModel quotationAmount quotationStatus status createdAt');
    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
