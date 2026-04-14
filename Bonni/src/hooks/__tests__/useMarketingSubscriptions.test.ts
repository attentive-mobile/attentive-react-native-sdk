/**
 * Unit tests for useMarketingSubscriptions hook.
 *
 * Uses a wrapper-component pattern with react-test-renderer (no additional
 * testing library required). The Attentive SDK is mocked via `jest.mock` with
 * `virtual: true` so that the test does not depend on the native build output.
 */

import React from 'react'
import { act, create } from 'react-test-renderer'
import {
    useMarketingSubscriptions,
    type UseMarketingSubscriptionsResult,
    type MarketingSubscriptionCallbacks,
} from '../useMarketingSubscriptions'

// ---------------------------------------------------------------------------
// SDK mock (virtual — does not require lib/ to be built)
// ---------------------------------------------------------------------------

jest.mock(
    '@attentive-mobile/attentive-react-native-sdk',
    () => ({
        identify: jest.fn(),
        optInMarketingSubscription: jest.fn().mockResolvedValue(undefined),
        optOutMarketingSubscription: jest.fn().mockResolvedValue(undefined),
    }),
    { virtual: true }
)

// Lazily obtain typed references after the mock is installed.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sdk = require('@attentive-mobile/attentive-react-native-sdk') as {
    identify: jest.Mock
    optInMarketingSubscription: jest.Mock
    optOutMarketingSubscription: jest.Mock
}

// ---------------------------------------------------------------------------
// Wrapper component — captures hook result into a mutable variable
// ---------------------------------------------------------------------------

let hookResult: UseMarketingSubscriptionsResult

function HookWrapper({ callbacks }: { callbacks?: MarketingSubscriptionCallbacks }) {
    hookResult = useMarketingSubscriptions(callbacks)
    return null
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

async function renderHook(callbacks?: MarketingSubscriptionCallbacks) {
    await act(async () => {
        create(React.createElement(HookWrapper, { callbacks }))
    })
}

async function setEmailInput(value: string) {
    await act(async () => { hookResult.setEmailInput(value) })
}

async function setPhoneInput(value: string) {
    await act(async () => { hookResult.setPhoneInput(value) })
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
    jest.clearAllMocks()
    sdk.optInMarketingSubscription.mockResolvedValue(undefined)
    sdk.optOutMarketingSubscription.mockResolvedValue(undefined)
})

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('initial state', () => {
    it('starts with empty inputs and null committed values', async () => {
        await renderHook()

        expect(hookResult.emailInput).toBe('')
        expect(hookResult.phoneInput).toBe('')
        expect(hookResult.currentEmail).toBeNull()
        expect(hookResult.currentPhone).toBeNull()
        expect(hookResult.emailError).toBeNull()
        expect(hookResult.phoneError).toBeNull()
    })
})

// ---------------------------------------------------------------------------
// handleSetEmail
// ---------------------------------------------------------------------------

describe('handleSetEmail', () => {
    it('commits a valid email and clears any previous error', async () => {
        await renderHook()
        await setEmailInput('user@example.com')
        await act(async () => { hookResult.handleSetEmail() })

        expect(hookResult.currentEmail).toBe('user@example.com')
        expect(hookResult.emailError).toBeNull()
    })

    it('calls identify with the committed email', async () => {
        await renderHook()
        await setEmailInput('user@example.com')
        await act(async () => { hookResult.handleSetEmail() })

        expect(sdk.identify).toHaveBeenCalledWith({ email: 'user@example.com' })
    })

    it('trims surrounding whitespace before committing', async () => {
        await renderHook()
        await setEmailInput('  user@example.com  ')
        await act(async () => { hookResult.handleSetEmail() })

        expect(hookResult.currentEmail).toBe('user@example.com')
    })

    it('invokes onSuccess callback with the committed email', async () => {
        const onSuccess = jest.fn()
        await renderHook({ onSuccess })
        await setEmailInput('user@example.com')
        await act(async () => { hookResult.handleSetEmail() })

        expect(onSuccess).toHaveBeenCalledWith(expect.stringContaining('user@example.com'))
    })

    it('sets emailError and does not commit for an invalid email', async () => {
        await renderHook()
        await setEmailInput('not-an-email')
        await act(async () => { hookResult.handleSetEmail() })

        expect(hookResult.emailError).not.toBeNull()
        expect(hookResult.currentEmail).toBeNull()
        expect(sdk.identify).not.toHaveBeenCalled()
    })

    it('sets emailError for an empty input', async () => {
        await renderHook()
        await act(async () => { hookResult.handleSetEmail() })

        expect(hookResult.emailError).toBe('Email is required')
        expect(hookResult.currentEmail).toBeNull()
    })

    it('does not invoke onSuccess when validation fails', async () => {
        const onSuccess = jest.fn()
        await renderHook({ onSuccess })
        await setEmailInput('bad-email')
        await act(async () => { hookResult.handleSetEmail() })

        expect(onSuccess).not.toHaveBeenCalled()
    })
})

