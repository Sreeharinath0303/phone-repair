const { CommunicationSettings, Offer } = require('../models/Settings');

// @desc    Get communication settings
// @route   GET /api/admin/settings/communication
// @access  Private/Admin
exports.getCommunicationSettings = async (req, res) => {
  try {
    let settings = await CommunicationSettings.findOne();
    if (!settings) {
      settings = await CommunicationSettings.create({
        emailNotifications: true,
        smsNotifications: false,
        slackWebhookAlerts: true,
        slackWebhookUrl: 'https://hooks.slack.com/services/...'
      });
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
    const { code, discountPercentage, description, expiryDate } = req.body;
    
    const offer = await Offer.create({
      code,
      discountValue: discountPercentage,
      discountType: 'percentage',
      description,
      startDate: new Date(),
      endDate: new Date(expiryDate),
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
    const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
