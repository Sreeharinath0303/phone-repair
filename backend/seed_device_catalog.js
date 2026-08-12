const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Brand = require('./src/models/Brand');
const Model = require('./src/models/Model');
const { BRAND_FALLBACKS, MODEL_FALLBACKS } = require('./src/data/deviceCatalog');

const dropLegacyBrandNameIndex = async () => {
  const indexes = await Brand.collection.indexes();
  const legacyNameIndex = indexes.find((index) => index.name === 'name_1');
  if (legacyNameIndex) {
    await Brand.collection.dropIndex('name_1');
    console.log('Dropped legacy Brand unique index on name');
  }
};

const seedDeviceCatalog = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not configured');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await dropLegacyBrandNameIndex();
    await Brand.syncIndexes();
    await Model.syncIndexes();

    const desiredBrandKeys = new Set();
    const desiredModelKeys = new Set();

    let brandCount = 0;
    let modelCount = 0;

    for (const [category, brandNames] of Object.entries(BRAND_FALLBACKS)) {
      for (const brandName of brandNames) {
        const normalizedBrandName = String(brandName).trim();
        desiredBrandKeys.add(`${category}::${normalizedBrandName.toLowerCase()}`);

        const brand = await Brand.findOneAndUpdate(
          { name: normalizedBrandName, category },
          { $set: { name: normalizedBrandName, category, isActive: true } },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        brandCount += 1;

        const modelNames = MODEL_FALLBACKS?.[category]?.[normalizedBrandName] || [];
        for (const modelName of modelNames) {
          const normalizedModelName = String(modelName).trim();
          desiredModelKeys.add(`${brand._id.toString()}::${normalizedModelName.toLowerCase()}`);

          await Model.findOneAndUpdate(
            { name: normalizedModelName, brand: brand._id },
            {
              $set: {
                name: normalizedModelName,
                brand: brand._id,
                category,
                basePrice: 0,
                isActive: true
              }
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
          );
          modelCount += 1;
        }
      }
    }

    const existingBrands = await Brand.find({ category: { $in: Object.keys(BRAND_FALLBACKS) } }).select('_id name category');
    for (const brand of existingBrands) {
      const key = `${brand.category}::${String(brand.name).trim().toLowerCase()}`;
      if (!desiredBrandKeys.has(key) && brand.isActive !== false) {
        await Brand.updateOne({ _id: brand._id }, { $set: { isActive: false } });
      }
    }

    const existingModels = await Model.find({}).select('_id name brand');
    for (const model of existingModels) {
      const key = `${model.brand.toString()}::${String(model.name).trim().toLowerCase()}`;
      if (!desiredModelKeys.has(key) && model.isActive !== false) {
        await Model.updateOne({ _id: model._id }, { $set: { isActive: false } });
      }
    }

    const activeBrandCount = await Brand.countDocuments({ isActive: true });
    const activeModelCount = await Model.countDocuments({ isActive: true });

    console.log(`Seeded catalog successfully: ${brandCount} brand entries processed, ${modelCount} model entries processed`);
    console.log(`Active catalog totals: ${activeBrandCount} brands, ${activeModelCount} models`);
  } catch (error) {
    console.error('Device catalog seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedDeviceCatalog();
