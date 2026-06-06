require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const path = require('path');
const axios = require('axios');

const MIGRATION_CONFIG = [
  {
    modelName: 'User',
    fields: [
      { urlField: 'profile_photo', publicIdField: 'profile_photo_public_id', folder: 'users/account/profile-photos', resourceType: 'image' }
    ]
  },
  {
    modelName: 'Blog',
    fields: [
      { urlField: 'featured_image', publicIdField: 'featured_image_public_id', folder: 'content/blogs/featured-images', resourceType: 'image' }
    ]
  },
  {
    modelName: 'AnimalListing',
    fields: [
      { urlField: 'frontPhoto', publicIdField: 'frontPhotoPublicId', folder: 'listings/cows/images', resourceType: 'image' },
      { urlField: 'sidePhoto', publicIdField: 'sidePhotoPublicId', folder: 'listings/cows/images', resourceType: 'image' },
      { urlField: 'milkScenePhoto', publicIdField: 'milkScenePhotoPublicId', folder: 'listings/cows/images', resourceType: 'image' },
      { urlField: 'video', publicIdField: 'videoPublicId', folder: 'listings/cows/videos', resourceType: 'video' }
    ]
  },
  {
    modelName: 'BuffaloListing',
    fields: [
      { urlField: 'frontPhoto', publicIdField: 'frontPhotoPublicId', folder: 'listings/buffalos/images', resourceType: 'image' },
      { urlField: 'sidePhoto', publicIdField: 'sidePhotoPublicId', folder: 'listings/buffalos/images', resourceType: 'image' },
      { urlField: 'milkScenePhoto', publicIdField: 'milkScenePhotoPublicId', folder: 'listings/buffalos/images', resourceType: 'image' },
      { urlField: 'video', publicIdField: 'videoPublicId', folder: 'listings/buffalos/videos', resourceType: 'video' }
    ]
  },
  {
    modelName: 'HorseListing',
    fields: [
      { urlField: 'frontPhoto', publicIdField: 'frontPhotoPublicId', folder: 'listings/horses/images', resourceType: 'image' },
      { urlField: 'sidePhoto', publicIdField: 'sidePhotoPublicId', folder: 'listings/horses/images', resourceType: 'image' },
      { urlField: 'fullBodyPhoto', publicIdField: 'fullBodyPhotoPublicId', folder: 'listings/horses/images', resourceType: 'image' },
      { urlField: 'video', publicIdField: 'videoPublicId', folder: 'listings/horses/videos', resourceType: 'video' }
    ]
  },
  {
    modelName: 'GoatListing',
    fields: [
      { urlField: 'photo1', publicIdField: 'photo1PublicId', folder: 'listings/goats/images', resourceType: 'image' },
      { urlField: 'photo2', publicIdField: 'photo2PublicId', folder: 'listings/goats/images', resourceType: 'image' },
      { urlField: 'photo3', publicIdField: 'photo3PublicId', folder: 'listings/goats/images', resourceType: 'image' },
      { urlField: 'photo4', publicIdField: 'photo4PublicId', folder: 'listings/goats/images', resourceType: 'image' },
      { urlField: 'photo5', publicIdField: 'photo5PublicId', folder: 'listings/goats/images', resourceType: 'image' },
      { urlField: 'video', publicIdField: 'videoPublicId', folder: 'listings/goats/videos', resourceType: 'video' }
    ]
  },
  {
    modelName: 'DogListing',
    fields: [
      { urlField: 'photo1', publicIdField: 'photo1PublicId', folder: 'listings/dogs/images', resourceType: 'image' },
      { urlField: 'photo2', publicIdField: 'photo2PublicId', folder: 'listings/dogs/images', resourceType: 'image' },
      { urlField: 'photo3', publicIdField: 'photo3PublicId', folder: 'listings/dogs/images', resourceType: 'image' },
      { urlField: 'photo4', publicIdField: 'photo4PublicId', folder: 'listings/dogs/images', resourceType: 'image' },
      { urlField: 'photo5', publicIdField: 'photo5PublicId', folder: 'listings/dogs/images', resourceType: 'image' },
      { urlField: 'video', publicIdField: 'videoPublicId', folder: 'listings/dogs/videos', resourceType: 'video' }
    ]
  },
  {
    modelName: 'CatListing',
    fields: [
      { urlField: 'photo1', publicIdField: 'photo1PublicId', folder: 'listings/cats/images', resourceType: 'image' },
      { urlField: 'photo2', publicIdField: 'photo2PublicId', folder: 'listings/cats/images', resourceType: 'image' },
      { urlField: 'photo3', publicIdField: 'photo3PublicId', folder: 'listings/cats/images', resourceType: 'image' },
      { urlField: 'photo4', publicIdField: 'photo4PublicId', folder: 'listings/cats/images', resourceType: 'image' },
      { urlField: 'photo5', publicIdField: 'photo5PublicId', folder: 'listings/cats/images', resourceType: 'image' },
      { urlField: 'video', publicIdField: 'videoPublicId', folder: 'listings/cats/videos', resourceType: 'video' }
    ]
  },
  {
    modelName: 'OtherAnimalListing',
    fields: [
      { urlField: 'frontPhoto', publicIdField: 'frontPhotoPublicId', folder: 'listings/other-animals/images/front', resourceType: 'image' },
      { urlField: 'sidePhoto', publicIdField: 'sidePhotoPublicId', folder: 'listings/other-animals/images/side', resourceType: 'image' },
      { urlField: 'additionalPhoto', publicIdField: 'additionalPhotoPublicId', folder: 'listings/other-animals/images/additional', resourceType: 'image' },
      { urlField: 'video', publicIdField: 'videoPublicId', folder: 'listings/other-animals/videos', resourceType: 'video' }
    ]
  },
  {
    modelName: 'Veterinarian',
    fields: [
      { urlField: 'profile_photo', publicIdField: 'profile_photo_public_id', folder: 'veterinarians/account/profile-photos', resourceType: 'image' },
      { urlField: 'license_document', publicIdField: 'license_document_public_id', folder: 'veterinarians/registration/license-documents', resourceType: 'raw' },
      { urlField: 'degree_certificate', publicIdField: 'degree_certificate_public_id', folder: 'veterinarians/registration/degree-certificates', resourceType: 'raw' },
      { urlField: 'aadhar_document', publicIdField: 'aadhar_document_public_id', folder: 'veterinarians/registration/aadhar-documents', resourceType: 'raw' }
    ]
  }
];

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const selectedModel = args.find((arg) => arg.startsWith('--model='))?.split('=')[1] || null;
const limitArg = args.find((arg) => arg.startsWith('--limit='))?.split('=')[1];
const limit = limitArg ? Number.parseInt(limitArg, 10) : null;

