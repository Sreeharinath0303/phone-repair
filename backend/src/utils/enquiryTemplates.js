/**
 * Generates HTML email templates for different enquiry types.
 */
exports.getEnquiryTemplate = (type, data) => {
  const { name, type: enquiryType, status, responseNotes } = data;
  
  const baseStyle = `
    font-family: 'Inter', sans-serif;
    color: #333;
    line-height: 1.6;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #eee;
    border-radius: 10px;
  `;

  const headerStyle = `
    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
    color: white;
    padding: 20px;
    text-align: center;
    border-radius: 8px 8px 0 0;
    margin: -20px -20px 20px -20px;
  `;

  if (type === 'admin_response') {
    return `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h2>RepairVafe Response</h2>
        </div>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Our team has responded to your <strong>${enquiryType}</strong> enquiry.</p>
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
          <p><strong>Message from RepairVafe:</strong></p>
          <p>${responseNotes}</p>
        </div>
        <p><strong>Current Status:</strong> <span style="text-transform: capitalize;">${status || 'In Progress'}</span></p>
        <p>If you have further questions, please reply to this email or visit our website.</p>
        <br>
        <p>Best regards,<br>The RepairVafe Team</p>
      </div>
    `;
  }

  // Default Receipt Template
  return `
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <h2>Enquiry Received</h2>
      </div>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Thank you for reaching out to RepairVafe. We have successfully received your <strong>${type.toUpperCase()}</strong> enquiry.</p>
      <p>Our team is reviewing your request and will get back to you shortly.</p>
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Enquiry Type:</strong> ${type.toUpperCase()}</p>
        <p><strong>Reference:</strong> ${data._id || 'Pending'}</p>
      </div>
      <p>Need immediate help? Give us a call at +91 99999 88888.</p>
      <br>
      <p>Best regards,<br>The RepairVafe Team</p>
    </div>
  `;
};
