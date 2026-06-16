const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

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
  res.json({ status: 'ok', message: 'RepairVafe API is running', timestamp: new Date() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

const BASE_PORT = Number(process.env.PORT) || 5000;
const MAX_PORT_RETRIES = 10;

function startServer(port = BASE_PORT, retries = 0) {
  const server = app.listen(port, () => {
    console.log(`RepairVafe API running in ${process.env.NODE_ENV} mode on port ${port}`);
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
