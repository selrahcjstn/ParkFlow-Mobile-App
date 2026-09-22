import Constants from "expo-constants";

const DEFAULT_API_URL = "http://localhost:5000/api";

const normalizeApiUrl = (rawUrl?: string): string | null => {
  if (!rawUrl) return null;

  try {
    const parsed = new URL(rawUrl.trim());
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    const cleanPath = parsed.pathname.replace(/\/+$/, "");
    if (!cleanPath || cleanPath === "/") {
      parsed.pathname = "/api";
    } else if (/\/api$/i.test(cleanPath)) {
      parsed.pathname = cleanPath;
    } else if (/\/api\/api$/i.test(cleanPath)) {
      parsed.pathname = cleanPath.replace(/\/api\/api$/i, "/api");
    } else {
      parsed.pathname = `${cleanPath}/api`;
    }

    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
};

const resolveApiUrl = (): { url: string; source: "env" | "appConfig" | "manifest" | "fallback" } => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL || process.env.VITE_API_URL;
  const configUrl = Constants.expoConfig?.extra?.apiUrl;
  const manifestUrl = (Constants as any).manifest2?.extra?.expoClient?.extra?.apiUrl;

  const candidates: Array<{ value: string | undefined; source: "env" | "appConfig" | "manifest" }> = [
    { value: envUrl, source: "env" },
    { value: configUrl, source: "appConfig" },
    { value: manifestUrl, source: "manifest" },
  ];

  for (const candidate of candidates) {
    const normalized = normalizeApiUrl(candidate.value);
    if (normalized) {
      return { url: normalized, source: candidate.source };
    }
  }

  return { url: DEFAULT_API_URL, source: "fallback" };
};

const resolvedApiConfig = resolveApiUrl();
export const API_URL = resolvedApiConfig.url;
export const API_URL_SOURCE = resolvedApiConfig.source;

// Base server URL (without /api)
export const SERVER_BASE_URL = API_URL.replace(/\/api\/?$/, "");
