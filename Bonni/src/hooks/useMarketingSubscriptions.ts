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
  emailInput: string
  phoneInput: string
  currentEmail: string | null
  currentPhone: string | null
  emailError: string | null
  phoneError: string | null
  isOptingInEmail: boolean
  isOptingOutEmail: boolean
  isOptingInPhone: boolean
  isOptingOutPhone: boolean
  isAnyLoading: boolean
  setEmailInput: (value: string) => void
  setPhoneInput: (value: string) => void
  handleSetEmail: () => void
  handleSetPhone: () => void
  handleOptInEmail: () => Promise<void>
  handleOptOutEmail: () => Promise<void>
  handleOptInPhone: () => Promise<void>
  handleOptOutPhone: () => Promise<void>
}

/**
 * Manages the state and SDK operations for the Marketing Subscriptions form.
 *
 * @param callbacks - Optional success / error callbacks for user-facing feedback.
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
    () =>
      isOptingInEmail || isOptingOutEmail || isOptingInPhone || isOptingOutPhone,
    [isOptingInEmail, isOptingOutEmail, isOptingInPhone, isOptingOutPhone]
  )

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

  const handleOptInEmail = useCallback(async () => {
    const error = validateEmail(emailInput)
    if (error) {
      setEmailError(error)
      callbacks?.onError?.(error)
      return
    }
    const trimmed = emailInput.trim()
    setEmailError(null)
    console.log(TAG, 'optInEmail called with:', trimmed)
    setIsOptingInEmail(true)
    try {
      identify({ email: trimmed })
      await optInMarketingSubscription({ email: trimmed })
      console.log(TAG, 'optInEmail succeeded')
      callbacks?.onSuccess?.('Email opt-in successful')
    } catch (e) {
      console.warn(TAG, 'optInEmail failed:', e)
      callbacks?.onError?.('Email opt-in failed')
    } finally {
      setIsOptingInEmail(false)
    }
  }, [emailInput, callbacks])

  const handleOptInPhone = useCallback(async () => {
    const error = validatePhone(phoneInput)
    if (error) {
      setPhoneError(error)
      callbacks?.onError?.(error)
      return
    }
    const trimmed = phoneInput.trim()
    setPhoneError(null)
    console.log(TAG, 'optInPhone called with:', trimmed)
    setIsOptingInPhone(true)
    try {
      identify({ phone: trimmed })
      await optInMarketingSubscription({ phone: trimmed })
      console.log(TAG, 'optInPhone succeeded')
      callbacks?.onSuccess?.('Phone opt-in successful')
    } catch (e) {
      console.warn(TAG, 'optInPhone failed:', e)
      callbacks?.onError?.('Phone opt-in failed')
    } finally {
      setIsOptingInPhone(false)
    }
  }, [phoneInput, callbacks])

  const handleOptOutEmail = useCallback(async () => {
    const error = validateEmail(emailInput)
    if (error) {
      setEmailError(error)
      callbacks?.onError?.(error)
      return
    }
    const trimmed = emailInput.trim()
    setEmailError(null)
    console.log(TAG, 'optOutEmail called with:', trimmed)
    setIsOptingOutEmail(true)
    try {
      identify({ email: trimmed })
      await optOutMarketingSubscription({ email: trimmed })
      console.log(TAG, 'optOutEmail succeeded')
      callbacks?.onSuccess?.('Email opt-out successful')
    } catch (e) {
      console.warn(TAG, 'optOutEmail failed:', e)
      callbacks?.onError?.('Email opt-out failed')
    } finally {
      setIsOptingOutEmail(false)
    }
  }, [emailInput, callbacks])

  const handleOptOutPhone = useCallback(async () => {
    const error = validatePhone(phoneInput)
    if (error) {
      setPhoneError(error)
      callbacks?.onError?.(error)
      return
    }
    const trimmed = phoneInput.trim()
    setPhoneError(null)
    console.log(TAG, 'optOutPhone called with:', trimmed)
    setIsOptingOutPhone(true)
    try {
      identify({ phone: trimmed })
      await optOutMarketingSubscription({ phone: trimmed })
      console.log(TAG, 'optOutPhone succeeded')
      callbacks?.onSuccess?.('Phone opt-out successful')
    } catch (e) {
      console.warn(TAG, 'optOutPhone failed:', e)
      callbacks?.onError?.('Phone opt-out failed')
    } finally {
      setIsOptingOutPhone(false)
    }
  }, [phoneInput, callbacks])

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
