import axios from "axios";
import * as SecureStore from "expo-secure-store";

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const { useAuthStore } = require("@/features/auth/store/auth.store");
        const store = useAuthStore.getState();

        // Clear session token and reset state
        await store.logout();

        // Redirect to login screen
        const { router } = require("expo-router");
        router.replace("/(auth)/login");
      } catch (e) {
        console.error("[axios] session expiration redirect failed", e);
      }

      // Mute the throw so calling components don't receive rejection and show Toast/alert messages
      return new Promise(() => {});
    }

    return Promise.reject(error);
  },
);
