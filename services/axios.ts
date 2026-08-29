import axios from "axios";
import * as SecureStore from "expo-secure-store";

export const api = axios.create({
  baseURL:
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.VITE_API_URL ||
    "http://54.90.173.98:5000/api",
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
  console.log(`[Axios Request] ${config.method?.toUpperCase()} ${config.url}`, {
    hasToken: !!token,
    tokenSnippet: token ? `${token.substring(0, 15)}...` : null,
    isPublicAuthRoute,
  });

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

    console.error(`[Axios Error] ${error.config?.method?.toUpperCase()} ${url}`, {
      status,
      data: responseData,
      message: error.message,
    });

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
