'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

import {
  Archive,
  Banknote,
  Briefcase,
  CalendarClock,
  Coffee,
  Eye,
  Flame,
  Gift,
  GraduationCap,
  Handshake,
  Repeat,
  Zap
} from 'lucide-react'

import { type InboxTag } from '@/lib/inbox/auto-tag'
import { cn } from '@/lib/utils'

interface CountsResponse {
  all: number
  byTag: Record<InboxTag, number>
}

interface Item {
  view: 'all' | InboxTag
  label: string
  icon: typeof Flame
  color: string
}

const ACTION_ITEMS: Item[] = [
  {
    view: 'traiter_aujourdhui',
    label: 'À traiter aujourd’hui',
    icon: Zap,
    color: 'text-rose-500'
  },
  {
    view: 'planifier',
    label: 'À planifier',
    icon: CalendarClock,
    color: 'text-sky-500'
  },
  {
    view: 'relancer',
    label: 'À relancer',
    icon: Repeat,
    color: 'text-amber-500'
  },
  {
    view: 'engagements',
    label: 'Engagements',
    icon: Gift,
    color: 'text-violet-500'
  },
  { view: 'lire', label: 'À lire', icon: Eye, color: 'text-emerald-500' },
  {
    view: 'archive',
    label: 'Archive',
    icon: Archive,
    color: 'text-muted-foreground'
  }
]

const BUSINESS_ITEMS: Item[] = [
  {
    view: 'recruteur',
    label: 'Recruteurs',
    icon: Briefcase,
    color: 'text-blue-500'
  },
  {
    view: 'lead_commercial',
    label: 'Leads commerciaux',
    icon: Banknote,
    color: 'text-emerald-500'
  },
  {
    view: 'intro',
    label: 'Demandes intro',
    icon: Handshake,
    color: 'text-violet-500'
  },
  {
    view: 'mentorat',
    label: 'Mentorat',
    icon: GraduationCap,
    color: 'text-indigo-500'
  },
  {
    view: 'networking',
    label: 'Networking',
    icon: Coffee,
    color: 'text-stone-500'
  }
]

export function InboxSidebarSubmenu() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [counts, setCounts] = useState<CountsResponse | null>(null)

  const onInbox = pathname === '/inbox' || pathname.startsWith('/inbox/')

  useEffect(() => {
    let cancelled = false
    fetch('/api/inbox/counts')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!cancelled) setCounts(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // Active view only when actually on /inbox (otherwise nothing should look selected)
  const activeView = onInbox ? (searchParams.get('view') ?? 'all') : null

  const renderItem = (item: Item) => {
    const count =
      item.view === 'all' ? counts?.all : (counts?.byTag[item.view] ?? 0)
    const isActive = activeView === item.view
    // Hide empty categories (unless active, so users keep their bearings)
    if (counts && (count ?? 0) === 0 && !isActive) return null
    const Icon = item.icon
    const href =
      item.view === 'all' ? '/inbox' : `/inbox?view=${item.view}`
    return (
      <Link
        key={item.view}
        href={href}
        className={cn(
          'group flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors',
          isActive
            ? 'bg-muted text-foreground font-medium'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
        )}
      >
        <Icon className={cn('size-3.5 shrink-0', item.color)} />
        <span className="flex-1 truncate">{item.label}</span>
        {count != null && count > 0 && (
          <span className="text-[10px] tabular-nums opacity-70">{count}</span>
        )}
      </Link>
    )
  }

  return (
    <div className="ml-3 mt-0.5 mb-1 border-l border-border/40 pl-2 space-y-0.5">
      <Link
        href="/inbox"
        className={cn(
          'flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors',
          activeView === 'all'
            ? 'bg-muted text-foreground font-medium'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
        )}
      >
        <span>Tous</span>
        {counts?.all != null && (
          <span className="text-[10px] tabular-nums opacity-70">
            {counts.all}
          </span>
        )}
      </Link>

      {(() => {
        const rendered = ACTION_ITEMS.map(renderItem).filter(Boolean)
        if (rendered.length === 0) return null
        return (
          <div className="pt-1.5">
            <div className="px-2 mb-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Vues
            </div>
            {rendered}
          </div>
        )
      })()}

      {(() => {
        const rendered = BUSINESS_ITEMS.map(renderItem).filter(Boolean)
        if (rendered.length === 0) return null
        return (
          <div className="pt-1.5">
            <div className="px-2 mb-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Tags business
            </div>
            {rendered}
          </div>
        )
      })()}
    </div>
  )
}
