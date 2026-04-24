// Tracking routes — customer track repair by reference
const router = require('express').Router();
const Booking = require('../models/Booking');

router.get('/:ref', async (req, res) => {
  try {
    const booking = await Booking.findOne({ referenceNumber: req.params.ref.toUpperCase() })
      .populate('assignedTechnician', 'name specialization phone');
    if (!booking) return res.status(404).json({ success: false, message: 'Repair not found. Check your reference number.' });

    // Build clean tracking response
    const trackData = {
      ref: booking.referenceNumber,
      device: `${booking.deviceBrand} ${booking.deviceModel}`,
      category: booking.deviceCategory,
      repairs: booking.repairTypes.join(', '),
      customer: booking.customerName,
      phone: booking.customerPhone,
      status: booking.status,
      quotationStatus: booking.quotationStatus,
      amount: booking.quotationAmount ? `₹${booking.quotationAmount.toLocaleString('en-IN')}` : 'Pending',
      discount: booking.discount,
      estimatedTime: booking.estimatedTime,
      warranty: booking.warrantyPeriod,
      serviceType: booking.serviceType,
      technician: booking.assignedTechnician?.name || 'Being assigned',
      timeline: booking.timeline,
      bookedAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };

    res.json({ success: true, data: trackData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
