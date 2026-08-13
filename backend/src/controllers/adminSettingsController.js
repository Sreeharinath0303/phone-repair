const { CommunicationSettings, Offer } = require('../models/Settings');
const DEFAULT_WHATSAPP_PHONE = '919148136086';

const normalizeOfferPayload = (body = {}) => {
  const parsedCategories = Array.isArray(body.applicableCategories)
    ? body.applicableCategories
    : String(body.applicableCategories || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

  const discountType = body.discountType === 'fixed' ? 'fixed' : 'percentage';
  const discountValue = Number(body.discountValue ?? body.discountPercentage ?? 0);
  const maxUses = body.maxUses === '' || body.maxUses === null || body.maxUses === undefined
    ? null
    : Number(body.maxUses);
  const minOrderValue = Number(body.minOrderValue ?? 0);

  return {
    code: String(body.code || '').trim().toUpperCase(),
    description: String(body.description || '').trim(),
    discountType,
    discountValue,
    maxUses,
    minOrderValue,
    applicableCategories: parsedCategories,
    startDate: body.startDate ? new Date(body.startDate) : null,
    endDate: body.endDate ? new Date(body.endDate) : null,
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : true
  };
};

const validateOfferPayload = (payload) => {
  if (!payload.code) return 'Offer code is required';
  if (!payload.description) return 'Offer description is required';
  if (!payload.startDate || Number.isNaN(payload.startDate.getTime())) return 'Valid start date is required';
  if (!payload.endDate || Number.isNaN(payload.endDate.getTime())) return 'Valid end date is required';
  if (payload.endDate < payload.startDate) return 'End date must be after start date';
  if (!Number.isFinite(payload.discountValue) || payload.discountValue <= 0) return 'Discount value must be greater than zero';
  if (payload.discountType === 'percentage' && payload.discountValue > 100) return 'Percentage discount cannot exceed 100';
  if (payload.maxUses !== null && (!Number.isInteger(payload.maxUses) || payload.maxUses <= 0)) return 'Max uses must be a positive whole number';
  if (!Number.isFinite(payload.minOrderValue) || payload.minOrderValue < 0) return 'Minimum order value cannot be negative';
  return '';
};

// @desc    Get communication settings
// @route   GET /api/admin/settings/communication
// @access  Private/Admin
exports.getCommunicationSettings = async (req, res) => {
  try {
    let settings = await CommunicationSettings.findOne();
    
    const defaults = {
      facebookLink: 'https://www.facebook.com/share/192QskMjUo/',
      instagramLink: 'https://www.instagram.com/erepaircafe?igsh=MWV6Z242eDl5MXl0cg==',
      youtubeLink: 'https://youtube.com/@erepaircafe?si=XyuvL8OX4-Jjj2Wl',
      trustpilotLink: 'https://www.trustpilot.com/review/erepaircafe.com',
      linkedinLink: 'https://www.linkedin.com/company/erepaircafe/',
      twitterLink: 'https://x.com/ErepairCafe',
      googleSearchLink: 'https://www.google.com/search?kgmid=%2Fg%2F11hz37hgnj&hl=en-IN&q=eRepairCafe%20-%20Mobile%20Repair%20%26%20Phone%20Screen%20Repair%20Specialized&shem=epsd1%2Cltac%2Crimspwouoe&shndl=30&source=sh%2Fx%2Floc%2Fosrp%2Fm1%2F2&kgs=0832192f0912660b',
      whatsappLink: `https://api.whatsapp.com/send?phone=${DEFAULT_WHATSAPP_PHONE}`,
      showCompletedRepairsInFeedbackSection: true
    };

    if (!settings) {
      settings = await CommunicationSettings.create({
        emailNotifications: true,
        smsNotifications: false,
        slackWebhookAlerts: true,
        slackWebhookUrl: 'https://hooks.slack.com/services/...',
        ...defaults
      });
    } else {
      let needsSave = false;
      for (const [key, val] of Object.entries(defaults)) {
        if (settings[key] === undefined) {
          settings[key] = val;
          needsSave = true;
        }
      }
      if (needsSave) {
        await settings.save();
      }
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching communication settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update communication settings
// @route   PUT /api/admin/settings/communication
// @access  Private/Admin
exports.updateCommunicationSettings = async (req, res) => {
  try {
    let settings = await CommunicationSettings.findOne();
    if (!settings) {
      settings = new CommunicationSettings(req.body);
    } else {
      settings.emailNotifications = req.body.emailNotifications;
      settings.smsNotifications = req.body.smsNotifications;
      settings.slackWebhookAlerts = req.body.slackWebhookAlerts;
      settings.slackWebhookUrl = req.body.slackWebhookUrl;
      if (req.body.showCompletedRepairsInFeedbackSection !== undefined) {
        settings.showCompletedRepairsInFeedbackSection = Boolean(req.body.showCompletedRepairsInFeedbackSection);
      }
      
      // Update social links if provided in the body
      if (req.body.facebookLink !== undefined) settings.facebookLink = req.body.facebookLink;
      if (req.body.instagramLink !== undefined) settings.instagramLink = req.body.instagramLink;
      if (req.body.youtubeLink !== undefined) settings.youtubeLink = req.body.youtubeLink;
      if (req.body.trustpilotLink !== undefined) settings.trustpilotLink = req.body.trustpilotLink;
      if (req.body.linkedinLink !== undefined) settings.linkedinLink = req.body.linkedinLink;
      if (req.body.twitterLink !== undefined) settings.twitterLink = req.body.twitterLink;
      if (req.body.googleSearchLink !== undefined) settings.googleSearchLink = req.body.googleSearchLink;
      if (req.body.whatsappLink !== undefined) settings.whatsappLink = req.body.whatsappLink;
    }
    await settings.save();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error updating communication settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get offers
// @route   GET /api/admin/settings/offers
// @access  Private/Admin
exports.getOffers = async (req, res) => {
  try {
    const offers = await Offer.find().sort('-createdAt');
    res.json({ success: true, data: offers });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create offer
// @route   POST /api/admin/settings/offers
// @access  Private/Admin
exports.createOffer = async (req, res) => {
  try {
    const payload = normalizeOfferPayload(req.body);
    const validationError = validateOfferPayload(payload);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const existing = await Offer.findOne({ code: payload.code });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Offer code already exists' });
    }

    const offer = await Offer.create({
      code: payload.code,
      description: payload.description,
      discountType: payload.discountType,
      discountValue: payload.discountValue,
      maxUses: payload.maxUses,
      minOrderValue: payload.minOrderValue,
      applicableCategories: payload.applicableCategories,
      startDate: payload.startDate,
      endDate: payload.endDate,
      isActive: payload.isActive
    });

    res.status(201).json({ success: true, data: offer });
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update offer
// @route   PUT /api/admin/settings/offers/:id
// @access  Private/Admin
exports.updateOffer = async (req, res) => {
  try {
    const payload = normalizeOfferPayload(req.body);
    const validationError = validateOfferPayload(payload);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const offer = await Offer.findByIdAndUpdate(
      req.params.id,
      {
        code: payload.code,
        description: payload.description,
        discountType: payload.discountType,
        discountValue: payload.discountValue,
        maxUses: payload.maxUses,
        minOrderValue: payload.minOrderValue,
        applicableCategories: payload.applicableCategories,
        startDate: payload.startDate,
        endDate: payload.endDate,
        isActive: payload.isActive,
        updatedAt: new Date()
      },
      { new: true }
    );
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    res.json({ success: true, data: offer });
  } catch (error) {
    console.error('Error updating offer:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete offer
// @route   DELETE /api/admin/settings/offers/:id
// @access  Private/Admin
exports.deleteOffer = async (req, res) => {
  try {
    await Offer.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting offer:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
