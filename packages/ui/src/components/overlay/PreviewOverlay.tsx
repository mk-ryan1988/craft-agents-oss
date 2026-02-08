/**
 * PreviewOverlay - Base component for all preview overlays
 *
 * Provides unified presentation logic for modal/fullscreen overlays:
 * - Portal rendering to document.body (via FullscreenOverlayBase for fullscreen mode)
 * - Responsive modal (>=1200px) vs fullscreen (<1200px) modes
 * - Escape key to close
 * - Backdrop click to close (modal mode)
 * - Consistent header layout with badge, title, close button
 * - Optional error banner
 *
 * Used by: CodePreviewOverlay, DiffPreviewOverlay, TerminalPreviewOverlay, GenericOverlay
 */

import { useEffect, type ReactNode } from 'react'
import * as ReactDOM from 'react-dom'
import { X, type LucideIcon } from 'lucide-react'
import { useOverlayMode, OVERLAY_LAYOUT } from '../../lib/layout'
import { PreviewHeader, PreviewHeaderBadge, type PreviewBadgeVariant } from '../ui/PreviewHeader'
import { FullscreenOverlayBase } from './FullscreenOverlayBase'
import { OverlayErrorBanner } from './OverlayErrorBanner'

/** Badge color variants - re-export for backwards compatibility */
export type BadgeVariant = PreviewBadgeVariant

export interface PreviewOverlayProps {
  /** Whether the overlay is visible */
  isOpen: boolean
  /** Callback when the overlay should close */
  onClose: () => void
  /** Theme mode */
  theme?: 'light' | 'dark'

  /** Header badge configuration */
  badge: {
    icon: LucideIcon
    label: string
    variant: BadgeVariant
  }

  /** Main title (e.g., file path) */
  title?: string
  /** File path (alias for title, used by file-based overlays) */
  filePath?: string
  /** Callback when title is clicked (e.g., to open file) */
  onTitleClick?: () => void
  /** Optional subtitle (e.g., line range info) */
  subtitle?: ReactNode

  /** Optional error state */
  error?: {
    label: string
    message: string
  }

  /** Actions to show in header (rendered after badges) */
  headerActions?: ReactNode

  /** Main content */
  children: ReactNode

  /** Background color override (default: theme-based) */
  backgroundColor?: string
  /** Text color override (default: theme-based) */
  textColor?: string
  /** Render inline without dialog (for playground) */
  embedded?: boolean
  /** Additional CSS class name */
  className?: string
}

export function PreviewOverlay({
  isOpen,
  onClose,
  theme: _theme, // Deprecated: theme is now auto-inherited from CSS variables
  badge,
  title,
  filePath,
  onTitleClick,
  subtitle,
  error,
  headerActions,
  children,
  backgroundColor: _backgroundColor, // Deprecated: use CSS variables
  textColor: _textColor, // Deprecated: use CSS variables
  embedded,
  className: _className,
}: PreviewOverlayProps) {
  const responsiveMode = useOverlayMode()
  const isModal = responsiveMode === 'modal'

  // Handle Escape key for modal mode only (fullscreen mode uses FullscreenOverlayBase which handles ESC)
  useEffect(() => {
    if (!isOpen || !isModal) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isModal, onClose])

  if (!isOpen) return null

  const header = (
    <PreviewHeader onClose={onClose} height={isModal ? 48 : 54}>
      <PreviewHeaderBadge
        icon={badge.icon}
        label={badge.label}
        variant={badge.variant}
      />
      <PreviewHeaderBadge label={title || filePath || ''} onClick={onTitleClick} shrinkable />
      {subtitle && <PreviewHeaderBadge label={String(subtitle)} />}
      {headerActions}
    </PreviewHeader>
  )

  // Error banner — uses shared OverlayErrorBanner with tinted-shadow styling.
  // Rendered inside the centering wrapper so error + content are centered together.
  const errorBanner = error && (
    <div className="px-6 pb-4">
      <OverlayErrorBanner label={error.label} message={error.message} />
    </div>
  )

  // Gradient fade mask for modal/embedded modes — mirrors FullscreenOverlayBase's
  // scroll container structure so children (ContentFrame, etc.) work identically
  // in all modes using flow-based layout inside a scrollable, masked viewport.
  const FADE_SIZE = 24
  const FADE_MASK = `linear-gradient(to bottom, transparent 0%, black ${FADE_SIZE}px, black calc(100% - ${FADE_SIZE}px), transparent 100%)`

  const contentArea = (
    <div
      className="flex-1 min-h-0 relative"
      style={{ maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }}
    >
      <div
        className="absolute inset-0 overflow-y-auto"
        style={{ paddingTop: FADE_SIZE, paddingBottom: FADE_SIZE, scrollPaddingTop: FADE_SIZE }}
      >
        {/* Centering wrapper — error + content are vertically centered together when small */}
        <div className="min-h-full flex flex-col justify-center">
          {errorBanner}
          {children}
        </div>
      </div>
    </div>
  )

  // Embedded mode — renders inline without dialog/portal, for design system playground
  if (embedded) {
    return (
      <div className="flex flex-col bg-background h-full w-full overflow-hidden rounded-lg border border-foreground/5">
        {header}
        {contentArea}
      </div>
    )
  }

  // Fullscreen mode - uses FullscreenOverlayBase for portal, traffic lights, and ESC handling
  if (!isModal) {
    return (
      <FullscreenOverlayBase
        isOpen={isOpen}
        onClose={onClose}
        className="flex flex-col bg-background text-foreground"
      >
        <div className="flex flex-col flex-1 min-h-0 bg-background text-foreground">
          {header}
          {errorBanner}
          {contentArea}
        </div>
      </FullscreenOverlayBase>
    )
  }

  // Modal mode - uses its own portal with backdrop click to close
  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${OVERLAY_LAYOUT.modalBackdropClass}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="flex flex-col bg-background text-foreground shadow-3xl overflow-hidden smooth-corners"
        style={{
          width: '90vw',
          maxWidth: OVERLAY_LAYOUT.modalMaxWidth,
          height: `${OVERLAY_LAYOUT.modalMaxHeightPercent}vh`,
          borderRadius: 16,
        }}
      >
        {header}
        {contentArea}
      </div>
    </div>,
    document.body
  )
}