// ---------------------------------------------------------------------------
// handleSetPhone
// ---------------------------------------------------------------------------

describe('handleSetPhone', () => {
    it('commits a valid phone and clears any previous error', async () => {
        await renderHook()
        await setPhoneInput('+15551234567')
        await act(async () => { hookResult.handleSetPhone() })

        expect(hookResult.currentPhone).toBe('+15551234567')
        expect(hookResult.phoneError).toBeNull()
    })

    it('calls identify with the committed phone', async () => {
        await renderHook()
        await setPhoneInput('+15551234567')
        await act(async () => { hookResult.handleSetPhone() })

        expect(sdk.identify).toHaveBeenCalledWith({ phone: '+15551234567' })
    })

    it('invokes onSuccess callback with the committed phone', async () => {
        const onSuccess = jest.fn()
        await renderHook({ onSuccess })
        await setPhoneInput('+15551234567')
        await act(async () => { hookResult.handleSetPhone() })

        expect(onSuccess).toHaveBeenCalledWith(expect.stringContaining('+15551234567'))
    })

    it('sets phoneError and does not commit for an invalid phone', async () => {
        await renderHook()
        await setPhoneInput('not-a-phone')
        await act(async () => { hookResult.handleSetPhone() })

        expect(hookResult.phoneError).not.toBeNull()
        expect(hookResult.currentPhone).toBeNull()
    })

    it('sets phoneError for an empty input', async () => {
        await renderHook()
        await act(async () => { hookResult.handleSetPhone() })

        expect(hookResult.phoneError).toBe('Phone number is required')
    })
})

// ---------------------------------------------------------------------------
// handleOptInEmail
// ---------------------------------------------------------------------------

describe('handleOptInEmail', () => {
    async function withCommittedEmail(callbacks?: MarketingSubscriptionCallbacks) {
        await renderHook(callbacks)
        await setEmailInput('user@example.com')
        await act(async () => { hookResult.handleSetEmail() })
        jest.clearAllMocks()
        sdk.optInMarketingSubscription.mockResolvedValue(undefined)
        sdk.optOutMarketingSubscription.mockResolvedValue(undefined)
    }

    it('calls optInMarketingSubscription with the current email', async () => {
        await withCommittedEmail()
        await act(async () => { await hookResult.handleOptInEmail() })

        expect(sdk.optInMarketingSubscription).toHaveBeenCalledWith({ email: 'user@example.com' })
    })

    it('invokes onSuccess after a successful opt-in', async () => {
        const onSuccess = jest.fn()
        await withCommittedEmail({ onSuccess })
        await act(async () => { await hookResult.handleOptInEmail() })

        expect(onSuccess).toHaveBeenCalledWith(expect.stringContaining('Email opt-in successful'))
    })

    it('invokes onError when no email is committed', async () => {
        const onError = jest.fn()
        await renderHook({ onError })
        await act(async () => { await hookResult.handleOptInEmail() })

        expect(sdk.optInMarketingSubscription).not.toHaveBeenCalled()
        expect(onError).toHaveBeenCalledWith(expect.stringContaining('email'))
    })

    it('invokes onError when the SDK rejects', async () => {
        const onError = jest.fn()
        await withCommittedEmail({ onError })
        sdk.optInMarketingSubscription.mockRejectedValueOnce(new Error('network error'))
        await act(async () => { await hookResult.handleOptInEmail() })

        expect(onError).toHaveBeenCalledWith(expect.stringContaining('Email opt-in failed'))
    })
})

// ---------------------------------------------------------------------------
// handleOptOutEmail
// ---------------------------------------------------------------------------

