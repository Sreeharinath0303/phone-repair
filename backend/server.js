const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB
connectDB();

const app = express();

// ─── Middleware ───────────────────────────────────────────
const corsOptions = (process.env.NODE_ENV === 'production' && process.env.CLIENT_URL)
  ? { origin: process.env.CLIENT_URL, credentials: true }
  : { origin: true, credentials: true };
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ─── Routes ───────────────────────────────────────────────
app.use('/api/bookings',     require('./src/routes/bookingRoutes'));
app.use('/api/quotations',   require('./src/routes/quotationRoutes'));
app.use('/api/tracking',     require('./src/routes/trackingRoutes'));
app.use('/api/feedback',     require('./src/routes/feedbackRoutes'));
app.use('/api/customers',    require('./src/routes/customerRoutes'));
app.use('/api/customer',     require('./src/routes/customerDashboardRoutes'));
app.use('/api/technicians',  require('./src/routes/technicianRoutes'));
app.use('/api/technician-auth', require('./src/routes/technicianAuthRoutes'));
app.use('/api/auth',         require('./src/routes/authRoutes'));
app.use('/api/customer-auth', require('./src/routes/customerAuthRoutes'));
app.use('/api/leads',        require('./src/routes/leadRoutes'));
app.use('/api/enquiries',    require('./src/routes/enquiryRoutes'));
app.use('/api/admin',        require('./src/routes/adminRoutes'));

// ─── Health Check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'RepairVafe API is running', timestamp: new Date() });
});

// ─── 404 Handler ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Error Handler ────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────
const BASE_PORT = Number(process.env.PORT) || 5000;
const MAX_PORT_RETRIES = 10;

function startServer(port = BASE_PORT, retries = 0) {
  const server = app.listen(port, () => {
    console.log(`\n🚀 RepairVafe API running in ${process.env.NODE_ENV} mode on port ${port}`);
    console.log(`   Health: http://localhost:${port}/api/health\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && retries < MAX_PORT_RETRIES) {
      const nextPort = port + 1;
      console.warn(`⚠️ Port ${port} is in use. Retrying on port ${nextPort}...`);
      return startServer(nextPort, retries + 1);
    }
    console.error(`❌ Server failed to start: ${err.message}`);
    process.exit(1);
  });

  return server;
}

const server = startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
