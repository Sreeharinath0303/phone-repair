const Booking = require('../models/Booking');
const { Lead, LEAD_STAGES } = require('../models/Lead');
const User = require('../models/User');
const { Technician } = require('../models/Technician');
const Feedback = require('../models/Feedback');
const mongoose = require('mongoose');

// @desc  Create new booking
// @route POST /api/bookings
// @access Public
exports.createBooking = async (req, res) => {
  try {
    const { deviceCategory, deviceBrand, deviceModel, repairTypes, issueDescription,
            customerName, customerPhone, customerEmail, serviceType, address, city, state, pincode,
            preferredDate, preferredTimeSlot, leadId,
            latitude, longitude, ipCity, locationSource } = req.body;

    const requiredFields = [
      { key: 'deviceCategory', value: deviceCategory },
      { key: 'deviceBrand', value: deviceBrand },
      { key: 'deviceModel', value: deviceModel },
      { key: 'customerName', value: customerName },
      { key: 'customerPhone', value: customerPhone },
      { key: 'customerEmail', value: customerEmail },
      { key: 'serviceType', value: serviceType },
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
    if (!/^\+?[0-9]{10,15}$/.test(String(customerPhone).replace(/\s+/g, ''))) {
      return res.status(400).json({ success: false, message: 'Invalid mobile number format.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(customerEmail).trim())) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }
    if (!/^[0-9]{6}$/.test(String(pincode).trim())) {
      return res.status(400).json({ success: false, message: 'Pincode must be 6 digits.' });
    }

    const bookingData = {
      deviceCategory, deviceBrand, deviceModel, repairTypes, issueDescription,
      customerName, customerPhone, customerEmail, serviceType, address, city, state, pincode,
      preferredDate, preferredTimeSlot,
      // Location intelligence
      latitude:       latitude   || null,
      longitude:      longitude  || null,
      ipCity:         ipCity     || null,
      locationSource: locationSource || 'manual',
      timeline: [{ stage: 'Booking Received', note: 'Repair request submitted by customer.' }]
    };

    if (req.user) {
      bookingData.customerId = req.user._id;
      bookingData.customerEmail = req.user.email; // Ensure it matches the login email
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
      }
    }

    // Step 3 & 4: Event Trigger Engine - Booking Submitted Alert
    try {
        const sendEmail = require('../utils/sendEmail');
        
        // 1. Notify Customer (SMS/WhatsApp Mock + Email)
        console.log(`[SMS WEBHOOK DISPATCH] -> Texting +91${customerPhone}: "RepairVafe: Your booking ${booking.referenceNumber} is confirmed!"`);
        await sendEmail({
           email: customerEmail,
           subject: `Booking Confirmed: #${booking.referenceNumber}`,
           message: `Hello ${customerName},\n\nWe have successfully received your repair booking for your ${deviceBrand} ${deviceModel}.\n\nYour Service Date: ${preferredDate} (${preferredTimeSlot})\nReference ID: ${booking.referenceNumber}\n\nOur team is reviewing the hardware needs and will push an Estimate shortly.\n\nThank you for choosing RepairVafe!`
        });

        // 2. Admin Alert Trigger (New Order Received)
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@repairvafe.com';
        await sendEmail({
           email: adminEmail,
           subject: `🚨 [EVENT] New Booking Submitted: #${booking.referenceNumber}`,
           message: `An event was triggered: BOOKING SUBMITTED.\n\nCustomer: ${customerName}\nDevice: ${deviceBrand} ${deviceModel}\nService Mode: ${serviceType.toUpperCase()}\n\nPlease review and generate the Service Quote within the Admin Dashboard.`
        });
    } catch(triggerErr) {
        console.error('Booking Submitted Trigger Error:', triggerErr.message);
    }

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
    const { status, search, location, state, city, brand, model, repairType, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (state)  query.state = { $regex: new RegExp(state, 'i') };
    if (city)   query.city = { $regex: new RegExp(city, 'i') };
    if (brand)  query.deviceBrand = { $regex: new RegExp(brand, 'i') };
    if (model)  query.deviceModel = { $regex: new RegExp(model, 'i') };
    if (repairType) query.repairTypes = { $regex: new RegExp(repairType, 'i') };

    if (location) {
      query.$or = [
        { address: { $regex: new RegExp(location, 'i') } },
        { city:    { $regex: new RegExp(location, 'i') } },
        { state:   { $regex: new RegExp(location, 'i') } },
        { pincode: { $regex: new RegExp(location, 'i') } }
      ];
    }

    if (search) {
      const searchTerms = [
        { referenceNumber: new RegExp(search, 'i') },
        { customerName:    new RegExp(search, 'i') },
        { deviceModel:     new RegExp(search, 'i') },
        { customerPhone:   new RegExp(search, 'i') },
        { address:         new RegExp(search, 'i') },
        { city:            new RegExp(search, 'i') },
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchTerms }];
        delete query.$or;
      } else {
        query.$or = searchTerms;
      }
    }

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('assignedTechnician', 'name specialization')
      .sort({ createdAt: -1 })
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
    const booking = await Booking.findOne({ referenceNumber: req.params.ref.toUpperCase() })
      .populate('assignedTechnician', 'name specialization phone');
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
      
      // Step 16: Order History and Audit Log
      const actorName = req.user ? (req.user.name || (req.user.role ? 'Admin' : 'Technician')) : 'System';
      booking.timeline.push({ 
        stage: status, 
        note: note || `Status mapped to ${status} via ${actorName}`, 
        date: new Date() 
      });
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
    if (status) {
      try {
        const sendEmail = require('../utils/sendEmail');
        
        // Step 7, 8 & 10: Role-Specific Event Context Map (Recipient Rules)
        let subjectDetails = `Order Update: #${booking.referenceNumber} is now ${status}`;
        let messageDetails = `Hello ${booking.customerName},\n\nYour repair order #${booking.referenceNumber} status has been updated to: ${status}.\n\nNote: ${note || 'No additional notes.'}\n\nYou can track progress via your secure dashboard.`;
        let smsText = `RepairVafe Update: Order ${booking.referenceNumber} is now ${status}.`;

        // Step 7: Pickup & Repair Event Formatting
        if (status === 'Pickup Scheduled') {
            subjectDetails = `Pickup Scheduled: #${booking.referenceNumber}`;
            smsText = `RepairVafe: Your device pickup for ${booking.deviceModel} has been formally scheduled. Pack your device securely!`;
        } else if (status === 'Picked Up' || status === 'Device Received') {
            subjectDetails = `Device Secure: #${booking.referenceNumber}`;
            smsText = `RepairVafe: We have your ${booking.deviceModel}! Diagnostics bounding starting shortly.`;
        } else if (status === 'Diagnosis In Progress' || status === 'Ongoing' || status === 'Repair Ongoing') {
            subjectDetails = `Repair Pipeline Active: #${booking.referenceNumber}`;
            smsText = `RepairVafe: Diagnostics & Repair operations are actively underway for your device!`;
        } else if (status === 'Repair Completed' || status === 'Completed') {
            subjectDetails = `Repair Completed: #${booking.referenceNumber} ✅`;
            smsText = `RepairVafe: Great news! Your ${booking.deviceModel} is fully repaired and passing quality checks.`;
        }
        
        // Step 8: Delivery & Feedback Event Formatting
        else if (status === 'Ready for Dispatch' || status === 'Ready for Return') {
            subjectDetails = `Ready for Return: #${booking.referenceNumber}`;
            smsText = `RepairVafe: Your device is ready! Our partner is preparing delivery vectors.`;
        } else if (status === 'Delivered') {
            subjectDetails = `Job Delivered! Rate your service #${booking.referenceNumber}`;
            smsText = `RepairVafe: Your device was delivered safely! Please review our service and let us know your feedback!`;
        }

        // 1. Notify Customer (Email + SMS/WhatsApp Hooks) -> Recipient Rule 1
        await sendEmail({
          email: booking.customerEmail,
          subject: subjectDetails,
          message: messageDetails
        });
        
        if (booking.customerPhone) {
           console.log(`[SMS WEBHOOK DISPATCH] -> Texting +91${booking.customerPhone}: "${smsText}"`);
           console.log(`[WHATSAPP API DISPATCH] -> Messaging +91${booking.customerPhone}: "RepairVafe Alert: Job ${booking.referenceNumber} pushed to ${status} ✅"`);
        }
        
        // 2. Notify Admin
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@repairvafe.com';
        await sendEmail({
          email: adminEmail,
          subject: `ADMIN ALERT: Order #${booking.referenceNumber} Status Changed`,
          message: `Action Registered: The job #${booking.referenceNumber} for ${booking.customerName} has been pushed to: ${status}.\n\nInternal Action Note: ${note || 'No additional metrics'}\nTriggered by: ${req.user ? (req.user.name || 'Admin') : 'System'}`
        });
        
        // 3. Notify Partner Dashboard Context (if Assigned AND action was triggered via Admin)
        if (booking.assignedTechnician && (!req.user || req.user.role === 'admin' || req.user.role === 'superadmin')) {
             // We dispatch an email to the technician alerting them of Administrative pipeline overrides
             const Technician = require('../models/Technician');
             const tech = await Technician.findById(booking.assignedTechnician);
             if (tech) {
                 await sendEmail({
                    email: tech.email,
                    subject: `PARTNER ALERT: Job #${booking.referenceNumber} Pipeline Override`,
                    message: `Hello ${tech.name},\n\nAdministrative oversight has pushed Order #${booking.referenceNumber} to: ${status}.\n\nPlease review your active queue.`
                 });
             }
        }
        
      } catch (triggerErr) {
        console.error('Omnibus Notification trigger exception: ', triggerErr.message);
      }
    }

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

    booking.quotationAmount  = quotationAmount;
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

    res.json({ success: true, data: booking, message: 'Quotation issued successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Approve or reject quotation (customer action)
// @route PUT /api/bookings/:ref/quote-action
// @access Public
exports.quotationAction = async (req, res) => {
  try {
    const { action } = req.body; // 'approve' | 'reject'
    const booking = await Booking.findOne({ referenceNumber: req.params.ref.toUpperCase() });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.quotationStatus !== 'Awaiting Customer Approval' && booking.quotationStatus !== 'Pending')
      return res.status(400).json({ success: false, message: 'Quotation already actioned' });

    const { Lead, LEAD_STAGES } = require('../models/Lead');
    const lead = await Lead.findOne({ bookingReference: booking.referenceNumber });

    if (action === 'approve') {
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
