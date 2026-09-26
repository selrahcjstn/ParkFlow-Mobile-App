import { Platform } from "react-native";
import * as ExpoSecureStore from "expo-secure-store";

/**
 * Cross-platform storage helper.
 * Uses native KeyStore/KeyChain (expo-secure-store) on iOS and Android,
 * and falls back to window.localStorage on Web.
 */
export const SecureStore = {
  async getItemAsync(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      try {
        return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
      } catch {
        return null;
      }
    }
    try {
      return await ExpoSecureStore.getItemAsync(key);
    } catch (e) {
      console.warn(`[SecureStore] Failed to get "${key}":`, e);
      return null;
    }
  },

  async setItemAsync(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, value);
        }
      } catch {}
      return;
    }
    try {
      await ExpoSecureStore.setItemAsync(key, value);
    } catch (e) {
      console.warn(`[SecureStore] Failed to set "${key}":`, e);
    }
  },

  async deleteItemAsync(key: string): Promise<void> {
    if (Platform.OS === "web") {
      try {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(key);
        }
      } catch {}
      return;
    }
    try {
      await ExpoSecureStore.deleteItemAsync(key);
    } catch (e) {
      console.warn(`[SecureStore] Failed to delete "${key}":`, e);
    }
  },
};

export default SecureStore;
