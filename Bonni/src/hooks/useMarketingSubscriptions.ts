/**
 * Custom hook for managing marketing subscription opt-in / opt-out operations.
 * Keeps all business logic (state, validation, SDK calls) outside the UI layer
 * so SettingsScreen remains a thin view component.
 */

import { useState, useCallback, useMemo } from 'react'
import {
    identify,
    optInMarketingSubscription,
    optOutMarketingSubscription,
} from '@attentive-mobile/attentive-react-native-sdk'
import { validateEmail, validatePhone } from '../utils/validation'

const TAG = '[Marketing]'

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
    /** `true` while an email opt-in request is in flight. */
    isOptingInEmail: boolean
    /** `true` while an email opt-out request is in flight. */
    isOptingOutEmail: boolean
    /** `true` while a phone opt-in request is in flight. */
    isOptingInPhone: boolean
    /** `true` while a phone opt-out request is in flight. */
    isOptingOutPhone: boolean
    /** `true` when any opt-in / opt-out operation is in progress. */
    isAnyLoading: boolean
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

    const [isOptingInEmail, setIsOptingInEmail] = useState(false)
    const [isOptingOutEmail, setIsOptingOutEmail] = useState(false)
    const [isOptingInPhone, setIsOptingInPhone] = useState(false)
    const [isOptingOutPhone, setIsOptingOutPhone] = useState(false)

    const isAnyLoading = useMemo(
        () => isOptingInEmail || isOptingOutEmail || isOptingInPhone || isOptingOutPhone,
        [isOptingInEmail, isOptingOutEmail, isOptingInPhone, isOptingOutPhone],
    )

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
     * Sets `isOptingInEmail` while the request is in flight.
     * @throws Never — errors are surfaced via the `onError` callback.
     */
    const handleOptInEmail = useCallback(async () => {
        if (!currentEmail) {
            callbacks?.onError?.('Set an email address first')
            return
        }
        console.log(TAG, 'optInEmail called with:', currentEmail)
        setIsOptingInEmail(true)
        try {
            await optInMarketingSubscription({ email: currentEmail })
            console.log(TAG, 'optInEmail succeeded')
            callbacks?.onSuccess?.('Email opt-in successful')
        } catch (e) {
            console.warn(TAG, 'optInEmail failed:', e)
            callbacks?.onError?.('Email opt-in failed')
        } finally {
            setIsOptingInEmail(false)
        }
    }, [currentEmail, callbacks])

    /**
     * Opts the committed phone number into marketing subscriptions.
     * Sets `isOptingInPhone` while the request is in flight.
     * @throws Never — errors are surfaced via the `onError` callback.
     */
    const handleOptInPhone = useCallback(async () => {
        if (!currentPhone) {
            callbacks?.onError?.('Set a phone number first')
            return
        }
        console.log(TAG, 'optInPhone called with:', currentPhone)
        setIsOptingInPhone(true)
        try {
            await optInMarketingSubscription({ phone: currentPhone })
            console.log(TAG, 'optInPhone succeeded')
            callbacks?.onSuccess?.('Phone opt-in successful')
        } catch (e) {
            console.warn(TAG, 'optInPhone failed:', e)
            callbacks?.onError?.('Phone opt-in failed')
        } finally {
            setIsOptingInPhone(false)
        }
    }, [currentPhone, callbacks])

    // ---------------------------------------------------------------------------
    // Opt-out handlers
    // ---------------------------------------------------------------------------

    /**
     * Opts the committed email address out of marketing subscriptions.
     * Sets `isOptingOutEmail` while the request is in flight.
     * @throws Never — errors are surfaced via the `onError` callback.
     */
    const handleOptOutEmail = useCallback(async () => {
        if (!currentEmail) {
            callbacks?.onError?.('Set an email address first')
            return
        }
        console.log(TAG, 'optOutEmail called with:', currentEmail)
        setIsOptingOutEmail(true)
        try {
            await optOutMarketingSubscription({ email: currentEmail })
            console.log(TAG, 'optOutEmail succeeded')
            callbacks?.onSuccess?.('Email opt-out successful')
        } catch (e) {
            console.warn(TAG, 'optOutEmail failed:', e)
            callbacks?.onError?.('Email opt-out failed')
        } finally {
            setIsOptingOutEmail(false)
        }
    }, [currentEmail, callbacks])

    /**
     * Opts the committed phone number out of marketing subscriptions.
     * Sets `isOptingOutPhone` while the request is in flight.
     * @throws Never — errors are surfaced via the `onError` callback.
     */
    const handleOptOutPhone = useCallback(async () => {
        if (!currentPhone) {
            callbacks?.onError?.('Set a phone number first')
            return
        }
        console.log(TAG, 'optOutPhone called with:', currentPhone)
        setIsOptingOutPhone(true)
        try {
            await optOutMarketingSubscription({ phone: currentPhone })
            console.log(TAG, 'optOutPhone succeeded')
            callbacks?.onSuccess?.('Phone opt-out successful')
        } catch (e) {
            console.warn(TAG, 'optOutPhone failed:', e)
            callbacks?.onError?.('Phone opt-out failed')
        } finally {
            setIsOptingOutPhone(false)
        }
    }, [currentPhone, callbacks])

    return {
        emailInput,
        phoneInput,
        currentEmail,
        currentPhone,
        emailError,
        phoneError,
        isOptingInEmail,
        isOptingOutEmail,
        isOptingInPhone,
        isOptingOutPhone,
        isAnyLoading,
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
