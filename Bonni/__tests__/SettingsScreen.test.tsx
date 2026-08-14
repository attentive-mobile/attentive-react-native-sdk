/**
 * SettingsScreen regression tests.
 *
 * clearUser call count (MSDK-406): the "Clear User" and "Log Out" buttons must
 * each invoke the SDK's clearUser() exactly once per press. "Clear User"
 * previously fired it twice — once via a direct SDK import and once via
 * useAttentiveUser().clearUserIdentification() (which itself calls clearUser) —
 * producing a duplicate user-update call and a double visitor-ID rotation.
 * Both handlers reach clearUser() through the useAttentiveUser hook, so a
 * call-count assertion is the cheapest guard against the "direct SDK call plus a
 * hook that already calls the SDK" pattern re-landing (see PR #92 review).
 *
 * Push enabled toggle: the toggle persists to AsyncStorage
 * (CONFIG_STORAGE_KEYS.PUSH_ENABLED) and only takes effect on the next app
 * launch, when App.tsx reads the flag and passes it to initialize(). There is no
 * SDK call to observe at toggle time, so these tests assert against the
 * AsyncStorage mock.
 *
 * The SDK module is auto-mocked (jest replaces every export with a jest.fn())
 * rather than hand-stubbed: SettingsScreen mounts six hooks that import ~a dozen
 * SDK functions between them, and automock spares the test from tracking that
 * list. (The narrower hook tests, e.g. useMarketingSubscriptions.test.ts, stub
 * their two or three exports explicitly.)
 */
import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as sdk from '@attentive-mobile/attentive-react-native-sdk'
import { CONFIG_STORAGE_KEYS } from '../src/constants/storage'
import type { SettingsScreenProps } from '../src/types/navigation'

jest.mock('@attentive-mobile/attentive-react-native-sdk')

import SettingsScreen from '../src/screens/SettingsScreen'

// SettingsScreen is typed with navigation props its body never reads at runtime,
// so an empty cast satisfies the types without a NavigationContainer.
const stubProps = {} as SettingsScreenProps

const mockGetItem = AsyncStorage.getItem as jest.Mock
const mockSetItem = AsyncStorage.setItem as jest.Mock

// Replaces the async-storage mock's in-memory store with explicit per-test
// values, so tests never depend on writes leaking between them.
const seedStorage = (values: Record<string, string>) => {
  mockGetItem.mockImplementation((key: string) =>
    Promise.resolve(values[key] ?? null)
  )
}

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    seedStorage({})
    // displayAlerts defaults to true, so handlers fire Alert.alert — silence it.
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  })

  describe('clearUser call count (MSDK-406)', () => {
    it('calls SDK clearUser exactly once when "Clear User" is pressed', async () => {
      const { findByText } = render(<SettingsScreen {...stubProps} />)

      // Awaiting the query flushes the async AsyncStorage reads the screen kicks
      // off on mount before we interact.
      fireEvent.press(await findByText('Clear User'))

      expect(sdk.clearUser).toHaveBeenCalledTimes(1)
    })

    it('calls SDK clearUser exactly once when "Log Out" is pressed', async () => {
      const { findByText } = render(<SettingsScreen {...stubProps} />)

      fireEvent.press(await findByText('Log Out'))

      expect(sdk.clearUser).toHaveBeenCalledTimes(1)
    })
  })

  describe('Push enabled toggle', () => {
    it('renders the switch off when push enabled is persisted as "false"', async () => {
      seedStorage({ [CONFIG_STORAGE_KEYS.PUSH_ENABLED]: 'false' })

      const { getByTestId } = render(<SettingsScreen {...stubProps} />)

      // On at first paint (the state default, matching the SDK default),
      // proving the OFF state below comes from loadConfiguration's async
      // storage read — not from a default.
      expect(getByTestId('pushEnabledSwitch').props.value).toBe(true)

      // Flush the storage read and its state commit, then assert the settled
      // state with a plain expect. waitFor would accept anything true of the
      // initial render (it retries until the callback passes), so an inverted
      // expectation would go green vacuously; a non-retrying assertion fails.
      await act(async () => {})
      expect(getByTestId('pushEnabledSwitch').props.value).toBe(false)
    })

    it('persists "true" when toggled on', async () => {
      const { findByTestId } = render(<SettingsScreen {...stubProps} />)

      fireEvent(await findByTestId('pushEnabledSwitch'), 'valueChange', true)

      await waitFor(() =>
        expect(mockSetItem).toHaveBeenCalledWith(
          CONFIG_STORAGE_KEYS.PUSH_ENABLED,
          'true'
        )
      )
    })

    it('persists "false" when toggled off from a persisted-on state', async () => {
      seedStorage({ [CONFIG_STORAGE_KEYS.PUSH_ENABLED]: 'true' })
      const { getByTestId } = render(<SettingsScreen {...stubProps} />)
      await act(async () => {})
      expect(getByTestId('pushEnabledSwitch').props.value).toBe(true)

      fireEvent(getByTestId('pushEnabledSwitch'), 'valueChange', false)

      await waitFor(() =>
        expect(mockSetItem).toHaveBeenCalledWith(
          CONFIG_STORAGE_KEYS.PUSH_ENABLED,
          'false'
        )
      )
    })

    it('announces the restart requirement after saving when display alerts are on', async () => {
      const { findByTestId } = render(<SettingsScreen {...stubProps} />)

      fireEvent(await findByTestId('pushEnabledSwitch'), 'valueChange', true)

      await waitFor(() =>
        expect(Alert.alert).toHaveBeenCalledWith(
          'Push Setting',
          'Push setting has been saved. Note: This setting requires app restart to take effect.'
        )
      )
    })

    it('stays silent when display alerts are off', async () => {
      seedStorage({
        [CONFIG_STORAGE_KEYS.DISPLAY_ALERTS]: 'false',
        [CONFIG_STORAGE_KEYS.PUSH_ENABLED]: 'false',
      })
      const { getByTestId } = render(<SettingsScreen {...stubProps} />)
      // Both flags land in the same loadConfiguration pass, so the switch
      // turning off (from its on default) proves displayAlerts=false has
      // committed too.
      await act(async () => {})
      expect(getByTestId('pushEnabledSwitch').props.value).toBe(false)

      fireEvent(getByTestId('pushEnabledSwitch'), 'valueChange', true)

      await waitFor(() =>
        expect(mockSetItem).toHaveBeenCalledWith(
          CONFIG_STORAGE_KEYS.PUSH_ENABLED,
          'true'
        )
      )
      expect(Alert.alert).not.toHaveBeenCalled()
    })

    it('shows the error alert when persisting fails', async () => {
      mockSetItem.mockRejectedValueOnce(new Error('storage unavailable'))
      // The handler logs the failure; keep the test output clean.
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      const { findByTestId } = render(<SettingsScreen {...stubProps} />)
      fireEvent(await findByTestId('pushEnabledSwitch'), 'valueChange', true)

      await act(async () => {})
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to save push setting'
      )
      consoleError.mockRestore()
    })
  })
})
