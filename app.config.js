const { requireHttpsApi } = require("./scripts/validate-release-api.cjs");
module.exports = ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE;
  const development = profile === "development" || (!profile && process.env.NODE_ENV !== "production" && process.env.EXPO_PUBLIC_ALLOW_LOCAL_HTTP === "true");
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || process.env.VITE_API_URL;
  const resolved = development ? apiUrl : requireHttpsApi(apiUrl);
  return {
    ...config,
    extra: { ...config.extra, apiUrl: resolved },
    ios: { ...config.ios, infoPlist: { ...config.ios?.infoPlist, NSAppTransportSecurity: { NSAllowsArbitraryLoads: development } } },
    android: { ...config.android, usesCleartextTraffic: development },
    plugins: (config.plugins || []).map(plugin => Array.isArray(plugin) && plugin[0] === "expo-build-properties"
      ? [plugin[0], { ...plugin[1], android: { ...plugin[1]?.android, usesCleartextTraffic: development } }] : plugin),
  };
};
