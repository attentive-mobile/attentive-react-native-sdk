/**
 * Hook to check if display alerts is enabled for Attentive events
 * @returns A boolean indicating if alerts should be displayed
 */

import { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const DISPLAY_ALERTS_KEY = 'attentive_display_alerts'

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
      const value = await AsyncStorage.getItem(DISPLAY_ALERTS_KEY)
      if (value !== null) {
        setDisplayAlerts(value === 'true')
      }
    } catch (error) {
      console.error('Error loading display alerts setting:', error)
    }
  }

  return displayAlerts
}

