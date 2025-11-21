/**
 * Custom hooks for Attentive SDK user identification
 * Handles user identification and clearing user data
 */

import { useCallback } from 'react'
import { identify, clearUser, type UserIdentifiers } from '@attentive-mobile/attentive-react-native-sdk'

/**
 * Hook for user identification operations
 * @returns Memoized functions for identifying and clearing users
 */
export function useAttentiveUser() {
  /**
   * Identify a user with the provided identifiers
   * @param identifiers - User identifier object containing phone, email, etc.
   */
  const identifyUser = useCallback((identifiers: UserIdentifiers) => {
    identify(identifiers)
  }, [])

  /**
   * Clear the current user identification
   */
  const clearUserIdentification = useCallback(() => {
    clearUser()
  }, [])

  return {
    identifyUser,
    clearUserIdentification,
  }
}

