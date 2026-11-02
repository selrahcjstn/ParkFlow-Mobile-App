module.exports = ({ config }) => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || process.env.VITE_API_URL || "http://54.90.173.98:5000/api";
  return {
    ...config,
    extra: { ...config.extra, apiUrl },
    ios: {
      ...config.ios,
      infoPlist: {
        ...config.ios?.infoPlist,
        NSAppTransportSecurity: { NSAllowsArbitraryLoads: true }
      }
    },
    android: {
      ...config.android,
      usesCleartextTraffic: true
    },
    plugins: (config.plugins || []).map(plugin => Array.isArray(plugin) && plugin[0] === "expo-build-properties"
      ? [plugin[0], { ...plugin[1], android: { ...plugin[1]?.android, usesCleartextTraffic: true } }] : plugin),
  };
};
