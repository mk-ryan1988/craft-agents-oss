/**
 * Projects Atom
 *
 * State management for workspace projects.
 * Projects are an organizational layer below workspaces that group related sessions.
 */

import { atom } from 'jotai'
import type { LoadedProject } from '../../shared/types'

/**
 * Atom to store the current workspace's projects.
 * Populated when workspace is loaded, updated via IPC events.
 */
export const projectsAtom = atom<LoadedProject[]>([])

/**
 * Currently selected project ID for sidebar filtering.
 * When null, show "All Chats" view.
 */
export const selectedProjectIdAtom = atom<string | null>(null)

/**
 * Sidebar view mode - determines what's shown in the sidebar.
 * 'projects' = Project-based view with session grouping
 * 'all' = Traditional All Chats view (date-based grouping)
 */
export const sidebarViewModeAtom = atom<'projects' | 'all'>('all')

/**
 * Derived atom: currently selected project
 */
export const selectedProjectAtom = atom((get) => {
  const projectId = get(selectedProjectIdAtom)
  if (!projectId) return null
  const projects = get(projectsAtom)
  return projects.find((p) => p.config.id === projectId) ?? null
})

/**
 * Action atom: select a project by ID
 */
export const selectProjectAtom = atom(null, (get, set, projectId: string | null) => {
  set(selectedProjectIdAtom, projectId)
  // Switch to projects view when selecting a project
  if (projectId) {
    set(sidebarViewModeAtom, 'projects')
  }
})

/**
 * Action atom: initialize projects from loaded data
 */
export const initializeProjectsAtom = atom(null, (_get, set, projects: LoadedProject[]) => {
  set(projectsAtom, projects)
})

/**
 * Action atom: add a new project
 */
export const addProjectAtom = atom(null, (get, set, project: LoadedProject) => {
  const projects = get(projectsAtom)
  set(projectsAtom, [...projects, project].sort((a, b) => a.config.name.localeCompare(b.config.name)))
})

/**
 * Action atom: update an existing project
 */
export const updateProjectAtom = atom(null, (get, set, updatedProject: LoadedProject) => {
  const projects = get(projectsAtom)
  const newProjects = projects.map((p) =>
    p.config.id === updatedProject.config.id ? updatedProject : p
  )
  set(projectsAtom, newProjects.sort((a, b) => a.config.name.localeCompare(b.config.name)))
})

/**
 * Action atom: remove a project
 */
export const removeProjectAtom = atom(null, (get, set, projectId: string) => {
  const projects = get(projectsAtom)
  set(projectsAtom, projects.filter((p) => p.config.id !== projectId))

  // If the removed project was selected, clear selection
  const selectedId = get(selectedProjectIdAtom)
  if (selectedId === projectId) {
    set(selectedProjectIdAtom, null)
  }
})

// HMR: Force full page refresh when this file changes.
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    import.meta.hot?.invalidate()
  })
}
