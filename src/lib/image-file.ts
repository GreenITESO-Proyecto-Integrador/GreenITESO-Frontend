const ACCEPTED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/webp',
]);

/** Types the browser leaves blank. The server checks the file signature. */
const UNSNIFFED_MIME_TYPES = new Set(['', 'application/octet-stream']);

export const IMAGE_FILE_ACCEPT =
  'image/jpeg,image/jpg,image/pjpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';

/**
 * Accept JPEG, PNG, and WEBP, including the `image/jpg` label some phones send.
 * A missing type is left for the server, which reads the file signature.
 */
export function isAcceptedImageFile(file: File): boolean {
  const type = file.type.trim().toLowerCase();
  return ACCEPTED_IMAGE_MIME_TYPES.has(type) || UNSNIFFED_MIME_TYPES.has(type);
}
