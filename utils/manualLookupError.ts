import { isAxiosError } from "axios";

export function getManualLookupError(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401) return "Your session has expired. Please sign in again.";
    if (status === 403) return "You do not have permission to search plates. Contact an administrator.";
    if (status === 404) return "Manual entry is not available on this server yet. Ask an administrator to update ParkFlow.";
    if (status && status >= 500) return "ParkFlow could not check this plate. Please try again or contact an administrator.";
    if (!error.response && (error.request || ["ERR_NETWORK", "ECONNABORTED", "ETIMEDOUT"].includes(error.code ?? ""))) {
      return "Could not reach ParkFlow. Please try searching again.";
    }
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) return message;
    return "Could not check this plate. Please try again.";
  }
  return error instanceof Error && error.message
    ? error.message
    : "Could not check this plate. Please try again.";
}
