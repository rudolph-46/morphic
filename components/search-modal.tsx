'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Activity, Brain, Kanban, MessageSquare } from 'lucide-react'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command'

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ChatRow {
  id: string
  title: string | null
  createdAt: string
}

interface MemoryRow {
  id: string
  category: string
  content: string
}

interface CardRow {
  id?: string
  title?: string
  name?: string
  column?: string
  status?: string
  company?: string
}

interface SearchData {
  chats: ChatRow[]
  memories: MemoryRow[]
  cards: CardRow[]
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const router = useRouter()
  const [data, setData] = useState<SearchData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || data || loading) return
    setLoading(true)
    fetch('/api/search-all')
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setData)
      .catch(() => setData({ chats: [], memories: [], cards: [] }))
      .finally(() => setLoading(false))
  }, [open, data, loading])

  const go = (path: string) => {
    onOpenChange(false)
    router.push(path)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Rechercher dans tes chats, cartes, mémoires…" />
      <CommandList>
        <CommandEmpty>
          {loading ? 'Chargement…' : 'Aucun résultat.'}
        </CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go('/')}>
            <MessageSquare className="size-4" />
            Nouveau chat
          </CommandItem>
          <CommandItem onSelect={() => go('/board?tab=plan')}>
            <Kanban className="size-4" />
            Board · Plan
          </CommandItem>
          <CommandItem onSelect={() => go('/board?tab=heartbeat')}>
            <Activity className="size-4" />
            Board · Heartbeat
          </CommandItem>
          <CommandItem onSelect={() => go('/settings?tab=memory')}>
            <Brain className="size-4" />
            Mémoire
          </CommandItem>
        </CommandGroup>

        {data?.chats && data.chats.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Discussions récentes">
              {data.chats.slice(0, 30).map(chat => (
                <CommandItem
                  key={chat.id}
                  value={`chat ${chat.title ?? chat.id}`}
                  onSelect={() => go(`/search/${chat.id}`)}
                >
                  <MessageSquare className="size-4 text-muted-foreground" />
                  <span className="truncate">
                    {chat.title || 'Sans titre'}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {data?.cards && data.cards.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Cartes du Plan">
              {data.cards.slice(0, 30).map((card, i) => {
                const label = card.title || card.name || 'Carte'
                const sub = card.column || card.status || card.company
                return (
                  <CommandItem
                    key={card.id ?? `card-${i}`}
                    value={`card ${label} ${sub ?? ''}`}
                    onSelect={() => go('/board?tab=plan')}
                  >
                    <Kanban className="size-4 text-muted-foreground" />
                    <span className="truncate">{label}</span>
                    {sub && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {sub}
                      </span>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </>
        )}

        {data?.memories && data.memories.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Mémoires">
              {data.memories.slice(0, 30).map(m => (
                <CommandItem
                  key={m.id}
                  value={`memory ${m.category} ${m.content}`}
                  onSelect={() => go('/settings?tab=memory')}
                >
                  <Brain className="size-4 text-muted-foreground" />
                  <span className="truncate">{m.content}</span>
                  <span className="ml-auto text-xs text-muted-foreground capitalize">
                    {m.category}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
