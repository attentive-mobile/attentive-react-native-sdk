/**
 * Regression tests for App.tsx's SDK startup sequence (PR #102 review).
 *
 * Two ordering guarantees are easy to break and impossible to notice by hand:
 *
 * 1. initialize() must reach the SDK before identify(). Because the persisted
 *    push flag is read from AsyncStorage first, a fire-and-forget startup call
 *    lets the effect body continue and dispatch identify() while the iOS native
 *    SDK instance does not exist yet — the Objective-C bridge messages a nil
 *    instance, so the identify is dropped with no error, on every launch.
 * 2. When push is disabled, the app-side push flow must not run: it calls the OS
 *    permission APIs directly, so it would prompt the user and mint a token that
 *    the push-disabled SDK will never register.
 *
 * The SDK module is mocked here (rather than relying on jest.setup.js's native
 * module stub) so call order can be asserted via invocationCallOrder.
 */
import React from 'react'
import ReactTestRenderer, { act } from 'react-test-renderer'
import AsyncStorage from '@react-native-async-storage/async-storage'
import PushNotificationIOS from '@react-native-community/push-notification-ios'
import { CONFIG_STORAGE_KEYS } from '../src/constants/storage'

// App.tsx imports the SDK as '../src', which from Bonni/ resolves to the repo-root
// source. From this test file that same module is '../../src'.
jest.mock('../../src', () => ({
  initialize: jest.fn(),
  identify: jest.fn(),
  handleRegularOpen: jest.fn(),
  handleForegroundPush: jest.fn(),
  handlePushOpen: jest.fn(),
  registerDeviceTokenWithCallback: jest.fn(),
  registerForPushNotifications: jest.fn(),
  getPushAuthorizationStatus: jest.fn(() => Promise.resolve('authorized')),
}))

import App from '../App'
import * as sdk from '../../src'

const mockInitialize = sdk.initialize as jest.Mock
const mockIdentify = sdk.identify as jest.Mock
const mockGetItem = AsyncStorage.getItem as jest.Mock
const mockAddEventListener = PushNotificationIOS.addEventListener as jest.Mock

// Renders App and flushes the awaited storage read + init sequence. Fake timers
// keep the 300ms/500ms deferred work from firing after the test finishes.
const renderApp = async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer
  await act(async () => {
    renderer = ReactTestRenderer.create(<App />)
  })
  await act(async () => {})
  return renderer
}

describe('App SDK startup sequence', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockGetItem.mockResolvedValue(null)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('calls initialize() before identify()', async () => {
    const renderer = await renderApp()

    expect(mockInitialize).toHaveBeenCalledTimes(1)
    expect(mockIdentify).toHaveBeenCalledTimes(1)
    expect(mockInitialize.mock.invocationCallOrder[0]).toBeLessThan(
      mockIdentify.mock.invocationCallOrder[0]!
    )

    await act(async () => {
      renderer.unmount()
    })
  })

  it('passes the persisted pushEnabled=false through to initialize()', async () => {
    mockGetItem.mockImplementation((key: string) =>
      Promise.resolve(key === CONFIG_STORAGE_KEYS.PUSH_ENABLED ? 'false' : null)
    )

    const renderer = await renderApp()

    expect(mockInitialize).toHaveBeenCalledWith(
      expect.objectContaining({ pushEnabled: false })
    )

    await act(async () => {
      renderer.unmount()
    })
  })

  it('defaults pushEnabled to true when nothing is persisted', async () => {
    const renderer = await renderApp()

    expect(mockInitialize).toHaveBeenCalledWith(
      expect.objectContaining({ pushEnabled: true })
    )

    await act(async () => {
      renderer.unmount()
    })
  })

  it('skips the app-side push setup when push is disabled', async () => {
    mockGetItem.mockImplementation((key: string) =>
      Promise.resolve(key === CONFIG_STORAGE_KEYS.PUSH_ENABLED ? 'false' : null)
    )

    const renderer = await renderApp()

    // setupPushNotifications() registers the APNs listeners; with push disabled
    // it must not run, so no permission prompt and no token are requested.
    expect(mockAddEventListener).not.toHaveBeenCalled()

    await act(async () => {
      renderer.unmount()
    })
  })

  it('runs the app-side push setup when push is enabled', async () => {
    const renderer = await renderApp()

    expect(mockAddEventListener).toHaveBeenCalled()

    await act(async () => {
      renderer.unmount()
    })
  })
})
