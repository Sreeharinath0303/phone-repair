const NotificationTemplates = {
    // Step 12: Email Template Management
    EMAIL: {
        NEW_BOOKING: { subject: "Booking Received: {{Order_ID}}", template: "Hello {{Customer_Name}},\nWe received your repair booking for your {{Device_Brand}}. Your reference ID is {{Order_ID}}." },
        ORDER_CONFIRMED: { subject: "Booking Confirmed: {{Order_ID}}", template: "Hello {{Customer_Name}},\nYour {{Device_Brand}} order {{Order_ID}} is confirmed." },
        QUOTE_EMAIL: { subject: "New Service Quote: ₹{{Quote_Amount}}", template: "Hello {{Customer_Name}},\nYour repair quote for {{Order_ID}} is ₹{{Quote_Amount}}. Please review via the dashboard." },
        STATUS_UPDATE: { subject: "Order {{Order_ID}} Status: {{Status}}", template: "Hello {{Customer_Name}},\nYour order {{Order_ID}} has been updated to {{Status}}." },
        CONTACT_FORM: { subject: "New Inquiry from {{Customer_Name}}", template: "Inquiry received: {{Customer_Name}} is asking about {{Device_Brand}}." },
        SALES_INQUIRY: { subject: "Sales Inquiry: {{Order_ID}}", template: "We received your sales inquiry. Expect a response soon." },
        FEEDBACK_REQUEST: { subject: "Rate your erepaircafe Service!", template: "Hello {{Customer_Name}},\nYour device for {{Order_ID}} was delivered! Please leave us feedback." },
        PROMOTIONAL: { subject: "erepaircafe Exclusive Offer!", template: "Hello {{Customer_Name}},\nClaim your exclusive erepaircafe service discounts today!" },
        OTP_VERIFICATION: { subject: "erepaircafe Secure OTP", template: "Your secure OTP code is: {{OTP_Code}}. Valid for 10 minutes." },
        PARTNER_NOTIFY: { subject: "New assigned job: {{Order_ID}}", template: "Hello {{Partner_Name}},\nYou have a new assignment for {{Order_ID}}. Commission: ₹{{Quote_Amount}}." }
    },
    // Step 13: SMS Template Management
    SMS: {
        NEW_BOOKING: "erepaircafe: Booking {{Order_ID}} received successfully!",
        STATUS_UPDATE: "erepaircafe Update: Order {{Order_ID}} is now {{Status}}.",
        QUOTE_EMAIL: "erepaircafe Quote: Estimate of ₹{{Quote_Amount}} generated for {{Order_ID}}.",
        OTP_VERIFICATION: "erepaircafe OTP: {{OTP_Code}}",
        PARTNER_NOTIFY: "erepaircafe Partner Alert: You have been assigned job {{Order_ID}}."
    }
};

// Step 14: Notification Content Variables
const renderTemplate = (string, variables) => {
    let result = string;
    for (const [key, value] of Object.entries(variables)) {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(placeholder, value || 'N/A');
    }
    return result;
};

// Dispatcher logic wrapper mapping SMS + Email variables explicitly
const generateNotificationContent = (type, templateKey, variables) => {
    const rules = NotificationTemplates[type.toUpperCase()][templateKey.toUpperCase()];
    if (!rules) throw new Error("Template not found");
    
    if (type.toUpperCase() === 'EMAIL') {
       return {
          subject: renderTemplate(rules.subject, variables),
          message: renderTemplate(rules.template, variables)
       };
    } else {
       return renderTemplate(rules, variables);
    }
};

module.exports = { NotificationTemplates, renderTemplate, generateNotificationContent };

