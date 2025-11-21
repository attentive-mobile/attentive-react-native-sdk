/**
 * Custom hooks for Attentive SDK actions
 * Handles creative triggers, custom events, and other SDK actions
 */

import { useCallback } from 'react'
import {
  triggerCreative,
  recordCustomEvent,
  type CustomEvent,
} from '@attentive-mobile/attentive-react-native-sdk'

/**
 * Hook for Attentive SDK actions like triggering creatives and custom events
 * @returns Memoized functions for SDK actions
 */
export function useAttentiveActions() {
  /**
   * Trigger a creative with an optional creative ID
   * @param creativeId - Optional creative ID to trigger
   */
  const triggerAttentiveCreative = useCallback((creativeId?: string) => {
    triggerCreative(creativeId)
  }, [])

  /**
   * Record a custom event
   * @param eventType - The type of custom event
   * @param properties - Optional properties for the event
   */
  const recordCustomAttentiveEvent = useCallback(
    (eventType: string, properties?: Record<string, string>) => {
      const customEvent: CustomEvent = {
        type: eventType,
        properties: properties || {},
      }
      recordCustomEvent(customEvent)
    },
    []
  )

  return {
    triggerAttentiveCreative,
    recordCustomAttentiveEvent,
  }
}

