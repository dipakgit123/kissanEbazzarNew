// Simple script to test Cloudinary credentials
require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Testing Cloudinary credentials...');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not Set');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not Set');

// Try to get account details
cloudinary.api.ping()
  .then(result => {
    console.log('\n✅ Cloudinary credentials are VALID!');
    console.log('Response:', result);
  })
  .catch(error => {
    console.log('\n❌ Cloudinary credentials are INVALID!');
    console.log('Error:', error);
    console.log('\nPlease check:');
    console.log('1. Cloud name is correct (should match your Cloudinary account)');
    console.log('2. API key and secret are correct');
    console.log('3. Your Cloudinary account is active');
    console.log('\nGet your credentials from: https://cloudinary.com/console');
  });
