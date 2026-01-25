const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Log configuration status (without exposing secrets)
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn('WARNING: Cloudinary credentials are not fully configured');
} else {
  console.log(`Cloudinary configured for cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);
}

const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'animal-listings/images',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
      public_id: `${Date.now()}-${Math.round(Math.random() * 1000)}`
    };
  }
});

const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'animal-listings/videos',
      resource_type: 'video',
      allowed_formats: ['mp4', 'mov', 'avi', 'webm'],
      chunk_size: 6000000,
      public_id: `video-${Date.now()}-${Math.round(Math.random() * 1000)}`
    };
  }
});

// Helper function for mixed file upload
const uploadFields = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB max (for videos)
  }
}).fields([
  { name: 'frontPhoto', maxCount: 1 },
  { name: 'sidePhoto', maxCount: 1 },
  { name: 'milkScenePhoto', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]);

// Process and upload files to Cloudinary
const uploadToCloudinary = async (file, folder = 'animal-listings/images', resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    try {
      const uploadOptions = {
        resource_type: resourceType,
        folder: folder
      };

      if (resourceType === 'image') {
        uploadOptions.transformation = [
          { width: 1200, height: 1200, crop: 'limit', quality: 'auto' }
        ];
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // Handle both Buffer and file object with buffer property
      const buffer = file.buffer || file;

      // Ensure buffer is a Buffer instance
      if (Buffer.isBuffer(buffer)) {
        uploadStream.end(buffer);
      } else if (buffer instanceof ArrayBuffer) {
        uploadStream.end(Buffer.from(buffer));
      } else {
        reject(new Error('Invalid file buffer type'));
      }
    } catch (error) {
      console.error('Error in uploadToCloudinary:', error);
      reject(error);
    }
  });
};

const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

module.exports = { 
  cloudinary, 
  uploadFields, 
  uploadToCloudinary, 
  deleteFromCloudinary 
};