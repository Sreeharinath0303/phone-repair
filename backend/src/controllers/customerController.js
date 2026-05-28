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
      quotationStatus: 'Awaiting Customer Approval'
    });

    res.json({
      success: true,
      data: { total, active, pendingQuotes, user }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get invoice HTML for a booking (print/save as PDF)
// @route GET /api/customer/invoice/:id/html
// @access Private (Customer)
exports.getInvoiceHtml = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('assignedTechnician', 'name phone specialization')
      .lean();

    if (!booking) return res.status(404).send('Invoice not found');
    const isOwner = (booking.customerId && String(booking.customerId) === String(req.user._id)) || booking.customerEmail === req.user.email;
    if (!isOwner) return res.status(403).send('Access denied');

    const invoiceNumber = booking.invoiceNumber || `INV-${booking.referenceNumber}`;
    const invoiceDate = booking.invoiceDate || booking.updatedAt || booking.createdAt || new Date();
    const finalAmount = booking.finalAmount || Math.max(0, (booking.quotationAmount || 0) - (booking.discount || 0));

    const safe = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safe(invoiceNumber)} - RepairVafe Invoice</title>
  <style>
    :root { --bg:#0b1220; --card:#0f1a2e; --muted:#94a3b8; --text:#e5e7eb; --pri:#60a5fa; --line: rgba(255,255,255,0.08); }
    * { box-sizing: border-box; }
    body { margin:0; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background: var(--bg); color: var(--text); }
    .wrap { max-width: 900px; margin: 32px auto; padding: 0 18px; }
    .card { background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02)); border: 1px solid var(--line); border-radius: 16px; overflow:hidden; }
    .top { padding: 22px 22px; display:flex; align-items:flex-start; justify-content: space-between; gap: 14px; border-bottom: 1px solid var(--line); }
    .brand { font-weight: 900; letter-spacing: 0.3px; }
    .brand span { color: var(--pri); }
    .meta { text-align:right; }
    .meta .id { font-weight: 800; }
    .meta .dt { color: var(--muted); font-size: 12px; margin-top: 2px; }
    .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 18px 22px 10px; }
    .box { border: 1px solid var(--line); border-radius: 14px; padding: 14px 14px; background: rgba(255,255,255,0.02); }
    .box h3 { margin:0 0 10px; font-size: 13px; color: var(--muted); font-weight: 700; letter-spacing: 0.2px; text-transform: uppercase; }
    .row { display:flex; justify-content: space-between; gap: 10px; padding: 6px 0; border-bottom: 1px dashed rgba(255,255,255,0.06); }
    .row:last-child { border-bottom: 0; }
    .k { color: var(--muted); font-size: 12px; }
    .v { font-size: 12.5px; font-weight: 650; text-align:right; }
    .sum { padding: 8px 22px 22px; }
    .total { display:flex; justify-content: space-between; align-items:center; gap: 12px; padding: 16px 16px; border-radius: 14px; border: 1px solid rgba(96,165,250,0.35); background: linear-gradient(90deg, rgba(96,165,250,0.10), rgba(16,185,129,0.05)); }
    .total .label { color: var(--muted); font-size: 12px; }
    .total .amt { font-size: 22px; font-weight: 900; }
    .note { color: var(--muted); font-size: 12px; margin-top: 10px; line-height: 1.5; }
    .actions { display:flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
    button { cursor:pointer; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: var(--text); padding: 10px 12px; font-weight: 750; font-size: 12.5px; }
    button.primary { background: rgba(96,165,250,0.18); border-color: rgba(96,165,250,0.35); }
    @media print { body { background: #fff; color:#111827; } .card { border: 0; } button { display:none; } .wrap { margin: 0; max-width: none; } }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="top">
        <div>
          <div class="brand">Repair<span>Vafe</span></div>
          <div style="color: var(--muted); font-size:12px; margin-top:4px;">Service Invoice</div>
        </div>
        <div class="meta">
          <div class="id">${safe(invoiceNumber)}</div>
          <div class="dt">${safe(new Date(invoiceDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }))}</div>
          <div class="dt">Job: ${safe(booking.referenceNumber)}</div>
        </div>
      </div>

      <div class="grid">
        <div class="box">
          <h3>Customer</h3>
          <div class="row"><div class="k">Name</div><div class="v">${safe(booking.customerName)}</div></div>
          <div class="row"><div class="k">Phone</div><div class="v">${safe(booking.customerPhone)}</div></div>
          <div class="row"><div class="k">Email</div><div class="v">${safe(booking.customerEmail)}</div></div>
          <div class="row"><div class="k">Address</div><div class="v">${safe(`${booking.address}, ${booking.city}, ${booking.state} - ${booking.pincode}`)}</div></div>
        </div>
        <div class="box">
          <h3>Repair</h3>
          <div class="row"><div class="k">Device</div><div class="v">${safe(`${booking.deviceBrand} ${booking.deviceModel}`)}</div></div>
          <div class="row"><div class="k">Service Type</div><div class="v">${safe(booking.serviceType)}</div></div>
          <div class="row"><div class="k">Status</div><div class="v">${safe(booking.status)}</div></div>
          <div class="row"><div class="k">Warranty</div><div class="v">${safe(booking.warrantyPeriod || '3 Months')}</div></div>
        </div>
      </div>

      <div class="sum">
        <div class="box" style="margin: 0 0 14px; padding: 14px 16px;">
          <h3>Billing</h3>
          <div class="row"><div class="k">Quote</div><div class="v">₹${safe((booking.quotationAmount || 0).toLocaleString('en-IN'))}</div></div>
          <div class="row"><div class="k">Discount</div><div class="v">- ₹${safe((booking.discount || 0).toLocaleString('en-IN'))}</div></div>
          <div class="row"><div class="k">Payment Status</div><div class="v">${safe(booking.paymentStatus || 'Pending')}</div></div>
        </div>

        <div class="total">
          <div>
            <div class="label">Total Amount</div>
            <div style="font-weight:800; font-size:12px; color: var(--muted); margin-top:2px;">Payable upon delivery/pickup</div>
          </div>
          <div class="amt">₹${safe(Number(finalAmount || 0).toLocaleString('en-IN'))}</div>
        </div>

        <div class="actions">
          <button class="primary" onclick="window.print()">Print / Save PDF</button>
          <button onclick="window.close()">Close</button>
        </div>

        <div class="note">
          Terms: Warranty applies to replaced parts under normal usage. Data backups remain customer responsibility.
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (err) {
    res.status(500).send('Failed to generate invoice');
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
    if (booking.quotationStatus !== 'Awaiting Customer Approval' || !(booking.quotationAmount > 0)) {
      return res.status(400).json({ success: false, message: 'No admin quote available for approval yet' });
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
    
    if (booking.quotationStatus !== 'Awaiting Customer Approval' || !(booking.quotationAmount > 0)) {
      return res.status(400).json({ success: false, message: 'No admin quote available for rejection yet' });
    }

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
      booking: booking._id,
      orderId: booking.referenceNumber,
      type: 'customer',
      fromId: req.user._id,
      fromName: req.user.name || 'Customer',
      rating,
      review: comment
    });

    booking.customerFeedbackStatus = 'Feedback Submitted';
    await booking.save();

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
    const feedbacks = await Feedback.find({ fromId: req.user._id, type: 'customer' })
      .sort({ createdAt: -1 })
      .populate('booking', 'referenceNumber deviceBrand deviceModel');
    
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
