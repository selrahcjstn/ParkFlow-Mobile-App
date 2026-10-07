import axios from "axios";
import { SecureStore } from "./storage";
import { API_URL, getApiConfigurationError } from "./apiConfig";
import { clearNetworkError, reportNetworkError } from "./networkError";

export const api = axios.create({
  baseURL: API_URL || undefined,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const url = config.url ?? "";
  const options = config as typeof config & { handleNetworkErrorLocally?: boolean };
  if (options.handleNetworkErrorLocally) config.timeout = 15000;
  const isPublicAuthRoute =
    url.includes("/auth/register") ||
    url.includes("/auth/send-email-otp") ||
    url.includes("/auth/verify-email-otp") ||
    url.includes("/auth/microsoft") ||
    url.includes("/users/login") ||
    url.includes("/users/forgot-password") ||
    url.includes("/users/verify-reset-code") ||
    url.includes("/users/reset-password");

  const configurationError = getApiConfigurationError();
  if (configurationError) {
    const error = new Error(configurationError) as Error & { code?: string };
    error.code = "ERR_API_CONFIGURATION";
    reportNetworkError({
      kind: "configuration",
      message: configurationError,
      baseURL: API_URL,
      requestUrl: url,
      code: error.code,
    });
    return Promise.reject(error);
  }

  const token = await SecureStore.getItemAsync("token");

  if (token && !isPublicAuthRoute) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Handle multipart/form-data properly in React Native
  // Stripping manual Content-Type allows React Native's XMLHttpRequest to inject the correct boundary
  const isFormData =
    config.data &&
    (config.data instanceof FormData ||
      (typeof config.data === "object" && "_parts" in config.data));

  if (isFormData) {
    delete (config.headers as any)["Content-Type"];
    config.transformRequest = [(data) => data];
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    clearNetworkError();
    return response.data;
  },
  async (error) => {
    const url = error.config?.url ?? "";
    const status = error.response?.status;
    const responseData = error.response?.data;

    // A cancelled request or a local exception is not proof of lost connectivity.
    if (axios.isCancel(error)) return Promise.reject(error);
    const isTransportFailure = !error.response && (
      error.code === "ERR_NETWORK" ||
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT" ||
      Boolean(error.request)
    );
    if (isTransportFailure) {
      const networkMessage =
        "Cannot reach the ParkFlow API. Check the configured API URL, server status, firewall/security-group rules, and device internet connection.";
      error.code = error.code || "ERR_NETWORK";
      error.userMessage = networkMessage;
      if (!error.config?.handleNetworkErrorLocally) reportNetworkError({
        kind: error.code === "ERR_API_CONFIGURATION" ? "configuration" : "network",
        message: error.userMessage,
        baseURL: error.config?.baseURL || API_URL,
        requestUrl: url,
        code: error.code,
      });

      console.error("[Axios Network Error]", {
        method: error.config?.method?.toUpperCase(),
        requestUrl: url,
        baseURL: error.config?.baseURL || API_URL || "<missing>",
        message: error.message,
        code: error.code,
      });
    }

    const isExpectedError =
      (status === 404 &&
        (url.includes("/profiles/me") ||
          url.includes("/cor-submissions") ||
          url.includes("/parking-logs/active") ||
          url.includes("/parking-reservations/verify-scan"))) ||
      (status === 409 && (url.includes("/parking-logs/entry") || url.includes("/parking-logs/exit"))) ||
      (status === 500 && url.includes("/parking-logs/active")) ||
      status === 400;

    if (!isExpectedError && error.response) {
      console.warn(`[Axios Response] ${error.config?.method?.toUpperCase()} ${url} (${status})`, {
        status,
        data: responseData,
        message: error.message,
      });
    }

    const isOnboardingOrAuth =
      url.startsWith("/onboarding") ||
      url.startsWith("/auth") ||
      url.startsWith("/users/login") ||
      url.includes("/profiles/me");

    if (status === 401 && !isOnboardingOrAuth) {
      console.warn(`[Axios Interceptor] Global 401 Redirect triggered for ${url}`);
      try {
        const { useAuthStore } = require("@/features/auth/store/auth.store");
        const store = useAuthStore.getState();
        await store.logout();
        const { router } = require("expo-router");
        router.replace("/(auth)/login");
      } catch (e) {
        console.error("[axios] session expiration redirect failed", e);
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);
