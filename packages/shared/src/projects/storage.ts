/**
 * Project Storage
 *
 * CRUD operations for workspace-scoped projects.
 * Projects are stored at {workspaceRootPath}/projects/{projectSlug}/
 *
 * Note: All functions take `workspaceRootPath` (absolute path to workspace folder),
 * NOT a workspace slug.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'fs';
import { join, basename } from 'path';
import { randomUUID } from 'crypto';
import { expandPath, toPortablePath } from '../utils/paths.ts';
import type {
  ProjectConfig,
  LoadedProject,
  CreateProjectInput,
  UpdateProjectInput,
  Worktree,
} from './types.ts';

// ============================================================
// Directory Utilities
// ============================================================

/**
 * Get path to projects directory within a workspace
 */
export function getWorkspaceProjectsPath(workspaceRootPath: string): string {
  return join(workspaceRootPath, 'projects');
}

/**
 * Get path to a specific project folder within a workspace
 */
export function getProjectPath(workspaceRootPath: string, projectSlug: string): string {
  return join(getWorkspaceProjectsPath(workspaceRootPath), projectSlug);
}

/**
 * Ensure projects directory exists for a workspace
 */
export function ensureProjectsDir(workspaceRootPath: string): void {
  const dir = getWorkspaceProjectsPath(workspaceRootPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

// ============================================================
// Config Operations
// ============================================================

/**
 * Load project config.json
 */
export function loadProjectConfig(
  workspaceRootPath: string,
  projectSlug: string
): ProjectConfig | null {
  const configPath = join(getProjectPath(workspaceRootPath, projectSlug), 'config.json');
  if (!existsSync(configPath)) return null;

  try {
    const config = JSON.parse(readFileSync(configPath, 'utf-8')) as ProjectConfig;

    // Expand path variables for portability
    if (config.rootPath) {
      config.rootPath = expandPath(config.rootPath);
    }

    return config;
  } catch {
    return null;
  }
}

/**
 * Save project config.json
 */
export function saveProjectConfig(
  workspaceRootPath: string,
  config: ProjectConfig
): void {
  const dir = getProjectPath(workspaceRootPath, config.slug);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Convert paths to portable form for cross-machine compatibility
  const storageConfig: ProjectConfig = {
    ...config,
    updatedAt: Date.now(),
    rootPath: toPortablePath(config.rootPath),
  };

  writeFileSync(join(dir, 'config.json'), JSON.stringify(storageConfig, null, 2));
}

// ============================================================
// Worktree Operations (Phase 2 - stubbed for now)
// ============================================================

/**
 * Load worktrees for a project
 * Returns empty array for now - implementation in Phase 2
 */
export function loadProjectWorktrees(
  workspaceRootPath: string,
  projectSlug: string
): Worktree[] {
  const worktreesPath = join(getProjectPath(workspaceRootPath, projectSlug), 'worktrees.json');
  if (!existsSync(worktreesPath)) return [];

  try {
    const data = JSON.parse(readFileSync(worktreesPath, 'utf-8'));
    return Array.isArray(data.worktrees) ? data.worktrees : [];
  } catch {
    return [];
  }
}

// ============================================================
// Load Operations
// ============================================================

/**
 * Load complete project with all data
 */
export function loadProject(
  workspaceRootPath: string,
  projectSlug: string
): LoadedProject | null {
  const folderPath = getProjectPath(workspaceRootPath, projectSlug);
  const config = loadProjectConfig(workspaceRootPath, projectSlug);
  if (!config) return null;

  return {
    config,
    folderPath,
    workspaceRootPath,
    worktrees: loadProjectWorktrees(workspaceRootPath, projectSlug),
  };
}

/**
 * Load all projects for a workspace
 */
export function loadWorkspaceProjects(workspaceRootPath: string): LoadedProject[] {
  ensureProjectsDir(workspaceRootPath);

  const projects: LoadedProject[] = [];
  const projectsDir = getWorkspaceProjectsPath(workspaceRootPath);

  if (!existsSync(projectsDir)) return projects;

  const entries = readdirSync(projectsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const project = loadProject(workspaceRootPath, entry.name);
      if (project) {
        projects.push(project);
      }
    }
  }

  // Sort by name
  projects.sort((a, b) => a.config.name.localeCompare(b.config.name));

  return projects;
}

/**
 * Get project by ID
 */
export function getProjectById(
  workspaceRootPath: string,
  projectId: string
): LoadedProject | null {
  const projects = loadWorkspaceProjects(workspaceRootPath);
  return projects.find((p) => p.config.id === projectId) ?? null;
}

/**
 * Find project that contains a given path
 * Matches if the path starts with project.rootPath
 */
export function findProjectForPath(
  workspaceRootPath: string,
  path: string
): LoadedProject | null {
  const projects = loadWorkspaceProjects(workspaceRootPath);

  // Normalize path for comparison
  const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;

  for (const project of projects) {
    const rootPath = project.config.rootPath;
    const normalizedRoot = rootPath.endsWith('/') ? rootPath.slice(0, -1) : rootPath;

    // Check if path is exactly the rootPath or a subdirectory
    if (normalizedPath === normalizedRoot || normalizedPath.startsWith(normalizedRoot + '/')) {
      return project;
    }
  }

  return null;
}

// ============================================================
// Create/Update/Delete Operations
// ============================================================

/**
 * Generate URL-safe slug from name
 */
export function generateProjectSlug(workspaceRootPath: string, name: string): string {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);

  // Ensure slug is not empty
  if (!slug) {
    slug = 'project';
  }

  // Check for existing slugs and append number if needed
  const projectsDir = getWorkspaceProjectsPath(workspaceRootPath);
  const existingSlugs = new Set<string>();
  if (existsSync(projectsDir)) {
    const entries = readdirSync(projectsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        existingSlugs.add(entry.name);
      }
    }
  }

  if (!existingSlugs.has(slug)) {
    return slug;
  }

  // Find next available number
  let counter = 2;
  while (existingSlugs.has(`${slug}-${counter}`)) {
    counter++;
  }

  return `${slug}-${counter}`;
}

