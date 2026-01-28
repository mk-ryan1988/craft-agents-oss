/**
 * TerminalOutput - Terminal-style display for command output
 *
 * Platform-agnostic component for displaying terminal output with:
 * - ANSI color code support
 * - Grep output line number highlighting
 * - Light/dark theme support
 * - Copy functionality
 */

import * as React from 'react'
import { useState, useMemo, useCallback } from 'react'
import { Terminal, Copy, Check } from 'lucide-react'
import { cn } from '../../lib/utils'
import { parseAnsi, stripAnsi, isGrepContentOutput, parseGrepOutput } from './ansi-parser'

export type ToolType = 'bash' | 'grep' | 'glob'

export interface TerminalOutputProps {
  /** The command that was executed */
  command: string
  /** The output from the command */
  output: string
  /** Exit code (0 = success) */
  exitCode?: number
  /** Tool type for display styling */
  toolType?: ToolType
  /** Optional description of what the command does */
  description?: string
  /** Theme mode */
  theme?: 'light' | 'dark'
  /** Additional class names */
  className?: string
}

/**
 * TerminalOutput - Display terminal command and output with ANSI colors
 */
export function TerminalOutput({
  command,
  output,
  exitCode,
  toolType = 'bash',
  description,
  theme: themeProp, // Deprecated: theme is now auto-detected from DOM
  className,
}: TerminalOutputProps) {
  const [copied, setCopied] = useState<'command' | 'output' | null>(null)

  // Detect dark mode from DOM if no theme prop provided
  const isDark = themeProp ? themeProp === 'dark' : document.documentElement.classList.contains('dark')

  // Semantic colors for terminal output - these stay consistent
  const matchColor = '#22c55e' // Green for grep matches

  // Copy to clipboard (strip ANSI codes for clean text)
  const copyToClipboard = useCallback(async (text: string, type: 'command' | 'output') => {
    try {
      await navigator.clipboard.writeText(stripAnsi(text))
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [])

  // Memoize ANSI-parsed output for performance
  const parsedOutput = useMemo(() => {
    if (!output) return []
    return parseAnsi(output)
  }, [output])

  // Check if this looks like grep content output
  const isGrepOutput = useMemo(() => {
    if (!output) return false
    return isGrepContentOutput(output)
  }, [output])

  // Parse grep output if applicable
  const grepLines = useMemo(() => {
    if (!isGrepOutput || !output) return []
    return parseGrepOutput(output)
  }, [isGrepOutput, output])

  return (
    <div
      className={cn('h-full w-full overflow-auto p-4 font-mono text-sm bg-background text-foreground', className)}
      style={{ fontFamily: '"JetBrains Mono", monospace' }}
    >
      {/* Command section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Terminal className="w-3 h-3" />
            <span>Command</span>
          </div>
          <button
            onClick={() => copyToClipboard(command, 'command')}
            className="p-1 rounded transition-colors hover:bg-foreground/10"
            title={copied === 'command' ? 'Copied!' : 'Copy command'}
          >
            {copied === 'command' ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        </div>
        <div className="p-3 rounded-lg overflow-x-auto bg-foreground/5">
          <code className="text-accent">{command}</code>
        </div>
      </div>

      {/* Output section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Terminal className="w-3 h-3" />
            <span>Output</span>
            {exitCode !== undefined && (
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded text-[10px]',
                  exitCode === 0 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                )}
              >
                exit {exitCode}
              </span>
            )}
          </div>
          <button
            onClick={() => copyToClipboard(output, 'output')}
            className="p-1 rounded transition-colors hover:bg-foreground/10"
            title={copied === 'output' ? 'Copied!' : 'Copy output'}
          >
            {copied === 'output' ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        </div>
        <pre
          className="p-3 rounded-lg overflow-auto bg-foreground/5"
          style={{ maxHeight: 'calc(100vh - 200px)' }}
        >
          {/* Grep output with line number highlighting */}
          {isGrepOutput && grepLines.length > 0 ? (
            <div className="space-y-0">
              {grepLines.map((line, i) => (
                <div
                  key={i}
                  className={cn('flex', line.isMatch && 'bg-success/10')}
                >
                  {/* Line number */}
                  {line.lineNum && (
                    <span
                      className={cn(
                        'select-none pr-3 text-right shrink-0',
                        line.isMatch ? 'text-success' : 'text-muted-foreground'
                      )}
                      style={{ minWidth: '3rem' }}
                    >
                      {line.lineNum}
                      <span className={line.isMatch ? 'text-success' : 'text-foreground/20'}>
                        {line.isMatch ? ':' : '-'}
                      </span>
                    </span>
                  )}
                  {/* Content */}
                  <span
                    className={cn(
                      'whitespace-pre-wrap break-words',
                      line.isMatch ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {line.content}
                  </span>
                </div>
              ))}
            </div>
          ) : parsedOutput.length > 0 ? (
            /* ANSI-colored output */
            <div className="whitespace-pre-wrap break-words">
              {parsedOutput.map((span, i) => (
                <span
                  key={i}
                  style={{
                    color: span.fg,
                    backgroundColor: span.bg,
                    fontWeight: span.bold ? 'bold' : undefined,
                    // Add padding for background colors
                    padding: span.bg ? '0 2px' : undefined,
                    borderRadius: span.bg ? '2px' : undefined,
                  }}
                >
                  {span.text}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">(no output)</span>
          )}
        </pre>
      </div>
    </div>
  )
}
