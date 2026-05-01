const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
  // Admin Management
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  resetPassword,
  // Leads
  getIncompleteLeads,
  convertLeadToBooking,
  // Orders
  assignOrderToTechnician,
  // Quotations
  setServiceQuote,
  triggerQuoteReminders,
  saveFollowUp,
  setFinalInvoice,
  // Technician Payout
  setTechnicianPayout,
  // Status Updates
  updateBookingStatus,
  // Notifications
  sendEmailNotification,
  // Repair Types
  getRepairTypes,
  createRepairType,
  updateRepairType,
  deleteRepairType,
  // Brands
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  // Models
  getModels,
  createModel,
  updateModel,
  deleteModel,
  // Email Templates
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  // Communication Settings
  getCommunicationSettings,
  updateCommunicationSettings,
  // Offers
  getOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  // Data Export
  exportBookings,
  // Analytics
  getAnalytics,
  // Feedback Analytics
  getFeedbackAnalytics,
  // Search
  advancedSearch,
  // Notification Logs
  getNotificationLogs,
  // Location Intelligence
  getLocationAnalytics,
  getOrdersByLocation,
  getOrderLocationDetail,
  getNearbyPartners
} = require('../controllers/adminController');

const {
  getAllCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerHistory,
  resetCustomerPassword
} = require('../controllers/adminUserController');

const {
  getAllPartners,
  createPartner,
  updatePartner,
  deletePartner,
  managePayout,
  resetPartnerPassword,
  getPartnerPerformance
} = require('../controllers/adminPartnerController');

// Protect all routes with authentication
router.use(protect);

// ─── PARTNER MANAGEMENT ────────────────────────────────────
router.get('/partners', authorize('admin', 'superadmin'), getAllPartners);
router.post('/partners', authorize('admin', 'superadmin'), createPartner);
router.put('/partners/:id', authorize('admin', 'superadmin'), updatePartner);
router.delete('/partners/:id', authorize('admin', 'superadmin'), deletePartner);
router.post('/partners/:id/payout', authorize('admin', 'superadmin'), managePayout);
router.post('/partners/:id/reset-password', authorize('admin', 'superadmin'), resetPartnerPassword);
router.get('/partners/:id/performance', authorize('admin', 'superadmin'), getPartnerPerformance);

// ─── ADMIN USER MANAGEMENT ─────────────────────────────────
router.get('/admins', authorize('superadmin'), getAllAdmins);
router.post('/admins', authorize('superadmin'), createAdmin);
router.put('/admins/:id', authorize('superadmin'), updateAdmin);
router.delete('/admins/:id', authorize('superadmin'), deleteAdmin);
router.post('/reset-password', authorize('superadmin'), resetPassword);

// ─── CUSTOMER MANAGEMENT ───────────────────────────────────
router.get('/customers', getAllCustomers);
router.post('/customers', createCustomer);
router.put('/customers/:id', updateCustomer);
router.delete('/customers/:id', deleteCustomer);
router.get('/customers/:email/history', getCustomerHistory);
router.post('/customers/:id/reset-password', resetCustomerPassword);

// ─── INCOMPLETE LEADS ──────────────────────────────────────
router.get('/incomplete-leads', getIncompleteLeads);
router.post('/convert-lead', convertLeadToBooking);

// ─── ORDER MANAGEMENT ──────────────────────────────────────
router.post('/assign-order', authorize('admin', 'superadmin'), assignOrderToTechnician);

// ─── QUOTATION MANAGEMENT ──────────────────────────────────
router.post('/set-quote', setServiceQuote);
router.post('/trigger-quote-reminders', authorize('admin', 'superadmin'), triggerQuoteReminders);
router.post('/save-follow-up', authorize('admin', 'superadmin'), saveFollowUp);

// ─── INVOICE MANAGEMENT ──────────────────────────────────
router.post('/set-invoice', authorize('admin', 'superadmin'), setFinalInvoice);

// ─── TECHNICIAN PAYOUT ────────────────────────────────────
router.post('/set-payout', setTechnicianPayout);

// ─── STATUS UPDATES ───────────────────────────────────────
router.put('/update-status', updateBookingStatus);

// ─── EMAIL NOTIFICATIONS ──────────────────────────────────
router.post('/send-email', sendEmailNotification);

// ─── REPAIR TYPES ─────────────────────────────────────────
router.get('/repair-types', getRepairTypes);
router.post('/repair-types', createRepairType);
router.put('/repair-types/:id', updateRepairType);
router.delete('/repair-types/:id', deleteRepairType);

// ─── BRANDS ────────────────────────────────────────────────
router.get('/brands', getBrands);
router.post('/brands', createBrand);
router.put('/brands/:id', updateBrand);
router.delete('/brands/:id', deleteBrand);

// ─── MODELS ────────────────────────────────────────────────
router.get('/models', getModels);
router.post('/models', createModel);
router.put('/models/:id', updateModel);
router.delete('/models/:id', deleteModel);

// ─── EMAIL TEMPLATES ──────────────────────────────────────
router.get('/email-templates', getEmailTemplates);
router.post('/email-templates', createEmailTemplate);
router.put('/email-templates/:id', updateEmailTemplate);
router.delete('/email-templates/:id', deleteEmailTemplate);

// ─── COMMUNICATION SETTINGS ───────────────────────────────
router.get('/communication-settings', getCommunicationSettings);
router.put('/communication-settings', updateCommunicationSettings);

// ─── OFFERS/PROMOTIONS ────────────────────────────────────
router.get('/offers', getOffers);
router.post('/offers', createOffer);
router.put('/offers/:id', updateOffer);
router.delete('/offers/:id', deleteOffer);

// ─── DATA EXPORT ───────────────────────────────────────────
router.get('/export/bookings', exportBookings);

// ─── ANALYTICS ────────────────────────────────────────────
router.get('/analytics', getAnalytics);

// ─── FEEDBACK ANALYTICS ───────────────────────────────────
router.get('/feedback-analytics', getFeedbackAnalytics);

// ─── ADVANCED SEARCH ───────────────────────────────────────
router.get('/search', advancedSearch);

// ─── NOTIFICATION LOGS ────────────────────────────────────
router.get('/notification-logs', getNotificationLogs);

// ─── LOCATION INTELLIGENCE (Steps 6-14) ───────────────────
router.get('/location-analytics',     getLocationAnalytics);
router.get('/orders-by-location',     getOrdersByLocation);
router.get('/orders/:id/location',    getOrderLocationDetail);
router.get('/nearby-partners',        authorize('admin', 'superadmin'), getNearbyPartners);

module.exports = router;