/**
 * Create a new project in a workspace
 */
export function createProject(
  workspaceRootPath: string,
  input: CreateProjectInput
): ProjectConfig {
  const slug = generateProjectSlug(workspaceRootPath, input.name);
  const now = Date.now();

  const config: ProjectConfig = {
    id: `proj_${randomUUID().slice(0, 8)}`,
    name: input.name,
    slug,
    rootPath: input.rootPath,
    createdAt: now,
    updatedAt: now,
  };

  // Save config (creates directory)
  saveProjectConfig(workspaceRootPath, config);

  return config;
}

/**
 * Update an existing project
 */
export function updateProject(
  workspaceRootPath: string,
  projectSlug: string,
  updates: UpdateProjectInput
): ProjectConfig | null {
  const config = loadProjectConfig(workspaceRootPath, projectSlug);
  if (!config) return null;

  // Apply updates
  if (updates.name !== undefined) {
    config.name = updates.name;
  }
  if (updates.scripts !== undefined) {
    config.scripts = updates.scripts;
  }

  saveProjectConfig(workspaceRootPath, config);
  return config;
}

/**
 * Delete a project from a workspace
 */
export function deleteProject(workspaceRootPath: string, projectSlug: string): boolean {
  const dir = getProjectPath(workspaceRootPath, projectSlug);
  if (!existsSync(dir)) return false;

  try {
    rmSync(dir, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a project exists in a workspace
 */
export function projectExists(workspaceRootPath: string, projectSlug: string): boolean {
  return existsSync(join(getProjectPath(workspaceRootPath, projectSlug), 'config.json'));
}

/**
 * Check if a path is a git repository root
 * Returns true if the path contains a .git directory
 */
export function isGitRepository(path: string): boolean {
  return existsSync(join(path, '.git'));
}

/**
 * Find git repository root from a path
 * Walks up directory tree looking for .git
 * Returns null if not in a git repository
 */
export function findGitRoot(path: string): string | null {
  let current = path;
  const root = '/';

  while (current !== root) {
    if (existsSync(join(current, '.git'))) {
      return current;
    }
    const parent = join(current, '..');
    // Resolve to handle .. properly
    const resolvedParent = join(current, '..');
    if (resolvedParent === current) break; // At root
    current = resolvedParent;
  }

  // Check root as well
  if (existsSync(join(root, '.git'))) {
    return root;
  }

  return null;
}
