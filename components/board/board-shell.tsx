'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { Activity, Kanban, LayoutDashboard, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

import { HeartbeatDashboard } from '@/components/heartbeat/heartbeat-dashboard'

import { BoardOverview } from './board-overview'
import { KanbanBoard } from './kanban-board'

type View = 'overview' | 'plan' | 'heartbeat'

const VALID: View[] = ['overview', 'plan', 'heartbeat']

const VIEWS: Array<{ id: View; label: string; Icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { id: 'plan', label: 'View Plan', Icon: Kanban },
  { id: 'heartbeat', label: 'View Heartbeat', Icon: Activity }
]

interface BoardShellProps {
  initialTab: string
  userName?: string
}

export function BoardShell({ initialTab, userName }: BoardShellProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [active, setActive] = useState<View>(
    VALID.includes(initialTab as View) ? (initialTab as View) : 'overview'
  )

  const change = (next: View) => {
    setActive(next)
    const params = new URLSearchParams(searchParams)
    params.set('tab', next)
    router.replace(`/board?${params.toString()}`, { scroll: false })
  }

  const firstName = userName?.split(' ')[0] ?? userName ?? 'toi'

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto w-full max-w-7xl px-6 py-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Bon retour, {firstName} !
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Surveille tes projets et tâches ici.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-lg border border-border/60 bg-muted/30 p-0.5">
              {VIEWS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => change(id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    active === id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="flex -space-x-2 ml-2">
              {['M', 'D', 'A'].map(initial => (
                <Avatar
                  key={initial}
                  className="size-8 border-2 border-background"
                >
                  <AvatarFallback className="text-[10px] bg-muted">
                    {initial}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>

            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" />
              Add Task
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-auto">
        {active === 'overview' && <BoardOverview userName={userName} />}
        {active === 'plan' && <KanbanBoard />}
        {active === 'heartbeat' && <HeartbeatDashboard />}
      </div>
    </div>
  )
}
