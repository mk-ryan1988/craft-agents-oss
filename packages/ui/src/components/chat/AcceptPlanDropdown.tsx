import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * AcceptPlanDropdown - Dropdown for accepting plans with or without compaction
 *
 * Provides two options:
 * 1. Accept - Execute the plan immediately
 * 2. Accept & Compact - Summarize conversation first, then execute
 *
 * The compact option is useful when context is running low after a long planning session.
 *
 * Uses Radix DropdownMenu for proper positioning via Radix Popper.
 */

interface AcceptPlanDropdownProps {
  /** Callback when user selects "Accept" (execute immediately) */
  onAccept: () => void
  /** Callback when user selects "Accept & Compact" (compact first, then execute) */
  onAcceptWithCompact: () => void
  /** Additional className for the trigger button */
  className?: string
}

export function AcceptPlanDropdown({
  onAccept,
  onAcceptWithCompact,
  className,
}: AcceptPlanDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <DropdownMenuPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            "h-[28px] pl-2.5 pr-2 text-xs font-medium rounded-[6px] flex items-center gap-1.5 transition-all",
            "bg-success/5 text-success hover:bg-success/10 shadow-tinted",
            className
          )}
          style={{ '--shadow-color': '34, 136, 82' } as React.CSSProperties}
        >
          <Check className="h-3.5 w-3.5" />
          <span>Accept Plan</span>
          <ChevronDown className={cn(
            "h-3 w-3 transition-transform duration-150",
            isOpen && "rotate-180"
          )} />
        </button>
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          sideOffset={4}
          align="end"
          className={cn(
            "z-dropdown min-w-[280px] p-1.5",
            "bg-background rounded-[8px] shadow-strong border border-border/50",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
          )}
        >
          {/* Option 1: Accept (execute immediately) */}
          <DropdownMenuPrimitive.Item
            onSelect={() => onAccept()}
            className={cn(
              "flex flex-col w-full px-3 py-2 text-left rounded-[6px] cursor-default",
              "hover:bg-foreground/[0.05] focus:bg-foreground/[0.05] focus:outline-none",
              "transition-colors"
            )}
          >
            <span className="text-[13px] font-medium">Accept</span>
            <span className="text-xs text-muted-foreground">
              Execute the plan immediately
            </span>
          </DropdownMenuPrimitive.Item>

          {/* Option 2: Accept & Compact */}
          <DropdownMenuPrimitive.Item
            onSelect={() => onAcceptWithCompact()}
            className={cn(
              "flex flex-col w-full px-3 py-2 text-left rounded-[6px] cursor-default",
              "hover:bg-foreground/[0.05] focus:bg-foreground/[0.05] focus:outline-none",
              "transition-colors"
            )}
          >
            <span className="text-[13px] font-medium">Accept & Compact</span>
            <span className="text-xs text-muted-foreground">
              Works best for complex, longer plans
            </span>
          </DropdownMenuPrimitive.Item>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  )
}
