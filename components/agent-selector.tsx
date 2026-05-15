'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'

import { Bot, Check, ChevronDown, Sparkles } from 'lucide-react'

import type { UserAgent } from '@/lib/db/schema'
import { cn } from '@/lib/utils'
import {
  getChatAgentId,
  setChatAgentId,
  subscribeToChatPreferences
} from '@/lib/utils/chat-preferences'

import { Button } from './ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

interface AgentSelectorProps {
  chatId?: string
  /** Hide entirely when no agents exist (e.g. guest sessions). */
  hideWhenEmpty?: boolean
}

export function AgentSelector({
  chatId,
  hideWhenEmpty = true
}: AgentSelectorProps) {
  const router = useRouter()
  const [agents, setAgents] = useState<UserAgent[]>([])
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/agents')
      .then(r => (r.ok ? r.json() : { agents: [] }))
      .then(data => {
        if (cancelled) return
        setAgents(data.agents ?? [])
        setLoaded(true)
      })
      .catch(() => {
        if (cancelled) return
        setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const subscribe = useCallback(
    (cb: () => void) => subscribeToChatPreferences(chatId, cb),
    [chatId]
  )
  const getSnapshot = useCallback(() => getChatAgentId(chatId), [chatId])
  const selectedId = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => null as string | null
  )

  const selected = agents.find(a => a.id === selectedId) || null

  // When hideWhenEmpty is set, don't render anything until we know the user
  // has at least one agent. Avoids a flicker for users without agents.
  if (hideWhenEmpty && (!loaded || agents.length === 0)) {
    return null
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-xs rounded-full shadow-none gap-1 transition-all"
          aria-label="Agent"
        >
          {selected ? (
            <Sparkles className="size-3.5 text-violet-500" />
          ) : (
            <Bot className="size-3.5 text-muted-foreground" />
          )}
          <span className="text-xs font-medium truncate max-w-[120px]">
            {selected ? selected.name : 'Agent'}
          </span>
          <ChevronDown
            className={cn(
              'size-3 ml-0.5 opacity-50 transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" sideOffset={6}>
        <Command>
          <CommandInput placeholder="Chercher un agent…" />
          <CommandList>
            <CommandEmpty>
              <div className="py-3 text-center text-xs text-muted-foreground">
                {loaded
                  ? "Aucun agent. Crées-en un dans Explorer les agents."
                  : 'Chargement…'}
              </div>
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__none__"
                onSelect={() => {
                  setChatAgentId(chatId, null)
                  setOpen(false)
                }}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    'h-4 w-4',
                    selectedId === null ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <Bot className="size-4 text-muted-foreground" />
                <span>Aucun agent (Melron par défaut)</span>
              </CommandItem>
              {agents.map(agent => (
                <CommandItem
                  key={agent.id}
                  value={`${agent.id} ${agent.name}`}
                  onSelect={() => {
                    setChatAgentId(chatId, agent.id)
                    setOpen(false)
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'h-4 w-4',
                      selectedId === agent.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <Sparkles className="size-4 text-violet-500" />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{agent.name}</span>
                    {agent.description && (
                      <span className="text-xs text-muted-foreground truncate">
                        {agent.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup>
              <CommandItem
                value="__manage__"
                onSelect={() => {
                  setOpen(false)
                  router.push('/agents')
                }}
                className="cursor-pointer text-xs text-muted-foreground"
              >
                → Gérer mes agents
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
