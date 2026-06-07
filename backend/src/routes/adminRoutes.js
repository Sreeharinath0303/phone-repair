const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
  // Admin Management
  getAllAdmins,
  createAdmin,
  createCustomerAccount,
  createPartnerAccount,
  getAllAccounts,
  updateAdmin,
  deleteAdmin,
  resetAdminPassword,
  manageUserPassword,
  updateAccountStatus,
  // Leads
  getIncompleteLeads,
  convertLeadToBooking,
  assignLeadToTechnician,
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
  previewTemplate,
  sendTestEmail,
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
  // Feedback
  getAllFeedback,
  // Audit Logs
  getAuditLogs,
  getAuditLogDetails,
  getMyAuditLogs,
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
const {
  requestPartnerQuotes,
  getPartnerQuotesForBooking,
  getBookingIncidents,
  selectPartnerQuote,
  reviewPartnerIncident,
  overrideAssignment
} = require('../controllers/adminWorkflowController');

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
router.post('/partner-quotes/request', authorize('admin', 'superadmin'), requestPartnerQuotes);
router.get('/partner-quotes/:bookingId', authorize('admin', 'superadmin'), getPartnerQuotesForBooking);
router.get('/booking-incidents/:bookingId', authorize('admin', 'superadmin'), getBookingIncidents);
router.post('/partner-quotes/:id/select', authorize('admin', 'superadmin'), selectPartnerQuote);
router.post('/bookings/:id/incident-review', authorize('admin', 'superadmin'), reviewPartnerIncident);
router.post('/bookings/:id/override-assignment', authorize('admin', 'superadmin'), overrideAssignment);

// ─── ADMIN USER MANAGEMENT ─────────────────────────────────
router.get('/admins', authorize('superadmin'), getAllAdmins);
router.post('/admins', authorize('superadmin'), createAdmin);
router.put('/admins/:id', authorize('superadmin'), updateAdmin);
router.delete('/admins/:id', authorize('superadmin'), deleteAdmin);
router.post('/admins/reset-password', authorize('superadmin'), resetAdminPassword);
router.get('/accounts', authorize('admin', 'superadmin'), getAllAccounts);
router.post('/accounts/manage-password', authorize('admin', 'superadmin'), manageUserPassword);
router.post('/accounts/update-status', authorize('admin', 'superadmin'), updateAccountStatus);

// ─── CUSTOMER MANAGEMENT ───────────────────────────────────
router.get('/customers', authorize('admin', 'superadmin'), getAllCustomers);
router.post('/customers', authorize('admin', 'superadmin'), createCustomer);
router.put('/customers/:id', authorize('admin', 'superadmin'), updateCustomer);
router.delete('/customers/:id', authorize('admin', 'superadmin'), deleteCustomer);
router.get('/customers/:email/history', authorize('admin', 'superadmin'), getCustomerHistory);
router.post('/customers/:id/reset-password', authorize('admin', 'superadmin'), resetCustomerPassword);

// ─── INCOMPLETE LEADS ──────────────────────────────────────
router.get('/incomplete-leads', authorize('admin', 'superadmin'), getIncompleteLeads);
router.post('/convert-lead', authorize('admin', 'superadmin'), convertLeadToBooking);
router.post('/assign-lead', authorize('admin', 'superadmin'), assignLeadToTechnician);

// ─── ORDER MANAGEMENT ──────────────────────────────────────
router.post('/assign-order', authorize('admin', 'superadmin'), assignOrderToTechnician);

// ─── QUOTATION MANAGEMENT ──────────────────────────────────
router.post('/set-quote', authorize('admin', 'superadmin'), setServiceQuote);
router.post('/trigger-quote-reminders', authorize('admin', 'superadmin'), triggerQuoteReminders);
router.post('/save-follow-up', authorize('admin', 'superadmin'), saveFollowUp);

// ─── INVOICE MANAGEMENT ──────────────────────────────────
router.post('/set-invoice', authorize('admin', 'superadmin'), setFinalInvoice);

// ─── TECHNICIAN PAYOUT ────────────────────────────────────
router.post('/set-payout', authorize('admin', 'superadmin'), setTechnicianPayout);

// ─── STATUS UPDATES ───────────────────────────────────────
router.put('/update-status', authorize('admin', 'superadmin'), updateBookingStatus);

