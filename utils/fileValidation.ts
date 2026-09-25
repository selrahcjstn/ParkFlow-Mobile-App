export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // 5,242,880 bytes

export interface FileValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Validates that a file asset does not exceed the allowed maximum size in megabytes.
 *
 * @param file The file or asset to validate (must have a `size` property in bytes)
 * @param maxSizeMb Maximum allowable file size in MB (defaults to 5MB)
 * @returns Result object with `isValid` and an optional user-facing error message
 */
export function validateFileSize(
  file: { size?: number | null; name?: string } | null | undefined,
  maxSizeMb: number = MAX_FILE_SIZE_MB,
): FileValidationResult {
  if (!file) {
    return { isValid: false, message: "No file selected." };
  }

  const maxBytes = maxSizeMb * 1024 * 1024;
  if (typeof file.size === "number" && file.size > maxBytes) {
    return {
      isValid: false,
      message: `File size exceeds the ${maxSizeMb}MB limit. Please select a smaller document.`,
    };
  }

  return { isValid: true };
}

/**
 * Formats a file size in bytes to a human-readable string (Bytes, KB, MB).
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 Bytes";
  const k = 1024;
  const dm = 1;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const unitIndex = Math.min(i, sizes.length - 1);
  return parseFloat((bytes / Math.pow(k, unitIndex)).toFixed(dm)) + " " + sizes[unitIndex];
}
