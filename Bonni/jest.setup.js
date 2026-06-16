/* eslint-env jest */

/**
 * Jest setup for Bonni.
 *
 * The full-app render test (`__tests__/App.test.tsx`) mounts <App />, which pulls
 * in the Attentive SDK and a couple of native-only libraries. None of those native
 * modules exist in the Jest environment, so we stub them here to keep the smoke
 * test focused on the JS render path.
 */

import { NativeModules } from 'react-native'

// A native-module stub: every property is a jest.fn returning a resolved Promise,
// without masquerading as a thenable or exposing phantom symbol props.
const nativeModuleStub = () =>
  new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (typeof prop !== 'string' || prop === 'then') {
          return undefined
        }
        return jest.fn(() => Promise.resolve())
      },
    },
  )

// The SDK source resolves the *repo-root* copy of react-native (the host app
// bundles its own), so a NativeModules stub set here wouldn't reach it. Instead
// mock the SDK's native-module file directly: it default-exports the native
// module, and the public API (src/index.tsx) wraps that export. Stubbing it lets
// the real JS wrappers run while the bridge calls become no-ops. Both import
// styles used in Bonni — '../src' and '@attentive-mobile/attentive-react-native-sdk'
// — resolve through this same file.
jest.mock('../src/NativeAttentiveReactNativeSdk', () => ({
  __esModule: true,
  default: nativeModuleStub(),
}))

// App.tsx builds `new NativeEventEmitter(NativeModules.AttentiveReactNativeSdk)`
// against Bonni's own react-native copy, so stub that module here too (needs
// addListener / removeListeners, which the proxy provides).
NativeModules.AttentiveReactNativeSdk = nativeModuleStub()

// AsyncStorage ships an official jest mock.
jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

// @react-native-community/push-notification-ios has no bundled jest mock; stub the
// surface App.tsx uses so iOS push setup runs as no-ops during the render test.
jest.mock('@react-native-community/push-notification-ios', () => ({
  __esModule: true,
  default: {
    checkPermissions: jest.fn((cb) => cb && cb({})),
    requestPermissions: jest.fn(() => Promise.resolve({})),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
    addNotificationRequest: jest.fn(),
    removeAllDeliveredNotifications: jest.fn(),
    getDeliveredNotifications: jest.fn((cb) => cb && cb([])),
    FetchResult: { NoData: 'UIBackgroundFetchResultNoData' },
  },
}))
