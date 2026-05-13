const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./src/models/User');

const customers = [
  {
    name: 'Rohan Verma',
    email: 'customer@repairvafe.com',
    password: 'Customer@123',
    role: 'customer',
    isVerified: true,
    phone: '9876543210'
  },
  {
    name: 'Priya Sharma',
    email: 'demo@repairvafe.com',
    password: 'Demo@1234',
    role: 'customer',
    isVerified: true,
    phone: '9123456789'
  }
];

const seedCustomers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for customer seeding');

    for (const customer of customers) {
      const existing = await User.findOne({ email: customer.email });
      if (existing) {
        console.log(`ℹ️  Customer already exists: ${customer.email}`);
        continue;
      }

      // The User model has a pre-save hook for hashing, but let's be safe
      // Actually, User.create() triggers pre-save hooks.
      await User.create(customer);
      console.log(`🎉 Created customer: ${customer.email}`);
    }

    console.log('✅ Seeding complete!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedCustomers();
