const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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
const uploadToCloudinary = async (file, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: resourceType,
      folder: resourceType === 'video' ? 'animal-listings/videos' : 'animal-listings/images'
    };

    if (resourceType === 'image') {
      uploadOptions.transformation = [
        { width: 1200, height: 1200, crop: 'limit', quality: 'auto' }
      ];
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    uploadStream.end(file.buffer);
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