// Test Cloudinary upload
require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Testing Cloudinary upload...');

// Create a simple test buffer (1x1 red pixel PNG)
const testBuffer = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
  0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
  0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
  0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D,
  0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
  0x44, 0xAE, 0x42, 0x60, 0x82
]);

// Test upload using upload_stream
const uploadStream = cloudinary.uploader.upload_stream(
  {
    resource_type: 'image',
    folder: 'animal-listings/test'
  },
  (error, result) => {
    if (error) {
      console.log('\n❌ Upload failed!');
      console.error('Error:', error);
    } else {
      console.log('\n✅ Upload successful!');
      console.log('URL:', result.secure_url);
      console.log('Public ID:', result.public_id);

      // Clean up test image
      cloudinary.uploader.destroy(result.public_id).then(() => {
        console.log('Test image deleted');
      });
    }
  }
);

uploadStream.end(testBuffer);

console.log('Upload stream created and buffer sent...');
