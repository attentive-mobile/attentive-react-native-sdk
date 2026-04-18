/**
 * Hook for managing the Attentive SDK domain setting.
 * Owns persistence via AsyncStorage, SDK synchronisation, and
 * the user-facing prompt so the screen stays free of that logic.
 */

import { useState, useEffect, useCallback } from 'react'
import { Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { updateDomain } from '@attentive-mobile/attentive-react-native-sdk'

const DOMAIN_STORAGE_KEY = 'attentive_domain'
const DEFAULT_DOMAIN = 'games'

/** Shape returned by the hook. */
export interface AttentiveDomainHook {
  /** Currently active domain string. */
  domain: string
  /**
   * Presents a native text prompt asking the user to enter a domain.
   * On confirmation the domain is persisted and pushed to the SDK.
   */
  promptForDomain: () => void
}

/**
 * Manages loading, persisting, and updating the Attentive domain.
 *
 * @returns The current domain string and a helper to prompt the user for a new one.
 */
export function useAttentiveDomain(): AttentiveDomainHook {
  const [domain, setDomain] = useState<string>(DEFAULT_DOMAIN)

  useEffect(() => {
    loadDomain()
  }, [])

  /**
   * Reads the persisted domain from AsyncStorage on mount.
   */
  const loadDomain = async () => {
    try {
      const saved = await AsyncStorage.getItem(DOMAIN_STORAGE_KEY)
      if (saved !== null) setDomain(saved)
    } catch (error) {
      console.error('Error loading domain setting:', error)
    }
  }

  /**
   * Persists a new domain, updates local state, and notifies the SDK.
   *
   * @param newDomain - Raw string entered by the user.
   * @throws Does not throw; surfaces errors via Alert.
   */
  const saveDomain = useCallback(async (newDomain: string) => {
    const trimmed = newDomain.trim()
    if (!trimmed) return
    try {
      setDomain(trimmed)
      await AsyncStorage.setItem(DOMAIN_STORAGE_KEY, trimmed)
      updateDomain(trimmed)
      Alert.alert('Success', `Domain updated to: ${trimmed}`)
    } catch (error) {
      console.error('Error saving domain setting:', error)
      Alert.alert('Error', 'Failed to save domain setting')
    }
  }, [])

  /**
   * Shows a native Alert.prompt pre-filled with the current domain.
   * Calls saveDomain when the user confirms a non-empty value.
   */
  const promptForDomain = useCallback(() => {
    Alert.prompt(
      'Attentive Domain',
      'Enter your domain name',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (value) => {
            if (value) saveDomain(value)
          },
        },
      ],
      'plain-text',
      domain,
    )
  }, [domain, saveDomain])

  return { domain, promptForDomain }
}
