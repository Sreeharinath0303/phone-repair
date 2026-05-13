const Booking = require('../models/Booking');
const User = require('../models/User');

// @desc  Get logged-in customer's bookings
// @route GET /api/customer/my-bookings
// @access Private (Customer)
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ 
      $or: [
        { customerId: req.user._id },
        { customerEmail: req.user.email }
      ]
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get logged-in customer's bookings (alias for React dashboard)
// @route GET /api/customer/orders
// @access Private (Customer)
exports.getMyOrders = exports.getMyBookings;

// @desc  Get a customer order by reference for tracking
// @route GET /api/customer/order/:ref
// @access Private (Customer)
exports.getOrderByRef = async (req, res) => {
  try {
    const booking = await Booking.findOne({ referenceNumber: req.params.ref.toUpperCase() })
      .populate('assignedTechnician', 'name phone specialization');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (!booking.customerId?.equals(req.user._id) && booking.customerEmail !== req.user.email) {
      return res.status(403).json({ success: false, message: 'Access denied to this order' });
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get customer dashboard stats
// @route GET /api/customer/stats
// @access Private (Customer)
exports.getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const email = req.user.email;
    
    const user = await User.findById(userId).select('-password');

    const total = await Booking.countDocuments({ $or: [{ customerId: userId }, { customerEmail: email }] });
    const active = await Booking.countDocuments({ 
      $or: [{ customerId: userId }, { customerEmail: email }],
      status: { $nin: ['Completed', 'Cancelled', 'Closed'] }
    });
    const pendingQuotes = await Booking.countDocuments({
      $or: [{ customerId: userId }, { customerEmail: email }],
      quotationStatus: 'Pending'
    });

    res.json({
      success: true,
      data: { total, active, pendingQuotes, user }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Approve Quotation
// @route PUT /api/customer/approve-quote/:id
// @access Private (Customer)
exports.approveQuote = async (req, res) => {
  try {
    const booking = await Booking.findOne({ 
      _id: req.params.id,
      $or: [{ customerId: req.user._id }, { customerEmail: req.user.email }]
    });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (!['Pending', 'Awaiting Customer Approval', 'Quote Prepared', 'Offer Sent'].includes(booking.quotationStatus)) {
      return res.status(400).json({ success: false, message: 'Quotation is not in a state that can be approved' });
    }

    booking.quotationStatus = 'Approved by Customer';
    booking.status = 'Approved by Customer';
    booking.timeline.push({ 
      stage: 'Approved by Customer', 
      note: 'Quotation approved by customer. Repair work will move to the next service phase.' 
    });

    await booking.save();
    res.json({ success: true, message: 'Quotation approved successfully', data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Reject Quotation
// @route PUT /api/customer/reject-quote/:id
// @access Private (Customer)
exports.rejectQuote = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findOne({ 
      _id: req.params.id,
      $or: [{ customerId: req.user._id }, { customerEmail: req.user.email }]
    });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    // Step 3: Status explicitly changes to 'Rejected'
    booking.quotationStatus = 'Rejected by Customer';
    booking.status = 'Rejected';
    
    // Step 5 & 7: Log rejection reason explicitly mapped for trackablity 
    const reasonNote = reason ? `Reason provided: ${reason}` : 'No reason provided.';
    booking.rejectionReason = reasonNote;
    booking.followUpStatus = 'Follow-Up Pending'; // Step 7 Tracker Loop execution
    booking.timeline.push({ 
      stage: 'Rejected', 
      note: `Customer securely rejected the service estimate workflow. ${reasonNote}`,
      date: new Date()
    });

    await booking.save();
    
    // Step 4: Admin Rejection Notification hook
    try {
       const sendEmail = require('../utils/sendEmail');
       const adminEmail = process.env.ADMIN_EMAIL || 'admin@repairvafe.com';
       await sendEmail({
          email: adminEmail,
          subject: `Estimate Rejected: #${booking.referenceNumber}`,
          message: `Customer ${booking.customerName} has rejected the estimate for their ${booking.deviceBrand} ${booking.deviceModel}.\n\nReason: ${reasonNote}\n\nPlease review in the Admin Dashboard.`
       });
    } catch (e) {
       console.error("Admin rejection email bounce:", e.message);
    }

    res.json({ success: true, message: 'Quotation gracefully rejected', data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update customer profile
// @route PUT /api/customer/profile
// @access Private (Customer)
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, address, city, state, pincode, password } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const conflict = await User.findOne({
      _id: { $ne: user._id },
      $or: [
        ...(email ? [{ email: email.toLowerCase() }] : []),
        ...(phone ? [{ phone }] : [])
      ]
    });
    if (conflict) {
      return res.status(400).json({ success: false, message: 'Email or phone number already in use' });
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (city) user.city = city;
    if (state) user.state = state;
    if (pincode) user.pincode = pincode;
    if (password) user.password = password;

    await user.save();
    const safeData = user.toObject();
    delete safeData.password;
    res.json({ success: true, message: 'Profile updated successfully', data: safeData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const Feedback = require('../models/Feedback');

// @desc  Submit feedback
// @route POST /api/customer/feedback
// @access Private (Customer)
exports.submitFeedback = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const booking = await Booking.findOne({ 
      _id: bookingId,
      $or: [{ customerId: req.user._id }, { customerEmail: req.user.email }]
    });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    const feedback = await Feedback.create({
      bookingId,
      customerId: req.user._id,
      customerName: req.user.name,
      rating,
      comment
    });

    res.status(201).json({ success: true, message: 'Feedback submitted', data: feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get logged-in customer's feedback
// @route GET /api/customer/my-feedback
// @access Private (Customer)
exports.getMyFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ customerId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('bookingId', 'referenceNumber deviceBrand deviceModel');
    
    res.json({ success: true, data: feedbacks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Add saved address
// @route POST /api/customer/address
// @access Private (Customer)
exports.addAddress = async (req, res) => {
  try {
    const { label, address, city, state, pincode, isDefault } = req.body;
    const user = await User.findById(req.user._id);
    
    if (isDefault) {
      user.savedAddresses.forEach(a => a.isDefault = false);
    }
    
    user.savedAddresses.push({ label, address, city, state, pincode, isDefault });
    await user.save();
    
    res.json({ success: true, message: 'Address added successfully', data: user.savedAddresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update saved address
// @route PUT /api/customer/address/:id
// @access Private (Customer)
exports.updateAddress = async (req, res) => {
  try {
    const { label, address, city, state, pincode, isDefault } = req.body;
    const user = await User.findById(req.user._id);
    
    const addrIndex = user.savedAddresses.findIndex(a => a._id.toString() === req.params.id);
    if (addrIndex === -1) return res.status(404).json({ success: false, message: 'Address not found' });

    if (isDefault) {
      user.savedAddresses.forEach(a => a.isDefault = false);
    }

    user.savedAddresses[addrIndex] = { ...user.savedAddresses[addrIndex].toObject(), label, address, city, state, pincode, isDefault };
    await user.save();
    
    res.json({ success: true, message: 'Address updated successfully', data: user.savedAddresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete saved address
// @route DELETE /api/customer/address/:id
// @access Private (Customer)
exports.deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.savedAddresses = user.savedAddresses.filter(a => a._id.toString() !== req.params.id);
    await user.save();
    
    res.json({ success: true, message: 'Address deleted successfully', data: user.savedAddresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
