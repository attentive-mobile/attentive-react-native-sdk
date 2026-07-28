/**
 * Storage service for persisted configuration values.
 *
 * Boolean config flags are persisted as the strings 'true' / 'false'. These
 * helpers own that encoding so readers and writers can't drift; anything
 * unset (or unparseable) resolves to the caller's default.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

export async function getStoredBoolean(
  key: string,
  defaultValue: boolean
): Promise<boolean> {
  const value = await AsyncStorage.getItem(key)
  if (value === 'true') return true
  if (value === 'false') return false
  return defaultValue
}

export function setStoredBoolean(key: string, value: boolean): Promise<void> {
  return AsyncStorage.setItem(key, String(value))
}
