// Keep listing file choices aligned with the server's S3 upload middleware.
export const LISTING_MEDIA_LIMIT = 25 * 1024 * 1024;
const types = {
  photo: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
};
export const listingMediaAccept = kind => types[kind].join(',');
export function listingMediaError(file, kind) {
  if (!file) return null;
  if (!types[kind]?.includes(file.type)) return kind === 'video' ? 'listing.invalidVideoType' : 'listing.invalidPhotoType';
  if (file.size <= 0) return 'listing.emptyFile';
  if (file.size > LISTING_MEDIA_LIMIT) return 'listing.fileTooLarge';
  return null;
}
