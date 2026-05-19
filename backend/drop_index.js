const mongoose = require('mongoose');

async function dropIndex() {
  try {
    await mongoose.connect('mongodb+srv://sshari3103_db_user:Hari%403103@phone.pkuvupw.mongodb.net/repairvafe?retryWrites=true&w=majority&appName=phone');
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('technicians');
    
    // Check existing indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(i => i.name));
    
    const indexName = 'city_1_state_1_serviceAreas_1_specialization_1_supportedBrands_1';
    if (indexes.find(i => i.name === indexName)) {
      await collection.dropIndex(indexName);
      console.log(`Successfully dropped ${indexName} index!`);
    } else {
      console.log(`${indexName} index not found.`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

dropIndex();
