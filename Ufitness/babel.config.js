module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo (SDK 54+) adds the react-native-worklets plugin for Reanimated 4 automatically.
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
