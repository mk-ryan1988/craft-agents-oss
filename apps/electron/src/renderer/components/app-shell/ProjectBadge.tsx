/**
 * ProjectBadge - Clickable badge showing session's project assignment
 *
 * Shows "Unsorted" when session has no project, or project name when assigned.
 * Clicking opens a dropdown to assign/change the project.
 */

import * as React from 'react'
import { useState } from 'react'
import { FolderGit2, ChevronDown, Check, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  StyledDropdownMenuContent,
  StyledDropdownMenuItem,
  StyledDropdownMenuSeparator,
} from '@/components/ui/styled-dropdown'
import type { LoadedProject } from '../../../shared/types'

export interface ProjectBadgeProps {
  /** Currently assigned project ID (null if unassigned) */
  projectId: string | null
  /** Available projects to choose from */
  projects: LoadedProject[]
  /** Called when project assignment changes */
  onProjectChange: (projectId: string | null) => void
  /** Called when user wants to create a new project */
  onCreateProject?: () => void
  /** Optional className */
  className?: string
}

export function ProjectBadge({
  projectId,
  projects,
  onProjectChange,
  onCreateProject,
  className,
}: ProjectBadgeProps) {
  const [open, setOpen] = useState(false)

  // Find current project
  const currentProject = projectId
    ? projects.find(p => p.config.id === projectId)
    : null

  const displayName = currentProject?.config.name || 'Unsorted'
  const isUnassigned = !currentProject

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs",
            "hover:bg-foreground/[0.05] transition-colors",
            "focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            isUnassigned ? "text-muted-foreground" : "text-foreground/80",
            open && "bg-foreground/[0.05]",
            className
          )}
        >
          <FolderGit2 className="h-3 w-3 shrink-0" />
          <span className="truncate max-w-[120px]">{displayName}</span>
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <StyledDropdownMenuContent align="start" sideOffset={4}>
        {/* Unassigned option */}
        <StyledDropdownMenuItem
          onClick={() => {
            onProjectChange(null)
            setOpen(false)
          }}
        >
          <div className="w-4 flex justify-center">
            {isUnassigned && <Check className="h-3.5 w-3.5" />}
          </div>
          <span className="text-muted-foreground">Unsorted</span>
        </StyledDropdownMenuItem>

        {projects.length > 0 && <StyledDropdownMenuSeparator />}

        {/* Project list */}
        {projects.map(project => (
          <StyledDropdownMenuItem
            key={project.config.id}
            onClick={() => {
              onProjectChange(project.config.id)
              setOpen(false)
            }}
          >
            <div className="w-4 flex justify-center">
              {projectId === project.config.id && <Check className="h-3.5 w-3.5" />}
            </div>
            <FolderGit2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{project.config.name}</span>
          </StyledDropdownMenuItem>
        ))}

        {/* Create new project option */}
        {onCreateProject && (
          <>
            <StyledDropdownMenuSeparator />
            <StyledDropdownMenuItem
              onClick={() => {
                onCreateProject()
                setOpen(false)
              }}
            >
              <div className="w-4" />
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span>Add Project</span>
            </StyledDropdownMenuItem>
          </>
        )}
      </StyledDropdownMenuContent>
    </DropdownMenu>
  )
}
