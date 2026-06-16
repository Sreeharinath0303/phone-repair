const express = require('express');
const router = express.Router();
const PartnerApplication = require('../models/PartnerApplication');

// @route   POST /api/partners/apply
// @desc    Submit a partner application
// @access  Public
router.post('/apply', async (req, res) => {
  try {
    const { 
      name, businessName, email, phone, address, city, state, pincode, 
      specialization, serviceAreas, experienceYears 
    } = req.body;

    // Check if email or phone already applied
    const existing = await PartnerApplication.findOne({ 
      $or: [{ email }, { phone }] 
    });

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'An application with this email or phone already exists.' 
      });
    }

    // Convert serviceAreas string to array if needed
    let parsedServiceAreas = [];
    if (typeof serviceAreas === 'string') {
      parsedServiceAreas = serviceAreas.split(',').map(s => s.trim()).filter(s => s);
    } else if (Array.isArray(serviceAreas)) {
      parsedServiceAreas = serviceAreas;
    }

    const newApp = new PartnerApplication({
      name,
      businessName,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      specialization,
      serviceAreas: parsedServiceAreas,
      experienceYears: Number(experienceYears) || 0
    });

    await newApp.save();

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully. Our team will review and contact you shortly.'
    });
  } catch (error) {
    console.error('Error submitting partner application:', error);
    res.status(500).json({ success: false, message: 'Server error during submission' });
  }
});

module.exports = router;
