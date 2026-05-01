const router = require('express').Router();
const { login, register, getMe, forgotPassword, verifyOTP, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login',           login);
router.post('/register',        register);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp',      verifyOTP);
router.post('/reset-password',  resetPassword);

router.get('/me',               protect, getMe);

module.exports = router;
