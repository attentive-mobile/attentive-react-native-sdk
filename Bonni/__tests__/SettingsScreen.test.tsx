/**
 * Regression test for MSDK-406.
 *
 * The Settings screen's "Clear User" and "Log Out" buttons must each invoke the
 * SDK's clearUser() exactly once per press. "Clear User" previously fired it
 * twice — once via a direct SDK import and once via
 * useAttentiveUser().clearUserIdentification() (which itself calls clearUser) —
 * producing a duplicate user-update call and a double visitor-ID rotation.
 *
 * Both handlers reach clearUser() through the useAttentiveUser hook, so a
 * call-count assertion is the cheapest guard against the "direct SDK call plus a
 * hook that already calls the SDK" pattern re-landing (see PR #92 review).
 *
 * The SDK module is auto-mocked (jest replaces every export with a jest.fn())
 * rather than hand-stubbed: SettingsScreen mounts six hooks that import ~a dozen
 * SDK functions between them, and automock spares the test from tracking that
 * list. (The narrower hook tests, e.g. useMarketingSubscriptions.test.ts, stub
 * their two or three exports explicitly.)
 */
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Alert } from 'react-native'
import * as sdk from '@attentive-mobile/attentive-react-native-sdk'
import type { SettingsScreenProps } from '../src/types/navigation'

jest.mock('@attentive-mobile/attentive-react-native-sdk')

import SettingsScreen from '../src/screens/SettingsScreen'

// SettingsScreen is typed with navigation props its body never reads at runtime,
// so an empty cast satisfies the types without a NavigationContainer.
const stubProps = {} as SettingsScreenProps

describe('SettingsScreen — clearUser call count (MSDK-406)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // displayAlerts defaults to true, so both handlers fire Alert.alert — silence it.
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  })

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
