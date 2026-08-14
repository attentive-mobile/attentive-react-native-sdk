import { createRequire } from 'module'
import type * as ExpoConfigPlugins from 'expo/config-plugins'

// 'expo/config-plugins' must always be the app's copy (see CLAUDE.md), and a
// bare require normally finds it: standard apps install this SDK next to
// expo, and pnpm resolves it through our optional peer dependency. In
// workspace monorepos, however, the SDK can be hoisted to the workspace root
// while expo stays in the app's own node_modules — off the walk-up path from
// this file — so fall back to resolving from the prebuild working directory,
// which @expo/cli sets to the app's project root.
function load(): { module: typeof ExpoConfigPlugins; resolvedPath: string } {
  try {
    return {
      // Bare specifier (not the resolved absolute path) so test frameworks
      // and bundlers can interpose on the common path.
      module: require('expo/config-plugins'),
      resolvedPath: require.resolve('expo/config-plugins'),
    }
  } catch {
    try {
      const resolvedPath = require.resolve('expo/config-plugins', {
        paths: [process.cwd()],
      })
      return { module: require(resolvedPath), resolvedPath }
    } catch {
      throw new Error(
        '[attentive-react-native-sdk] Could not resolve expo/config-plugins ' +
          'from the SDK package or from the project root. The Expo config ' +
          'plugin requires the expo package (SDK 50+) installed in the app. ' +
          'In a monorepo, run prebuild from the app directory.'
      )
    }
  }
}

const loaded = load()

export const configPlugins = loaded.module

// Resolves modules as if from inside the app's expo/config-plugins — used to
// reach internal files that pre-SDK-54 versions don't re-export publicly.
export const requireFromExpoConfigPlugins = createRequire(loaded.resolvedPath)
