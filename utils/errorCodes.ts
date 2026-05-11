/**
 * Maps backend `errorCode` values to user-friendly messages.
 * The app relies on these instead of the raw backend `message` field
 * so that wording stays consistent and localisation-friendly.
 */
const ERROR_CODE_MAP: Record<number, string> = {
  // ── Auth / Login ──────────────────────────────
  0: "Something went wrong. Please try again.",
  400: "Please check your input and try again.",
  401: "Invalid email or password. Please try again.",
  403: "Your account has been suspended. Contact support.",
  404: "No account found with that email address.",
  409: "An account with this email already exists.",
  422: "Please fill in all required fields correctly.",
  429: "Too many attempts. Please wait a moment and try again.",

  // ── Server ────────────────────────────────────
  500: "Server error. Please try again later.",
  503: "Service is temporarily unavailable. Please try again later.",
};

/**
 * Returns a user-friendly error message for the given `errorCode`.
 * Falls back to a generic message if the code isn't mapped.
 */
export function getErrorMessage(errorCode: number): string {
  return ERROR_CODE_MAP[errorCode] ?? "An unexpected error occurred. Please try again.";
}
