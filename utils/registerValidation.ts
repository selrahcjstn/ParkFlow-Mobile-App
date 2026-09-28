export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^\+?\d{10,15}$/;
export const NAME_REGEX = /^[A-Za-z][A-Za-z' -]{1,49}$/;
export const PLATE_REGEX = /^[A-Za-z0-9-]{4,12}$/;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

/** Mirrors the password rules enforced by the ParkFlow API. */
export function getPasswordValidationError(password: string): string | null {
  if (!password) return "Password is required.";
  if (password !== password.trim()) {
    return "Password cannot start or end with spaces.";
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Password must not exceed ${MAX_PASSWORD_LENGTH} characters.`;
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter.";
  }
  if (!/\d/.test(password)) {
    return "Password must contain at least one number.";
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) {
    return "Password must contain at least one special character.";
  }

  return null;
}
