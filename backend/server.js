const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');
const DEFAULT_WHATSAPP_PHONE = '919148136086';

const normalizeWhatsAppLink = (value) => {
  const raw = String(value || '').trim();
  const fallback = `https://api.whatsapp.com/send?phone=${DEFAULT_WHATSAPP_PHONE}`;

  if (!raw) return fallback;

  const directPhone = raw.replace(/\D/g, '');
  if (directPhone.length >= 10 && directPhone.length <= 15) {
    return `https://api.whatsapp.com/send?phone=${directPhone}`;
  }

  try {
    const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    const hostname = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    const pathSegments = parsed.pathname.split('/').filter(Boolean);
    const phoneFromQuery = parsed.searchParams.get('phone')?.replace(/\D/g, '') || '';
    const phoneFromPath = hostname === 'wa.me' && /^\d{10,15}$/.test(pathSegments[0] || '')
      ? pathSegments[0]
      : '';
    const resolvedPhone = phoneFromQuery || phoneFromPath || DEFAULT_WHATSAPP_PHONE;
    return `https://api.whatsapp.com/send?phone=${resolvedPhone}`;
  } catch {
    return fallback;
  }
};

const localEnvPath = path.join(__dirname, '.env');
if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
}

connectDB().catch((err) => {
  console.error(`Database bootstrap failed: ${err.message}`);
});

const app = express();

const corsOptions = (process.env.NODE_ENV === 'production' && process.env.CLIENT_URL)
  ? { origin: process.env.CLIENT_URL, credentials: true }
  : { origin: true, credentials: true };

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api/bookings', require('./src/routes/bookingRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/quotations', require('./src/routes/quotationRoutes'));
app.use('/api/tracking', require('./src/routes/trackingRoutes'));
app.use('/api/feedback', require('./src/routes/feedbackRoutes'));
app.use('/api/customers', require('./src/routes/customerRoutes'));
app.use('/api/customer', require('./src/routes/customerDashboardRoutes'));
app.use('/api/technicians', require('./src/routes/technicianRoutes'));
app.use('/api/technician-auth', require('./src/routes/technicianAuthRoutes'));
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/customer-auth', require('./src/routes/customerAuthRoutes'));
app.use('/api/leads', require('./src/routes/leadRoutes'));
app.use('/api/enquiries', require('./src/routes/enquiryRoutes'));
app.use('/api/partners', require('./src/routes/partnerRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'erepaircafe API is running', timestamp: new Date() });
});

app.get('/api/settings/public', async (req, res) => {
  try {
    const { CommunicationSettings, Offer } = require('./src/models/Settings');
    let settings = await CommunicationSettings.findOne();
    const defaults = {
      facebookLink: 'https://www.facebook.com/share/192QskMjUo/',
      instagramLink: 'https://www.instagram.com/erepaircafe?igsh=MWV6Z242eDl5MXl0cg==',
      youtubeLink: 'https://youtube.com/@erepaircafe?si=XyuvL8OX4-Jjj2Wl',
      trustpilotLink: 'https://www.trustpilot.com/review/erepaircafe.com',
      linkedinLink: 'https://www.linkedin.com/company/erepaircafe/',
      twitterLink: 'https://x.com/ErepairCafe',
      googleSearchLink: 'https://www.google.com/search?kgmid=%2Fg%2F11hz37hgnj&hl=en-IN&q=eRepairCafe%20-%20Mobile%20Repair%20%26%20Phone%20Screen%20Repair%20Specialized&shem=epsd1%2Cltac%2Crimspwouoe&shndl=30&source=sh%2Fx%2Floc%2Fosrp%2Fm1%2F2&kgs=0832192f0912660b',
      whatsappLink: `https://api.whatsapp.com/send?phone=${DEFAULT_WHATSAPP_PHONE}`,
      showCompletedRepairsInFeedbackSection: true
    };

    const now = new Date();
    const activeOffers = await Offer.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .select('code description discountType discountValue endDate');

    if (!settings) {
      return res.json({ success: true, data: { ...defaults, offers: activeOffers } });
    }

    res.json({
      success: true,
      data: {
        facebookLink: settings.facebookLink || defaults.facebookLink,
        instagramLink: settings.instagramLink || defaults.instagramLink,
        youtubeLink: settings.youtubeLink || defaults.youtubeLink,
        trustpilotLink: settings.trustpilotLink || defaults.trustpilotLink,
        linkedinLink: settings.linkedinLink || defaults.linkedinLink,
        twitterLink: settings.twitterLink || defaults.twitterLink,
        googleSearchLink: settings.googleSearchLink || defaults.googleSearchLink,
        whatsappLink: normalizeWhatsAppLink(settings.whatsappLink || defaults.whatsappLink),
        showCompletedRepairsInFeedbackSection: settings.showCompletedRepairsInFeedbackSection ?? defaults.showCompletedRepairsInFeedbackSection,
        offers: activeOffers
      }
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

const BASE_PORT = Number(process.env.PORT) || 5000;
const MAX_PORT_RETRIES = 10;

function startServer(port = BASE_PORT, retries = 0) {
  const server = app.listen(port, () => {
    console.log(`erepaircafe API running in ${process.env.NODE_ENV} mode on port ${port}`);
    console.log(`Health: http://localhost:${port}/api/health`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && retries < MAX_PORT_RETRIES) {
      const nextPort = port + 1;
      console.warn(`Port ${port} is in use. Retrying on port ${nextPort}...`);
      return startServer(nextPort, retries + 1);
    }

    console.error(`Server failed to start: ${err.message}`);
    process.exit(1);
  });

  return server;
}

if (require.main === module) {
  const server = startServer();

  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
}

module.exports = app;

