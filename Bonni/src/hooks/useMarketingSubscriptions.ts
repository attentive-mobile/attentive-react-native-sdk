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
 * @param onSuccess - Called with a success message after an operation succeeds.
 * @param onError - Called with an error message when an operation fails or is blocked.
 */
export function useMarketingSubscriptions(
  onSuccess?: (message: string) => void,
  onError?: (message: string) => void
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
      isOptingInEmail ||
      isOptingOutEmail ||
      isOptingInPhone ||
      isOptingOutPhone,
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
    onSuccess?.(`Email set to ${trimmed}`)
  }, [emailInput, onSuccess])

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
    onSuccess?.(`Phone set to ${trimmed}`)
  }, [phoneInput, onSuccess])

  const handleOptInEmail = useCallback(async () => {
    const error = validateEmail(emailInput)
    if (error) {
      setEmailError(error)
      onError?.(error)
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
      onSuccess?.('Email opt-in successful')
    } catch (e) {
      console.warn(TAG, 'optInEmail failed:', e)
      onError?.('Email opt-in failed')
    } finally {
      setIsOptingInEmail(false)
    }
  }, [emailInput, onSuccess, onError])

  const handleOptInPhone = useCallback(async () => {
    const error = validatePhone(phoneInput)
    if (error) {
      setPhoneError(error)
      onError?.(error)
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
      onSuccess?.('Phone opt-in successful')
    } catch (e) {
      console.warn(TAG, 'optInPhone failed:', e)
      onError?.('Phone opt-in failed')
    } finally {
      setIsOptingInPhone(false)
    }
  }, [phoneInput, onSuccess, onError])

  const handleOptOutEmail = useCallback(async () => {
    const error = validateEmail(emailInput)
    if (error) {
      setEmailError(error)
      onError?.(error)
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
      onSuccess?.('Email opt-out successful')
    } catch (e) {
      console.warn(TAG, 'optOutEmail failed:', e)
      onError?.('Email opt-out failed')
    } finally {
      setIsOptingOutEmail(false)
    }
  }, [emailInput, onSuccess, onError])

  const handleOptOutPhone = useCallback(async () => {
    const error = validatePhone(phoneInput)
    if (error) {
      setPhoneError(error)
      onError?.(error)
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
      onSuccess?.('Phone opt-out successful')
    } catch (e) {
      console.warn(TAG, 'optOutPhone failed:', e)
      onError?.('Phone opt-out failed')
    } finally {
      setIsOptingOutPhone(false)
    }
  }, [phoneInput, onSuccess, onError])

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
