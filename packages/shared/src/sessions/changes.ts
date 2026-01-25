/**
 * Session Changes
 *
 * Utilities for extracting and analyzing file changes made during a session.
 * Used by the Session Changes View feature to show a summary of all edits
 * before committing.
 */

/**
 * Minimal message interface for extracting file changes.
 * Works with both StoredMessage (type field) and Message (role field).
 */
interface MessageLike {
  /** Message type for StoredMessage */
  type?: string;
  /** Message role for Message */
  role?: string;
  /** Tool name */
  toolName?: string;
  /** Tool input parameters */
  toolInput?: Record<string, unknown>;
}

/**
 * A file that was touched (edited/written) during the session
 */
export interface SessionFileChange {
  /** Absolute file path */
  filePath: string;
  /** Change status: modified existing, added new, or deleted */
  status: 'modified' | 'added' | 'deleted';
  /** Number of lines added */
  additions: number;
  /** Number of lines deleted */
  deletions: number;
  /** Original file content (from HEAD or empty if new) */
  original: string;
  /** Modified file content (current state on disk) */
  modified: string;
  /** Error message if diff couldn't be computed */
  error?: string;
}

/**
 * Result from getSessionChanges IPC call
 */
export interface SessionChangesResult {
  /** List of file changes */
  files: SessionFileChange[];
  /** Whether the session is in a git repository */
  isGitRepo: boolean;
  /** Working directory of the session */
  workingDirectory?: string;
}

/**
 * Tool names that modify files
 */
const FILE_MODIFYING_TOOLS = ['edit', 'write', 'multiedit'];

/**
 * Check if a message is a tool message.
 * Handles both StoredMessage (type field) and Message (role field).
 */
function isToolMessage(msg: MessageLike): boolean {
  return msg.type === 'tool' || msg.role === 'tool';
}

/**
 * Extract unique file paths that were touched by Edit/Write tools in a session.
 * Returns files sorted alphabetically (tree order).
 *
 * @param messages - Session messages to scan (works with both StoredMessage and Message types)
 * @returns Sorted array of unique file paths
 */
export function getSessionTouchedFiles(messages: MessageLike[]): string[] {
  const files = new Set<string>();

  for (const msg of messages) {
    // Only look at tool messages
    if (!isToolMessage(msg) || !msg.toolInput) continue;

    // Check if it's a file-modifying tool
    const toolName = msg.toolName?.toLowerCase();
    if (!toolName || !FILE_MODIFYING_TOOLS.includes(toolName)) continue;

    // Extract file path from tool input
    const filePath = msg.toolInput.file_path || msg.toolInput.path;
    if (typeof filePath === 'string' && filePath.trim()) {
      files.add(filePath);
    }
  }

  // Return sorted for tree order
  return Array.from(files).sort((a, b) => a.localeCompare(b));
}

/**
 * Count added and deleted lines between two strings.
 * Uses a simple line-by-line diff algorithm.
 *
 * @param original - Original content
 * @param modified - Modified content
 * @returns Object with additions and deletions counts
 */
export function countLineDifferences(
  original: string,
  modified: string
): { additions: number; deletions: number } {
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');

  // Simple LCS-based diff to count additions/deletions
  const originalSet = new Set(originalLines);
  const modifiedSet = new Set(modifiedLines);

  // Lines in modified but not in original = additions
  let additions = 0;
  for (const line of modifiedLines) {
    if (!originalSet.has(line)) {
      additions++;
    }
  }

  // Lines in original but not in modified = deletions
  let deletions = 0;
  for (const line of originalLines) {
    if (!modifiedSet.has(line)) {
      deletions++;
    }
  }

  return { additions, deletions };
}

/**
 * Determine file change status based on original and modified content.
 *
 * @param original - Original content (empty string if file didn't exist)
 * @param modified - Modified content (empty string if file was deleted)
 * @returns Change status
 */
export function getChangeStatus(
  original: string,
  modified: string
): 'modified' | 'added' | 'deleted' {
  if (!original && modified) {
    return 'added';
  }
  if (original && !modified) {
    return 'deleted';
  }
  return 'modified';
}
