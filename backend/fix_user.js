const mongoose = require('mongoose');
const User = require('./src/models/User');

async function fixUser() {
  try {
    await mongoose.connect('mongodb+srv://sshari3103_db_user:Hari%403103@phone.pkuvupw.mongodb.net/repairvafe?retryWrites=true&w=majority&appName=phone');
    console.log('Connected to MongoDB');
    
    // Delete the unverified user so they can register again
    const result = await User.deleteMany({ email: 'rkumar0151966@gmail.com' });
    console.log(`Deleted ${result.deletedCount} unverified users.`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixUser();
