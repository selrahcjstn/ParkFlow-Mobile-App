import Constants from "expo-constants";

export const DEFAULT_API_URL = "http://54.90.173.98:5000/api";

type ExtraConfig = {
  apiUrl?: unknown;
};

const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/, "");

const readConfiguredUrl = (): string => {
  const extra = Constants.expoConfig?.extra as ExtraConfig | undefined;
  const manifestExtra = (Constants as any).manifest2?.extra?.expoClient?.extra as ExtraConfig | undefined;

  const raw = String(
    process.env.EXPO_PUBLIC_API_URL ||
      process.env.VITE_API_URL ||
      extra?.apiUrl ||
      manifestExtra?.apiUrl ||
      DEFAULT_API_URL,
  ).trim();

  return raw || DEFAULT_API_URL;
};

export const getApiUrl = (): string => {
  const configuredUrl = readConfiguredUrl();

  let parsed: URL;
  try {
    parsed = new URL(configuredUrl);
  } catch {
    console.warn(`[apiConfig] Invalid API URL: "${configuredUrl}". Falling back to default: ${DEFAULT_API_URL}`);
    return DEFAULT_API_URL;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    console.warn(`[apiConfig] Invalid API URL protocol: "${parsed.protocol}". Falling back to default: ${DEFAULT_API_URL}`);
    return DEFAULT_API_URL;
  }

  return trimTrailingSlashes(parsed.toString());
};

export const API_URL = getApiUrl();

// Base server URL (without /api), used by SignalR and document URLs.
export const SERVER_BASE_URL = (API_URL || DEFAULT_API_URL).replace(/\/api\/?$/, "");

export const getApiConfigurationError = (): string | null => {
  if (!API_URL) {
    return "The API server URL is not configured. Set EXPO_PUBLIC_API_URL and rebuild the app.";
  }

  return null;
};
