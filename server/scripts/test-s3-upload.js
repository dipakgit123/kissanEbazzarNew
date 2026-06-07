require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const { uploadToCloudinary, deleteFromCloudinary } = require('../src/config/cloudinary');

const ONE_PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnM4EwAAAAASUVORK5CYII=',
  'base64'
);

async function main() {
  const required = ['AWS_REGION', 'AWS_S3_BUCKET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required S3 env vars: ${missing.join(', ')}`);
  }

  const testFile = {
    buffer: ONE_PIXEL_PNG,
    mimetype: 'image/png',
    originalname: 's3-smoke-test.png'
  };

  console.log('Uploading S3 smoke-test file...');
  const result = await uploadToCloudinary(testFile, 'tests/s3/images', 'image');

  console.log('Upload successful');
  console.log(`URL: ${result.secure_url}`);
  console.log(`Key: ${result.public_id}`);

  console.log('Deleting S3 smoke-test file...');
  await deleteFromCloudinary(result.public_id, 'image');
  console.log('Cleanup successful');
}

main()
  .then(() => {
    console.log('S3 smoke test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('S3 smoke test failed:', error.message);
    process.exit(1);
  });
