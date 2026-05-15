'use client'

import { useEffect, useState } from 'react'

import { Bell, Search } from 'lucide-react'

import { cn } from '@/lib/utils'

import { SearchModal } from '@/components/search-modal'

interface SidebarSearchBarProps {
  /** Show a red dot on the bell to hint at unread notifications. */
  hasNotification?: boolean
  className?: string
}

/**
 * Compact search input + notification bell, designed to live in the sidebar
 * header (below the brand). The input is read-only — clicking or pressing
 * ⌘K opens the global SearchModal.
 */
export function SidebarSearchBar({
  hasNotification = true,
  className
}: SidebarSearchBarProps) {
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
      <div className={cn('flex items-center gap-1.5 px-2 pb-2', className)}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex-1 inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-muted/50 hover:bg-muted text-sm text-muted-foreground transition-colors group"
          aria-label="Rechercher"
        >
          <Search className="size-3.5 shrink-0" />
          <span className="flex-1 text-left">Rechercher…</span>
          <kbd className="hidden md:inline-flex h-5 select-none items-center gap-0.5 rounded border bg-background/60 px-1.5 text-[10px] font-mono">
            ⌘K
          </kbd>
        </button>

        <button
          type="button"
          className="relative size-8 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="size-4" />
          {hasNotification && (
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-rose-500 ring-2 ring-sidebar" />
          )}
        </button>
      </div>

      <SearchModal open={open} onOpenChange={setOpen} />
    </>
  )
}
