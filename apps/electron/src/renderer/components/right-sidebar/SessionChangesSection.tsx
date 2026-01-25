/**
 * SessionChangesSection - Displays file changes made during the session
 *
 * Features:
 * - Shows files modified by Edit/Write tools with +/- line counts
 * - Click to view single file diff
 * - "Review All" button to view all changes in MultiDiffPreviewOverlay
 * - Only shows files with net changes (reverted files are excluded)
 *
 * Styling matches SessionFilesSection patterns.
 */

import * as React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { FileCode, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MultiDiffPreviewOverlay, DiffPreviewOverlay, type FileChange } from '@craft-agent/ui'
import { useTheme } from '@/hooks/useTheme'
import type { SessionChangesResult, SessionFileChange } from '@craft-agent/shared/sessions'

export interface SessionChangesSectionProps {
  sessionId?: string
  className?: string
}

/**
 * Get file name from path
 */
function getFileName(filePath: string): string {
  return filePath.split('/').pop() || filePath
}

/**
 * Get parent directory for display
 */
function getParentDir(filePath: string): string {
  const parts = filePath.split('/')
  if (parts.length <= 2) return ''
  return parts.slice(-3, -1).join('/')
}

interface ChangeItemProps {
  change: SessionFileChange
  onClick: () => void
}

/**
 * Single change item in the list
 */
function ChangeItem({ change, onClick }: ChangeItemProps) {
  const fileName = getFileName(change.filePath)
  const parentDir = getParentDir(change.filePath)

  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full min-w-0 overflow-hidden items-center gap-2 rounded-[6px] py-[5px] text-[13px] select-none outline-none text-left",
        "focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring",
        "hover:bg-foreground/5 transition-colors",
        "px-2"
      )}
      title={`${change.filePath}\n+${change.additions} -${change.deletions}\n\nClick to view diff`}
    >
      {/* Icon */}
      <span className="h-3.5 w-3.5 shrink-0 flex items-center justify-center">
        <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
      </span>

      {/* File name and path */}
      <div className="flex-1 min-w-0">
        <div className="truncate">{fileName}</div>
        {parentDir && (
          <div className="text-[10px] text-muted-foreground truncate">
            {parentDir}
          </div>
        )}
      </div>

      {/* Line counts */}
      <div className="shrink-0 text-xs font-mono flex gap-1.5">
        {change.additions > 0 && (
          <span className="text-green-600 dark:text-green-500">+{change.additions}</span>
        )}
        {change.deletions > 0 && (
          <span className="text-red-600 dark:text-red-500">-{change.deletions}</span>
        )}
        {change.status === 'added' && change.additions === 0 && (
          <span className="text-green-600 dark:text-green-500 text-[10px]">new</span>
        )}
      </div>
    </button>
  )
}

/**
 * Section displaying session file changes
 */
export function SessionChangesSection({ sessionId, className }: SessionChangesSectionProps) {
  const { isDark } = useTheme()
  const [changesResult, setChangesResult] = useState<SessionChangesResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const mountedRef = useRef(true)

  // Overlay state
  const [showMultiDiff, setShowMultiDiff] = useState(false)
  const [singleDiff, setSingleDiff] = useState<SessionFileChange | null>(null)

  // Load changes
  const loadChanges = useCallback(async () => {
    if (!sessionId) {
      setChangesResult(null)
      return
    }

    setIsLoading(true)
    try {
      const result = await window.electronAPI.getSessionChanges(sessionId)
      if (mountedRef.current) {
        setChangesResult(result)
      }
    } catch (error) {
      console.error('Failed to load session changes:', error)
      if (mountedRef.current) {
        setChangesResult(null)
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [sessionId])

  // Load on mount and when session changes
  useEffect(() => {
    mountedRef.current = true
    loadChanges()

    // Reload changes periodically while session is active
    const interval = setInterval(loadChanges, 10000) // Every 10 seconds

    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
  }, [sessionId, loadChanges])

  // Handle single file click
  const handleFileClick = useCallback((change: SessionFileChange) => {
    setSingleDiff(change)
  }, [])

  // Handle "Review All" click
  const handleReviewAll = useCallback(() => {
    setShowMultiDiff(true)
  }, [])

  // Convert changes to FileChange format for MultiDiffPreviewOverlay
  const fileChanges: FileChange[] = (changesResult?.files || []).map(change => ({
    id: change.filePath,
    filePath: change.filePath,
    toolType: change.status === 'added' ? 'Write' : 'Edit',
    original: change.original,
    modified: change.modified,
    error: change.error,
  }))

  // Handle opening file in editor
  const handleOpenFile = useCallback((filePath: string) => {
    window.electronAPI.openFile(filePath)
  }, [])

  // Don't render if no session or no changes
  if (!sessionId) {
    return null
  }

  const changes = changesResult?.files || []

  // Don't show the section if there are no changes
  if (changes.length === 0 && !isLoading) {
    return null
  }

  return (
    <div className={cn('flex flex-col min-h-0', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0 select-none">
        <span className="text-xs font-medium text-muted-foreground">
          Changes {changes.length > 0 && `(${changes.length})`}
        </span>
        {changes.length > 0 && (
          <button
            onClick={handleReviewAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            title="Review all changes"
          >
            <Eye className="h-3 w-3" />
            Review All
          </button>
        )}
      </div>

      {/* Changes list - grows to fill available space */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-2 min-h-0">
        {isLoading && changes.length === 0 ? (
          <div className="px-4 text-muted-foreground select-none">
            <p className="text-xs">Loading...</p>
          </div>
        ) : (
          <nav className="grid gap-0.5 px-2">
            {changes.map((change) => (
              <ChangeItem
                key={change.filePath}
                change={change}
                onClick={() => handleFileClick(change)}
              />
            ))}
          </nav>
        )}
      </div>

      {/* Single file diff overlay */}
      {singleDiff && (
        <DiffPreviewOverlay
          isOpen={true}
          onClose={() => setSingleDiff(null)}
          original={singleDiff.original}
          modified={singleDiff.modified}
          filePath={singleDiff.filePath}
          theme={isDark ? 'dark' : 'light'}
          onOpenFile={handleOpenFile}
        />
      )}

      {/* Multi-diff overlay */}
      {showMultiDiff && fileChanges.length > 0 && (
        <MultiDiffPreviewOverlay
          isOpen={true}
          onClose={() => setShowMultiDiff(false)}
          changes={fileChanges}
          consolidated={true}
          theme={isDark ? 'dark' : 'light'}
          onOpenFile={handleOpenFile}
        />
      )}
    </div>
  )
}
