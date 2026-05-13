const express = require('express');
const router = express.Router();
const { login, getMe, updateProfile, updatePassword } = require('../controllers/technicianAuthController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/update-password', protect, updatePassword);

module.exports = router;
