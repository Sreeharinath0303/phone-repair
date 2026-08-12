const { EmailTemplate } = require('../models/Settings');

const BASE_STYLE = `
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1f2937;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
  padding: 0;
  background-color: #ffffff;
`;

const CONTAINER_STYLE = `
  padding: 40px 20px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
`;

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const replacePlaceholders = (text, data = {}) => {
  if (!text) return '';

  return String(text).replace(/\{\{(.+?)\}\}/g, (match, key) => {
    const normalizedKey = String(key || '').trim();
    return data[normalizedKey] !== undefined ? data[normalizedKey] : match;
  });
};

const getActionButtonStyle = (variant) => {
  if (variant === 'success') {
    return 'background:#10b981;color:#ffffff;';
  }
  if (variant === 'danger') {
    return 'background:#ffffff;color:#dc2626;border:1px solid #fecaca;';
  }
  return 'background:#6366f1;color:#ffffff;';
};

const renderStoredTemplate = (template, data = {}) => {
  const subject = replacePlaceholders(template.subject, data);
  const header = replacePlaceholders(template.header, data);
  const body = replacePlaceholders(template.body, data);
  const footer = replacePlaceholders(template.footer, data);
  const ctaText = replacePlaceholders(template.ctaText, data);
  const ctaLink = replacePlaceholders(template.ctaLink, data);
  const extraActions = Array.isArray(data.additionalActions) ? data.additionalActions : [];

  const ctaHtml = ctaText
    ? `
      <div style="text-align:center; margin:40px 0 0;">
        <a href="${escapeHtml(ctaLink)}" style="background:#6366f1;color:#ffffff;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;">${escapeHtml(ctaText)}</a>
      </div>`
    : '';

  const actionsHtml = extraActions.length
    ? `
      <div style="text-align:center; margin:20px 0 10px;">
        ${extraActions.map((action) => `
          <a href="${escapeHtml(action.href)}" style="${getActionButtonStyle(action.variant)}padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;margin:8px 6px;">
            ${escapeHtml(action.label)}
          </a>
        `).join('')}
      </div>
    `
    : '';

  return {
    subject,
    html: `
      <div style="${BASE_STYLE}">
        <div style="${CONTAINER_STYLE}">
          <div style="text-align:center; margin-bottom:30px;">
            <h1 style="color:#6366f1; margin:0; font-size:24px;">${header || 'eRepaircafe'}</h1>
            <div style="height:2px; background:linear-gradient(90deg, #6366f1, #8b5cf6); margin-top:15px; border-radius:1px;"></div>
          </div>
          <div style="font-size:16px; color:#374151;">
            ${body.split('\n').map((paragraph) => `<p>${paragraph}</p>`).join('')}
          </div>
          ${ctaHtml}
          ${actionsHtml}
          <div style="margin-top:40px; padding-top:20px; border-top:1px solid #f3f4f6; font-size:13px; color:#6b7280; text-align:center;">
            ${footer || '<p>Copyright 2026 eRepaircafe. All rights reserved. India.</p>'}
          </div>
        </div>
      </div>
    `
  };
};

const getEmailTemplate = async (type, data = {}) => {
  let template = null;
  try {
    template = await EmailTemplate.findOne({ type, isActive: true });
  } catch (err) {
    console.error('Error fetching email template from DB:', err.message);
  }

  if (template) {
    return renderStoredTemplate(template, data);
  }

  const defaultHeader = `<h2 style="color:#6366f1; margin:0;">eRepaircafe Update</h2>`;
  let defaultBody = `<p>Hello ${data.name || data.customerName || 'Customer'},</p><p>We have an update regarding your request.</p>`;
  let defaultSubject = 'eRepaircafe Notification';

  if (type === 'otp') {
    defaultSubject = 'Your Verification Code | eRepaircafe';
    defaultBody = `<p>Your one-time password (OTP) is: <strong style="font-size:24px; color:#111827;">${data.otp}</strong></p>`;
  } else if (type === 'quotation') {
    defaultSubject = `Quotation for Order #${data.orderId}`;
    defaultBody = `<p>Your estimate is ready: <strong>${data.quotationAmount || data.price || 'Rs 0'}</strong> for ${data.repairType || data.service || 'your repair request'}.</p>`;
  }

  return {
    subject: defaultSubject,
    html: `
      <div style="${BASE_STYLE}">
        <div style="${CONTAINER_STYLE}">
          <div style="text-align:center; margin-bottom:30px;">${defaultHeader}</div>
          <div style="font-size:16px">${defaultBody}</div>
          <div style="margin-top:40px; padding-top:20px; border-top:1px solid #eee; font-size:12px; color:#888; text-align:center;">Copyright 2026 eRepaircafe. All rights reserved. India.</div>
        </div>
      </div>
    `
  };
};

module.exports = { getEmailTemplate, renderStoredTemplate, replacePlaceholders };
