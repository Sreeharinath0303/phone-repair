const { CommunicationSettings, Offer } = require('../models/Settings');

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
      whatsappLink: 'https://wa.me/message/N6IZQBNEIYG7O1'
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
