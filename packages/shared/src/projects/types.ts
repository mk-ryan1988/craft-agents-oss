/**
 * Project Types
 *
 * Projects are git-repo-anchored organizational layers within workspaces.
 * They serve as the foundation for worktree support and code-centric session grouping.
 *
 * File structure:
 * ~/.craft-agent/workspaces/{workspaceId}/projects/{projectSlug}/
 *   ├── config.json      - Project metadata (name, rootPath, scripts)
 *   ├── worktrees.json   - Worktree definitions (Phase 2)
 *   └── .env             - Project environment variables (future)
 */

/**
 * Project configuration (stored in config.json)
 */
export interface ProjectConfig {
  /** Unique project ID */
  id: string;
  /** Display name (e.g., "Craft Agents OSS") */
  name: string;
  /** URL-safe identifier (folder name) */
  slug: string;
  /** Absolute path to git repo root */
  rootPath: string;
  /** Custom scripts (future: build, test, deploy, etc.) */
  scripts?: Record<string, string>;
  /** Timestamps */
  createdAt: number;
  updatedAt: number;
}

/**
 * Worktree definition (Phase 2)
 * Stored in worktrees.json within the project folder
 */
export interface Worktree {
  /** Unique worktree ID */
  id: string;
  /** Git branch name */
  branch: string;
  /** Absolute path to worktree directory */
  path: string;
  /** Timestamps */
  createdAt: number;
}

/**
 * Loaded project with resolved paths
 */
export interface LoadedProject {
  config: ProjectConfig;
  /** Absolute path to project folder (e.g., ~/.craft-agent/workspaces/xxx/projects/my-project) */
  folderPath: string;
  /** Absolute path to workspace folder */
  workspaceRootPath: string;
  /** Worktrees for this project (Phase 2) */
  worktrees: Worktree[];
}

/**
 * Project creation input (without auto-generated fields)
 */
export interface CreateProjectInput {
  /** Display name */
  name: string;
  /** Absolute path to git repo root */
  rootPath: string;
}

/**
 * Project update input
 */
export interface UpdateProjectInput {
  /** Update display name */
  name?: string;
  /** Update scripts */
  scripts?: Record<string, string>;
}
