const router = require('express').Router();
const { submitFeedback, getAllFeedback, getFeedbackByRef } = require('../controllers/feedbackController');
const { protect } = require('../middleware/auth');

router.post('/',         submitFeedback);
router.get('/',  protect, getAllFeedback);
router.get('/:ref',      getFeedbackByRef);

module.exports = router;
