const User = require('../models/User');
const Booking = require('../models/Booking');

// @desc  Get all customers
// @route GET /api/admin/customers
// @access Private (Admin)
exports.getAllCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    let filter = { role: 'customer' };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await User.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: customers.length, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Create a new customer account
// @route POST /api/admin/customers
// @access Private (Admin)
exports.createCustomer = async (req, res) => {
  try {
    const { name, email, phone, password, address, city, state, pincode } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) return res.status(400).json({ success: false, message: 'Email already exists' });

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) return res.status(400).json({ success: false, message: 'Phone number already exists' });

    const customer = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      address,
      city,
      state,
      pincode,
      isVerified: true // Admin created accounts are pre-verified
    });

    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update customer details
// @route PUT /api/admin/customers/:id
// @access Private (Admin)
exports.updateCustomer = async (req, res) => {
  try {
    const { name, email, phone, address, city, state, pincode, isActive } = req.body;
    
    const customer = await User.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    // Check if new email/phone already taken
    if (email && email.toLowerCase() !== customer.email) {
      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) return res.status(400).json({ success: false, message: 'Email already in use' });
      customer.email = email.toLowerCase();
    }

    if (phone && phone !== customer.phone) {
      const exists = await User.findOne({ phone });
      if (exists) return res.status(400).json({ success: false, message: 'Phone already in use' });
      customer.phone = phone;
    }

    if (name) customer.name = name;
    if (address !== undefined) customer.address = address;
    if (city !== undefined) customer.city = city;
    if (state !== undefined) customer.state = state;
    if (pincode !== undefined) customer.pincode = pincode;
    if (isActive !== undefined) customer.isActive = isActive;

    customer.updatedAt = new Date();
    await customer.save();

    res.json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete customer
// @route DELETE /api/admin/customers/:id
// @access Private (Admin)
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    // Check if customer has bookings
    const bookingsCount = await Booking.countDocuments({ customerEmail: customer.email });
    if (bookingsCount > 0) {
      // Soft delete if they have bookings
      customer.isActive = false;
      await customer.save();
      return res.json({ success: true, message: 'Customer has history, account deactivated instead of deleted' });
    }

    await customer.deleteOne();
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get customer service history
// @route GET /api/admin/customers/:email/history
// @access Private (Admin)
exports.getCustomerHistory = async (req, res) => {
  try {
    const bookings = await Booking.find({ customerEmail: req.params.email }).sort({ createdAt: -1 });
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Reset customer password
// @route POST /api/admin/customers/:id/reset-password
// @access Private (Admin)
exports.resetCustomerPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const customer = await User.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    customer.password = newPassword;
    await customer.save();

    res.json({ success: true, message: 'Customer password reset successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
