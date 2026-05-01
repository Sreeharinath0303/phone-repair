const router = require('express').Router();
const {
  captureLead,
  markAbandonedLead,
  getLeads,
  sendFollowUp,
  sendPromotionalMessage,
  getPromotionalTemplates,
  updateLeadStage,
  convertToBooking
} = require('../controllers/leadController');
const { protect } = require('../middleware/auth');

router.post('/capture', captureLead);
router.put('/:id/abandon', markAbandonedLead);
router.get('/', protect, getLeads);
router.get('/promo-templates', protect, getPromotionalTemplates);
router.put('/:id/follow-up', protect, sendFollowUp);
router.post('/:id/promotional-message', protect, sendPromotionalMessage);
router.put('/:id/stage', protect, updateLeadStage);
router.post('/:id/convert', protect, convertToBooking);

module.exports = router;
