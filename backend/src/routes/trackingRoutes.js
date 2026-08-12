// Tracking routes — customer track repair by reference
const router = require('express').Router();
const Booking = require('../models/Booking');

const sendEmail = require('../utils/sendEmail');

// Step 3 & 4: Request Tracking OTP (Validates Order ID + Mobile)
router.post('/request-otp', async (req, res) => {
  try {
    const { referenceNumber, mobileNumber } = req.body;
    if (!referenceNumber || !mobileNumber) {
      return res.status(400).json({ success: false, message: 'Reference number and mobile number are required.' });
    }

    const booking = await Booking.findOne({ 
      referenceNumber: referenceNumber.toUpperCase(),
      customerPhone: mobileNumber 
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Invalid Reference Number or Mobile Number.' });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    booking.trackingOtp = otp;
    booking.trackingOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    await booking.save();

    // In a real production app, you would send an SMS here. We simulate or log it, and send email if possible.
    console.log(`[TRACKING OTP] Order ${referenceNumber} OTP is: ${otp}`);
    if (booking.customerEmail) {
      try {
        await sendEmail({
          email: booking.customerEmail,
          subject: 'erepaircafe - Tracking Security OTP',
          message: `Your OTP to track Order ${referenceNumber} is: ${otp}. It will expire in 10 minutes.`
        });
      } catch (e) {
        console.error('Email OTP sending failed, skipped.', e.message);
      }
    }

    res.json({ success: true, message: 'OTP sent successfully to your registered contact.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Step 5: Verify OTP and Fetch Order Details
router.post('/verify-otp', async (req, res) => {
  try {
    const { referenceNumber, mobileNumber, otp } = req.body;
    
    if (!referenceNumber || !mobileNumber || !otp) {
      return res.status(400).json({ success: false, message: 'Reference, Mobile, and OTP are required.' });
    }

    const booking = await Booking.findOne({ 
      referenceNumber: referenceNumber.toUpperCase(),
      customerPhone: mobileNumber 
    }).select('+trackingOtp +trackingOtpExpiry').populate('assignedTechnician', 'name specialization phone');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (!booking.trackingOtp || booking.trackingOtp !== String(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    if (booking.trackingOtpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Clear OTP securely
    booking.trackingOtp = undefined;
    booking.trackingOtpExpiry = undefined;
    await booking.save();

    // Build secure tracking response
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

    res.json({ success: true, data: trackData, message: 'Tracking details fetched successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const { protect } = require('../middleware/auth');

// Step 16: Authenticated Bypass for Logged-In Users
router.get('/auth/:ref', protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({ 
      referenceNumber: req.params.ref.toUpperCase(),
      customerEmail: req.user.email // Ensure ownership
    }).populate('assignedTechnician', 'name specialization phone');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found or access denied.' });
    }

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

    res.json({ success: true, data: trackData, message: 'Tracking details fetched automatically via login.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Step 17: Request Update / Reminder Notification
router.post('/request-update', async (req, res) => {
  try {
    const { referenceNumber } = req.body;
    if (!referenceNumber) return res.status(400).json({ success: false, message: 'Reference number required.' });

    const booking = await Booking.findOne({ referenceNumber: referenceNumber.toUpperCase() });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const adminEmail = process.env.ADMIN_EMAIL || 'erepaircafe2010@gmail.com';
    try {
      await sendEmail({
        email: adminEmail,
        subject: `[URGENT] Customer Requested Update: Order #${booking.referenceNumber}`,
        message: `The customer for Order #${booking.referenceNumber} (${booking.customerName}) has requested an urgent status update via the tracking portal.\n\nCurrent Status: ${booking.status}\nPlease review and respond.`
      });
    } catch (e) {
      console.error('Failed to send admin notification', e.message);
    }

    res.json({ success: true, message: 'Update request sent to our team.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

