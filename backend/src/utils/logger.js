const AuditLog = require('../models/AuditLog');

/**
 * Logs an activity to the database.
 * @param {Object} params - Activity details
 * @param {string} params.action - Action name (e.g., 'BOOKING_UPDATED')
 * @param {string} params.entityType - Collection name ('Booking', 'User', etc.)
 * @param {string} params.entityId - ID of the record being acted upon
 * @param {Object} [params.req] - Express request object to extract user and metadata
 * @param {string} [params.description] - Human readable description
 * @param {any} [params.prev] - Previous state
 * @param {any} [params.updated] - New state
 */
exports.logActivity = async ({ action, entityType, entityId, req, description, prev, updated }) => {
  try {
    const logData = {
      action,
      entityType,
      entityId,
      description,
      previousValue: prev,
      updatedValue: updated
    };

    if (req) {
      logData.ipAddress = req.ip;
      logData.userAgent = req.get('user-agent');
      
      if (req.user) {
        logData.performedBy = req.user._id;
        logData.performerModel = req.user.constructor.modelName || 'User';
        logData.performerRole = req.user.role || (logData.performerModel === 'Technician' ? 'partner' : 'customer');
      }
    }

    await AuditLog.create(logData);
  } catch (err) {
    console.error('Audit Logging failed:', err.message);
  }
};
