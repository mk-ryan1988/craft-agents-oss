/**
 * Completion Sound Hook
 *
 * Plays a sound when the agent completes processing.
 * Only plays when the window is not focused (same logic as notifications).
 */

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseCompletionSoundOptions {
  /** Whether the window is currently focused */
  isWindowFocused: boolean
}

interface UseCompletionSoundResult {
  /** Whether completion sound is enabled */
  enabled: boolean
  /** Set whether completion sound is enabled */
  setEnabled: (enabled: boolean) => void
  /** Play the completion sound (respects enabled and focus state) */
  playCompletionSound: () => void
}

export function useCompletionSound({
  isWindowFocused,
}: UseCompletionSoundOptions): UseCompletionSoundResult {
  const [enabled, setEnabledState] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Load the enabled setting and sound path on mount
  useEffect(() => {
    window.electronAPI.getSoundEnabled().then(setEnabledState)

    // Get the sound file path from main process (handles dev/prod correctly)
    window.electronAPI.getSoundPath().then((soundPath) => {
      console.log('[CompletionSound] Loading sound from:', soundPath)
      const audio = new Audio()
      audio.src = soundPath
      audio.preload = 'auto'
      audio.volume = 0.5  // 50% volume for a pleasant notification sound
      audio.oncanplaythrough = () => console.log('[CompletionSound] Audio loaded successfully')
      audio.onerror = (e) => console.error('[CompletionSound] Audio load error:', e)
      audioRef.current = audio
    })

    return () => {
      audioRef.current = null
    }
  }, [])

  // Handler to persist the enabled setting
  const setEnabled = useCallback((newEnabled: boolean) => {
    setEnabledState(newEnabled)
    window.electronAPI.setSoundEnabled(newEnabled)
  }, [])

  // Play the completion sound
  const playCompletionSound = useCallback(() => {
    console.log('[CompletionSound] playCompletionSound called', { enabled, isWindowFocused, hasAudio: !!audioRef.current })
    // Don't play if disabled
    if (!enabled) {
      console.log('[CompletionSound] Skipping - disabled')
      return
    }
    // Don't play if window is focused
    if (isWindowFocused) {
      console.log('[CompletionSound] Skipping - window focused')
      return
    }
    // Don't play if audio not loaded
    if (!audioRef.current) {
      console.log('[CompletionSound] Skipping - no audio loaded')
      return
    }

    console.log('[CompletionSound] Playing sound!')
    // Reset and play
    audioRef.current.currentTime = 0
    audioRef.current.play().catch((error) => {
      // Audio playback can fail due to autoplay policies
      // This is fine - user interaction will unlock it
      console.warn('[CompletionSound] Failed to play sound:', error)
    })
  }, [enabled, isWindowFocused])

  return {
    enabled,
    setEnabled,
    playCompletionSound,
  }
}