const isCloudinaryUrl = (value) => typeof value === 'string' && value.includes('res.cloudinary.com');

const required = ['AWS_REGION', 'AWS_S3_BUCKET', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required S3 env vars: ${missing.join(', ')}`);
}

const { Op } = require('sequelize');
const db = require('../src/models');
const { uploadToCloudinary } = require('../src/config/cloudinary');

async function downloadRemoteFile(url, resourceType) {
  const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
  const parsedUrl = new URL(url);
  const originalname = path.basename(parsedUrl.pathname) || (resourceType === 'video' ? 'media.mp4' : 'media.jpg');

  return {
    buffer: Buffer.from(response.data),
    mimetype: response.headers['content-type'] || (resourceType === 'video' ? 'video/mp4' : 'image/jpeg'),
    originalname
  };
}

async function migrateField(record, fieldConfig) {
  const currentUrl = record[fieldConfig.urlField];
  if (!isCloudinaryUrl(currentUrl)) {
    return { status: 'skipped' };
  }

  console.log(`  Migrating ${fieldConfig.urlField} for record ${record.id}`);

  if (dryRun) {
    return { status: 'dry-run' };
  }

  const file = await downloadRemoteFile(currentUrl, fieldConfig.resourceType);
  const result = await uploadToCloudinary(file, fieldConfig.folder, fieldConfig.resourceType);

  await record.update({
    [fieldConfig.urlField]: result.secure_url,
    [fieldConfig.publicIdField]: result.public_id
  });

  return { status: 'migrated', key: result.public_id };
}

async function migrateModel(modelConfig) {
  const Model = db[modelConfig.modelName];
  if (!Model) {
    console.warn(`Skipping unknown model: ${modelConfig.modelName}`);
    return;
  }

  const where = {
    [Op.or]: modelConfig.fields.map((field) => ({
      [field.urlField]: { [Op.like]: '%cloudinary%' }
    }))
  };

  const queryOptions = {
    where,
    order: [[Model.primaryKeyAttributes[0] || 'id', 'ASC']]
  };

  if (limit) {
    queryOptions.limit = limit;
  }

  const records = await Model.findAll(queryOptions);
  console.log(`\n${modelConfig.modelName}: found ${records.length} record(s) with Cloudinary URLs`);

  for (const record of records) {
    for (const field of modelConfig.fields) {
      try {
        await migrateField(record, field);
      } catch (error) {
        console.error(`  Failed ${modelConfig.modelName}#${record.id} ${field.urlField}: ${error.message}`);
      }
    }
  }
}

async function main() {
  const configs = selectedModel
    ? MIGRATION_CONFIG.filter((config) => config.modelName === selectedModel)
    : MIGRATION_CONFIG;

  if (configs.length === 0) {
    throw new Error(`No migration config found for model: ${selectedModel}`);
  }

  console.log(`Starting Cloudinary -> S3 migration${dryRun ? ' (dry run)' : ''}`);

  for (const config of configs) {
    await migrateModel(config);
  }

  await db.sequelize.close();
  console.log('\nMigration script finished');
}

main().catch(async (error) => {
  console.error('Migration failed:', error.message);
  try {
    await db.sequelize.close();
  } catch (closeError) {
    // ignore close errors during failure
  }
  process.exit(1);
});
