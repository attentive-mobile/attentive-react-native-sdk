/**
 * Custom hook for the "switch user" (updateUser) flow.
 * Keeps input state, validation, loading, and the SDK call out of the UI layer
 * so SettingsScreen remains a thin view component.
 */

import { useState, useCallback } from 'react'
import { updateUser } from '@attentive-mobile/attentive-react-native-sdk'
import { validateEmail, validatePhone } from '../utils/validation'

/**
 * Shape returned by `useSwitchUser`.
 */
export interface UseSwitchUserResult {
  email: string
  phone: string
  emailError: string | null
  phoneError: string | null
  isUpdating: boolean
  setEmail: (value: string) => void
  setPhone: (value: string) => void
  clearErrors: () => void
  handleUpdateUser: () => Promise<void>
}

/**
 * Manages the state and SDK operation for the Switch User form.
 *
 * @param onSuccess - Called with a display label after the user is updated.
 * @param onError - Called with an error message when validation or the update fails.
 */
export function useSwitchUser(
  onSuccess?: (label: string) => void,
  onError?: (message: string) => void
): UseSwitchUserResult {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const clearErrors = useCallback(() => {
    setEmailError(null)
    setPhoneError(null)
  }, [])

  const handleUpdateUser = useCallback(async () => {
    const trimmedEmail = email.trim()
    const trimmedPhone = phone.trim()

    if (!trimmedEmail && !trimmedPhone) {
      const message = 'Enter an email or phone number'
      setEmailError(message)
      setPhoneError(null)
      onError?.(message)
      return
    }

    const nextEmailError = trimmedEmail ? validateEmail(trimmedEmail) : null
    const nextPhoneError = trimmedPhone ? validatePhone(trimmedPhone) : null
    setEmailError(nextEmailError)
    setPhoneError(nextPhoneError)
    const validationError = nextEmailError ?? nextPhoneError
    if (validationError) {
      onError?.(validationError)
      return
    }

    setIsUpdating(true)
    try {
      await updateUser({
        email: trimmedEmail || undefined,
        phone: trimmedPhone || undefined,
      })
      const label = [trimmedEmail, trimmedPhone].filter(Boolean).join(' / ')
      onSuccess?.(label)
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'User update failed')
    } finally {
      setIsUpdating(false)
    }
  }, [email, phone, onSuccess, onError])

  return {
    email,
    phone,
    emailError,
    phoneError,
    isUpdating,
    setEmail,
    setPhone,
    clearErrors,
    handleUpdateUser,
  }
}
