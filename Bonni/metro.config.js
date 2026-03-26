const path = require('path')
const escape = require('escape-string-regexp')
const exclusionList = require('metro-config/src/defaults/exclusionList')
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const pak = require('../package.json')

const root = path.resolve(__dirname, '..')
const bonniNodeModules = path.join(__dirname, 'node_modules')

// Peer deps of the SDK – must come from Bonni's node_modules, not the SDK root's
const modules = Object.keys({
  ...pak.peerDependencies,
})

const defaultConfig = getDefaultConfig(__dirname)

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  projectRoot: __dirname,

  // Watch the SDK source so Metro picks up changes without publishing
  watchFolders: [root],

  resolver: {
    // Prevent Metro from picking up peer dep copies from the SDK root's node_modules
    blockList: exclusionList(
      modules.map(
        (m) =>
          new RegExp(`^${escape(path.join(root, 'node_modules', m))}\\/.*$`)
      )
    ),

    // Redirect peer deps to Bonni's own node_modules so there's only one copy
    extraNodeModules: modules.reduce((acc, name) => {
      acc[name] = path.join(bonniNodeModules, name)
      return acc
    }, {}),

    // Ensure every package (including transitive deps of @react-navigation/* etc.)
    // resolves from Bonni's node_modules when the hierarchical walk-up fails
    nodeModulesPaths: [bonniNodeModules],

    // SVG support
    assetExts: defaultConfig.resolver.assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
  },

  transformer: {
    ...defaultConfig.transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
}

module.exports = mergeConfig(defaultConfig, config)
