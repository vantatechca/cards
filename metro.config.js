const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable lazy bundling for web — ensures full bundle is sent in one request
config.server = {
  ...config.server,
  experimentalImportBundleSupport: false,
};

// Use CJS builds to avoid import.meta in ESM packages (e.g. zustand)
config.resolver.unstable_conditionNames = ['react-native', 'require', 'default'];

module.exports = config;
