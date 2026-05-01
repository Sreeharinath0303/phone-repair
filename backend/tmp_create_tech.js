const mongoose = require('mongoose');
const Technician = require('./src/models/Technician');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/repairvafe');
  
  const tech = await Technician.create({
    name: "Partner Test",
    email: "partner@test.com",
    phone: "1234567890",
    password: "password123",
    specialization: "Smartphones",
    serviceAreas: ["Hyderabad"]
  });

  console.log('Test partner created: ', tech);
  process.exit();
}
run();
