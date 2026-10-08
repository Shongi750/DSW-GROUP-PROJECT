const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

// Old, unused screens live in _archive/ — never bundle them.
const archiveFolder = /[\\/]_archive[\\/].*/;
config.resolver.blockList = [].concat(config.resolver.blockList || [], archiveFolder);

module.exports = withNativeWind(config, { input: './global.css' });
