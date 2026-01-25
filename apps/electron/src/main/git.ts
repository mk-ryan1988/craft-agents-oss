/**
 * Git Utilities
 *
 * Helpers for git operations in the main process.
 * Used by Session Changes View to compute diffs between HEAD and working tree.
 */

import { execSync, exec } from 'child_process'
import { readFile as fsReadFile } from 'fs/promises'
import { existsSync } from 'fs'
import { relative, isAbsolute } from 'path'
import { countLineDifferences, getChangeStatus, type SessionFileChange } from '@craft-agent/shared/sessions'

/**
 * Check if a directory is inside a git repository.
 *
 * @param workingDir - Directory to check
 * @returns True if inside a git repo
 */
export function isGitRepo(workingDir: string): boolean {
  try {
    execSync('git rev-parse --git-dir', {
      cwd: workingDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 5000,
    })
    return true
  } catch {
    return false
  }
}

/**
 * Get the original content of a file from HEAD.
 * Returns empty string if file doesn't exist in HEAD (new file).
 *
 * @param workingDir - Git working directory
 * @param filePath - Absolute or relative path to file
 * @returns Original file content or empty string
 */
export async function getOriginalFromHead(
  workingDir: string,
  filePath: string
): Promise<string> {
  try {
    // Convert to relative path if absolute
    const relativePath = isAbsolute(filePath)
      ? relative(workingDir, filePath)
      : filePath

    // Use git show to get file content from HEAD
    const content = execSync(`git show HEAD:"${relativePath}"`, {
      cwd: workingDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000,
      maxBuffer: 10 * 1024 * 1024, // 10MB max
    })
    return content
  } catch (error) {
    // File doesn't exist in HEAD (new file) or git error
    return ''
  }
}

/**
 * Get the current content of a file from disk.
 * Returns empty string if file doesn't exist (deleted file).
 *
 * @param filePath - Absolute path to file
 * @returns Current file content or empty string
 */
export async function getCurrentFromDisk(filePath: string): Promise<string> {
  try {
    if (!existsSync(filePath)) {
      return ''
    }
    const content = await fsReadFile(filePath, 'utf-8')
    return content
  } catch {
    return ''
  }
}

/**
 * Check if a file has any differences between HEAD and current state.
 * More efficient than computing the full diff.
 *
 * @param workingDir - Git working directory
 * @param filePath - Absolute or relative path to file
 * @returns True if file has changes
 */
export async function hasChanges(
  workingDir: string,
  filePath: string
): Promise<boolean> {
  try {
    const relativePath = isAbsolute(filePath)
      ? relative(workingDir, filePath)
      : filePath

    // git diff --quiet exits with 1 if there are changes, 0 if no changes
    execSync(`git diff --quiet HEAD -- "${relativePath}"`, {
      cwd: workingDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 5000,
    })
    return false // No changes
  } catch {
    return true // Has changes (or error, treat as changed)
  }
}

/**
 * Compute the full diff information for a file.
 *
 * @param workingDir - Git working directory
 * @param filePath - Absolute path to file
 * @returns SessionFileChange with diff information
 */
export async function getFileDiff(
  workingDir: string,
  filePath: string
): Promise<SessionFileChange> {
  const [original, modified] = await Promise.all([
    getOriginalFromHead(workingDir, filePath),
    getCurrentFromDisk(filePath),
  ])

  // Skip if no net changes
  if (original === modified) {
    return {
      filePath,
      status: 'modified',
      additions: 0,
      deletions: 0,
      original: '',
      modified: '',
    }
  }

  const { additions, deletions } = countLineDifferences(original, modified)
  const status = getChangeStatus(original, modified)

  return {
    filePath,
    status,
    additions,
    deletions,
    original,
    modified,
  }
}

/**
 * Check if a file is a binary file (skip diff for binary files).
 *
 * @param filePath - Path to check
 * @returns True if file appears to be binary
 */
export function isBinaryFile(filePath: string): boolean {
  const binaryExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.icns',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.zip', '.tar', '.gz', '.7z', '.rar',
    '.mp3', '.mp4', '.wav', '.mov', '.avi',
    '.exe', '.dll', '.so', '.dylib',
    '.woff', '.woff2', '.ttf', '.otf', '.eot',
  ]

  const ext = filePath.toLowerCase().slice(filePath.lastIndexOf('.'))
  return binaryExtensions.includes(ext)
}
