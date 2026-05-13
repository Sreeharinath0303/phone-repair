const { EmailTemplate } = require('../models/Settings');

/**
 * Generates an email HTML string using dynamic templates from the database
 * or falls back to a hardcoded default if the template is not found.
 */
const getEmailTemplate = async (type, data = {}) => {
  let template = null;
  try {
    template = await EmailTemplate.findOne({ type, isActive: true });
  } catch (err) {
    console.error('Error fetching email template from DB:', err.message);
  }

  // Base Style
  const baseStyle = `
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1f2937;
    line-height: 1.6;
    max-width: 600px;
    margin: 0 auto;
    padding: 0;
    background-color: #ffffff;
  `;

  const containerStyle = `
    padding: 40px 20px;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  `;

  // Function to replace placeholders like {{customerName}}
  const replacePlaceholders = (text, data) => {
    if (!text) return '';
    return text.replace(/\{\{(.+?)\}\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  };

  if (template) {
    const subject = replacePlaceholders(template.subject, data);
    const header = replacePlaceholders(template.header, data);
    const body = replacePlaceholders(template.body, data);
    const footer = replacePlaceholders(template.footer, data);
    const ctaText = replacePlaceholders(template.ctaText, data);
    const ctaLink = replacePlaceholders(template.ctaLink, data);

    const ctaHtml = ctaText ? `
      <div style="text-align: center; margin: 40px 0;">
        <a href="${ctaLink}" style="background: #6366f1; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block;">${ctaText}</a>
      </div>` : '';

    return {
      subject,
      html: `
        <div style="${baseStyle}">
          <div style="${containerStyle}">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #6366f1; margin: 0; font-size: 24px;">${header || 'RepairVafe'}</h1>
              <div style="height: 2px; background: linear-gradient(90deg, #6366f1, #8b5cf6); margin-top: 15px; border-radius: 1px;"></div>
            </div>
            <div style="font-size: 16px; color: #374151;">
              ${body.split('\n').map(p => `<p>${p}</p>`).join('')}
            </div>
            ${ctaHtml}
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f3f4f6; font-size: 13px; color: #6b7280; text-align: center;">
              ${footer || '<p>© 2026 RepairVafe. Premium Device Repairs.</p>'}
            </div>
          </div>
        </div>
      `
    };
  }

  // FALLBACK to hardcoded defaults if no DB template found
  // (Old switch-case logic adapted to return {subject, html})
  // I'll keep a simplified fallback here
  const defaultHeader = `<h2 style="color: #6366f1; margin: 0;">RepairVafe Update</h2>`;
  let defaultBody = `<p>Hello ${data.name || 'Customer'},</p><p>We have an update regarding your request.</p>`;
  let defaultSubject = 'RepairVafe Notification';

  if (type === 'otp') {
    defaultSubject = 'Your Verification Code | RepairVafe';
    defaultBody = `<p>Your one-time password (OTP) is: <strong style="font-size: 24px; color: #111827;">${data.otp}</strong></p>`;
  } else if (type === 'quotation') {
    defaultSubject = `Quotation for Order #${data.orderId}`;
    defaultBody = `<p>Your estimate is ready: <strong>₹${data.price}</strong> for ${data.service}.</p>`;
  }

  return {
    subject: defaultSubject,
    html: `
      <div style="${baseStyle}">
        <div style="${containerStyle}">
          <div style="text-align:center;margin-bottom:30px">${defaultHeader}</div>
          <div style="font-size:16px">${defaultBody}</div>
          <div style="margin-top:40px;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#888;text-align:center">© 2026 RepairVafe</div>
        </div>
      </div>
    `
  };
};

module.exports = { getEmailTemplate };
