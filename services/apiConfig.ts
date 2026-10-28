import Constants from "expo-constants";

// There is deliberately no remote fallback: a release must configure its TLS endpoint.
export const DEFAULT_API_URL = "";
type ExtraConfig = { apiUrl?: unknown };

const configuredUrl = (): string => {
  const extra = Constants.expoConfig?.extra as ExtraConfig | undefined;
  const manifestExtra = (Constants as any).manifest2?.extra?.expoClient?.extra as ExtraConfig | undefined;
  return String(process.env.EXPO_PUBLIC_API_URL || process.env.VITE_API_URL || extra?.apiUrl || manifestExtra?.apiUrl || "").trim();
};

const resolve = (): { url: string; error: string | null } => {
  try {
    const raw = configuredUrl();
    const parsed = new URL(raw);
    const developmentHttp = typeof __DEV__ !== "undefined" && __DEV__ && process.env.EXPO_PUBLIC_ALLOW_LOCAL_HTTP === "true";
    if ((parsed.protocol !== "https:" && !(developmentHttp && parsed.protocol === "http:")) || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname.replace(/\/+$/, "") !== "/api" || /[\\\x00-\x1f\x7f?#]/.test(raw) || !/^https?:\/\//i.test(raw))
      throw new Error("Invalid API transport");
    return { url: parsed.toString().replace(/\/+$/, ""), error: null };
  } catch {
    // Never echo configuration values: malformed URLs can contain credentials.
    return { url: "", error: "Configure EXPO_PUBLIC_API_URL with an HTTPS API endpoint. Local HTTP requires an explicit development build and EXPO_PUBLIC_ALLOW_LOCAL_HTTP=true." };
  }
};

const configuration = resolve();
export const getApiUrl = (): string => configuration.url;
export const API_URL = getApiUrl();
export const SERVER_BASE_URL = API_URL.replace(/\/api\/?$/, "");
export const getApiConfigurationError = (): string | null => configuration.error;
