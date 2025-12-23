/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const path = require('path');

module.exports = {
  projectRoot: __dirname,
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    // Module resolution for absolute imports
    nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
    useWatchman: false,
    unstable_enableSymlinks: true,
    extraNodeModules: {
      App: path.resolve(__dirname, 'App'),
    },
  },
  watchFolders: [path.resolve(__dirname, 'App')],
};
