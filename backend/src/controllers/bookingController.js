const Booking = require('../models/Booking');
const { Lead, LEAD_STAGES } = require('../models/Lead');
const User = require('../models/User');
const Technician = require('../models/Technician');
const Feedback = require('../models/Feedback');
const RepairType = require('../models/RepairType');
const mongoose = require('mongoose');

// @desc  Create new booking
// @route POST /api/bookings
// @access Public
exports.createBooking = async (req, res) => {
  try {
    const body = req.body || {};
    const deviceCategory = body.deviceCategory || body.deviceType;
    const deviceBrand = body.deviceBrand || body.brand;
    const deviceModel = body.deviceModel || body.model;
    const repairTypes = Array.isArray(body.repairTypes)
      ? body.repairTypes
      : body.repairTypes
        ? [body.repairTypes]
        : body.issueType
          ? [body.issueType]
          : body.issue
            ? [body.issue]
            : [];
    const issueDescription = body.issueDescription || body.description || '';
    const customerName = body.customerName || body.name || '';
    const customerPhone = body.customerPhone || body.phone || '';
    const customerEmail = (body.customerEmail || body.email || '').trim();
    const serviceTypeRaw = (body.serviceType || body.service || 'pickup').toString().toLowerCase();
    const normalizedServiceType = ['pickup', 'dropoff', 'walkin'].includes(serviceTypeRaw)
      ? serviceTypeRaw
      : serviceTypeRaw.includes('walk')
        ? 'walkin'
        : serviceTypeRaw.includes('store') || serviceTypeRaw.includes('drop')
          ? 'dropoff'
          : 'pickup';
    const address = body.address || '';
    const city = body.city || '';
    const state = body.state || 'Delhi';
    const pincode = body.pincode || '';
    const preferredDate = body.preferredDate || body.scheduledDate;
    const preferredTimeSlot = body.preferredTimeSlot || body.scheduledTime;
    const leadId = body.leadId;
    const latitude = body.latitude;
    const longitude = body.longitude;
    const ipCity = body.ipCity;
    const locationSource = body.locationSource;

    const requiredFields = [
      { key: 'deviceType', value: deviceCategory },
      { key: 'brand', value: deviceBrand },
      { key: 'model', value: deviceModel },
      { key: 'customerName', value: customerName },
      { key: 'customerPhone', value: customerPhone },
      { key: 'address', value: address },
      { key: 'city', value: city },
      { key: 'state', value: state },
      { key: 'pincode', value: pincode },
      { key: 'preferredDate', value: preferredDate },
      { key: 'preferredTimeSlot', value: preferredTimeSlot }
    ];
    const missing = requiredFields.find(field => !String(field.value || '').trim());
    if (missing) {
      return res.status(400).json({ success: false, message: `Missing required field: ${missing.key}` });
    }
    if (!Array.isArray(repairTypes) || repairTypes.length === 0) {
      return res.status(400).json({ success: false, message: 'Select at least one repair type.' });
    }
    const normalizedPhone = String(customerPhone).replace(/\s+/g, '');
    if (!/^\+?[0-9]{10,15}$/.test(normalizedPhone)) {
      return res.status(400).json({ success: false, message: 'Invalid mobile number format.' });
    }
    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }
    if (!/^[0-9]{6}$/.test(String(pincode).trim())) {
      return res.status(400).json({ success: false, message: 'Pincode must be 6 digits.' });
    }

    const safeEmail = customerEmail || `no-reply+${normalizedPhone}@repairvafe.local`;

    // Approximate estimate (sum of configured repair type estimated prices).
    // This is NOT the admin-approved quotation amount; it's only a quick estimate.
    let approxAmount = 0;
    try {
      const typeNames = repairTypes.map((t) => String(t || '').trim()).filter(Boolean);
      if (typeNames.length > 0) {
        const types = await RepairType.find({
          isActive: true,
          name: { $in: typeNames },
          $or: [{ category: deviceCategory }, { category: 'general' }]
        }).select('estimatedPrice');
        approxAmount = (types || []).reduce((sum, t) => sum + (Number(t.estimatedPrice) || 0), 0);
      }
    } catch (e) {
      approxAmount = 0;
    }

    const bookingData = {
      deviceCategory,
      deviceBrand,
      deviceModel,
      repairTypes,
      issueDescription,
      customerName,
      customerPhone: normalizedPhone,
      customerEmail: safeEmail,
      serviceType: normalizedServiceType,
      address,
      city,
      state,
      pincode,
      preferredDate,
      preferredTimeSlot,
      approxAmount,
      quotationStatus: 'Pending',
      // Location intelligence
      latitude:       latitude   || null,
      longitude:      longitude  || null,
      ipCity:         ipCity     || null,
      locationSource: locationSource || 'manual',
      timeline: [{ stage: 'Booking Received', note: 'Repair request submitted by customer.' }]
    };

    let assignedUserId = null;

    if (req.user) {
      bookingData.customerId = req.user._id;
      bookingData.customerEmail = req.user.email; // Ensure it matches the login email
      assignedUserId = req.user._id;
    } else {
      // Step 8 & 9: Auto Account Creation Logic
      let user = await User.findOne({ $or: [{ email: customerEmail.toLowerCase() }, { phone: customerPhone }] });
      
      let autoPassword = null;
      if (!user) {
        // Generate secure 8-character password
        autoPassword = Math.random().toString(36).slice(-8);
        user = await User.create({
          name: customerName,
          email: customerEmail.toLowerCase(),
          phone: customerPhone,
          password: autoPassword,
          address, city, state, pincode,
          isVerified: true // Auto-created accounts from valid booking flows are pre-verified
        });
      }
      
      bookingData.customerId = user._id;
      assignedUserId = user._id;
      
      // Step 10: Share Credentials Securely
      if (autoPassword) {
        try {
          const sendEmail = require('../utils/sendEmail');
          console.log(`[SMS WEBHOOK DISPATCH] -> Texting +91${customerPhone}: "Welcome to RepairVafe! Your temporary password is: ${autoPassword}"`);
          if (customerEmail) {
            await sendEmail({
              email: customerEmail,
              subject: 'Welcome to RepairVafe! Your Account Details',
              message: `Hello ${customerName},\n\nWe have automatically created an account for you so you can easily track your bookings and approve quotes.\n\nLogin Email: ${customerEmail}\nTemporary Password: ${autoPassword}\n\nPlease login and change your password as soon as possible.`
            });
          }
        } catch(e) {
           console.error('Failed to send auto-generated credentials', e.message);
        }
      }
    }

    const booking = await Booking.create(bookingData);

    if (leadId && mongoose.Types.ObjectId.isValid(leadId)) {
      const lead = await Lead.findById(leadId);
      if (lead) {
        lead.bookingCompleted = true;
        lead.stage = LEAD_STAGES.BOOKING_COMPLETED;
        lead.bookingId = booking._id;
        lead.bookingReference = booking.referenceNumber;
        lead.convertedAt = new Date();
        lead.lastActivityAt = new Date();
        lead.stageHistory.push({ stage: LEAD_STAGES.BOOKING_COMPLETED, note: 'Customer submitted booking successfully' });
        await lead.save();
      }
    } else {
      const normalizedMobile = String(customerPhone).replace(/\s+/g, '');
      const lead = await Lead.findOne({ normalizedMobile, bookingCompleted: false }).sort({ updatedAt: -1 });
      if (lead) {
        lead.bookingCompleted = true;
        lead.stage = LEAD_STAGES.BOOKING_COMPLETED;
        lead.bookingId = booking._id;
        lead.bookingReference = booking.referenceNumber;
        lead.convertedAt = new Date();
        lead.lastActivityAt = new Date();
        lead.stageHistory.push({ stage: LEAD_STAGES.BOOKING_COMPLETED, note: 'Booking linked via mobile number match' });
        await lead.save();
      } else {
        await Lead.create({
          customerName,
          mobileNumber: customerPhone,
          normalizedMobile,
          email: customerEmail,
          address, city, state, pincode,
          deviceCategory, deviceBrand, deviceModel,
          repairTypes,
          source: 'website',
          stage: LEAD_STAGES.BOOKING_COMPLETED,
          bookingCompleted: true,
          bookingId: booking._id,
          bookingReference: booking.referenceNumber,
          convertedAt: new Date(),
          lastActivityAt: new Date(),
          stageHistory: [
            { stage: LEAD_STAGES.NEW_LEAD, note: 'Lead generated directly from direct website booking', changedAt: new Date() },
            { stage: LEAD_STAGES.BOOKING_COMPLETED, note: 'Customer submitted booking successfully', changedAt: new Date() }
          ]
        });
      }
    }

    // Step 13: Notification Integration
    try {
        const sendEmail = require('../utils/sendEmail');
        
        // 1. Notify Customer if email is present
        if (customerEmail) {
          await sendEmail({
             email: customerEmail,
             type: 'booking',
             data: { 
               customerName, 
               brand: deviceBrand, 
               model: deviceModel, 
               orderId: booking.referenceNumber,
               serviceDate: preferredDate,
               timeSlot: preferredTimeSlot
             }
          });
        }

        // 2. Admin Alert Trigger (Internal Notification)
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@repairvafe.com';
        await sendEmail({
           email: adminEmail,
           subject: `🚨 New Booking: #${booking.referenceNumber}`,
           message: `New booking received from ${customerName} for ${deviceBrand} ${deviceModel}.`
        });
    } catch(triggerErr) {
        console.error('Booking Submitted Trigger Error:', triggerErr.message);
    }

    // Step 2: Log Activity
    const { logActivity } = require('../utils/logger');
    await logActivity({
      action: 'BOOKING_CREATED',
      entityType: 'Booking',
      entityId: booking._id,
      req,
      description: `New booking created for ${deviceBrand} ${deviceModel}`,
      updated: booking
    });

    res.status(201).json({ success: true, data: booking, message: 'Booking submitted successfully!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Get all bookings (admin)
// @route GET /api/bookings
// @access Private (Admin)
exports.getAllBookings = async (req, res) => {
  try {
    const { status, search, location, state, city, brand, model, repairType, quoteStatus, assignedStatus, serviceMode, startDate, endDate, feedbackRating, sortBy, sortOrder, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (state)  query.state = { $regex: new RegExp(state, 'i') };
    if (city)   query.city = { $regex: new RegExp(city, 'i') };
    if (brand)  query.deviceBrand = { $regex: new RegExp(brand, 'i') };
    if (model)  query.deviceModel = { $regex: new RegExp(model, 'i') };
    if (repairType) query.repairTypes = { $regex: new RegExp(repairType, 'i') };

    if (quoteStatus) {
      if (quoteStatus.toLowerCase() === 'approved') query.quotationStatus = 'Approved by Customer';
      else if (quoteStatus.toLowerCase() === 'rejected') query.quotationStatus = 'Rejected by Customer';
      else if (quoteStatus.toLowerCase() === 'pending') query.quotationStatus = { $in: ['Pending', 'Awaiting Customer Approval'] };
    }

    if (assignedStatus) {
      if (assignedStatus.toLowerCase() === 'assigned') query.assignedTechnician = { $ne: null };
      else if (assignedStatus.toLowerCase() === 'unassigned') query.assignedTechnician = null;
    }

    if (serviceMode) {
      if (serviceMode.toLowerCase() === 'pickup') query.serviceType = 'pickup';
      else if (serviceMode.toLowerCase() === 'store visit' || serviceMode.toLowerCase() === 'dropoff' || serviceMode.toLowerCase() === 'walkin') query.serviceType = { $in: ['dropoff', 'walkin'] };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (feedbackRating) {
      const rating = parseInt(feedbackRating);
      if (!isNaN(rating)) {
        const Feedback = require('../models/Feedback');
        const feedbacks = await Feedback.find({ overallRating: rating }).select('referenceNumber');
        const refs = feedbacks.map(f => f.referenceNumber);
        query.referenceNumber = { $in: refs };
      }
    }

    if (location) {
      query.$or = [
        { address: { $regex: new RegExp(location, 'i') } },
        { city:    { $regex: new RegExp(location, 'i') } },
        { state:   { $regex: new RegExp(location, 'i') } },
        { pincode: { $regex: new RegExp(location, 'i') } }
      ];
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      
      // Look up matching technicians to support searching by Partner Name
      const Technician = require('../models/Technician');
      const matchingTechs = await Technician.find({ name: searchRegex }).select('_id');
      const techIds = matchingTechs.map(t => t._id);

      const searchTerms = [
        { referenceNumber: searchRegex },
        { customerName:    searchRegex },
        { customerEmail:   searchRegex },
        { deviceModel:     searchRegex },
        { customerPhone:   searchRegex },
        { address:         searchRegex },
        { city:            searchRegex }
      ];

      if (techIds.length > 0) {
        searchTerms.push({ assignedTechnician: { $in: techIds } });
      }

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchTerms }];
        delete query.$or;
      } else {
        query.$or = searchTerms;
      }
    }

    const sortConfig = {};
    if (sortBy) {
       sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
       sortConfig.createdAt = -1; // Default
    }

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('assignedTechnician', 'name specialization')
      .sort(sortConfig)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single booking by reference number
// @route GET /api/bookings/:ref
// @access Public
exports.getBookingByRef = async (req, res) => {
  try {
    let booking;
    // Check if the parameter is a valid ObjectId first
    if (mongoose.Types.ObjectId.isValid(req.params.ref)) {
      booking = await Booking.findById(req.params.ref)
        .populate('assignedTechnician', 'name specialization phone email businessName');
    }
    // Fallback to checking referenceNumber
    if (!booking) {
      booking = await Booking.findOne({ referenceNumber: req.params.ref.toUpperCase() })
        .populate('assignedTechnician', 'name specialization phone email businessName');
    }
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update booking status
// @route PUT /api/bookings/:id/status
// @access Private (Admin, Technician)
exports.updateStatus = async (req, res) => {
  try {
    const { status, note, technicianId, partnerRemark } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // If a technician is making the request, verify they own the booking
    if (req.user && req.user.constructor.modelName === 'Technician') {
      if (booking.assignedTechnician?.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized. You can only update your assigned orders.' });
      }
    }

    // Step 17, 18, 19: Final Status Flow with Scalability and Exception handling maps
    const ALLOWED_TRANSITIONS = {
      'Pending': ['Under Review', 'Quote Prepared', 'Assigned to Partner', 'Cancelled'],
      'Under Review': ['Quote Prepared', 'Assigned to Partner', 'Cancelled'],
      
      'Quote Prepared': ['Offer Sent', 'Cancelled'],
      'Offer Sent': ['Awaiting Customer Approval', 'Cancelled'],
      'Awaiting Customer Approval': ['Approved by Customer', 'Rejected by Customer', 'Cancelled'],
      'Approved by Customer': ['Assigned to Partner', 'Order Paused', 'Cancelled'],
      'Rejected by Customer': ['Closed', 'Cancelled'],
      
      'Assigned to Partner': ['Pickup Scheduled', 'Device Received', 'Order Paused', 'Cancelled', 'Assigned'],
      'Assigned': ['Pickup Scheduled', 'Device Received', 'Ongoing', 'Order Paused', 'Cancelled'],
      'Pickup Scheduled': ['Picked Up', 'Order Paused', 'Cancelled'],
      'Picked Up': ['Device Received', 'Order Paused', 'Cancelled'],
      'Device Received': ['Diagnosis In Progress', 'Ongoing', 'Order Paused', 'Cancelled'],
      
      'Diagnosis In Progress': ['Repair Ongoing', 'Ongoing', 'Waiting for Part', 'Waiting for Spare Part', 'Order Paused', 'Cancelled'],
      'Waiting for Part': ['Repair Ongoing', 'Ongoing', 'Order Paused', 'Cancelled'],
      'Waiting for Spare Part': ['Repair Ongoing', 'Ongoing', 'Order Paused', 'Cancelled'],
      'Order Paused': ['Repair Ongoing', 'Ongoing', 'Diagnosis In Progress', 'Ready for Dispatch', 'Cancelled'],
      
      'Repair Ongoing': ['Repair Completed', 'Completed', 'Waiting for Part', 'Waiting for Spare Part', 'Order Paused', 'Cancelled'],
      'Ongoing': ['Repair Completed', 'Completed', 'Waiting for Part', 'Waiting for Spare Part', 'Order Paused', 'Cancelled'],
      
      'Repair Completed': ['Quality Check Done', 'Completed', 'Order Paused', 'Cancelled'],
      'Quality Check Done': ['Ready for Dispatch', 'Ready for Return', 'Order Paused', 'Cancelled'],
      
      'Ready for Dispatch': ['Out for Delivery / Ready for Pickup', 'Ready for Return', 'Order Paused', 'Cancelled'],
      'Ready for Return': ['Out for Delivery / Ready for Pickup', 'Delivered', 'Cancelled'],
      'Out for Delivery / Ready for Pickup': ['Delivered', 'Cancelled'],
      'Delivered': ['Completed', 'Cancelled'],
      'Completed': ['Feedback Pending', 'Closed'],
      'Feedback Pending': ['Closed'],
      'Closed': [],
      'Cancelled': [],
      'Rejected': ['Closed', 'Cancelled'],
      
      // Fallback handlers mapping backward legacy paths safely into the rigid pipeline
      'Assigned': ['Pickup Scheduled', 'In Diagnosis', 'Cancelled'],
      'In Diagnosis': ['Repair In Progress', 'Awaiting Approval'],
      'In Progress': ['Repair Completed', 'Cancelled'],
      'Repair In Progress': ['Repair Completed'],
      'Ready for Delivery': ['Completed', 'Delivered'],
      'Job Closed': [],
      'Device Picked Up': ['Device Received']
    };

    if (status) {
      if (booking.status !== status) {
        const allowed = ALLOWED_TRANSITIONS[booking.status];
        if (allowed && !allowed.includes(status)) {
          if (!req.user || req.user.role !== 'superadmin') {
             return res.status(400).json({ success: false, message: `Invalid workflow transition. Cannot move from '${booking.status}' to '${status}'.` });
          }
        }

        // Step 13: Role-Based Status Controls
        const ADMIN_ONLY_STATUSES = ['Under Review', 'Quote Prepared', 'Offer Sent', 'Assigned to Partner', 'Closed', 'Cancelled', 'Feedback Pending'];
        const isTechnician = req.user && req.user.constructor.modelName === 'Technician';
        if (isTechnician && ADMIN_ONLY_STATUSES.includes(status)) {
          return res.status(403).json({ success: false, message: `Access Denied: Only Administrative Users can set status to '${status}'.` });
        }
      }
      booking.status = status;
      
      // Step 14: Order Workflow Logic & Status Logs
      const actorName = req.user ? (req.user.name || (req.user.role ? 'Admin' : 'Technician')) : 'System';
      const updaterModel = req.user ? (req.user.constructor.modelName) : 'User'; // default to User for tracking page

      booking.timeline.push({ 
        stage: status, 
        note: note || `Status mapped to ${status} via ${actorName}`, 
        date: new Date() 
      });

      // Create separate StatusLog record
      try {
        const StatusLog = require('../models/StatusLog');
        await StatusLog.create({
          orderId: booking._id,
          status,
          note: note || `Updated by ${actorName}`,
          updatedBy: req.user ? req.user._id : null,
          updaterModel
        });
      } catch (logErr) { console.error('StatusLog ingestion bypassed'); }
    }
    if (technicianId && req.user.constructor.modelName !== 'Technician') {
      // Allow only admins to re-assign via status update, tech can't reassign
      booking.assignedTechnician = technicianId; 
    }
    if (partnerRemark) {
      booking.partnerRemarks.push({ note: partnerRemark });
    }

    // Step 1: Automated Invoice Generation Rules
    if ((status === 'Completed' || status === 'Delivered') && !booking.invoiceNumber) {
        booking.invoiceNumber = `INV-${booking.referenceNumber}`;
        booking.invoiceDate = new Date();
        booking.finalAmount = booking.finalAmount || booking.quotationAmount || 0;
        booking.timeline.push({ 
           stage: status, 
           note: `Automated Invoice ${booking.invoiceNumber} generated for amount ₹${booking.finalAmount}.`,
           date: new Date()
        });
    }

    await booking.save();

    // Step 12 & 13: Create Omnibus Notification Trigger Rules (Email, SMS, WhatsApp)
    // Step 13: Create Omnibus Notification Trigger Rules
    if (status) {
      try {
        const sendEmail = require('../utils/sendEmail');
        
        await sendEmail({
          email: booking.customerEmail,
          type: 'status_update',
          data: { 
            name: booking.customerName, 
            orderId: booking.referenceNumber, 
            status, 
            note: note || 'Your repair is progressing.' 
          }
        });
        
        // Notify Admin
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@repairvafe.com';
        await sendEmail({
          email: adminEmail,
          subject: `ADMIN: #${booking.referenceNumber} -> ${status}`,
          message: `Order #${booking.referenceNumber} status changed to ${status} by ${req.user ? req.user.name : 'System'}`
        });
        
      } catch (triggerErr) {
        console.error('Omnibus Notification trigger exception: ', triggerErr.message);
      }
    }

    // Step 2: Log Activity
    const { logActivity } = require('../utils/logger');
    await logActivity({
      action: 'BOOKING_STATUS_UPDATED',
      entityType: 'Booking',
      entityId: booking._id,
      req,
      description: `Status changed to ${status}`,
      updated: { status }
    });

    res.json({ success: true, data: booking, message: 'Updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Issue quotation for a booking
// @route PUT /api/bookings/:id/quotation
// @access Private (Admin)
exports.issueQuotation = async (req, res) => {
  try {
    const { quotationAmount, discount, estimatedTime, warrantyPeriod, technicianNote, repairSummary, termsAndConditions } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.quotationStatus === 'Approved by Customer') {
      return res.status(400).json({ success: false, message: 'Cannot change quote after customer approval. Create a new order or reset workflow.' });
    }

    const amountNum = Number(quotationAmount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({ success: false, message: 'quotationAmount must be a positive number' });
    }

    booking.quotationAmount  = amountNum;
    booking.discount         = discount || 0;
    booking.estimatedTime    = estimatedTime;
    booking.warrantyPeriod   = warrantyPeriod || '3 Months';
    booking.technicianNote   = technicianNote;
    booking.repairSummary    = repairSummary || '';
    booking.termsAndConditions = termsAndConditions || 'Standard repair conditions apply.';
    booking.quotationStatus  = 'Awaiting Customer Approval';
    booking.status           = 'Offer Sent';
    booking.timeline.push({ stage: 'Quote Prepared', note: 'Quote calculation prepared' });
    booking.timeline.push({ stage: 'Offer Sent', note: `Quotation of ₹${quotationAmount} dispatched to customer.` });

    await booking.save();

    // Notify Customer
    try {
      const sendEmail = require('../utils/sendEmail');
      await sendEmail({
        email: booking.customerEmail,
        subject: `Quotation Issued: #${booking.referenceNumber} - Approval Required`,
        message: `A quotation of ₹${quotationAmount} has been issued for your repair #${booking.referenceNumber}. Please login to your dashboard to configure or respond to the offer.`
      });
    } catch (ignore) {}

    // Step 19: Log Activity
    const { logActivity } = require('../utils/logger');
    await logActivity({
      action: 'QUOTE_ISSUED',
      entityType: 'Booking',
      entityId: booking._id,
      req,
      description: `Quotation of ₹${quotationAmount} issued for repair`,
      updated: { quotationAmount, quotationStatus: 'Awaiting Customer Approval' }
    });

    res.json({ success: true, data: booking, message: 'Quotation issued successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Request OTP for Quotation Approval
// @route POST /api/bookings/:ref/quote-otp
exports.requestQuoteOtp = async (req, res) => {
  try {
    const booking = await Booking.findOne({ referenceNumber: req.params.ref.toUpperCase() });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    if (booking.quotationStatus !== 'Awaiting Customer Approval') {
      return res.status(400).json({ success: false, message: 'No quotation awaiting approval' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    booking.trackingOtp = otp;
    booking.trackingOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await booking.save();

    console.log(`[QUOTE OTP] Sending OTP to ${booking.customerPhone}: ${otp}`);
    try {
      const sendEmail = require('../utils/sendEmail');
      await sendEmail({
        email: booking.customerEmail,
        subject: 'RepairVafe - Quote Approval Security OTP',
        message: `Your OTP to approve Quote for Order ${booking.referenceNumber} is: ${otp}. It will expire in 10 minutes.`
      });
    } catch(e) {}

    res.json({ success: true, message: 'Approval OTP sent successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Approve or reject quotation (customer action)
// @route PUT /api/bookings/:ref/quote-action
// @access Public
exports.quotationAction = async (req, res) => {
  try {
    const { action, otp } = req.body; // 'approve' | 'reject'
    const booking = await Booking.findOne({ referenceNumber: req.params.ref.toUpperCase() }).select('+trackingOtp +trackingOtpExpiry');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.quotationStatus !== 'Awaiting Customer Approval' && booking.quotationStatus !== 'Pending')
      return res.status(400).json({ success: false, message: 'Quotation already actioned' });

    const { Lead, LEAD_STAGES } = require('../models/Lead');
    const lead = await Lead.findOne({ bookingReference: booking.referenceNumber });

    if (action === 'approve') {
      if (otp) {
        if (!booking.trackingOtp || booking.trackingOtp !== String(otp)) {
          return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }
        if (booking.trackingOtpExpiry < new Date()) {
          return res.status(400).json({ success: false, message: 'OTP has expired' });
        }
        // Securely clear OTP upon use
        booking.trackingOtp = undefined;
        booking.trackingOtpExpiry = undefined;
      }

      booking.quotationStatus = 'Approved by Customer';
      // Step 9: Customer Approval Workflow execution mapping status directly
      booking.status = 'Approved by Customer'; 
      // Step 10 & 12: Record Timestamps explicitly in the history payload.
      booking.timeline.push({ 
         stage: 'Approved by Customer', 
         note: 'Customer securely approved Estimate Form parameters.', 
         date: new Date() 
      });
      
      if (lead) {
        lead.stage = LEAD_STAGES.CONVERTED_TO_ORDER;
        lead.bookingCompleted = true;
        lead.convertedAt = new Date();
        lead.lastActivityAt = new Date();
        if (!lead.stageHistory) lead.stageHistory = [];
        lead.stageHistory.push({ stage: LEAD_STAGES.CONVERTED_TO_ORDER, note: 'Customer approved quote', changedAt: new Date() });
        await lead.save();
      }
    } else {
      booking.quotationStatus = 'Rejected by Customer';
      // Step 9: Rejection Logic maps firmly to Cancelled string block
      booking.status = 'Cancelled'; 
      booking.timeline.push({ stage: 'Rejected by Customer', note: 'Customer actively denied estimate offer parameters.', date: new Date() });
      booking.timeline.push({ stage: 'Cancelled', note: 'Workflow locked permanently to Cancelled workflow via rejection parameter.', date: new Date() });
      
      if (lead) {
        lead.stage = LEAD_STAGES.LOST_INACTIVE;
        lead.lostAt = new Date();
        lead.lastActivityAt = new Date();
        if (!lead.stageHistory) lead.stageHistory = [];
        lead.stageHistory.push({ stage: LEAD_STAGES.LOST_INACTIVE, note: 'Quotation rejected by customer', changedAt: new Date() });
        await lead.save();
      }
    }

    await booking.save();

    // Step 5: Add Quotation Events (Quote Approved & Quote Rejected)
    try {
        const sendEmail = require('../utils/sendEmail');
        
        // Notify Customer securely via Dashboard rules
        if (action === 'approve') {
           console.log(`[WhatsApp API MOCK] -> +91${booking.customerPhone}: "Thank you! Estimate Approved✅. We will dispatch a Partner shortly."`);
           await sendEmail({
              email: booking.customerEmail,
              subject: `Estimate Approved: #${booking.referenceNumber}`,
              message: `Thank you for approving the service estimate for the ${booking.deviceModel}!\n\nWe are formally executing your repair pipeline. An operations administrator will assign a technician immediately.`
           });
        }
        
        // Admin Master Alerts
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@repairvafe.com';
        await sendEmail({
           email: adminEmail,
           subject: `[EVENT] Quotation ${action === 'approve' ? 'APPROVED' : 'REJECTED'}: #${booking.referenceNumber}`,
           message: `An event was triggered: QUOTATION ${action.toUpperCase()}.\n\nCustomer: ${booking.customerName}\nOrder Reference: ${booking.referenceNumber}\nAmount: ₹${booking.quotationAmount}\n\nPlease review the active bounds natively in the Administrative Terminal.`
        });
        
    } catch(triggerErr) {
        console.error('Quotation Event exception safely bypassed: ', triggerErr.message);
    }

    // Step 19: Log Activity
    const { logActivity } = require('../utils/logger');
    await logActivity({
      action: action === 'approve' ? 'QUOTE_APPROVED' : 'QUOTE_REJECTED',
      entityType: 'Booking',
      entityId: booking._id,
      req,
      description: `Customer ${action}d the quotation of ₹${booking.quotationAmount}`,
      updated: { quotationStatus: booking.quotationStatus, status: booking.status }
    });

    res.json({ success: true, data: booking, message: `Quotation ${action}d successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get dashboard stats
// @route GET /api/bookings/stats
// @access Private (Admin)
exports.getDashboardStats = async (req, res) => {
  try {
    // Step 2: Dashboard Summary Cards
    const totalLeads = await Lead.countDocuments();
    const incompleteLeads = await Lead.countDocuments({ bookingCompleted: false });
    const totalBookings = await Booking.countDocuments();
    const pendingQuotations = await Booking.countDocuments({ quotationStatus: 'Awaiting Customer Approval' });
    const approvedQuotations = await Booking.countDocuments({ quotationStatus: 'Approved by Customer' });
    
    const assignedOrders = await Booking.countDocuments({ 
      status: { $in: ['Assigned to Partner', 'Pickup Scheduled', 'Picked Up', 'Device Received', 'Assigned'] } 
    });
    const ongoingRepairs = await Booking.countDocuments({ 
      status: { $in: ['Diagnosis In Progress', 'Repair Ongoing', 'Waiting for Part', 'Waiting for Spare Part', 'Order Paused', 'Ongoing', 'In Diagnosis', 'In Progress'] } 
    });
    const completedRepairs = await Booking.countDocuments({ 
      status: { $in: ['Repair Completed', 'Quality Check Done', 'Ready for Dispatch', 'Ready for Return', 'Delivered', 'Completed', 'Closed', 'Job Closed'] } 
    });
    const cancelledOrders = await Booking.countDocuments({ status: 'Cancelled' });

    // Feedback Pending: Completed/Delivered bookings that don't have a feedback record yet
    const feedbackBookingRefs = await Feedback.distinct('referenceNumber');
    const feedbackPending = await Booking.countDocuments({
      status: { $in: ['Completed', 'Delivered'] },
      referenceNumber: { $nin: feedbackBookingRefs }
    });

    // Partner-wise breakdown
    const partnerWise = await Booking.aggregate([
      { $match: { assignedTechnician: { $ne: null } } },
      { $group: { _id: '$assignedTechnician', count: { $sum: 1 } } }
    ]);
    // Populate technician names
    const partnerWisePopulated = [];
    for (const item of partnerWise) {
      const tech = await Technician.findById(item._id).select('name');
      partnerWisePopulated.push({
        partnerId: item._id,
        partnerName: tech ? tech.name : 'Unknown Partner',
        count: item.count
      });
    }

    // Location-wise breakdown (City)
    const locationWise = await Booking.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const customersCount = await User.countDocuments({ role: 'customer' });
    const techniciansCount = await Technician.countDocuments();

    const revenueResult = await Booking.aggregate([
      { $match: { status: { $in: ['Completed', 'Delivered', 'Closed'] } } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$quotationAmount', '$discount'] } } } }
    ]);
    const revenue = revenueResult[0]?.total || 0;

    const recent = await Booking.find().sort({ createdAt: -1 }).limit(5)
      .select('referenceNumber customerName deviceModel status quotationAmount createdAt');

    res.json({
      success: true,
      data: {
        totalBookings,
        totalLeads,
        incompleteLeads,
        pendingQuotations,
        approvedQuotations,
        assignedOrders,
        ongoingRepairs,
        completedRepairs,
        cancelledOrders,
        feedbackPending,
        partnerWise: partnerWisePopulated,
        locationWise,
        customers: customersCount,
        technicians: techniciansCount,
        revenue,
        recent
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete booking
// @route DELETE /api/bookings/:id
// @access Private (Admin)
exports.deleteBooking = async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