describe('handleOptOutEmail', () => {
    async function withCommittedEmail(callbacks?: MarketingSubscriptionCallbacks) {
        await renderHook(callbacks)
        await setEmailInput('user@example.com')
        await act(async () => { hookResult.handleSetEmail() })
        jest.clearAllMocks()
        sdk.optInMarketingSubscription.mockResolvedValue(undefined)
        sdk.optOutMarketingSubscription.mockResolvedValue(undefined)
    }

    it('calls optOutMarketingSubscription with the current email', async () => {
        await withCommittedEmail()
        await act(async () => { await hookResult.handleOptOutEmail() })

        expect(sdk.optOutMarketingSubscription).toHaveBeenCalledWith({ email: 'user@example.com' })
    })

    it('invokes onSuccess after a successful opt-out', async () => {
        const onSuccess = jest.fn()
        await withCommittedEmail({ onSuccess })
        await act(async () => { await hookResult.handleOptOutEmail() })

        expect(onSuccess).toHaveBeenCalledWith(expect.stringContaining('Email opt-out successful'))
    })

    it('invokes onError when no email is committed', async () => {
        const onError = jest.fn()
        await renderHook({ onError })
        await act(async () => { await hookResult.handleOptOutEmail() })

        expect(sdk.optOutMarketingSubscription).not.toHaveBeenCalled()
        expect(onError).toHaveBeenCalled()
    })

    it('invokes onError when the SDK rejects', async () => {
        const onError = jest.fn()
        await withCommittedEmail({ onError })
        sdk.optOutMarketingSubscription.mockRejectedValueOnce(new Error('network error'))
        await act(async () => { await hookResult.handleOptOutEmail() })

        expect(onError).toHaveBeenCalledWith(expect.stringContaining('Email opt-out failed'))
    })
})

// ---------------------------------------------------------------------------
// handleOptInPhone
// ---------------------------------------------------------------------------

describe('handleOptInPhone', () => {
    async function withCommittedPhone(callbacks?: MarketingSubscriptionCallbacks) {
        await renderHook(callbacks)
        await setPhoneInput('+15551234567')
        await act(async () => { hookResult.handleSetPhone() })
        jest.clearAllMocks()
        sdk.optInMarketingSubscription.mockResolvedValue(undefined)
        sdk.optOutMarketingSubscription.mockResolvedValue(undefined)
    }

    it('calls optInMarketingSubscription with the current phone', async () => {
        await withCommittedPhone()
        await act(async () => { await hookResult.handleOptInPhone() })

        expect(sdk.optInMarketingSubscription).toHaveBeenCalledWith({ phone: '+15551234567' })
    })

    it('invokes onSuccess after a successful opt-in', async () => {
        const onSuccess = jest.fn()
        await withCommittedPhone({ onSuccess })
        await act(async () => { await hookResult.handleOptInPhone() })

        expect(onSuccess).toHaveBeenCalledWith(expect.stringContaining('Phone opt-in successful'))
    })

    it('invokes onError when no phone is committed', async () => {
        const onError = jest.fn()
        await renderHook({ onError })
        await act(async () => { await hookResult.handleOptInPhone() })

        expect(sdk.optInMarketingSubscription).not.toHaveBeenCalled()
        expect(onError).toHaveBeenCalledWith(expect.stringContaining('phone'))
    })

    it('invokes onError when the SDK rejects', async () => {
        const onError = jest.fn()
        await withCommittedPhone({ onError })
        sdk.optInMarketingSubscription.mockRejectedValueOnce(new Error('network error'))
        await act(async () => { await hookResult.handleOptInPhone() })

        expect(onError).toHaveBeenCalledWith(expect.stringContaining('Phone opt-in failed'))
    })
})

// ---------------------------------------------------------------------------
// handleOptOutPhone
// ---------------------------------------------------------------------------

describe('handleOptOutPhone', () => {
    async function withCommittedPhone(callbacks?: MarketingSubscriptionCallbacks) {
        await renderHook(callbacks)
        await setPhoneInput('+15551234567')
        await act(async () => { hookResult.handleSetPhone() })
        jest.clearAllMocks()
        sdk.optInMarketingSubscription.mockResolvedValue(undefined)
        sdk.optOutMarketingSubscription.mockResolvedValue(undefined)
    }

    it('calls optOutMarketingSubscription with the current phone', async () => {
        await withCommittedPhone()
        await act(async () => { await hookResult.handleOptOutPhone() })

        expect(sdk.optOutMarketingSubscription).toHaveBeenCalledWith({ phone: '+15551234567' })
    })

    it('invokes onSuccess after a successful opt-out', async () => {
        const onSuccess = jest.fn()
        await withCommittedPhone({ onSuccess })
        await act(async () => { await hookResult.handleOptOutPhone() })

        expect(onSuccess).toHaveBeenCalledWith(expect.stringContaining('Phone opt-out successful'))
    })

    it('invokes onError when no phone is committed', async () => {
        const onError = jest.fn()
        await renderHook({ onError })
        await act(async () => { await hookResult.handleOptOutPhone() })

        expect(sdk.optOutMarketingSubscription).not.toHaveBeenCalled()
        expect(onError).toHaveBeenCalled()
    })

    it('invokes onError when the SDK rejects', async () => {
        const onError = jest.fn()
        await withCommittedPhone({ onError })
        sdk.optOutMarketingSubscription.mockRejectedValueOnce(new Error('network error'))
        await act(async () => { await hookResult.handleOptOutPhone() })

        expect(onError).toHaveBeenCalledWith(expect.stringContaining('Phone opt-out failed'))
    })
})
