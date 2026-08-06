/**
 * Custom hooks for Attentive SDK actions
 * Handles creative triggers, custom events, and other SDK actions
 */

import { useCallback, useEffect } from 'react'
import {
  triggerCreative,
  recordCustomEvent,
  addCreativeEventListener,
  type CustomEvent,
} from '@attentive-mobile/attentive-react-native-sdk'

/**
 * Hook for Attentive SDK actions like triggering creatives and custom events
 * @returns Memoized functions for SDK actions
 */
export function useAttentiveActions() {
  /**
   * Log the creative lifecycle stream so both platforms can be verified from Metro / logcat:
   * the happy path logs `opened` then `closed`, while a missing or fatigued creative logs a
   * single `notOpened`.
   */
  useEffect(() => {
    const subscription = addCreativeEventListener(({ status, creativeId }) => {
      console.log(
        `🎨 [Attentive] Creative ${status}${
          creativeId ? ` (id: ${creativeId})` : ''
        }`
      )
    })

    return () => subscription.remove()
  }, [])

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
