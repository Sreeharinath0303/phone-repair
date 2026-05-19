const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Admin = require('./src/models/Admin');
const User = require('./src/models/User');
const Technician = require('./src/models/Technician');
const { Lead } = require('./src/models/Lead');
const Booking = require('./src/models/Booking');
const Feedback = require('./src/models/Feedback');
const AuditLog = require('./src/models/AuditLog');
const Brand = require('./src/models/Brand');
const Model = require('./src/models/Model');

const seedAll = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Clean up old non-admin, non-user test data to start fresh (keeps admins/users intact but wipes bookings/leads/payouts/auditlogs for clean analytics)
    console.log('Clearing old transaction data...');
    await Booking.deleteMany({});
    await Lead.deleteMany({});
    await Feedback.deleteMany({});
    await AuditLog.deleteMany({});
    await Technician.deleteMany({});
    await Brand.deleteMany({});
    await Model.deleteMany({});
    console.log('✅ Wiped temporary mock collections');

    // 2. Create Brands and Models
    console.log('Seeding Brands and Models...');
    const brandsData = [
      { name: 'Apple', category: 'smartphone', isActive: true },
      { name: 'Samsung', category: 'smartphone', isActive: true },
      { name: 'OnePlus', category: 'smartphone', isActive: true },
      { name: 'Xiaomi', category: 'smartphone', isActive: true },
      { name: 'Google', category: 'smartphone', isActive: true }
    ];

    const seededBrands = {};
    for (const b of brandsData) {
      const brandObj = await Brand.create(b);
      seededBrands[b.name] = brandObj;
    }

    const modelsData = [
      { name: 'iPhone 13', brand: seededBrands['Apple']._id, category: 'smartphone', basePrice: 15000, isActive: true },
      { name: 'iPhone 14 Pro', brand: seededBrands['Apple']._id, category: 'smartphone', basePrice: 25000, isActive: true },
      { name: 'Galaxy S22 Ultra', brand: seededBrands['Samsung']._id, category: 'smartphone', basePrice: 18000, isActive: true },
      { name: 'Galaxy S23', brand: seededBrands['Samsung']._id, category: 'smartphone', basePrice: 20000, isActive: true },
      { name: 'OnePlus 10 Pro', brand: seededBrands['OnePlus']._id, category: 'smartphone', basePrice: 12000, isActive: true },
      { name: 'Mi 11 Ultra', brand: seededBrands['Xiaomi']._id, category: 'smartphone', basePrice: 10000, isActive: true },
      { name: 'Pixel 7 Pro', brand: seededBrands['Google']._id, category: 'smartphone', basePrice: 14000, isActive: true }
    ];

    for (const m of modelsData) {
      await Model.create(m);
    }
    console.log('✅ Seeded Brands and Models');

    // 3. Create Technicians (Partners)
    console.log('Seeding Technicians...');
    const partners = [
      {
        name: 'Sharma Tech Services',
        businessName: 'Sharma Electronics & Repairs',
        email: 'sharma@repairvafe.com',
        phone: '9876543211',
        password: 'Partner@123',
        address: 'Sec 12, Dwarka',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110075',
        specialization: 'Smartphones',
        supportedBrands: ['Apple', 'Samsung', 'OnePlus'],
        supportedCategories: ['smartphone'],
        serviceAreas: ['New Delhi', 'Dwarka', 'Janakpuri'],
        status: 'available',
        totalRepairs: 48,
        completedRepairs: 45,
        averageRating: 4.8,
        payoutBalance: 12500,
        totalEarned: 95000,
        commissionRate: 10,
        isActive: true
      },
      {
        name: 'Sai Mobile Clinic',
        businessName: 'Sai Cellular Hub',
        email: 'sai@repairvafe.com',
        phone: '9876543212',
        password: 'Partner@123',
        address: 'HSR Layout, Sector 3',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560102',
        specialization: 'Smartphones',
        supportedBrands: ['Apple', 'Samsung', 'Xiaomi', 'Google'],
        supportedCategories: ['smartphone'],
        serviceAreas: ['Bangalore', 'HSR Layout', 'Koramangala'],
        status: 'available',
        totalRepairs: 35,
        completedRepairs: 32,
        averageRating: 4.6,
        payoutBalance: 8000,
        totalEarned: 64000,
        commissionRate: 12,
        isActive: true
      },
      {
        name: 'Apex Repair Hub',
        businessName: 'Apex Device Labs',
        email: 'apex@repairvafe.com',
        phone: '9876543213',
        password: 'Partner@123',
        address: 'Andheri West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400053',
        specialization: 'Smartphones',
        supportedBrands: ['Apple', 'Samsung', 'OnePlus', 'Google'],
        supportedCategories: ['smartphone'],
        serviceAreas: ['Mumbai', 'Andheri', 'Bandra'],
        status: 'busy',
        totalRepairs: 60,
        completedRepairs: 58,
        averageRating: 4.9,
        payoutBalance: 15400,
        totalEarned: 120000,
        commissionRate: 8,
        isActive: true
      },
      {
        name: 'Pune SmartFix',
        businessName: 'SmartFix Solutions',
        email: 'smartfix@repairvafe.com',
        phone: '9876543214',
        password: 'Partner@123',
        address: 'Kothrud',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411038',
        specialization: 'Smartphones',
        supportedBrands: ['Samsung', 'Xiaomi', 'OnePlus'],
        supportedCategories: ['smartphone'],
        serviceAreas: ['Pune', 'Kothrud', 'Deccan'],
        status: 'available',
        totalRepairs: 18,
        completedRepairs: 17,
        averageRating: 4.4,
        payoutBalance: 4200,
        totalEarned: 32000,
        commissionRate: 10,
        isActive: true
      }
    ];

    const seededPartners = [];
    for (const p of partners) {
      const partnerObj = await Technician.create(p);
      seededPartners.push(partnerObj);
    }
    console.log(`✅ Seeded ${seededPartners.length} Technicians`);

    // Get seeded admin for AuditLogs
    const adminUser = await Admin.findOne({ role: 'superadmin' });
    const adminId = adminUser ? adminUser._id : new mongoose.Types.ObjectId();

    // Get existing customer
    let customerUser = await User.findOne({ role: 'customer' });
    if (!customerUser) {
      customerUser = await User.create({
        name: 'Rohan Verma',
        email: 'customer@repairvafe.com',
        password: 'Customer@123',
        phone: '9876543210',
        role: 'customer',
        isVerified: true
      });
    }

    // 4. Seeding Leads
    console.log('Seeding Leads...');
    const leadTemplates = [
      { customerName: 'Aarav Mehta', mobileNumber: '9988776655', email: 'aarav@gmail.com', city: 'New Delhi', state: 'Delhi', pincode: '110075', deviceCategory: 'smartphone', deviceBrand: 'Apple', deviceModel: 'iPhone 13', repairTypes: ['Screen Replacement'], stage: 'Lead Created', bookingCompleted: false },
      { customerName: 'Ananya Sen', mobileNumber: '9988776654', email: 'ananya@gmail.com', city: 'Mumbai', state: 'Maharashtra', pincode: '400053', deviceCategory: 'smartphone', deviceBrand: 'Samsung', deviceModel: 'Galaxy S22 Ultra', repairTypes: ['Battery Replacement'], stage: 'Incomplete booking', bookingCompleted: false },
      { customerName: 'Kabir Das', mobileNumber: '9988776653', email: 'kabir@gmail.com', city: 'Bangalore', state: 'Karnataka', pincode: '560102', deviceCategory: 'smartphone', deviceBrand: 'OnePlus', deviceModel: 'OnePlus 10 Pro', repairTypes: ['Charging Port Repair'], stage: 'Under Review', bookingCompleted: false },
      { customerName: 'Rohan Verma', mobileNumber: '9876543210', email: 'customer@repairvafe.com', city: 'Pune', state: 'Maharashtra', pincode: '411038', deviceCategory: 'smartphone', deviceBrand: 'Google', deviceModel: 'Pixel 7 Pro', repairTypes: ['Back Glass Replacement'], stage: 'Booking Submitted', bookingCompleted: true }
    ];

    for (const leadData of leadTemplates) {
      leadData.normalizedMobile = leadData.mobileNumber.replace(/\D/g, '');
      await Lead.create(leadData);
    }
    console.log('✅ Seeded Leads');

    // 5. Seeding Bookings
    console.log('Seeding Bookings...');
    const now = new Date();
    
    // Detailed list of status configurations to have beautifully diverse statistics
    const bookingsData = [
      // 1. Completed Order (Generates Revenue)
      {
        deviceCategory: 'smartphone',
        deviceBrand: 'Apple',
        deviceModel: 'iPhone 14 Pro',
        repairTypes: ['Screen Replacement'],
        issueDescription: 'Cracked screen display is flickering',
        customerName: 'Vikram Aditya',
        customerPhone: '9810293847',
        customerEmail: 'vikram@gmail.com',
        serviceType: 'pickup',
        address: 'Flat 402, Block A, Dwarka',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110075',
        preferredDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        preferredTimeSlot: '12:00 PM - 03:00 PM',
        status: 'Completed',
        assignedTechnician: seededPartners[0]._id,
        approxAmount: 18000,
        quotationAmount: 19500,
        finalAmount: 19500,
        partnerPayout: 17550,
        quotationStatus: 'Approved by Customer',
        discount: 0,
        warrantyPeriod: '6 Months',
        paymentStatus: 'Paid',
        paymentDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        invoiceNumber: 'INV-2026-00001',
        invoiceDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        locationSource: 'gps',
        latitude: 28.5921,
        longitude: 77.0465,
        customerFeedbackStatus: 'Feedback Submitted',
        customerId: customerUser._id
      },
      // 2. Another Completed Order (Bangalore)
      {
        deviceCategory: 'smartphone',
        deviceBrand: 'Samsung',
        deviceModel: 'Galaxy S23',
        repairTypes: ['Back Glass Repair'],
        issueDescription: 'Shattered back panel',
        customerName: 'Meera Nair',
        customerPhone: '9820394857',
        customerEmail: 'meera@gmail.com',
        serviceType: 'pickup',
        address: '42, 4th Cross, Koramangala',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560102',
        preferredDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        preferredTimeSlot: '09:00 AM - 12:00 PM',
        status: 'Completed',
        assignedTechnician: seededPartners[1]._id,
        approxAmount: 6000,
        quotationAmount: 6500,
        finalAmount: 6200,
        partnerPayout: 5500,
        quotationStatus: 'Approved by Customer',
        discount: 300,
        warrantyPeriod: '3 Months',
        paymentStatus: 'Paid',
        paymentDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        invoiceNumber: 'INV-2026-00002',
        invoiceDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        locationSource: 'ip',
        latitude: 12.9352,
        longitude: 77.6244,
        customerFeedbackStatus: 'Feedback Pending',
        customerId: customerUser._id
      },
      // 3. Active / Ongoing Order
      {
        deviceCategory: 'smartphone',
        deviceBrand: 'OnePlus',
        deviceModel: 'OnePlus 10 Pro',
        repairTypes: ['Battery Replacement'],
        issueDescription: 'Battery draining fast in 2 hours',
        customerName: 'Aditya Rao',
        customerPhone: '9830495867',
        customerEmail: 'aditya@gmail.com',
        serviceType: 'pickup',
        address: 'Bungalow 9, Kothrud',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411038',
        preferredDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        preferredTimeSlot: '03:00 PM - 06:00 PM',
        status: 'Repair Ongoing',
        assignedTechnician: seededPartners[3]._id,
        approxAmount: 3200,
        quotationAmount: 3500,
        quotationStatus: 'Approved by Customer',
        locationSource: 'manual',
        latitude: 18.5074,
        longitude: 73.8077
      },
      // 4. Pending Quotation / Awaiting Approval
      {
        deviceCategory: 'smartphone',
        deviceBrand: 'Google',
        deviceModel: 'Pixel 7 Pro',
        repairTypes: ['Charging Port Repair'],
        issueDescription: 'Not connecting to charger unless held at specific angle',
        customerName: 'Sanjay Dutt',
        customerPhone: '9840596877',
        customerEmail: 'sanjay@gmail.com',
        serviceType: 'walkin',
        address: 'Bandra Reclamation',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400053',
        preferredDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        preferredTimeSlot: '12:00 PM - 03:00 PM',
        status: 'Awaiting Customer Approval',
        approxAmount: 4000,
        quotationAmount: 4200,
        quotationStatus: 'Awaiting Customer Approval',
        locationSource: 'gps',
        latitude: 19.0522,
        longitude: 72.8258
      },
      // 5. Assigned Order
      {
        deviceCategory: 'smartphone',
        deviceBrand: 'Xiaomi',
        deviceModel: 'Mi 11 Ultra',
        repairTypes: ['Camera Lens Replacement'],
        issueDescription: 'Rear camera glass is shattered',
        customerName: 'Rajesh Kumar',
        customerPhone: '9850697887',
        customerEmail: 'rajesh@gmail.com',
        serviceType: 'pickup',
        address: 'Janakpuri Block C',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110075',
        preferredDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        preferredTimeSlot: '09:00 AM - 12:00 PM',
        status: 'Assigned to Partner',
        assignedTechnician: seededPartners[0]._id,
        approxAmount: 5000,
        locationSource: 'gps',
        latitude: 28.6219,
        longitude: 77.0878
      }
    ];

    const seededBookings = [];
    for (const b of bookingsData) {
      const bObj = await Booking.create(b);
      seededBookings.push(bObj);
    }
    console.log(`✅ Seeded ${seededBookings.length} Bookings`);

    // 6. Seed Customer Feedback
    console.log('Seeding Feedback...');
    await Feedback.create({
      booking: seededBookings[0]._id,
      orderId: seededBookings[0].referenceNumber,
      type: 'customer',
      fromId: customerUser._id,
      fromName: customerUser.name,
      rating: 5,
      review: 'Brilliant screen repair! Sharma Tech was extremely professional and picked up the device right on time.',
      serviceQuality: 5,
      pickupExperience: 5,
      technicianBehavior: 5,
      timeliness: 5,
      overallSatisfaction: 5
    });
    console.log('✅ Seeded Feedback');

    // 7. Seeding Audit Logs (Activity Logs) to populate Command Center
    console.log('Seeding Audit Logs...');
    const auditLogsData = [
      {
        action: 'PARTNER_REGISTERED',
        entityType: 'Technician',
        entityId: seededPartners[0]._id,
        performedBy: adminId,
        performerModel: 'Admin',
        performerRole: 'Super Admin',
        description: `New repair partner successfully registered: ${seededPartners[0].name}`,
        ipAddress: '192.168.1.5',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      {
        action: 'LEAD_CONVERTED',
        entityType: 'Lead',
        entityId: seededBookings[0]._id,
        performedBy: adminId,
        performerModel: 'Admin',
        performerRole: 'Super Admin',
        description: `Lead for customer Vikram Aditya successfully converted to booking ${seededBookings[0].referenceNumber}`,
        ipAddress: '192.168.1.5',
        userAgent: 'Mozilla/5.0'
      },
      {
        action: 'QUOTE_PREPARED',
        entityType: 'Booking',
        entityId: seededBookings[0]._id,
        performedBy: adminId,
        performerModel: 'Admin',
        performerRole: 'Super Admin',
        description: `Service quotation of ₹19,500 prepared and sent to customer for approval`,
        ipAddress: '192.168.1.5',
        userAgent: 'Mozilla/5.0'
      },
      {
        action: 'PAYMENT_RECEIVED',
        entityType: 'Booking',
        entityId: seededBookings[0]._id,
        performedBy: customerUser._id,
        performerModel: 'User',
        performerRole: 'Customer',
        description: `Payment of ₹19,500 successfully settled online by customer`,
        ipAddress: '157.44.12.92',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)'
      },
      {
        action: 'ORDER_COMPLETED',
        entityType: 'Booking',
        entityId: seededBookings[0]._id,
        performedBy: seededPartners[0]._id,
        performerModel: 'Technician',
        performerRole: 'Partner',
        description: `Order completely closed. Screen replaced, post-repair inspection checked, delivered to client.`,
        ipAddress: '192.168.12.4',
        userAgent: 'Mozilla/5.0'
      }
    ];

    for (const log of auditLogsData) {
      await AuditLog.create(log);
    }
    console.log('✅ Seeded Audit Logs successfully!');
    console.log('🎉 Seeding successfully completed without errors!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedAll();
