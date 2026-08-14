/**
 * Hook to check if display alerts is enabled for Attentive events
 * @returns A boolean indicating if alerts should be displayed
 */

import { useState, useEffect } from 'react'
import { CONFIG_STORAGE_KEYS } from '../constants/storage'
import { getStoredBoolean } from '../services/storage'

/**
 * Hook to get the current display alerts setting
 * @returns Boolean indicating if alerts should be displayed (defaults to true)
 */
export function useDisplayAlerts() {
  const [displayAlerts, setDisplayAlerts] = useState<boolean>(true)

  useEffect(() => {
    loadDisplayAlerts()
  }, [])

  const loadDisplayAlerts = async () => {
    try {
      setDisplayAlerts(
        await getStoredBoolean(CONFIG_STORAGE_KEYS.DISPLAY_ALERTS, true)
      )
    } catch (error) {
      console.error('Error loading display alerts setting:', error)
    }
  }

  return displayAlerts
}
