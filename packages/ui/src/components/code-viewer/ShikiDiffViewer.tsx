/**
 * ShikiDiffViewer - Diff viewer using @pierre/diffs (Shiki-based)
 *
 * Platform-agnostic component for displaying file diffs with:
 * - Unified or split diff view
 * - Syntax highlighting via Shiki
 * - Light/dark theme support
 * - Line-level diff highlighting
 */

import * as React from 'react'
import { useState, useEffect, useMemo, useRef } from 'react'
import { FileDiff, type FileDiffMetadata, type FileDiffProps } from '@pierre/diffs/react'
import { parseDiffFromFile, DIFFS_TAG_NAME, type FileContents } from '@pierre/diffs'
import { cn } from '../../lib/utils'
import { LANGUAGE_MAP } from './language-map'
import { useShikiTheme } from '../../context/ShikiThemeContext'
import { registerCraftShikiThemes } from './registerShikiThemes'

// Register the diffs-container custom element if not already registered
// This is necessary because the React component renders a custom element
if (typeof HTMLElement !== 'undefined' && !customElements.get(DIFFS_TAG_NAME)) {
  class FileDiffContainer extends HTMLElement {
    constructor() {
      super()
      if (this.shadowRoot != null) return
      this.attachShadow({ mode: 'open' })
    }
  }
  customElements.define(DIFFS_TAG_NAME, FileDiffContainer)
}

// Register custom themes once per runtime.
registerCraftShikiThemes()


export interface ShikiDiffViewerProps {
  /** Original (before) content */
  original: string
  /** Modified (after) content */
  modified: string
  /** File path - used for language detection and display */
  filePath?: string
  /** Language for syntax highlighting (auto-detected from filePath if not provided) */
  language?: string
  /** Diff style: 'unified' (stacked) or 'split' (side-by-side) */
  diffStyle?: 'unified' | 'split'
  /** Theme mode */
  theme?: 'light' | 'dark'
  /** Shiki theme name override */
  shikiTheme?: string
  /** Disable background styling */
  disableBackground?: boolean
  /** Disable file header display */
  disableFileHeader?: boolean
  /** Callback when file header is clicked */
  onFileHeaderClick?: (path: string) => void
  /** Callback when ready */
  onReady?: () => void
  /** Additional class names */
  className?: string
}

function getLanguageFromPath(filePath: string, explicit?: string): string {
  if (explicit) return explicit
  const ext = filePath.split('.').pop()?.toLowerCase() || ''
  return LANGUAGE_MAP[ext] || 'text'
}

export function getDiffStats(fileDiff: FileDiffMetadata): { additions: number; deletions: number } {
  let additions = 0
  let deletions = 0
  for (const hunk of fileDiff.hunks) {
    additions += hunk.additionCount
    deletions += hunk.deletionCount
  }
  return { additions, deletions }
}

/**
 * ShikiDiffViewer - Shiki-based diff viewer component
 */
export function ShikiDiffViewer({
  original,
  modified,
  filePath = 'file',
  language,
  diffStyle = 'unified',
  theme: themeProp, // Deprecated: theme is now auto-detected from DOM
  onReady,
  className,
}: ShikiDiffViewerProps) {
  const hasCalledReady = useRef(false)
  const [isReady, setIsReady] = useState(false)

  // Get shiki theme from context (matches app's selected theme)
  const contextShikiTheme = useShikiTheme()

  // Detect dark mode from DOM if no theme prop provided
  const isDark = themeProp ? themeProp === 'dark' : document.documentElement.classList.contains('dark')

  // Resolve language
  const resolvedLang = useMemo(() => {
    return language || getLanguageFromPath(filePath)
  }, [language, filePath])

  // Create file contents objects for the diff parser
  const oldFile: FileContents = useMemo(() => ({
    name: filePath,
    contents: original,
    lang: resolvedLang as any,
  }), [filePath, original, resolvedLang])

  const newFile: FileContents = useMemo(() => ({
    name: filePath,
    contents: modified,
    lang: resolvedLang as any,
  }), [filePath, modified, resolvedLang])

  // Parse the diff
  const fileDiff: FileDiffMetadata = useMemo(() => {
    return parseDiffFromFile(oldFile, newFile)
  }, [oldFile, newFile])

  // Diff options - use context theme if available, otherwise fall back to pierre themes
  const options: FileDiffProps<undefined>['options'] = useMemo(() => {
    // Use the app's configured shiki theme from context, or fall back to pierre themes
    const shikiTheme = contextShikiTheme || (isDark ? 'pierre-dark' : 'pierre-light')

    return {
      theme: shikiTheme,
      diffStyle,
      diffIndicators: 'bars',
      disableBackground: false,
      lineDiffType: 'word',
      overflow: 'scroll',
      disableFileHeader: true, // We handle headers ourselves
      themeType: isDark ? 'dark' : 'light',
    }
  }, [contextShikiTheme, isDark, diffStyle])

  // Call onReady after first render
  useEffect(() => {
    if (!hasCalledReady.current && onReady) {
      hasCalledReady.current = true
      // Give Shiki time to highlight
      const timer = setTimeout(() => {
        setIsReady(true)
        onReady()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [onReady, original, modified, fileDiff])

  return (
    <div
      className={cn(
        'h-full w-full overflow-auto transition-opacity duration-200 bg-background text-foreground',
        className
      )}
      style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 13,
        lineHeight: 1.6,
      }}
    >
      <FileDiff
        fileDiff={fileDiff}
        options={options}
        className="min-h-full"
      />
    </div>
  )
}
