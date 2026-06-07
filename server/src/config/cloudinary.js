const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const multer = require('multer');
const path = require('path');

const S3_REGION = process.env.AWS_REGION;
const S3_BUCKET = process.env.AWS_S3_BUCKET;
const S3_PUBLIC_BASE_URL = (process.env.AWS_S3_PUBLIC_BASE_URL || '').replace(/\/+$/, '');
const S3_ENDPOINT = (process.env.AWS_S3_ENDPOINT || '').replace(/\/+$/, '');
const S3_FORCE_PATH_STYLE = ['1', 'true', 'yes'].includes((process.env.AWS_S3_FORCE_PATH_STYLE || '').toLowerCase());
const hasS3Config = Boolean(S3_REGION && S3_BUCKET);
const hasStaticCredentials = Boolean(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY
);

const s3 = hasS3Config
  ? new S3Client({
      region: S3_REGION,
      endpoint: S3_ENDPOINT || undefined,
      forcePathStyle: S3_FORCE_PATH_STYLE,
      ...(hasStaticCredentials
        ? {
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
          }
        : {})
    })
  : null;

if (!hasS3Config) {
  console.warn('WARNING: AWS S3 is not configured. Set AWS_REGION and AWS_S3_BUCKET.');
} else if (hasStaticCredentials) {
  console.log(`AWS S3 storage configured for bucket: ${S3_BUCKET} (${S3_REGION}) using static credentials`);
} else {
  console.log(`AWS S3 storage configured for bucket: ${S3_BUCKET} (${S3_REGION}) using the default AWS credential chain`);
}

const DEFAULT_FOLDER_BY_RESOURCE = {
  image: 'animal-listings/images',
  video: 'animal-listings/videos',
  raw: 'animal-listings/files'
};

const MIME_EXTENSION_MAP = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'video/x-msvideo': '.avi',
  'application/pdf': '.pdf'
};

const normalizeFolder = (folder) => (folder || '')
  .replace(/\\/g, '/')
  .replace(/^\/+/, '')
  .replace(/\/+$/, '');

const encodeKeyForUrl = (key) => key
  .split('/')
  .filter(Boolean)
  .map((segment) => encodeURIComponent(segment))
  .join('/');

const inferResourceType = (file, explicitType) => {
  if (explicitType) {
    return explicitType;
  }

  if (file?.mimetype?.startsWith('video/')) {
    return 'video';
  }

  return 'image';
};

const resolveUploadOptions = (file, folderOrType, resourceType) => {
  if (folderOrType === 'image' || folderOrType === 'video' || folderOrType === 'raw') {
    const resolvedResourceType = folderOrType;
    return {
      resourceType: resolvedResourceType,
      folder: DEFAULT_FOLDER_BY_RESOURCE[resolvedResourceType]
    };
  }

  const resolvedResourceType = inferResourceType(file, resourceType);
  const resolvedFolder = normalizeFolder(folderOrType) || DEFAULT_FOLDER_BY_RESOURCE[resolvedResourceType] || DEFAULT_FOLDER_BY_RESOURCE.image;

  return {
    resourceType: resolvedResourceType,
    folder: resolvedFolder
  };
};

const getFileExtension = (file, resourceType) => {
  const fromOriginalName = path.extname(file?.originalname || '').toLowerCase();
  if (fromOriginalName) {
    return fromOriginalName;
  }

  if (file?.mimetype && MIME_EXTENSION_MAP[file.mimetype]) {
    return MIME_EXTENSION_MAP[file.mimetype];
  }

  return resourceType === 'video' ? '.mp4' : '.jpg';
};

const buildObjectKey = (file, folder, resourceType) => {
  const extension = getFileExtension(file, resourceType);
  const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
  return normalizeFolder(folder) ? `${normalizeFolder(folder)}/${uniqueName}` : uniqueName;
};

const buildPublicUrl = (key) => {
  const encodedKey = encodeKeyForUrl(key);

  if (S3_PUBLIC_BASE_URL) {
    return `${S3_PUBLIC_BASE_URL}/${encodedKey}`;
  }

  if (S3_ENDPOINT) {
    if (S3_FORCE_PATH_STYLE) {
      return `${S3_ENDPOINT}/${S3_BUCKET}/${encodedKey}`;
    }

    return `${S3_ENDPOINT}/${encodedKey}`;
  }

  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${encodedKey}`;
};

const extractKeyFromValue = (publicIdOrUrl) => {
  if (!publicIdOrUrl) {
    return null;
  }

  if (!String(publicIdOrUrl).startsWith('http')) {
    return String(publicIdOrUrl).replace(/^\/+/, '');
  }

  try {
    const parsedUrl = new URL(publicIdOrUrl);
    const rawPath = decodeURIComponent(parsedUrl.pathname || '').replace(/^\/+/, '');

    if (S3_PUBLIC_BASE_URL && publicIdOrUrl.startsWith(S3_PUBLIC_BASE_URL)) {
      return rawPath;
    }

    if (rawPath.startsWith(`${S3_BUCKET}/`)) {
      return rawPath.slice(S3_BUCKET.length + 1);
    }

    return rawPath;
  } catch (error) {
    console.error('Failed to parse storage URL for deletion:', error);
    return null;
  }
};

const ensureS3Configured = () => {
  if (!s3 || !S3_BUCKET) {
    throw new Error('AWS S3 is not configured. Set AWS_REGION and AWS_S3_BUCKET, and provide credentials via IAM role or AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY.');
  }
};

const uploadFields = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024
  }
}).fields([
  { name: 'frontPhoto', maxCount: 1 },
  { name: 'sidePhoto', maxCount: 1 },
  { name: 'milkScenePhoto', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]);

const uploadToCloudinary = async (file, folderOrType, resourceType) => {
  ensureS3Configured();

  const buffer = file?.buffer || file;
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('Invalid file buffer type');
  }

  const { folder, resourceType: resolvedResourceType } = resolveUploadOptions(file, folderOrType, resourceType);
  const key = buildObjectKey(file, folder, resolvedResourceType);

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file?.mimetype || (resolvedResourceType === 'video' ? 'video/mp4' : 'image/jpeg'),
      CacheControl: resolvedResourceType === 'image'
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=86400'
    }
  });

  const result = await upload.done();

  return {
    secure_url: buildPublicUrl(key),
    public_id: key,
    key,
    bucket: S3_BUCKET,
    resource_type: resolvedResourceType,
    etag: result?.ETag || null
  };
};

const deleteFromCloudinary = async (publicIdOrUrl, resourceType = 'image') => {
  ensureS3Configured();

  const key = extractKeyFromValue(publicIdOrUrl);
  if (!key) {
    return {
      result: 'not_found',
      deleted: null,
      resource_type: resourceType
    };
  }

  await s3.send(new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key
  }));

  return {
    result: 'ok',
    deleted: key,
    resource_type: resourceType
  };
};

module.exports = {
  cloudinary: null,
  s3,
  uploadFields,
  uploadToCloudinary,
  uploadToStorage: uploadToCloudinary,
  deleteFromCloudinary,
  deleteFromStorage: deleteFromCloudinary
};
