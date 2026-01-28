/**
 * Projects Module
 *
 * Exports for workspace-scoped project management.
 */

// Types
export type {
  ProjectConfig,
  LoadedProject,
  CreateProjectInput,
  UpdateProjectInput,
  Worktree,
} from './types.ts';

// Storage operations
export {
  // Path utilities
  getWorkspaceProjectsPath,
  getProjectPath,
  ensureProjectsDir,
  // Config operations
  loadProjectConfig,
  saveProjectConfig,
  // Load operations
  loadProject,
  loadWorkspaceProjects,
  getProjectById,
  findProjectForPath,
  // CRUD operations
  generateProjectSlug,
  createProject,
  updateProject,
  deleteProject,
  projectExists,
  // Git utilities
  isGitRepository,
  findGitRoot,
} from './storage.ts';
