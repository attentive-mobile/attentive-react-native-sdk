/**
 * Storage service for persisted configuration values.
 *
 * Boolean config flags are persisted as the strings 'true' / 'false'. These
 * helpers own that encoding so readers and writers can't drift.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Reads a persisted boolean flag. Anything unset, unparseable, or unreadable
 * resolves to `defaultValue` — this never rejects, so callers (including the
 * SDK startup path) don't need their own try/catch to stay on the happy path.
 */
export async function getStoredBoolean(
  key: string,
  defaultValue: boolean
): Promise<boolean> {
  let value: string | null = null
  try {
    value = await AsyncStorage.getItem(key)
  } catch (error) {
    console.error(`[Storage] Failed to read "${key}":`, error)
    return defaultValue
  }

  if (value === 'true') return true
  if (value === 'false') return false
  return defaultValue
}

/**
 * Persists a boolean flag. Rejects on failure so callers can surface the error
 * and roll back any optimistic UI state.
 */
export function setStoredBoolean(key: string, value: boolean): Promise<void> {
  return AsyncStorage.setItem(key, String(value))
}
