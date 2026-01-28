/**
 * ProjectsListPanel - List view for workspace projects
 *
 * Displays projects with their session counts and allows:
 * - Creating new projects
 * - Selecting projects to filter sessions
 * - Deleting projects (via context menu)
 */

import { useState, useCallback, useMemo } from 'react'
import { FolderGit2, MoreHorizontal, Trash2, FolderOpen, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  StyledDropdownMenuContent,
  StyledDropdownMenuItem,
  StyledDropdownMenuSeparator,
} from '@/components/ui/styled-dropdown'
import {
  ContextMenu,
  ContextMenuTrigger,
  StyledContextMenuContent,
} from '@/components/ui/styled-context-menu'
import { ContextMenuProvider, DropdownMenuProvider } from '@/components/ui/menu-context'
import { RenameDialog } from '@/components/ui/rename-dialog'
import type { LoadedProject } from '../../../shared/types'

interface ProjectItemProps {
  project: LoadedProject
  isSelected: boolean
  sessionCount: number
  onSelect: () => void
  onRename: (name: string) => void
  onDelete: () => void
  onOpenInFinder: () => void
}

function ProjectItem({
  project,
  isSelected,
  sessionCount,
  onSelect,
  onRename,
  onDelete,
  onOpenInFinder,
}: ProjectItemProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [contextMenuOpen, setContextMenuOpen] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renameName, setRenameName] = useState(project.config.name)

  const handleRenameSubmit = () => {
    if (renameName.trim() && renameName.trim() !== project.config.name) {
      onRename(renameName.trim())
    }
    setRenameDialogOpen(false)
  }

  const menuContent = (
    <>
      <StyledDropdownMenuItem onClick={() => {
        setRenameName(project.config.name)
        requestAnimationFrame(() => setRenameDialogOpen(true))
      }}>
        Rename
      </StyledDropdownMenuItem>
      <StyledDropdownMenuItem onClick={onOpenInFinder}>
        <FolderOpen className="h-3.5 w-3.5" />
        Open in Finder
      </StyledDropdownMenuItem>
      <StyledDropdownMenuSeparator />
      <StyledDropdownMenuItem onClick={onDelete} variant="destructive">
        <Trash2 className="h-3.5 w-3.5" />
        Delete Project
      </StyledDropdownMenuItem>
    </>
  )

  return (
    <>
      <ContextMenu modal={true} onOpenChange={setContextMenuOpen}>
        <ContextMenuTrigger asChild>
          <div className="group relative">
            <button
              onClick={onSelect}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm outline-none rounded-[8px] mx-2',
                'transition-[background-color] duration-75',
                isSelected
                  ? 'bg-foreground/5 hover:bg-foreground/7'
                  : 'hover:bg-foreground/2'
              )}
            >
              <FolderGit2 className="h-4 w-4 text-foreground/60 shrink-0" />
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="font-medium truncate">{project.config.name}</span>
                <span className="text-xs text-foreground/50 truncate">
                  {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}
                </span>
              </div>
            </button>
            {/* Action buttons - visible on hover or when menu is open */}
            <div
              className={cn(
                'absolute right-4 top-1/2 -translate-y-1/2 transition-opacity z-10',
                menuOpen || contextMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              )}
            >
              <DropdownMenu modal={true} onOpenChange={setMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <div className="p-1 hover:bg-foreground/10 data-[state=open]:bg-foreground/10 cursor-pointer rounded">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </div>
                </DropdownMenuTrigger>
                <StyledDropdownMenuContent align="end">
                  <DropdownMenuProvider>
                    {menuContent}
                  </DropdownMenuProvider>
                </StyledDropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </ContextMenuTrigger>
        <StyledContextMenuContent>
          <ContextMenuProvider>
            {menuContent}
          </ContextMenuProvider>
        </StyledContextMenuContent>
      </ContextMenu>

      {/* Rename Dialog */}
      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        title="Rename project"
        value={renameName}
        onValueChange={setRenameName}
        onSubmit={handleRenameSubmit}
        placeholder="Enter a name..."
      />
    </>
  )
}

interface ProjectsListPanelProps {
  projects: LoadedProject[]
  selectedProjectId: string | null
  sessionCountByProject: Map<string, number>
  onProjectSelect: (project: LoadedProject | null) => void
  onProjectRename: (projectSlug: string, name: string) => void
  onProjectDelete: (projectSlug: string) => void
  onOpenProjectInFinder: (project: LoadedProject) => void
}

export function ProjectsListPanel({
  projects,
  selectedProjectId,
  sessionCountByProject,
  onProjectSelect,
  onProjectRename,
  onProjectDelete,
  onOpenProjectInFinder,
}: ProjectsListPanelProps) {
  // Sort projects by name
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => a.config.name.localeCompare(b.config.name))
  }, [projects])

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center">
        <FolderGit2 className="h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">No projects yet</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Create a project to group related sessions
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col py-2">
        {/* "All Sessions" option to show unassigned sessions */}
        <button
          onClick={() => onProjectSelect(null)}
          className={cn(
            'flex w-full items-center gap-2 px-3 py-2 text-left text-sm outline-none rounded-[8px] mx-2',
            'transition-[background-color] duration-75',
            selectedProjectId === null
              ? 'bg-foreground/5 hover:bg-foreground/7'
              : 'hover:bg-foreground/2'
          )}
        >
          <span className="font-medium">Unassigned Sessions</span>
        </button>

        <div className="px-4 py-2">
          <Separator />
        </div>

        {/* Project list */}
        {sortedProjects.map((project) => (
          <ProjectItem
            key={project.config.id}
            project={project}
            isSelected={selectedProjectId === project.config.id}
            sessionCount={sessionCountByProject.get(project.config.id) || 0}
            onSelect={() => onProjectSelect(project)}
            onRename={(name) => onProjectRename(project.config.slug, name)}
            onDelete={() => onProjectDelete(project.config.slug)}
            onOpenInFinder={() => onOpenProjectInFinder(project)}
          />
        ))}
      </div>
    </ScrollArea>
  )
}
