const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');
const sendEmail = require('../utils/sendEmail');
const Booking = require('../models/Booking');
const { Lead } = require('../models/Lead');
const Technician = require('../models/Technician');
const User = require('../models/User');


// @desc  Get all accounts (Admins, Customers, Partners) with unified filtering
// @route GET /api/admin/accounts
// @access Private (Admin)
exports.getAllAccounts = async (req, res) => {
  try {
    const { search, role, status } = req.query;
    
    // Fetch from all 3 models
    const [admins, customers, partners] = await Promise.all([
      Admin.find({}).select('+isActive +isLocked'),
      User.find({}).select('+isActive +isLocked'),
      Technician.find({}).select('+isActive +isLocked')
    ]);

    // Map to a unified format
    let all = [
      ...admins.map(a => ({ ...a._doc, role: a.role || 'admin', type: 'admin' })),
      ...customers.map(c => ({ ...c._doc, role: 'customer', type: 'customer' })),
      ...partners.map(p => ({ ...p._doc, role: 'partner', type: 'partner' }))
    ];

    // Filter by search (Name, Email)
    if (search) {
      const s = search.toLowerCase();
      all = all.filter(u => 
        (u.name && u.name.toLowerCase().includes(s)) || 
        (u.email && u.email.toLowerCase().includes(s)) ||
        (u.phone && u.phone.includes(s))
      );
    }

    // Filter by role
    if (role) {
      all = all.filter(u => u.role === role || u.type === role);
    }

    // Filter by status
    if (status) {
      if (status === 'locked') all = all.filter(u => u.isLocked);
      else if (status === 'active') all = all.filter(u => u.isActive && !u.isLocked);
      else if (status === 'inactive') all = all.filter(u => !u.isActive);
    }

    // Sort by last login or created date
    all.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    res.json({ success: true, count: all.length, data: all });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
const Feedback = require('../models/Feedback');
const { RepairType, Brand, Model, EmailTemplate, CommunicationSettings, Offer } = require('../models/Settings');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// ─── ADMIN USER MANAGEMENT ─────────────────────────────────
// Get all admins
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({ isActive: true }).select('-password');
    res.json({ success: true, data: admins, total: admins.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Reset/Change password for Admins
exports.resetAdminPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) {
      return res.status(400).json({ success: false, message: 'userId and newPassword required' });
    }
    const adminId = req.user.id;
    const ipAddress = req.ip;

    const user = await Admin.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Account not found' });

    user.password = newPassword;
    await user.save();

    // Step 12: Audit Log
    await AuditLog.create({
      performedBy: adminId,
      performerModel: 'Admin',
      action: 'PASSWORD_RESET_ADMIN',
      entityType: 'Admin',
      entityId: userId,
      description: `Admin reset password for admin: ${user.email}`,
      ipAddress
    });


    // Step 13: Notification
    try {
      if (user.email) {
        await sendEmail({
          email: user.email,
          subject: 'Security Alert: Your Password Has Been Reset',
          message: `Hello ${user.name},\n\nAn administrator has reset your password for security reasons.\n\nYour new temporary password is: ${newPassword}\n\nPlease log in and change your password immediately.\n\nIf you did not expect this, please contact support immediately.`,
          html: `<h3>Security Alert</h3><p>Hello <strong>${user.name}</strong>,</p><p>An administrator has reset your password for security reasons.</p><p>Your new temporary password is: <strong>${newPassword}</strong></p><p>Please log in and change your password immediately.</p><p>If you did not expect this, please contact support immediately.</p>`
        });
      }
    } catch (e) { console.error('Notification failed:', e.message); }

    res.json({ success: true, message: 'Password updated and user notified' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── USER & PARTNER ACCOUNT CONTROLS ───────────────────────
// Step 2 & 3: Reset/Change password for Customer or Partner
exports.manageUserPassword = async (req, res) => {
  try {
    const { id, type, newPassword } = req.body; // type: 'customer' | 'partner'
    if (!id || !newPassword) return res.status(400).json({ success: false, message: 'ID and newPassword required' });

    let account;
    if (type === 'customer') {
      const User = require('../models/User');
      account = await User.findById(id);
    } else {
      account = await Technician.findById(id);
    }

    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    const adminId = req.user.id;
    const ipAddress = req.ip;

    account.password = newPassword;
    await account.save();

    // Step 12: Audit Log
    await AuditLog.create({
      adminId,
      action: 'PASSWORD_RESET_ADMIN',
      targetType: type,
      targetId: id,
      details: `Admin reset password for ${type}: ${account.email || account.phone}`,
      ipAddress
    });

    // Step 13: Notification
    try {
      if (account.email) {
        await sendEmail({
          email: account.email,
          subject: 'Security Alert: Your Password Has Been Reset',
          message: `Hello ${account.name},\n\nAn administrator has reset your password for security reasons.\n\nYour new temporary password is: ${newPassword}\n\nPlease log in and change your password immediately.\n\nIf you did not expect this, please contact support immediately.`,
          html: `<h3>Security Alert</h3><p>Hello <strong>${account.name}</strong>,</p><p>An administrator has reset your password for security reasons.</p><p>Your new temporary password is: <strong>${newPassword}</strong></p><p>Please log in and change your password immediately.</p><p>If you did not expect this, please contact support immediately.</p>`
        });
      }
    } catch (e) { console.error('Notification failed:', e.message); }

    res.json({ success: true, message: `${type} password updated and user notified` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Step 4, 5 & 6: Manage Account Status (Activate/Lock/Force Reset)
exports.updateAccountStatus = async (req, res) => {
  try {
    const { id, type, action } = req.body; // action: 'activate' | 'deactivate' | 'lock' | 'unlock' | 'forceReset'
    if (!id || !action) return res.status(400).json({ success: false, message: 'ID and action required' });

    let account;
    if (type === 'customer') {
      const User = require('../models/User');
      account = await User.findById(id);
    } else {
      account = await Technician.findById(id);
    }

    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    const adminId = req.user.id;
    const ipAddress = req.ip;

    let detailMsg = '';
    switch (action) {
      case 'activate':   account.isActive = true; detailMsg = 'Activated account'; break;
      case 'deactivate': account.isActive = false; detailMsg = 'Deactivated account'; break;
      case 'lock':       account.isLocked = true; account.lockedUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); detailMsg = 'Locked account'; break;
      case 'unlock':     account.isLocked = false; account.lockedUntil = undefined; account.loginAttempts = 0; detailMsg = 'Unlocked account'; break;
      case 'forceReset': account.mustResetPassword = true; detailMsg = 'Forced password reset'; break;
      default: return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    await account.save();

    // Step 12: Audit Log
    await AuditLog.create({
      performedBy: adminId,
      performerModel: 'Admin',
      action: action.toUpperCase(),
      entityType: type === 'customer' ? 'User' : 'Technician',
      entityId: id,
      description: detailMsg,
      ipAddress
    });


    // Step 13: Notification
    try {
      if (account.email) {
        const subjects = {
          activate: 'Your Account Has Been Activated',
          deactivate: 'Your Account Has Been Deactivated',
          lock: 'Security Alert: Your Account Has Been Locked',
          unlock: 'Your Account Has Been Unlocked',
          forceReset: 'Security Action Required: Password Reset'
        };
        const messages = {
          activate: 'Great news! Your account is now active and you can access all features.',
          deactivate: 'Your account has been deactivated by an administrator. Please contact support if you believe this is an error.',
          lock: 'Your account has been locked due to security concerns or suspicious activity. Access is restricted until further notice.',
          unlock: 'Your account has been unlocked. You can now log in normally.',
          forceReset: 'For your security, an administrator requires you to reset your password. You will be prompted to do this on your next login.'
        };

        if (subjects[action]) {
          await sendEmail({
            email: account.email,
            subject: `RepairVafe Security: ${subjects[action]}`,
            message: `Hello ${account.name},\n\n${messages[action]}\n\nBest regards,\nRepairVafe Security Team`,
            html: `<h3>Account Update</h3><p>Hello <strong>${account.name}</strong>,</p><p>${messages[action]}</p><p>Best regards,<br>RepairVafe Security Team</p>`
          });
        }
      }
    } catch (e) { console.error('Notification failed:', e.message); }

    res.json({ success: true, message: `Account status updated: ${action}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create new Customer
exports.createCustomerAccount = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const User = require('../models/User');
    const user = await User.create({ name, email, phone, password, isActive: true });
    
    const { logActivity } = require('../utils/logger');
    await logActivity({
      action: 'CUSTOMER_CREATED_ADMIN',
      entityType: 'User',
      entityId: user._id,
      req,
      description: `Admin created customer account: ${email}`
    });

    res.status(201).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create new Partner
exports.createPartnerAccount = async (req, res) => {
  try {
    const { name, email, phone, password, businessName, city } = req.body;
    const partner = await Technician.create({ name, email, phone, password, businessName, city, isActive: true });
    
    const { logActivity } = require('../utils/logger');
    await logActivity({
      action: 'PARTNER_CREATED_ADMIN',
      entityType: 'Technician',
      entityId: partner._id,
      req,
      description: `Admin created partner account: ${email}`
    });

    res.status(201).json({ success: true, data: partner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create new admin
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, role, permissions } = req.body;
    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const admin = await Admin.create({ name, email, password, role, permissions });
    res.status(201).json({ success: true, data: admin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update admin details
exports.updateAdmin = async (req, res) => {
  try {
    const { name, role, permissions, isActive } = req.body;
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    if (name) admin.name = name;
    if (role) admin.role = role;
    if (permissions) admin.permissions = permissions;
    if (isActive !== undefined) admin.isActive = isActive;

    await admin.save();
    res.json({ success: true, data: admin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete admin
exports.deleteAdmin = async (req, res) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    res.json({ success: true, message: 'Admin account removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update admin
exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const admin = await Admin.findByIdAndUpdate(id, updates, { new: true });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    
    res.json({ success: true, data: admin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete/Deactivate admin
exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await Admin.findByIdAndUpdate(id, { isActive: false });
    res.json({ success: true, message: 'Admin deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── INCOMPLETE LEADS MANAGEMENT ───────────────────────────
// Get incomplete leads (leads without full booking)
exports.getIncompleteLeads = async (req, res) => {
  try {
    const { search, city, state, status } = req.query;
    let filter = {}; // Return all leads (both active and converted) so history is visible

    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (city) filter.city = city;
    if (state) filter.state = state;
    const leads = await Lead.find(filter)
      .populate('assignedTechnician', 'name phone specialization businessName email city state')
      .populate({
        path: 'bookingId',
        populate: {
          path: 'assignedTechnician',
          select: 'name phone specialization businessName email city state'
        }
      })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, data: leads, total: leads.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PARTNER ASSIGNMENT LOGIC ──────────────────────────────
// Step 16: Recommended Partners based on location & specialization
exports.getRecommendedPartners = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.assignmentLockedAt && booking.quotedByPartnerId && String(booking.quotedByPartnerId) !== String(technicianId)) {
      return res.status(403).json({ success: false, message: 'Assignment locked to the quoting partner. Use override-assignment with a reason.' });
    }

    // Match by city and specialization (basic)
    const partners = await Technician.find({
      city: { $regex: new RegExp(booking.city, 'i') },
      isActive: true,
      status: 'available'
    }).limit(10);

    res.json({ success: true, data: partners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ORDER ASSIGNMENT ──────────────────────────────────────
// Assign order to technician
exports.assignOrderToTechnician = async (req, res) => {
  try {
    const { bookingId, technicianId, payoutAmount } = req.body;
    if (!bookingId || !technicianId) {
      return res.status(400).json({ success: false, message: 'bookingId and technicianId required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    // Step 1 & 2: Structural Lock -> Condition Before Assignment
    if (['Completed', 'Delivered', 'Closed', 'Cancelled', 'Rejected'].includes(booking.status)) {
       return res.status(403).json({ success: false, message: 'Assignment restricted: Cannot assign partner to a finalized, cancelled, or rejected booking.' });
    }

    const tech = await Technician.findById(technicianId);
    if (!tech) return res.status(404).json({ success: false, message: 'Technician not found' });

    booking.assignedTechnician = technicianId;
    booking.status = 'Assigned to Partner';
    booking.workflowPhase = 'partner_locked';
    
    // Step 5: Partner Payout Setup
    if (payoutAmount) {
      booking.partnerPayout = payoutAmount;
      booking.partnerPayoutLocked = payoutAmount;
    }

    booking.timeline.push({ 
      stage: 'Assigned to Partner', 
      note: `Order assigned to Service Partner: ${tech.name} (${tech.businessName || 'Independent'}). Partner Commission Pledged: ₹${payoutAmount || 0}.` 
    });
    await booking.save();
    
    // Step 13 & 19: Dynamic Notification Integration
    try {
       const sendEmail = require('../utils/sendEmail');
       
       // 1. Notify Partner
       await sendEmail({
          email: tech.email,
          type: 'assignment',
          data: { 
            partnerName: tech.name, 
            orderId: booking.referenceNumber, 
            customerAddress: `${booking.address}, ${booking.city}`,
            device: `${booking.deviceBrand} ${booking.deviceModel}`
          }
       });
       
       // 2. Notify Customer
       await sendEmail({
          email: booking.customerEmail,
          subject: `Partner Assigned: #${booking.referenceNumber}`,
          message: `Hello ${booking.customerName}, your repair partner ${tech.name} has been assigned.`
       });

       // 3. Admin Alert
       const adminEmail = process.env.ADMIN_EMAIL || 'admin@repairvafe.com';
       await sendEmail({
          email: adminEmail,
          subject: `Partner Assigned: #${booking.referenceNumber}`,
          message: `Partner ${tech.name} assigned to order #${booking.referenceNumber}.`
       });
       
    } catch (e) {
       console.error("Partner assignment omnibus hook fallback skipped:", e.message);
    }

    res.json({ success: true, message: 'Order assigned successfully and partner notified', data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── QUOTATION MANAGEMENT ──────────────────────────────────
exports.setServiceQuote = async (req, res) => {
  try {
    const { bookingId, quotationAmount, description, repairSummary, termsAndConditions, estimatedTime, warrantyPeriod, markupType, markupValue, partnerQuotedAmount } = req.body;
    const amountNum = Number(quotationAmount);
    if (!bookingId || ((!Number.isFinite(amountNum) || amountNum <= 0) && !markupType)) {
      return res.status(400).json({ success: false, message: 'bookingId and quote commercial inputs required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.quotationStatus === 'Approved by Customer') {
      return res.status(400).json({ success: false, message: 'Cannot change quote after customer approval. Create a new order or reset workflow.' });
    }

    const { applyQuoteCommercials } = require('./adminWorkflowController');
    await applyQuoteCommercials(booking, {
      quotationAmount: amountNum,
      markupType,
      markupValue,
      partnerQuotedAmount,
      estimatedTime,
      warrantyPeriod,
      repairSummary,
      termsAndConditions,
      technicianNote: description
    });
    
    // Step 3 Transition Binding
    booking.status = 'Quote Sent To Customer';
    booking.quotationStatus = 'Awaiting Customer Approval';
    booking.timeline.push({ stage: 'Quote Prepared', note: 'Quote module calculation initialized' });
    booking.timeline.push({ 
      stage: 'Quote Sent To Customer',
      note: `Service estimate of Rs ${booking.quotationAmount} verified and dispatched to customer portal.`
    });
    await booking.save();

    // Step 15: Quote Management & Notifications
    try {
      const sendEmail = require('../utils/sendEmail');
      
      // 1. Notify Customer
      await sendEmail({
        email: booking.customerEmail,
        type: 'quotation',
        data: { 
          name: booking.customerName, 
          orderId: booking.referenceNumber, 
          price: booking.quotationAmount,
          device: `${booking.deviceBrand} ${booking.deviceModel}`,
          service: booking.repairTypes.join(', '),
          actionUrl: `http://repairvafe.com/pages/tracking.html?ref=${booking.referenceNumber}`
        }
      });
      
      // 2. Alert Admin
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@repairvafe.com';
      await sendEmail({
         email: adminEmail,
         subject: `Quotation Sent: #${booking.referenceNumber}`,
         message: `Estimate of Rs ${booking.quotationAmount} dispatched for Order #${booking.referenceNumber}.`
      });

    } catch (ignoreErr) {
       console.error('Estimate triggering exception natively bypassed: ', ignoreErr.message);
    }

    res.json({ success: true, message: 'Quote generated and sent successfully', data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Step 11: Create Expiry / Reminder Rules automation execution
exports.triggerQuoteReminders = async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Locate stalled quotes
    const stalledBookings = await Booking.find({
      quotationStatus: 'Awaiting Customer Approval',
      updatedAt: { $lte: twentyFourHoursAgo }
    });

    if (!stalledBookings.length) {
      return res.json({ success: true, message: 'No aged quotes pending reminders found.', count: 0 });
    }

    const sendEmail = require('../utils/sendEmail');
    let triggerCount = 0;

    for (let booking of stalledBookings) {
       try {
         await sendEmail({
           email: booking.customerEmail,
           subject: `REMINDER: Action Required for Repair Estimate #${booking.referenceNumber}`,
           message: `We are waiting for your approval on the repair estimate of ₹${booking.quotationAmount} for your ${booking.deviceBrand} ${booking.deviceModel}. Please approve or reject it from your dashboard. If no action is taken soon, the request may expire.`
         });
         
         booking.timeline.push({ 
             stage: 'Offer Sent', 
             note: 'Automated 24h follow-up reminder dispatched to customer securely.',
             date: new Date()
         });
         // Touches the updatedAt property natively
         await booking.save();
         triggerCount++;
       } catch (e) {
         console.error('Email automation bounce on booking ' + booking._id, e.message);
       }
    }

    res.json({ success: true, message: `Dispatched ${triggerCount} secure follow-up quote reminders successfully.`, count: triggerCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Step 6 & 7: Manual Follow-Up Workflow Logic
exports.saveFollowUp = async (req, res) => {
  try {
    const { bookingId, followUpStatus, followUpNotes } = req.body;
    if (!bookingId) return res.status(400).json({ success: false, message: 'bookingId required' });

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.followUpStatus = followUpStatus;
    if (followUpNotes) booking.followUpNotes = followUpNotes;
    
    // Step 7: Quote Tracking Module Timeline Log
    booking.timeline.push({ 
      stage: booking.status,
      note: `Admin Manual Follow-Up: Status updated to '${followUpStatus}'. Notes: ${followUpNotes || 'No additional metrics'}`,
      date: new Date()
    });
    
    // Explicit condition for Reopened loop
    if (followUpStatus === 'Reopened Quotes') {
       booking.status = 'Pending';
       booking.quotationStatus = 'Pending';
       booking.timeline.push({ stage: 'Pending', note: 'Quote logic reopened by Admin. Re-evaluation initialized.', date: new Date() });
    }

    await booking.save();
    res.json({ success: true, message: 'Follow-Up tracking securely linked', data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Convert lead to booking
exports.convertLeadToBooking = async (req, res) => {
  try {
    const { leadId } = req.body;
    const { Lead, LEAD_STAGES } = require('../models/Lead');
    const lead = await Lead.findById(leadId);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    // Generate reference number
    const ref = 'RV' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);

    // Normalize category
    const category = (lead.deviceCategory || 'smartphone').toLowerCase();
    const validCategories = ['smartphone', 'laptop', 'tablet', 'smartwatch'];
    const finalCategory = validCategories.includes(category) ? category : 'smartphone';

    const booking = await Booking.create({
      referenceNumber: ref,
      customerName: lead.customerName || 'Anonymous Customer',
      customerPhone: lead.mobileNumber || '9999999999',
      customerEmail: lead.email || 'no-email@repairvafe.com',
      serviceType: 'pickup',
      address: lead.address || 'Address not provided',
      city: lead.city || 'Delhi',
      state: lead.state || 'Delhi',
      pincode: lead.pincode || '110001',
      preferredDate: new Date(),
      preferredTimeSlot: 'Anytime',
      deviceCategory: finalCategory,
      deviceBrand: lead.deviceBrand || 'Generic',
      deviceModel: lead.deviceModel || 'Model',
      repairTypes: (lead.repairTypes && lead.repairTypes.length > 0) ? lead.repairTypes : ['General Diagnostics'],
      issueDescription: lead.issueDescription || '',
      assignedTechnician: lead.assignedTechnician || null,
      partnerPayout: lead.partnerPayout || 0,
      status: lead.assignedTechnician ? 'Assigned' : 'Pending',
      convertedFromLead: true
    });

    lead.stage = LEAD_STAGES.CONVERTED_TO_ORDER;
    lead.bookingCompleted = true;
    lead.bookingId = booking._id;
    lead.bookingReference = ref;
    lead.convertedAt = new Date();
    await lead.save();

    res.json({ success: true, message: 'Lead converted to booking successfully', data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Assign lead to technician
exports.assignLeadToTechnician = async (req, res) => {
  try {
    const { leadId, technicianId, payoutAmount } = req.body;
    if (!leadId || !technicianId) {
      return res.status(400).json({ success: false, message: 'leadId and technicianId required' });
    }

    const { Lead } = require('../models/Lead');
    const lead = await Lead.findById(leadId);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const tech = await Technician.findById(technicianId);
    if (!tech) return res.status(404).json({ success: false, message: 'Technician not found' });

    // Update Lead directly
    lead.assignedTechnician = technicianId;
    if (payoutAmount) lead.partnerPayout = payoutAmount;
    
    // If the lead is already converted, assign to its booking too!
    if (lead.bookingId) {
      const booking = await Booking.findById(lead.bookingId);
      if (booking) {
        booking.assignedTechnician = technicianId;
        if (payoutAmount) booking.partnerPayout = payoutAmount;
        // Set status to Assigned to Partner
        booking.status = 'Assigned to Partner';
        booking.timeline.push({
          stage: 'Assigned to Partner',
          note: `Order assigned to Service Partner: ${tech.name} via Lead screen update.`
        });
        await booking.save();
      }
    }
    
    await lead.save();

    // Log activity
    const { logActivity } = require('../utils/logger');
    await logActivity({
      action: 'LEAD_PARTNER_ASSIGNED',
      entityType: 'Lead',
      entityId: lead._id,
      req,
      description: `Lead assigned to partner: ${tech.name}`
    });

    res.json({ success: true, message: 'Lead partner assignment successful', data: lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── FINAL INVOICING MODULE ───────────────────────────────
exports.setFinalInvoice = async (req, res) => {
  try {
    const { bookingId, finalAmount, invoiceNumber } = req.body;
    if (!bookingId || !finalAmount) {
      return res.status(400).json({ success: false, message: 'bookingId and finalAmount required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.finalAmount = finalAmount;
    booking.invoiceNumber = invoiceNumber || `INV-${booking.referenceNumber}`;
    booking.invoiceDate = new Date();
    
    booking.timeline.push({ 
      stage: booking.status, 
      note: `Final Invoice ${booking.invoiceNumber} generated for amount ₹${finalAmount}.`,
      date: new Date()
    });
    
    await booking.save();
    
    // Step 5: Master Billing Notifications
    try {
        const sendEmail = require('../utils/sendEmail');
        await sendEmail({
            email: booking.customerEmail,
            subject: `Final Invoice Generated: ${booking.invoiceNumber}`,
            message: `Hello ${booking.customerName},\n\nYour repair service for ${booking.deviceModel} is complete.\n\nFinal Invoice Details:\nInvoice Number: ${booking.invoiceNumber}\nFinal Amount Due: ₹${finalAmount}\n\nAll standard warranty terms apply based on the replaced parts structurally agreed upon during the Service Estimate phase.\n\nPlease log into your track dashboard to review and complete final validations.\n\nThank you for choosing RepairVafe!`
        });
    } catch (e) {
        console.error("Master Billing exception securely bypassed: ", e.message);
    }
    
    res.json({ success: true, message: 'Final invoice parameters processed and Notification dispatched', data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PARTNER/TECHNICIAN PAYOUT ─────────────────────────────
// Set technician payout
exports.setTechnicianPayout = async (req, res) => {
  try {
    const { technicianId, bookingId, payoutAmount } = req.body;
    if (!technicianId || !bookingId || !payoutAmount) {
      return res.status(400).json({ success: false, message: 'technicianId, bookingId, and payoutAmount required' });
    }

    const tech = await Technician.findById(technicianId);
    if (!tech) return res.status(404).json({ success: false, message: 'Technician not found' });

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.technicianPayment = payoutAmount;
    await booking.save();

    if (!tech.totalEarnings) tech.totalEarnings = 0;
    tech.totalEarnings += payoutAmount;
    tech.recentPayment = { bookingId, amount: payoutAmount, date: new Date() };
    await tech.save();

    res.json({ success: true, message: 'Payout set successfully', data: { booking, tech } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── STATUS UPDATES ────────────────────────────────────────
// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId, status } = req.body;
    if (!bookingId || !status) {
      return res.status(400).json({ success: false, message: 'bookingId and status required' });
    }

    const validStatuses = Booking.schema.path('status').enumValues;
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status pipeline configuration' });
    }

    const booking = await Booking.findByIdAndUpdate(bookingId, { status }, { new: true });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    res.json({ success: true, message: 'Status updated successfully', data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── EMAIL NOTIFICATIONS ──────────────────────────────────
// Send email notification
exports.sendEmailNotification = async (req, res) => {
  try {
    const { recipientEmail, subject, body, bookingId } = req.body;
    if (!recipientEmail || !subject || !body) {
      return res.status(400).json({ success: false, message: 'recipientEmail, subject, body required' });
    }

    const sendEmail = require('../utils/sendEmail');
    await sendEmail({
      email: recipientEmail,
      subject: subject,
      message: body,
      html: body.replace(/\n/g, '<br>') // Basic text to HTML conversion
    });

    res.json({ success: true, message: 'Email sent successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── REPAIR TYPE MANAGEMENT ───────────────────────────────
// Get all repair types
exports.getRepairTypes = async (req, res) => {
  try {
    const { search, category, model, isActive } = req.query;
    let filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (category) filter.category = category;
    if (model) filter.applicableModels = { $in: [model] };
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const types = await RepairType.find(filter).populate('applicableModels', 'name');
    res.json({ success: true, data: types, total: types.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create repair type
exports.createRepairType = async (req, res) => {
  try {
    const { name, description, category, applicableModels, basePrice, basePayout, isActive } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name required' });

    const existing = await RepairType.findOne({ name });
    if (existing) return res.status(400).json({ success: false, message: 'Repair type already exists' });

    const type = await RepairType.create({ 
      name, description, category, applicableModels, basePrice, basePayout,
      isActive: isActive !== undefined ? isActive : true 
    });
    res.status(201).json({ success: true, data: type });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update repair type
exports.updateRepairType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, applicableModels, isActive, basePrice, basePayout } = req.body;

    const type = await RepairType.findByIdAndUpdate(id, { 
      name, description, category, applicableModels, isActive, basePrice, basePayout 
    }, { new: true });
    if (!type) return res.status(404).json({ success: false, message: 'Repair type not found' });

    res.json({ success: true, data: type });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete repair type
exports.deleteRepairType = async (req, res) => {
  try {
    const { id } = req.params;
    const type = await RepairType.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!type) return res.status(404).json({ success: false, message: 'Repair type not found' });

    res.json({ success: true, message: 'Repair type deleted', data: type });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── BRAND MANAGEMENT ─────────────────────────────────────
// Get all brands
exports.getBrands = async (req, res) => {
  try {
    const { search, category, isActive } = req.query;
    let filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const brands = await Brand.find(filter).sort({ name: 1 });
    res.json({ success: true, data: brands, total: brands.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create brand
exports.createBrand = async (req, res) => {
  try {
    const { name, category } = req.body;
    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Brand name and category are required' });
    }

    const existing = await Brand.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) return res.status(400).json({ success: false, message: `Brand "${name}" already exists` });

    const brand = await Brand.create({ name, category });
    res.status(201).json({ success: true, data: brand });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update brand
exports.updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, isActive } = req.body;
    const brand = await Brand.findByIdAndUpdate(id, { name, category, isActive }, { new: true });
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
    res.json({ success: true, data: brand });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete brand (soft delete)
exports.deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
    res.json({ success: true, message: 'Brand deactivated', data: brand });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── MODEL MANAGEMENT ─────────────────────────────────────
// Get all models
exports.getModels = async (req, res) => {
  try {
    const { search, brand, category, isActive } = req.query;
    let filter = {};
    
    if (search) {
      // Find brands that match the search first to include in filter
      const matchingBrands = await Brand.find({ name: { $regex: search, $options: 'i' } }).select('_id');
      const brandIds = matchingBrands.map(b => b._id);
      
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $in: brandIds } }
      ];
    }
    
    if (brand) filter.brand = brand;
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const models = await Model.find(filter).populate('brand').sort({ name: 1 });
    res.json({ success: true, data: models, total: models.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update model
exports.updateModel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, brand, category, isActive } = req.body;
    const model = await Model.findByIdAndUpdate(id, { name, brand, category, isActive }, { new: true });
    if (!model) return res.status(404).json({ success: false, message: 'Model not found' });
    res.json({ success: true, data: model });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete model (soft delete)
exports.deleteModel = async (req, res) => {
  try {
    const { id } = req.params;
    const model = await Model.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!model) return res.status(404).json({ success: false, message: 'Model not found' });
    res.json({ success: true, message: 'Model deactivated', data: model });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete email template
exports.deleteEmailTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await EmailTemplate.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, message: 'Template deactivated', data: template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get admin feedback analytics
exports.getFeedbackAnalytics = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    const total = feedbacks.length;
    const avgRating = total
      ? (feedbacks.reduce((s, f) => s + f.overallRating, 0) / total).toFixed(1)
      : 0;
    const fiveStar = feedbacks.filter(f => f.overallRating === 5).length;
    const oneStar = feedbacks.filter(f => f.overallRating <= 2).length;
    const recommend = feedbacks.filter(f => f.wouldRecommend === 'yes').length;
    const recommendRate = total ? ((recommend / total) * 100).toFixed(0) : 0;

    // Pending feedback (Completed bookings without feedback)
    const feedbackRefs = feedbacks.map(f => f.referenceNumber);
    const pendingFeedback = await Booking.find({
      status: { $in: ['Completed', 'Delivered', 'Closed'] },
      referenceNumber: { $nin: feedbackRefs }
    }).select('referenceNumber customerName deviceBrand deviceModel createdAt').limit(50);

    res.json({
      success: true,
      data: {
        feedbacks,
        stats: { total, avgRating, fiveStar, oneStar, recommendRate },
        pendingFeedback
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create model
exports.createModel = async (req, res) => {
  try {
    const { name, brand, category, isActive } = req.body;
    if (!name || !brand || !category) {
      return res.status(400).json({ success: false, message: 'Model name, brand, and category are required' });
    }

    // Step 16: Check for duplicate models under same brand
    const existing = await Model.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }, 
      brand 
    });
    if (existing) return res.status(400).json({ success: false, message: `Model "${name}" already exists for this brand` });

    const model = await Model.create({ name, brand, category, isActive: isActive !== undefined ? isActive : true });
    res.status(201).json({ success: true, data: model });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── EMAIL TEMPLATE MANAGEMENT ────────────────────────────
// Get all email templates
exports.getEmailTemplates = async (req, res) => {
  try {
    const templates = await EmailTemplate.find();
    res.json({ success: true, data: templates, total: templates.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create email template
exports.createEmailTemplate = async (req, res) => {
  try {
    const { name, subject, header, body, footer, ctaText, ctaLink, variables, type } = req.body;
    if (!name || !subject || !body || !type) {
      return res.status(400).json({ success: false, message: 'name, subject, body, and type required' });
    }

    const existing = await EmailTemplate.findOne({ name });
    if (existing) return res.status(400).json({ success: false, message: 'Template already exists' });

    const template = await EmailTemplate.create({ name, subject, header, body, footer, ctaText, ctaLink, variables, type });
    res.status(201).json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update email template
exports.updateEmailTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, header, body, footer, ctaText, ctaLink, isActive } = req.body;

    const template = await EmailTemplate.findByIdAndUpdate(id, { 
      subject, header, body, footer, ctaText, ctaLink, isActive, 
      updatedAt: Date.now() 
    }, { new: true });
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });

    res.json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Preview email template with mock data
exports.previewTemplate = async (req, res) => {
  try {
    const { templateId, mockData } = req.body;
    const template = await EmailTemplate.findById(templateId);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });

    const { getEmailTemplate } = require('../utils/emailTemplates');
    const { html } = await getEmailTemplate(template.type, mockData || {});
    
    res.json({ success: true, html });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Send test email
exports.sendTestEmail = async (req, res) => {
  try {
    const { templateId, testEmail } = req.body;
    const template = await EmailTemplate.findById(templateId);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });

    const sendEmail = require('../utils/sendEmail');
    await sendEmail({
      email: testEmail,
      type: template.type,
      data: { customerName: 'Test Admin', orderId: 'RV-TEST-999', brand: 'Apple', model: 'iPhone Test' }
    });

    res.json({ success: true, message: 'Test email sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── COMMUNICATION SETTINGS ───────────────────────────────
// Get communication settings
exports.getCommunicationSettings = async (req, res) => {
  try {
    let settings = await CommunicationSettings.findOne();
    if (!settings) {
      settings = await CommunicationSettings.create({});
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update communication settings
exports.updateCommunicationSettings = async (req, res) => {
  try {
    const updates = req.body;
    let settings = await CommunicationSettings.findOne();
    if (!settings) {
      settings = await CommunicationSettings.create(updates);
    } else {
      Object.assign(settings, updates);
      settings.updatedAt = new Date();
      await settings.save();
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── OFFERS/PROMOTIONS MANAGEMENT ──────────────────────────
// Get all offers
exports.getOffers = async (req, res) => {
  try {
    const offers = await Offer.find().sort({ createdAt: -1 });
    res.json({ success: true, data: offers, total: offers.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create offer
exports.createOffer = async (req, res) => {
  try {
    const { code, description, discountType, discountValue, maxUses, minOrderValue, applicableCategories, startDate, endDate } = req.body;
    if (!code || !discountType || !discountValue || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    const existing = await Offer.findOne({ code: code.toUpperCase() });
    if (existing) return res.status(400).json({ success: false, message: 'Offer code already exists' });

    const offer = await Offer.create({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      maxUses,
      minOrderValue,
      applicableCategories,
      startDate,
      endDate
    });

    res.status(201).json({ success: true, data: offer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update offer
exports.updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const offer = await Offer.findByIdAndUpdate(id, updates, { new: true });
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });

    res.json({ success: true, data: offer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete offer
exports.deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findByIdAndDelete(id);
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    res.json({ success: true, message: 'Offer deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DATA EXPORT ────────────────────────────────────────────
// Export orders/bookings data
exports.exportBookings = async (req, res) => {
  try {
    const { format, startDate, endDate } = req.query;

    let filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(filter).populate('assignedTechnician', 'name businessName phone email specialization').lean();

    // Implement CSV/JSON export
    if (format === 'csv') {
      // Convert to CSV
      const csv = convertToCSV(bookings);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=bookings.csv');
      res.send(csv);
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=bookings.json');
      res.send(JSON.stringify(bookings, null, 2));
    } else {
      res.json({ success: true, data: bookings });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  const columns = ['referenceNumber', 'customerName', 'customerPhone', 'deviceBrand', 'deviceModel', 'status', 'quotationAmount', 'discount', 'createdAt'];
  const header = columns.join(',');
  const rows = data.map(obj => columns.map(col => {
    let val = obj[col] ?? '';
    if (col === 'createdAt') val = new Date(val).toLocaleDateString();
    return `"${String(val).replace(/"/g, '""')}"`;
  }).join(','));
  return [header, ...rows].join('\n');
}

// ─── DASHBOARD ANALYTICS ──────────────────────────────────
// Get full analytics/dashboard stats
exports.getAnalytics = async (req, res) => {
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

    // Step 9: Location Analytics Module
    const stateWise = await Booking.aggregate([
      { $group: { _id: '$state', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const cityWise = await Booking.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const regionWise = await Booking.aggregate([
      { $group: { _id: '$pincode', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Location source breakdown (gps / ip / manual)
    const locationSources = await Booking.aggregate([
      { $group: { _id: '$locationSource', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Bookings that have GPS coordinates
    const gpsBookings = await Booking.find(
      { latitude: { $ne: null }, longitude: { $ne: null } },
      { referenceNumber: 1, latitude: 1, longitude: 1, city: 1, state: 1 }
    ).limit(200);

    // Financial Master Tracker Loop
    const financialResult = await Booking.aggregate([
      { $match: { status: { $in: ['Completed', 'Closed', 'Delivered'] } } },
      { $group: { 
         _id: null, 
         grossRevenue: { $sum: { $ifNull: ["$finalAmount", "$quotationAmount"] } },
         totalPayouts: { $sum: "$partnerPayout" }
      }}
    ]);
    
    const grossRevenue = financialResult[0]?.grossRevenue || 0;
    const totalPayouts = financialResult[0]?.totalPayouts || 0;
    const netProfit = grossRevenue - totalPayouts;

    // Conversion Engine Analytics
    const leadsConverted = await Lead.countDocuments({ bookingCompleted: true });
    const leadConversionRate = totalLeads ? ((leadsConverted / totalLeads) * 100).toFixed(1) : 0;

    const totalQuotesIssued = await Booking.countDocuments({ quotationStatus: { $ne: 'Not Issued' } });
    const quotesApproved = await Booking.countDocuments({ quotationStatus: 'Approved by Customer' });
    const quoteConversionRate = totalQuotesIssued ? ((quotesApproved / totalQuotesIssued) * 100).toFixed(1) : 0;

    // Monthly Trends (Last 6 Months)
    const monthlyTrends = await Booking.aggregate([
      { $match: { createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 5)) } } },
      { $group: { _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const statusDistributed = await Booking.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const brandDistributed = await Booking.aggregate([
      { $group: { _id: "$deviceBrand", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    const activeOrders = assignedOrders + ongoingRepairs;

    res.json({
      success: true,
      data: {
        totalLeads,
        incompleteLeads,
        totalBookings,
        pendingQuotations,
        approvedQuotations,
        assignedOrders,
        ongoingRepairs,
        completedRepairs,
        cancelledOrders,
        activeOrders,
        totalRevenue: grossRevenue,
        feedbackPending,
        partnerWise: partnerWisePopulated,
        stateWise,
        cityWise,
        regionWise,
        financials: {
          grossRevenue,
          totalPayouts,
          netProfit
        },
        conversions: {
          totalLeads,
          leadsConverted,
          leadConversionRate,
          totalQuotesIssued,
          quotesApproved,
          quoteConversionRate
        },
        monthlyTrends,
        statusDistributed,
        brandDistributed,
        locationSources,
        gpsBookings,
        customers: await Booking.distinct('customerEmail').then(e => e.length),
        technicians: await Technician.countDocuments({ isActive: true })
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── SEARCH/FILTER ────────────────────────────────────────
// Advanced search
exports.advancedSearch = async (req, res) => {
  try {
    const { type, location, state, city, status, brand, model, repairType } = req.query;

    if (type === 'bookings') {
      let filter = {};
      if (city) filter.city = city;
      if (state) filter.state = state;
      if (status) filter.status = status;
      if (brand) filter.deviceBrand = brand;
      if (model) filter.deviceModel = model;
      if (repairType) filter.repairTypes = { $in: [repairType] };

      const results = await Booking.find(filter).limit(50);
      return res.json({ success: true, data: results, total: results.length });
    }

    if (type === 'leads') {
      let filter = {};
      if (city) filter.city = city;
      if (state) filter.state = state;
      if (status) filter.stage = status;

      const results = await Lead.find(filter).limit(50);
      return res.json({ success: true, data: results, total: results.length });
    }

    res.status(400).json({ success: false, message: 'Invalid search type' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── LOCATION ANALYTICS (Steps 6-9, 12) ──────────────────────
// Step 6 & 7: Full location analytics with filtering support
exports.getLocationAnalytics = async (req, res) => {
  try {
    const { state, city, pincode, startDate, endDate } = req.query;
    let match = {};
    if (state)   match.state   = { $regex: state, $options: 'i' };
    if (city)    match.city    = { $regex: city,  $options: 'i' };
    if (pincode) match.pincode = pincode;
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate)   match.createdAt.$lte = new Date(endDate);
    }

    // Step 8: City-wise demand analysis
    const cityWise = await Booking.aggregate([
      { $match: match },
      { $group: { _id: '$city', count: { $sum: 1 }, revenue: { $sum: '$quotationAmount' }, states: { $addToSet: '$state' } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    // Step 9: State-wise (region) service volume
    const stateWise = await Booking.aggregate([
      { $match: match },
      { $group: { _id: '$state', count: { $sum: 1 }, revenue: { $sum: '$quotationAmount' }, cities: { $addToSet: '$city' } } },
      { $sort: { count: -1 } }
    ]);

    // Pincode / region breakdown
    const pincodeWise = await Booking.aggregate([
      { $match: match },
      { $group: { _id: '$pincode', count: { $sum: 1 }, city: { $first: '$city' }, state: { $first: '$state' } } },
      { $sort: { count: -1 } },
      { $limit: 30 }
    ]);

    // Step 11: GPS-tagged bookings for map view (admin only)
    const mapPoints = await Booking.find(
      { ...match, latitude: { $ne: null }, longitude: { $ne: null } },
      { referenceNumber: 1, latitude: 1, longitude: 1, city: 1, state: 1, status: 1, customerName: 1 }
    ).limit(500).lean();

    // Location source breakdown
    const locationSourceStats = await Booking.aggregate([
      { $match: match },
      { $group: { _id: '$locationSource', count: { $sum: 1 } } }
    ]);

    // Summary totals
    const total = await Booking.countDocuments(match);
    const uniqueCities  = await Booking.distinct('city',  match);
    const uniqueStates  = await Booking.distinct('state', match);
    const uniquePincodes = await Booking.distinct('pincode', match);

    res.json({
      success: true,
      data: {
        summary: { total, uniqueCities: uniqueCities.length, uniqueStates: uniqueStates.length, uniquePincodes: uniquePincodes.length },
        cityWise,
        stateWise,
        pincodeWise,
        mapPoints,
        locationSourceStats
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Step 12: Filter orders by location (state / city / pincode)
exports.getOrdersByLocation = async (req, res) => {
  try {
    const { state, city, pincode, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (state)   filter.state   = { $regex: state,   $options: 'i' };
    if (city)    filter.city    = { $regex: city,    $options: 'i' };
    if (pincode) filter.pincode = pincode;
    if (status)  filter.status  = status;

    const total = await Booking.countDocuments(filter);
    const orders = await Booking.find(filter)
      .populate('assignedTechnician', 'name city state phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('referenceNumber customerName customerPhone deviceBrand deviceModel status city state pincode latitude longitude locationSource assignedTechnician quotationAmount createdAt');

    res.json({ success: true, total, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Step 13: Get full location detail for a single order (role-based)
exports.getOrderLocationDetail = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('assignedTechnician', 'name city state pincode phone serviceAreas');
    if (!booking) return res.status(404).json({ success: false, message: 'Order not found' });

    const role = req.user?.role;
    const isTechnician = req.user?.constructor?.modelName === 'Technician';

    // Step 14: Role-Based Access — partner sees only assigned job location, not full coords
    if (isTechnician) {
      return res.json({
        success: true,
        data: {
          referenceNumber: booking.referenceNumber,
          serviceType: booking.serviceType,
          address: booking.address,
          city: booking.city,
          state: booking.state,
          pincode: booking.pincode,
          // No lat/lng for partners — privacy protection
        }
      });
    }

    // Admin: full location data
    res.json({
      success: true,
      data: {
        referenceNumber: booking.referenceNumber,
        customerName: booking.customerName,
        serviceType: booking.serviceType,
        address: booking.address,
        city: booking.city,
        state: booking.state,
        pincode: booking.pincode,
        latitude: booking.latitude,
        longitude: booking.longitude,
        ipCity: booking.ipCity,
        locationSource: booking.locationSource,
        assignedTechnician: booking.assignedTechnician
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Step 10: Nearby Partner Assignment — find partners matching customer location
exports.getNearbyPartners = async (req, res) => {
  try {
    const { bookingId } = req.query;
    if (!bookingId) return res.status(400).json({ success: false, message: 'bookingId required' });

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const { city, state, pincode, deviceBrand, deviceCategory } = booking;

    // Priority 1: Same city + supports brand/category
    const sameCityPartners = await Technician.find({
      isActive: true,
      $or: [
        { city: { $regex: city, $options: 'i' } },
        { serviceAreas: { $elemMatch: { $regex: city, $options: 'i' } } }
      ]
    }).select('name businessName city state phone specialization supportedBrands serviceAreas completedRepairs averageRating payoutBalance');

    // Priority 2: Same state (broader)
    const sameStatePartners = await Technician.find({
      isActive: true,
      state: { $regex: state, $options: 'i' },
      city: { $not: { $regex: city, $options: 'i' } } // exclude already in city
    }).select('name businessName city state phone specialization supportedBrands serviceAreas completedRepairs averageRating payoutBalance').limit(10);

    // Score partners: city match = 10pts, brand match = 5pts, category match = 3pts
    const score = (p) => {
      let s = 0;
      if (p.city?.toLowerCase().includes(city.toLowerCase())) s += 10;
      if (p.serviceAreas?.some(a => a.toLowerCase().includes(city.toLowerCase()))) s += 8;
      if (p.supportedBrands?.some(b => b.toLowerCase() === (deviceBrand || '').toLowerCase())) s += 5;
      if (p.specialization?.toLowerCase().includes((deviceCategory || '').toLowerCase())) s += 3;
      s += (p.completedRepairs || 0) * 0.1;
      s += (p.averageRating || 0) * 2;
      return s;
    };

    const ranked = [...sameCityPartners, ...sameStatePartners]
      .map(p => ({ ...p.toObject(), matchScore: score(p) }))
      .sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      success: true,
      data: {
        bookingLocation: { city, state, pincode },
        partners: ranked,
        cityMatches: sameCityPartners.length,
        stateMatches: sameStatePartners.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Step 18: Search and Filter for Notifications
exports.getNotificationLogs = async (req, res) => {
  try {
     const { eventType, recipient, channel, deliveryStatus, date } = req.query;
     let filter = {};

     if (eventType) filter.eventName = { $regex: eventType, $options: 'i' };
     if (recipient) filter.recipient = { $regex: recipient, $options: 'i' };
     if (channel) filter.channel = channel;
     if (deliveryStatus) filter.deliveryStatus = deliveryStatus;
     
     if (date) {
        // Simple distinct day string match boundary logic
        const start = new Date(date);
        start.setHours(0,0,0,0);
        const end = new Date(date);
        end.setHours(23,59,59,999);
        filter.sentAt = { $gte: start, $lte: end };
     }

     const NotificationLog = require('../models/NotificationLog');
     const logs = await NotificationLog.find(filter).sort({ sentAt: -1 }).limit(100);
     
     res.json({ success: true, data: logs, total: logs.length });
  } catch (err) {
     res.status(500).json({ success: false, message: err.message });
  }
};

// ─── AUDIT LOGS MANAGEMENT ──────────────────────────────
// ─── FEEDBACK MANAGEMENT ───────────────────────────────────
// Step 14: View all feedback
exports.getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({})
      .populate('orderId', 'referenceNumber deviceBrand deviceModel')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: feedback.length, data: feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Step 7, 8, 9: Admin Log Viewer with Filtering
exports.getAuditLogs = async (req, res) => {
  try {
    const { action, role, orderId, startDate, endDate, page = 1, limit = 50 } = req.query;
    const query = {};

    if (action) query.action = action;
    if (role) query.performerRole = role;
    if (orderId) {
      if (mongoose.Types.ObjectId.isValid(orderId)) {
        query.$or = [{ entityId: orderId }, { entityType: 'Booking' }];
      } else {
        const b = await Booking.findOne({ referenceNumber: orderId.toUpperCase() });
        if (b) query.entityId = b._id;
      }
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Step 10: Detailed Log View
exports.getAuditLogDetails = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate('performedBy', 'name email');
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });
    res.json({ success: true, data: log });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Step 12: Ensure logs are immutable (No Update/Delete APIs provided)
// Step 14: Role-Based Access for Audit Logs (Users/Partners viewing their own logs)
exports.getMyAuditLogs = async (req, res) => {
  try {
    const query = {
      performedBy: req.user._id,
      performerModel: req.user.constructor.modelName || 'User'
    };

    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
