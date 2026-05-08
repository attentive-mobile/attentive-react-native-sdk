/**
 * Hook for managing the Attentive SDK domain setting.
 * Owns persistence via AsyncStorage, SDK synchronisation, and
 * the user-facing prompt so the screen stays free of that logic.
 *
 * On iOS  → prompt uses `Alert.prompt` natively (no extra UI needed).
 * On Android → prompt opens a `TextPromptModal`; the caller MUST render
 *              `DomainPromptModal` somewhere in the component tree.
 */

import React, { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { updateDomain } from '@attentive-mobile/attentive-react-native-sdk'
import { useTextPrompt } from './useTextPrompt'

const DOMAIN_STORAGE_KEY = 'attentive_domain'
const DEFAULT_DOMAIN = 'games'

/** Shape returned by the hook. */
export interface AttentiveDomainHook {
  /** Currently active domain string. */
  domain: string
  /**
   * Presents a text prompt asking the user to enter a domain.
   * On iOS this uses `Alert.prompt`; on Android a modal overlay is used.
   * On confirmation the domain is persisted and pushed to the SDK.
   */
  promptForDomain: () => void
  /**
   * React element that must be mounted in the component tree.
   * Always `null` on iOS. On Android this is the managed `TextPromptModal`.
   * Place it at the root of the screen that calls `promptForDomain`.
   */
  DomainPromptModal: React.ReactElement | null
}

/**
 * Manages loading, persisting, and updating the Attentive domain.
 *
 * @returns The current domain string, a helper to prompt the user for a new
 *          one, and the modal element to render (Android only, null on iOS).
 */
export function useAttentiveDomain(): AttentiveDomainHook {
  const [domain, setDomain] = useState<string>(DEFAULT_DOMAIN)
  const { showPrompt, PromptModal: DomainPromptModal } = useTextPrompt()

  useEffect(() => {
    loadDomain()
  }, [])

  /**
   * Reads the persisted domain from AsyncStorage on mount.
   */
  const loadDomain = async () => {
    try {
      const saved = await AsyncStorage.getItem(DOMAIN_STORAGE_KEY)
      if (saved !== null) { setDomain(saved) }
    } catch (error) {
      console.error('Error loading domain setting:', error)
    }
  }

  /**
   * Persists a new domain, updates local state, and notifies the SDK.
   *
   * @param newDomain - Raw string entered by the user.
   * @throws Does not throw; errors are logged to the console.
   */
  const saveDomain = useCallback(async (newDomain: string) => {
    const trimmed = newDomain.trim()
    if (!trimmed) { return }
    try {
      setDomain(trimmed)
      await AsyncStorage.setItem(DOMAIN_STORAGE_KEY, trimmed)
      updateDomain(trimmed)
    } catch (error) {
      console.error('Error saving domain setting:', error)
    }
  }, [])

  /**
   * Shows a text prompt pre-filled with the current domain.
   * Delegates to `Alert.prompt` on iOS or the managed `TextPromptModal` on Android.
   * Calls `saveDomain` when the user confirms a non-empty value.
   */
  const promptForDomain = useCallback(() => {
    showPrompt({
      title: 'Switch Domain',
      message: 'Enter the new domain',
      defaultValue: domain,
      confirmText: 'Save',
      cancelText: 'Cancel',
      onConfirm: saveDomain,
    })
  }, [domain, saveDomain, showPrompt])

  return { domain, promptForDomain, DomainPromptModal }
}
