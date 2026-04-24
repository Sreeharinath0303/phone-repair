const router = require('express').Router();
const {
  captureLead,
  markAbandonedLead,
  getLeads,
  sendFollowUp,
  sendPromotionalMessage,
  getPromotionalTemplates,
  updateLeadStage
} = require('../controllers/leadController');
const { protect } = require('../middleware/auth');

router.post('/capture', captureLead);
router.put('/:id/abandon', markAbandonedLead);
router.get('/', protect, getLeads);
router.get('/promo-templates', protect, getPromotionalTemplates);
router.put('/:id/follow-up', protect, sendFollowUp);
router.post('/:id/promotional-message', protect, sendPromotionalMessage);
router.put('/:id/stage', protect, updateLeadStage);

module.exports = router;
