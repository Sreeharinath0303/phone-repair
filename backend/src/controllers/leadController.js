const mongoose = require('mongoose');
const { Lead, LEAD_STAGES } = require('../models/Lead');

function normalizePhone(phone = '') {
  return String(phone).replace(/\s+/g, '').trim();
}

function isValidPhone(phone = '') {
  return /^\+?[0-9]{10,15}$/.test(normalizePhone(phone));
}

function hasAdditionalDetails(payload) {
  const fields = [
    payload.email,
    payload.address,
    payload.city,
    payload.state,
    payload.pincode,
    payload.deviceCategory,
    payload.deviceBrand,
    payload.deviceModel
  ];
  return fields.some(value => String(value || '').trim()) || (Array.isArray(payload.repairTypes) && payload.repairTypes.length > 0);
}

function pushStageHistory(lead, stage, note = '') {
  if (!Array.isArray(lead.stageHistory)) lead.stageHistory = [];
  lead.stageHistory.push({ stage, note, changedAt: new Date() });
}

const PROMO_TEMPLATES = Object.freeze({
  complete_booking: 'Complete your repair booking',
  discount_screen_replacement: 'Discount on screen replacement',
  pickup_available: 'Pickup available in your city',
  request_pending: 'Your device service request is pending'
});

exports.captureLead = async (req, res) => {
  try {
    const {
      customerName,
      mobileNumber,
      email,
      address,
      city,
      state,
      pincode,
      deviceCategory,
      deviceBrand,
      deviceModel,
      repairTypes
    } = req.body;

    const name = String(customerName || '').trim();
    const rawMobile = String(mobileNumber || '').trim();
    const normalizedMobile = normalizePhone(rawMobile);

    if (!name) return res.status(400).json({ success: false, message: 'customerName is required' });
    if (!isValidPhone(rawMobile)) return res.status(400).json({ success: false, message: 'Invalid mobile number format' });

    const nextStage = hasAdditionalDetails({
      email, address, city, state, pincode, deviceCategory, deviceBrand, deviceModel, repairTypes
    }) ? LEAD_STAGES.INCOMPLETE_BOOKING : LEAD_STAGES.NEW_LEAD;

    const updates = {
      customerName: name,
      mobileNumber: rawMobile,
      normalizedMobile,
      email: String(email || '').trim(),
      address: String(address || '').trim(),
      city: String(city || '').trim(),
      state: String(state || '').trim(),
      pincode: String(pincode || '').trim(),
      deviceCategory: String(deviceCategory || '').trim(),
      deviceBrand: String(deviceBrand || '').trim(),
      deviceModel: String(deviceModel || '').trim(),
      repairTypes: Array.isArray(repairTypes) ? repairTypes : [],
      source: 'website',
      bookingCompleted: false,
      abandonedAt: null,
      lostAt: null,
      lastActivityAt: new Date()
    };

    let lead = await Lead.findOne({ normalizedMobile, bookingCompleted: false }).sort({ updatedAt: -1 });
    if (lead) {
      Object.assign(lead, updates);
      if (lead.stage !== nextStage) {
        lead.stage = nextStage;
        pushStageHistory(lead, nextStage, 'Lead updated via customer booking flow');
      }
      await lead.save();
    } else {
      lead = await Lead.create({
        ...updates,
        stage: nextStage,
        stageHistory: [{ stage: nextStage, note: 'Lead captured from website form' }]
      });

      // Step 3 & 4: Event Trigger Engine - Lead Created Alert
      try {
         const sendEmail = require('../utils/sendEmail');
         
         // 1. WhatsApp/SMS Mock Trigger
         console.log(`[WHATSAPP API DISPATCH] -> Messaging +91${normalizedMobile}: "Hello ${name}! We received your erepaircafe inquiry. Complete your booking online!"`);

         // 2. Admin Alert Trigger
         const adminEmail = process.env.ADMIN_EMAIL || 'erepaircafe2010@gmail.com';
         await sendEmail({
             email: adminEmail,
             subject: `[EVENT] New Lead Created: ${name}`,
             message: `An event was triggered: LEAD CAPTURED.\n\nCustomer: ${name}\nPhone: ${rawMobile}\nIntent: ${deviceBrand || 'General'} ${deviceModel || 'Inquiry'}\n\nPlease review in the Admin Notification Dashboard.`
         });
      } catch(e) {
         console.error('Lead Event Trigger Error:', e.message);
      }
    }

    return res.status(201).json({
      success: true,
      data: { leadId: lead._id, stage: lead.stage },
      message: 'Lead captured'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.markAbandonedLead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid lead id' });
    }

    const lead = await Lead.findById(id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    if (lead.bookingCompleted || lead.stage === LEAD_STAGES.CONVERTED_TO_ORDER) {
      return res.json({ success: true, data: lead, message: 'Lead already converted' });
    }

    lead.stage = LEAD_STAGES.INCOMPLETE_BOOKING;
    lead.abandonedAt = new Date();
    lead.lastActivityAt = new Date();
    pushStageHistory(lead, LEAD_STAGES.INCOMPLETE_BOOKING, 'Customer exited before final booking submit');
    await lead.save();

    return res.json({
      success: true,
      data: { leadId: lead._id, stage: lead.stage },
      message: 'Lead marked as incomplete booking'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLeads = async (req, res) => {
  try {
    const { stage, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (stage) query.stage = stage;
    if (search) {
      query.$or = [
        { customerName: new RegExp(search, 'i') },
        { mobileNumber: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { bookingReference: new RegExp(search, 'i') }
      ];
    }

    const total = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .sort({ updatedAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return res.json({ success: true, total, page: Number(page), data: leads });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.sendFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid lead id' });
    }
    const lead = await Lead.findById(id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    if (lead.stage === LEAD_STAGES.CONVERTED_TO_ORDER) {
      return res.status(400).json({ success: false, message: 'Lead already converted to order' });
    }

    lead.stage = LEAD_STAGES.FOLLOW_UP_SENT;
    lead.followUpSentAt = new Date();
    lead.lastActivityAt = new Date();
    pushStageHistory(lead, LEAD_STAGES.FOLLOW_UP_SENT, 'Follow-up sent by admin');
    await lead.save();

    return res.json({ success: true, data: { leadId: lead._id, stage: lead.stage }, message: 'Follow-up stage updated' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.sendPromotionalMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { channel = 'sms', templateKey = '', message = '' } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid lead id' });
    }
    if (!['email', 'sms', 'whatsapp'].includes(channel)) {
      return res.status(400).json({ success: false, message: 'Invalid channel. Use email, sms, or whatsapp.' });
    }

    const lead = await Lead.findById(id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const templateMessage = templateKey ? PROMO_TEMPLATES[templateKey] : '';
    const finalMessage = String(message || templateMessage || '').trim();
    if (!finalMessage) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    if (!Array.isArray(lead.followUpMessages)) lead.followUpMessages = [];
    lead.followUpMessages.push({
      channel,
      templateKey,
      message: finalMessage,
      sentAt: new Date(),
      sentBy: req.user?._id || null
    });

    lead.stage = LEAD_STAGES.FOLLOW_UP_SENT;
    lead.followUpSentAt = new Date();
    lead.lastActivityAt = new Date();
    pushStageHistory(lead, LEAD_STAGES.FOLLOW_UP_SENT, `Promotional ${channel.toUpperCase()} follow-up sent`);
    await lead.save();

    return res.json({
      success: true,
      data: { leadId: lead._id, stage: lead.stage, lastMessage: finalMessage, channel },
      message: 'Promotional follow-up saved successfully'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPromotionalTemplates = async (req, res) => {
  return res.json({
    success: true,
    data: Object.entries(PROMO_TEMPLATES).map(([key, text]) => ({ key, text }))
  });
};

exports.updateLeadStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid lead id' });
    }
    if (!Object.values(LEAD_STAGES).includes(stage)) {
      return res.status(400).json({ success: false, message: 'Invalid lead stage' });
    }

    const lead = await Lead.findById(id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    lead.stage = stage;
    lead.lastActivityAt = new Date();
    if (stage === LEAD_STAGES.FOLLOW_UP_SENT) lead.followUpSentAt = new Date();
    if (stage === LEAD_STAGES.LOST_INACTIVE) lead.lostAt = new Date();
    if (stage === LEAD_STAGES.BOOKING_COMPLETED || stage === LEAD_STAGES.CONVERTED_TO_ORDER) {
      lead.bookingCompleted = true;
      if (!lead.convertedAt) lead.convertedAt = new Date();
    }
    pushStageHistory(lead, stage, String(note || '').trim() || 'Stage updated by admin');
    await lead.save();

    return res.json({ success: true, data: { leadId: lead._id, stage: lead.stage }, message: 'Lead stage updated' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.convertToBooking = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid lead id' });
    }

    const lead = await Lead.findById(id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    if (lead.bookingCompleted) {
      return res.status(400).json({ success: false, message: 'Lead already converted to booking' });
    }

    // Import Booking controller or use the model directly to create a booking
    const Booking = require('../models/Booking');
    
    // Create a basic booking from lead data
    // Note: Some fields might be missing in a lead, we'll use defaults or leave them empty
    const bookingData = {
      deviceCategory: lead.deviceCategory || 'smartphone',
      deviceBrand: lead.deviceBrand || 'Unknown',
      deviceModel: lead.deviceModel || 'Unknown',
      repairTypes: lead.repairTypes.length > 0 ? lead.repairTypes : ['General Service'],
      customerName: lead.customerName,
      customerPhone: lead.mobileNumber,
      customerEmail: lead.email || 'customer@example.com',
      serviceType: 'pickup', // Default
      address: lead.address || 'Not Provided',
      city: lead.city || 'Not Provided',
      state: lead.state || 'Not Provided',
      pincode: lead.pincode || '000000',
      preferredDate: new Date(),
      preferredTimeSlot: 'Anytime',
      status: 'Pending',
      timeline: [{ stage: 'Booking Created', note: 'Lead converted to booking by admin.' }]
    };

    const booking = await Booking.create(bookingData);

    // Update lead
    lead.bookingCompleted = true;
    lead.stage = LEAD_STAGES.CONVERTED_TO_ORDER;
    lead.bookingId = booking._id;
    lead.bookingReference = booking.referenceNumber;
    lead.convertedAt = new Date();
    lead.lastActivityAt = new Date();
    pushStageHistory(lead, LEAD_STAGES.CONVERTED_TO_ORDER, 'Lead converted to booking manually by admin');
    await lead.save();

    return res.json({
      success: true,
      data: { booking, lead },
      message: 'Lead successfully converted to booking'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

