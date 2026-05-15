'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import {
  Bell,
  Brain,
  CreditCard,
  ExternalLink,
  Network,
  Plug,
  SlidersHorizontal,
  Sparkles,
  User
} from 'lucide-react'

import { cn } from '@/lib/utils'

import { MemoryDashboard } from '@/components/memory/memory-dashboard'

type TabId = 'general' | 'memory' | 'account' | 'integrations' | 'notifications'

interface InternalTab {
  kind: 'tab'
  id: TabId
  label: string
  Icon: typeof User
  description: string
}

interface LinkItem {
  kind: 'link'
  id: string
  label: string
  Icon: typeof User
  href: string
}

const TABS: Array<InternalTab | LinkItem> = [
  {
    kind: 'tab',
    id: 'general',
    label: 'Général',
    Icon: SlidersHorizontal,
    description: 'Préférences globales de l’application'
  },
  {
    kind: 'tab',
    id: 'memory',
    label: 'Mémoire',
    Icon: Brain,
    description: 'Ce que Melron sait de toi'
  },
  {
    kind: 'tab',
    id: 'account',
    label: 'Compte',
    Icon: User,
    description: 'Profil, email, mot de passe'
  },
  {
    kind: 'tab',
    id: 'integrations',
    label: 'Intégrations',
    Icon: Plug,
    description: 'LinkedIn, WhatsApp, MCP'
  },
  {
    kind: 'tab',
    id: 'notifications',
    label: 'Notifications',
    Icon: Bell,
    description: 'Heartbeats et alertes'
  },
  // — separator —
  {
    kind: 'link',
    id: 'agents',
    label: 'Agents',
    Icon: Sparkles,
    href: '/agents'
  },
  {
    kind: 'link',
    id: 'network',
    label: 'Mon réseau',
    Icon: Network,
    href: '/network'
  },
  {
    kind: 'link',
    id: 'plan',
    label: 'Plan & facturation',
    Icon: CreditCard,
    href: '/plan'
  }
]

const INTERNAL_TABS = TABS.filter((t): t is InternalTab => t.kind === 'tab')

interface SettingsShellProps {
  initialTab: string
}

export function SettingsShell({ initialTab }: SettingsShellProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [active, setActive] = useState<TabId>(
    (INTERNAL_TABS.find(t => t.id === initialTab)?.id as TabId) ?? 'general'
  )

  const handleTab = (id: TabId) => {
    setActive(id)
    const params = new URLSearchParams(searchParams)
    params.set('tab', id)
    router.replace(`/settings?${params.toString()}`, { scroll: false })
  }

  const activeTab = INTERNAL_TABS.find(t => t.id === active)!

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <aside className="w-64 shrink-0 border-r border-border/60 bg-muted/20 p-4">
        <h1 className="text-lg font-semibold mb-4 px-2">Paramètres</h1>
        <nav className="flex flex-col gap-1">
          {TABS.map(item => {
            const Icon = item.Icon
            if (item.kind === 'link') {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Icon className="size-4" />
                  <span className="flex-1">{item.label}</span>
                  <ExternalLink className="size-3 opacity-50" />
                </Link>
              )
            }
            return (
              <button
                key={item.id}
                onClick={() => handleTab(item.id)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors text-left',
                  active === item.id
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {active === 'memory' ? (
          <MemoryDashboard />
        ) : (
          <PlaceholderTab tab={activeTab} />
        )}
      </main>
    </div>
  )
}

function PlaceholderTab({
  tab
}: {
  tab: { label: string; description: string; Icon: typeof User }
}) {
  const Icon = tab.Icon
  return (
    <div className="flex flex-col items-center justify-center h-full p-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="size-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">{tab.label}</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        {tab.description}. Cette section arrive bientôt.
      </p>
    </div>
  )
}
