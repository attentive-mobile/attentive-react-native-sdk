/**
 * Custom hook for managing marketing subscription opt-in / opt-out operations.
 * Keeps all business logic (state, validation, SDK calls) outside the UI layer
 * so SettingsScreen remains a thin view component.
 */

import { useState, useCallback } from 'react'
import {
    identify,
    optInMarketingSubscription,
    optOutMarketingSubscription,
} from '@attentive-mobile/attentive-react-native-sdk'
import { validateEmail, validatePhone } from '../utils/validation'

/**
 * Callbacks that the hook invokes after each operation completes so the caller
 * can display platform-appropriate feedback (e.g. `Alert.alert`) without the
 * hook depending on React Native's `Alert` directly.
 */
export interface MarketingSubscriptionCallbacks {
    /** Called with a success message after an operation succeeds. */
    onSuccess?: (message: string) => void
    /** Called with an error message when an operation fails or is blocked. */
    onError?: (message: string) => void
}

/**
 * Shape returned by `useMarketingSubscriptions`.
 */
export interface UseMarketingSubscriptionsResult {
    /** Current value of the email text input (unvalidated). */
    emailInput: string
    /** Current value of the phone text input (unvalidated). */
    phoneInput: string
    /** The committed email address used for opt-in / opt-out calls, or `null`. */
    currentEmail: string | null
    /** The committed phone number used for opt-in / opt-out calls, or `null`. */
    currentPhone: string | null
    /** Inline validation error for the email input, or `null` when valid / untouched. */
    emailError: string | null
    /** Inline validation error for the phone input, or `null` when valid / untouched. */
    phoneError: string | null
    /** Updates the email text input value. */
    setEmailInput: (value: string) => void
    /** Updates the phone text input value. */
    setPhoneInput: (value: string) => void
    /**
     * Validates `emailInput`, commits it to `currentEmail` on success, and
     * calls `identify` so the Attentive SDK associates the email with the user.
     */
    handleSetEmail: () => void
    /**
     * Validates `phoneInput`, commits it to `currentPhone` on success, and
     * calls `identify` so the Attentive SDK associates the phone with the user.
     */
    handleSetPhone: () => void
    /** Opts `currentEmail` into marketing subscriptions. */
    handleOptInEmail: () => Promise<void>
    /** Opts `currentEmail` out of marketing subscriptions. */
    handleOptOutEmail: () => Promise<void>
    /** Opts `currentPhone` into marketing subscriptions. */
    handleOptInPhone: () => Promise<void>
    /** Opts `currentPhone` out of marketing subscriptions. */
    handleOptOutPhone: () => Promise<void>
}

/**
 * Manages the state and SDK operations for the Marketing Subscriptions form.
 *
 * @param callbacks - Optional success / error callbacks for user-facing feedback.
 * @returns Stateful values and handlers for the marketing subscriptions UI.
 */
export function useMarketingSubscriptions(
    callbacks?: MarketingSubscriptionCallbacks
): UseMarketingSubscriptionsResult {
    const [emailInput, setEmailInput] = useState('')
    const [phoneInput, setPhoneInput] = useState('')
    const [currentEmail, setCurrentEmail] = useState<string | null>(null)
    const [currentPhone, setCurrentPhone] = useState<string | null>(null)
    const [emailError, setEmailError] = useState<string | null>(null)
    const [phoneError, setPhoneError] = useState<string | null>(null)

    // ---------------------------------------------------------------------------
    // Set / commit handlers
    // ---------------------------------------------------------------------------

    /**
     * Validates the current email input and, if valid, commits it as the active
     * email for subsequent opt-in / opt-out operations and calls `identify`.
     */
    const handleSetEmail = useCallback(() => {
        const error = validateEmail(emailInput)
        if (error) {
            setEmailError(error)
            return
        }

        const trimmed = emailInput.trim()
        setEmailError(null)
        setCurrentEmail(trimmed)
        identify({ email: trimmed })
        callbacks?.onSuccess?.(`Email set to ${trimmed}`)
    }, [emailInput, callbacks])

    /**
     * Validates the current phone input and, if valid, commits it as the active
     * phone for subsequent opt-in / opt-out operations and calls `identify`.
     */
    const handleSetPhone = useCallback(() => {
        const error = validatePhone(phoneInput)
        if (error) {
            setPhoneError(error)
            return
        }

        const trimmed = phoneInput.trim()
        setPhoneError(null)
        setCurrentPhone(trimmed)
        identify({ phone: trimmed })
        callbacks?.onSuccess?.(`Phone set to ${trimmed}`)
    }, [phoneInput, callbacks])

    // ---------------------------------------------------------------------------
    // Opt-in handlers
    // ---------------------------------------------------------------------------

    /**
     * Opts the committed email address into marketing subscriptions.
     * @throws Never — errors are surfaced via the `onError` callback.
     */
    const handleOptInEmail = useCallback(async () => {
        if (!currentEmail) {
            callbacks?.onError?.('Set an email address first')
            return
        }
        try {
            await optInMarketingSubscription({ email: currentEmail })
            callbacks?.onSuccess?.('Email opt-in successful')
        } catch {
            callbacks?.onError?.('Email opt-in failed')
        }
    }, [currentEmail, callbacks])

    /**
     * Opts the committed phone number into marketing subscriptions.
     * @throws Never — errors are surfaced via the `onError` callback.
     */
    const handleOptInPhone = useCallback(async () => {
        if (!currentPhone) {
            callbacks?.onError?.('Set a phone number first')
            return
        }
        try {
            await optInMarketingSubscription({ phone: currentPhone })
            callbacks?.onSuccess?.('Phone opt-in successful')
        } catch {
            callbacks?.onError?.('Phone opt-in failed')
        }
    }, [currentPhone, callbacks])

    // ---------------------------------------------------------------------------
    // Opt-out handlers
    // ---------------------------------------------------------------------------

    /**
     * Opts the committed email address out of marketing subscriptions.
     * @throws Never — errors are surfaced via the `onError` callback.
     */
    const handleOptOutEmail = useCallback(async () => {
        if (!currentEmail) {
            callbacks?.onError?.('Set an email address first')
            return
        }
        try {
            await optOutMarketingSubscription({ email: currentEmail })
            callbacks?.onSuccess?.('Email opt-out successful')
        } catch {
            callbacks?.onError?.('Email opt-out failed')
        }
    }, [currentEmail, callbacks])

    /**
     * Opts the committed phone number out of marketing subscriptions.
     * @throws Never — errors are surfaced via the `onError` callback.
     */
    const handleOptOutPhone = useCallback(async () => {
        if (!currentPhone) {
            callbacks?.onError?.('Set a phone number first')
            return
        }
        try {
            await optOutMarketingSubscription({ phone: currentPhone })
            callbacks?.onSuccess?.('Phone opt-out successful')
        } catch {
            callbacks?.onError?.('Phone opt-out failed')
        }
    }, [currentPhone, callbacks])

    return {
        emailInput,
        phoneInput,
        currentEmail,
        currentPhone,
        emailError,
        phoneError,
        setEmailInput,
        setPhoneInput,
        handleSetEmail,
        handleSetPhone,
        handleOptInEmail,
        handleOptOutEmail,
        handleOptInPhone,
        handleOptOutPhone,
    }
}
