'use client'

import { useEffect, useState } from 'react'

import { Search } from 'lucide-react'

import {
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'

import { SearchModal } from '@/components/search-modal'

export function SidebarSearchTrigger() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={() => setOpen(true)}>
          <Search className="size-4" />
          <span className="flex-1">Recherche</span>
          <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-mono text-muted-foreground">
            ⌘K
          </kbd>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SearchModal open={open} onOpenChange={setOpen} />
    </>
  )
}
