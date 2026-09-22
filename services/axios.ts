import axios from "axios";
import { SecureStore } from "./storage";
import { API_URL, API_URL_SOURCE } from "./apiConfig";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const url = config.url ?? "";
  const isPublicAuthRoute =
    url.includes("/auth/register") ||
    url.includes("/auth/send-email-otp") ||
    url.includes("/auth/verify-email-otp") ||
    url.includes("/auth/microsoft") ||
    url.includes("/users/login") ||
    url.includes("/users/forgot-password") ||
    url.includes("/users/verify-reset-code") ||
    url.includes("/users/reset-password");

  const token = await SecureStore.getItemAsync("token");

  if (token && !isPublicAuthRoute) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const url = error.config?.url ?? "";
    const status = error.response?.status;
    const responseData = error.response?.data;

    if (!error.response) {
      const configuredBaseUrl = error.config?.baseURL || API_URL;
      const sourceHint =
        API_URL_SOURCE === "fallback"
          ? "No API host is configured. Set EXPO_PUBLIC_API_URL to your active backend URL (prefer HTTPS)."
          : "Check API host/network reachability or update EXPO_PUBLIC_API_URL if the backend host changed.";
      error.message = `Unable to reach ParkFlow API at ${configuredBaseUrl}. ${sourceHint}`;

      console.warn(`[Axios Response] ${error.config?.method?.toUpperCase()} ${url} (network error)`, {
        code: error.code,
        baseURL: configuredBaseUrl,
        message: error.message,
      });

      return Promise.reject(error);
    }

    const isExpectedError =
      (status === 404 &&
        (url.includes("/profiles/me") ||
          url.includes("/cor-submissions") ||
          url.includes("/parking-logs/active") ||
          url.includes("/parking-reservations/verify-scan"))) ||
      (status === 409 && (url.includes("/parking-logs/entry") || url.includes("/parking-logs/exit"))) ||
      status === 400;

    if (!isExpectedError) {
      console.warn(`[Axios Response] ${error.config?.method?.toUpperCase()} ${url} (${status})`, {
        status,
        data: responseData,
        message: error.message,
      });
    }

    // Only auto-logout on 401 for NON-auth/onboarding endpoints.
    // During onboarding, a 401 should surface as a visible error to the user,
    // not silently redirect to login.
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

      return new Promise(() => {});
    }

    return Promise.reject(error);
  },
);
