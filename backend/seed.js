const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const dotenv   = require('dotenv');
dotenv.config();

const Admin = require('./src/models/Admin');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const existing = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
  if (existing) {
    console.log('ℹ️  Default admin already exists:', existing.email);
    await mongoose.disconnect();
    return;
  }

  await Admin.create({
    name:     'Super Admin',
    email:    process.env.ADMIN_EMAIL    || 'admin@repairvafe.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@1234',
    role:     'superadmin'
  });

  console.log('🎉 Default admin created!');
  console.log('   Email:    ', process.env.ADMIN_EMAIL);
  console.log('   Password: ', process.env.ADMIN_PASSWORD);
  await mongoose.disconnect();
};

seed().catch(err => { console.error(err); process.exit(1); });
