const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Admin = require('./src/models/Admin');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const admin = await Admin.findOne({ email: 'admin@repairvafe.com' });
  if (admin) {
    admin.loginAttempts = 0;
    admin.isLocked = false;
    admin.lockedUntil = null;
    admin.isActive = true;
    await admin.save();
    console.log('Successfully unlocked admin:', admin.email);
  } else {
    console.log('Admin not found');
  }

  process.exit();
}
run();
