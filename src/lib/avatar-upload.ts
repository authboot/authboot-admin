// ============================================================
// Avatar upload — shared limits
// ============================================================
// Used by the avatar upload control and by the BFF routes that forward
// avatars (/api/users/[id]/avatar and /api/auth/me/avatar).
// Keep in sync with authboot-server's utils.ValidateAvatar (pkg/utils):
// it decodes the image and accepts JPEG / PNG / GIF up to 5 MB.

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export const AVATAR_ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/gif'];

export const AVATAR_REQUIREMENTS = 'PNG, JPG, or GIF, up to 5 MB.';

/** Returns a user-facing problem with the selected file, or null when it can be uploaded. */
export function getAvatarFileError(file: File): string | null {
  if (!AVATAR_ACCEPTED_TYPES.includes(file.type)) return 'Use a PNG, JPG, or GIF image.';
  if (file.size === 0) return 'The selected image is empty.';
  if (file.size > AVATAR_MAX_BYTES) return 'The image must be 5 MB or smaller.';
  return null;
}
