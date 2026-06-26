import { useEffect, useState } from 'react'

const PREFIX = 'meowtronome:'

// Read a persisted setting, falling back if it's missing or storage is
// unavailable (private mode, disabled cookies, etc.).
export function loadSetting(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

// Persist a setting, ignoring failures (quota, private mode) since none of
// these settings are critical enough to interrupt the user.
export function saveSetting(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Ignore storage failures.
  }
}

// useState that mirrors its value to localStorage so it survives reloads.
export function usePersistentState(key, fallback) {
  const [value, setValue] = useState(() => loadSetting(key, fallback))
  useEffect(() => {
    saveSetting(key, value)
  }, [key, value])
  return [value, setValue]
}
