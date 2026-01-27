/**
 * Notification Sounds Hook
 *
 * Plays different sounds for different events:
 * - complete: Agent finished processing successfully
 * - attention: Agent needs user input (permission/auth/plan)
 * - error: Something went wrong
 *
 * Plays when:
 * - Window is NOT focused (user switched away), OR
 * - Window IS focused but user has been idle > 3 minutes (stepped away / zoned out)
 */

import { useState, useEffect, useCallback, useRef } from 'react'

export type SoundType = 'complete' | 'attention' | 'error'

interface UseNotificationSoundsOptions {
  /** Whether the window is currently focused */
  isWindowFocused: boolean
}

interface UseNotificationSoundsResult {
  /** Whether sounds are enabled */
  enabled: boolean
  /** Set whether sounds are enabled */
  setEnabled: (enabled: boolean) => void
  /** Play the completion sound */
  playCompletionSound: () => void
  /** Play the attention sound (needs user input) */
  playAttentionSound: () => void
  /** Play the error sound */
  playErrorSound: () => void
}

// Idle threshold in seconds (3 minutes)
const IDLE_THRESHOLD_SECONDS = 180

export function useNotificationSounds({
  isWindowFocused,
}: UseNotificationSoundsOptions): UseNotificationSoundsResult {
  const [enabled, setEnabledState] = useState(true)
  const audioRefs = useRef<Record<SoundType, HTMLAudioElement | null>>({
    complete: null,
    attention: null,
    error: null,
  })

  // Load the enabled setting and sound paths on mount
  useEffect(() => {
    window.electronAPI.getSoundEnabled().then(setEnabledState)

    // Load all sound files
    const soundTypes: SoundType[] = ['complete', 'attention', 'error']
    soundTypes.forEach(async (soundType) => {
      const soundPath = await window.electronAPI.getSoundPath(soundType)
      console.log(`[NotificationSounds] Loading ${soundType} sound from:`, soundPath)
      const audio = new Audio()
      audio.src = soundPath
      audio.preload = 'auto'
      audio.volume = 0.5 // 50% volume for a pleasant notification sound
      audio.oncanplaythrough = () => console.log(`[NotificationSounds] ${soundType} audio loaded`)
      audio.onerror = (e) => console.error(`[NotificationSounds] ${soundType} audio load error:`, e)
      audioRefs.current[soundType] = audio
    })

    return () => {
      audioRefs.current = { complete: null, attention: null, error: null }
    }
  }, [])

  // Handler to persist the enabled setting
  const setEnabled = useCallback((newEnabled: boolean) => {
    setEnabledState(newEnabled)
    window.electronAPI.setSoundEnabled(newEnabled)
  }, [])

  // Check if we should play a sound based on focus and idle state
  const shouldPlaySound = useCallback(async (): Promise<boolean> => {
    if (!enabled) return false

    // If window is not focused, play sound
    if (!isWindowFocused) return true

    // Window is focused - check if user is idle
    try {
      const idleSeconds = await window.electronAPI.getSystemIdleTime()
      return idleSeconds > IDLE_THRESHOLD_SECONDS
    } catch (error) {
      console.warn('[NotificationSounds] Failed to get idle time:', error)
      // Fall back to not playing if we can't check idle
      return false
    }
  }, [enabled, isWindowFocused])

  // Generic play function
  const playSound = useCallback(async (soundType: SoundType) => {
    const audio = audioRefs.current[soundType]
    const canPlay = await shouldPlaySound()

    console.log(`[NotificationSounds] play ${soundType}`, { enabled, isWindowFocused, canPlay, hasAudio: !!audio })

    if (!canPlay) {
      console.log(`[NotificationSounds] Skipping ${soundType} - conditions not met`)
      return
    }

    if (!audio) {
      console.log(`[NotificationSounds] Skipping ${soundType} - no audio loaded`)
      return
    }

    console.log(`[NotificationSounds] Playing ${soundType} sound!`)
    audio.currentTime = 0
    audio.play().catch((error) => {
      // Audio playback can fail due to autoplay policies
      console.warn(`[NotificationSounds] Failed to play ${soundType} sound:`, error)
    })
  }, [enabled, isWindowFocused, shouldPlaySound])

  // Individual play functions for each sound type
  const playCompletionSound = useCallback(() => playSound('complete'), [playSound])
  const playAttentionSound = useCallback(() => playSound('attention'), [playSound])
  const playErrorSound = useCallback(() => playSound('error'), [playSound])

  return {
    enabled,
    setEnabled,
    playCompletionSound,
    playAttentionSound,
    playErrorSound,
  }
}
