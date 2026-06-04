const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('mjs');
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = true;

// Custom resolver to fix relative imports with explicit .js extensions in ESM node_modules packages (like TanStack Query v5)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if ((moduleName.startsWith('./') || moduleName.startsWith('../')) && moduleName.endsWith('.js')) {
    const modifiedModuleName = moduleName.replace(/\.js$/, '');
    return context.resolveRequest(context, modifiedModuleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });