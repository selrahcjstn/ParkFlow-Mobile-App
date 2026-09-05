import Constants from "expo-constants";

export const getApiUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL || process.env.VITE_API_URL;
  const configUrl = Constants.expoConfig?.extra?.apiUrl;
  const manifestUrl = (Constants as any).manifest2?.extra?.expoClient?.extra?.apiUrl;

  const resolved = envUrl || configUrl || manifestUrl || "http://54.90.173.98:5000/api";
  
  // Ensure no trailing slash
  return resolved.replace(/\/$/, "");
};

export const API_URL = getApiUrl();

// Base server URL (without /api)
export const SERVER_BASE_URL = API_URL.replace(/\/api\/?$/, "");
