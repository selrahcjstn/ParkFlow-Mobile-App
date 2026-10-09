/** Keep registration failures understandable while preserving backend validation messages. */
export function getRegistrationErrorMessage(error: unknown, fallback = "Could not save your registration. Please try again."): string {
  const failure = error as { code?: string; message?: string; response?: { status?: number; data?: any } } | null;
  if (failure?.code === "ECONNABORTED" || failure?.code === "ETIMEDOUT")
    return "The request took too long. Please try again. Your registration progress is saved.";
  if (failure?.code === "ERR_NETWORK")
    return "Could not reach ParkFlow. Please try again. Your registration progress is saved.";
  if (failure?.response?.status === 401)
    return "Your sign-in has expired. Please sign in again to continue your saved registration.";
  if ((failure?.response?.status ?? 0) >= 500)
    return "ParkFlow could not process your submission. Please try again later.";

  const data = failure?.response?.data ?? error;
  if (data && typeof data === "object") {
    const errors = (data as any).errors;
    const messages = errors && typeof errors === "object"
      ? Object.values(errors).flat().filter((message): message is string => typeof message === "string" && !!message.trim())
      : [];
    if (messages.length) return messages.join(" ");
    if (typeof (data as any).message === "string" && (data as any).message.trim()) return (data as any).message;
  }
  // Do not replace a helpful form fallback with Axios' generic HTTP status text.
  if (failure?.response) return fallback;
  return failure?.message?.trim() || fallback;
}
