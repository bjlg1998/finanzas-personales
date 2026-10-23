const { getDefaultConfig } = require('metro-config');

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);
  config.projectRoot = __dirname;
  config.resetCache = true;
  config.resolver.useWatchman = false;
  config.watchFolders = [__dirname];
  config.maxWorkers = 2;
  config.resolver.sourceExts = ['js', 'jsx', 'json', 'ts', 'tsx'];
  config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
  config.resolver.unstable_conditionNames = ['require', 'react-native'];
  config.transformer.babelTransformerPath = require.resolve('@react-native/metro-babel-transformer');
  config.transformer.assetRegistryPath = 'react-native/Libraries/Image/AssetRegistry';
  config.serializer.getModulesRunBeforeMainModule = () => [require.resolve('react-native/Libraries/Core/InitializeCore')];
  config.serializer.getPolyfills = () => require('@react-native/js-polyfills')();
  config.transformer.getTransformOptions = async () => ({transform:{experimentalImportSupport:false,inlineRequires:true}});
  return config;
})();
