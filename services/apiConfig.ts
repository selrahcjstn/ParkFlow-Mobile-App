import Constants from "expo-constants";

type ExtraConfig = {
  apiUrl?: unknown;
};

const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/, "");

const readConfiguredUrl = (): string => {
  const extra = Constants.expoConfig?.extra as ExtraConfig | undefined;
  const manifestExtra = (Constants as any).manifest2?.extra?.expoClient?.extra as ExtraConfig | undefined;

  return String(
    process.env.EXPO_PUBLIC_API_URL ||
      process.env.VITE_API_URL ||
      extra?.apiUrl ||
      manifestExtra?.apiUrl ||
      "",
  ).trim();
};

export const getApiUrl = (): string => {
  const configuredUrl = readConfiguredUrl();

  if (!configuredUrl) {
    return "";
  }

  let parsed: URL;
  try {
    parsed = new URL(configuredUrl);
  } catch {
    throw new Error(
      `Invalid API URL: "${configuredUrl}". Set EXPO_PUBLIC_API_URL to an absolute http(s) URL ending in /api.`,
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(
      `Invalid API URL protocol: "${parsed.protocol}". Use an http:// or https:// API URL.`,
    );
  }

  return trimTrailingSlashes(parsed.toString());
};

export const API_URL = getApiUrl();

// Base server URL (without /api), used by SignalR and document URLs.
export const SERVER_BASE_URL = API_URL.replace(/\/api\/?$/, "");

export const getApiConfigurationError = (): string | null => {
  if (!API_URL) {
    return "The API server URL is not configured. Set EXPO_PUBLIC_API_URL and rebuild the app.";
  }

  return null;
};