// ─── EMAIL NOTIFICATIONS ──────────────────────────────────
router.post('/send-email', authorize('admin', 'superadmin'), sendEmailNotification);

// ─── REPAIR TYPES ─────────────────────────────────────────
router.get('/repair-types', getRepairTypes); // Public for booking
router.post('/repair-types', authorize('admin', 'superadmin'), createRepairType);
router.put('/repair-types/:id', authorize('admin', 'superadmin'), updateRepairType);
router.delete('/repair-types/:id', authorize('admin', 'superadmin'), deleteRepairType);

// ─── BRANDS ────────────────────────────────────────────────
router.get('/brands', getBrands); // Public for booking
router.post('/brands', authorize('admin', 'superadmin'), createBrand);
router.put('/brands/:id', authorize('admin', 'superadmin'), updateBrand);
router.delete('/brands/:id', authorize('admin', 'superadmin'), deleteBrand);

// ─── MODELS ────────────────────────────────────────────────
router.get('/models', getModels); // Public for booking
router.post('/models', authorize('admin', 'superadmin'), createModel);
router.put('/models/:id', authorize('admin', 'superadmin'), updateModel);
router.delete('/models/:id', authorize('admin', 'superadmin'), deleteModel);

// ─── EMAIL TEMPLATES ──────────────────────────────────────
router.get('/email-templates', authorize('admin', 'superadmin'), getEmailTemplates);
router.post('/email-templates', authorize('admin', 'superadmin'), createEmailTemplate);
router.put('/email-templates/:id', authorize('admin', 'superadmin'), updateEmailTemplate);
router.delete('/email-templates/:id', authorize('admin', 'superadmin'), deleteEmailTemplate);
router.post('/preview-template', authorize('admin', 'superadmin'), previewTemplate);
router.post('/send-test-email', authorize('admin', 'superadmin'), sendTestEmail);

// ─── COMMUNICATION SETTINGS ───────────────────────────────
router.get('/communication-settings', authorize('admin', 'superadmin'), getCommunicationSettings);
router.put('/communication-settings', authorize('admin', 'superadmin'), updateCommunicationSettings);

// ─── OFFERS/PROMOTIONS ────────────────────────────────────
router.get('/offers', authorize('admin', 'superadmin'), getOffers);
router.post('/offers', authorize('admin', 'superadmin'), createOffer);
router.put('/offers/:id', authorize('admin', 'superadmin'), updateOffer);
router.delete('/offers/:id', authorize('admin', 'superadmin'), deleteOffer);

// ─── REGISTRATION ─────────────────────────────────────────
router.post('/customers/register', authorize('admin', 'superadmin'), createCustomerAccount);
router.post('/partners/register', authorize('admin', 'superadmin'), createPartnerAccount);

// ─── DATA EXPORT ───────────────────────────────────────────
router.get('/export/bookings', authorize('admin', 'superadmin'), exportBookings);

// ─── ANALYTICS ────────────────────────────────────────────
router.get('/analytics', authorize('admin', 'superadmin'), getAnalytics);

// ─── FEEDBACK ─────────────────────────────────────────────
router.get('/feedback', authorize('admin', 'superadmin'), getAllFeedback);
router.get('/feedback-analytics', authorize('admin', 'superadmin'), getFeedbackAnalytics);

// ─── ADVANCED SEARCH ───────────────────────────────────────
router.get('/search', authorize('admin', 'superadmin'), advancedSearch);

// ─── NOTIFICATION LOGS ────────────────────────────────────
router.get('/notification-logs', authorize('admin', 'superadmin'), getNotificationLogs);

// ─── LOCATION INTELLIGENCE (Steps 6-14) ───────────────────
router.get('/location-analytics',     authorize('admin', 'superadmin'), getLocationAnalytics);
router.get('/orders-by-location',     authorize('admin', 'superadmin'), getOrdersByLocation);
router.get('/orders/:id/location',    authorize('admin', 'superadmin'), getOrderLocationDetail);
router.get('/nearby-partners',        authorize('admin', 'superadmin'), getNearbyPartners);

// ─── AUDIT LOGS ──────────────────────────────────────────
router.get('/audit-logs',           authorize('admin', 'superadmin'), getAuditLogs);
router.get('/audit-logs/:id',       authorize('admin', 'superadmin'), getAuditLogDetails);
router.get('/my-audit-logs',        protect, getMyAuditLogs);

module.exports = router;
