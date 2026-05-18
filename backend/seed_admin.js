const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./src/models/Admin');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@repairvafe.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@1234';

    const existing = await Admin.findOne({ email: adminEmail });
    if (existing) {
      console.log('Admin already exists. Updating password...');
      existing.password = adminPassword;
      await existing.save();
      console.log('Admin updated successfully.');
    } else {
      await Admin.create({
        name: 'Super Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'superadmin'
      });
      console.log('Admin created successfully.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedAdmin();
