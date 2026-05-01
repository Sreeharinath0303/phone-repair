const router = require('express').Router();
const {
  register,
  verifyRegistration,
  login,
  verifyLogin,
  forgotPassword,
  resetPassword,
  getMe
} = require('../controllers/customerAuthController');
const { protect } = require('../middleware/auth');

// Registration
router.post('/register', register);
router.post('/verify-registration', verifyRegistration);

// Login
router.post('/login', login);
router.post('/verify-login', verifyLogin);

// Password Reset
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Profile
router.get('/me', protect, getMe);

module.exports = router;
