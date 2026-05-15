'use client'

import { type ReactNode, useState } from 'react'

import { ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'

export function RecentsCollapsible({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-1 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
        <span>Récents</span>
        <ChevronRight
          className={cn(
            'size-3 transition-transform opacity-60 group-hover:opacity-100',
            open && 'rotate-90'
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  )
}
