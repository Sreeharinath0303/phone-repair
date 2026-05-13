const router = require('express').Router();
const {
  register,
  verifyRegistration,
  login,
  requestMobileOtp,
  verifyMobileOtp,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe
} = require('../controllers/customerAuthController');
const { protect } = require('../middleware/auth');

// Email Registration
router.post('/register', register);
router.post('/verify-registration', verifyRegistration);

// Email Login
router.post('/login', login);

// Mobile OTP Auth (Steps 3 & 5)
router.post('/mobile-otp', requestMobileOtp);
router.post('/verify-mobile-otp', verifyMobileOtp);

// Password Management
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/change-password', protect, changePassword);

// Profile
router.get('/me', protect, getMe);

module.exports = router;
