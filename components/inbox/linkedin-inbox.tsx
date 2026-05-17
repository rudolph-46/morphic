'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import TextareaAutosize from 'react-textarea-autosize'

import {
  Archive,
  Banknote,
  Bell,
  BellOff,
  Briefcase,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  Coffee,
  Eye,
  Flame,
  Gift,
  GraduationCap,
  Handshake,
  Inbox as InboxIcon,
  Linkedin,
  Loader2,
  Image as ImageIcon,
  MailOpen,
  Paperclip,
  Pin,
  Smile,
  RefreshCw,
  Repeat,
  Search,
  Send,
  Settings2,
  Sparkles,
  X,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'

import type { LinkedinMessage, LinkedinThread } from '@/lib/db/schema'
import {
  ACTION_VIEWS,
  type ActionView,
  BUSINESS_TAGS,
  type BusinessTag,
  type InboxTag,
  TAG_LABELS
} from '@/lib/inbox/auto-tag'
import { cn } from '@/lib/utils'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

import { EmptyPersonState } from './empty-person-state'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from '@/components/ui/resizable'

import { PersonChatPanel } from './person-chat-panel'

// ─── Constants ──────────────────────────────────────────────────────────────

type CategoryId = 'all' | InboxTag

const ACTION_META: Record<
  ActionView,
  { label: string; icon: typeof Flame; color: string }
> = {
  traiter_aujourdhui: {
    label: 'À traiter aujourd’hui',
    icon: Zap,
    color: 'text-rose-500'
  },
  planifier: {
    label: 'À planifier',
    icon: CalendarClock,
    color: 'text-sky-500'
  },
  relancer: {
    label: 'À relancer',
    icon: Repeat,
    color: 'text-amber-500'
  },
  engagements: {
    label: 'Engagements',
    icon: Gift,
    color: 'text-violet-500'
  },
  lire: { label: 'À lire', icon: Eye, color: 'text-emerald-500' },
  archive: {
    label: 'Archive',
    icon: Archive,
    color: 'text-muted-foreground'
  }
}

const BUSINESS_META: Record<
  BusinessTag,
  { label: string; icon: typeof Flame; color: string }
> = {
  recruteur: {
    label: 'Recruteurs',
    icon: Briefcase,
    color: 'text-blue-500'
  },
  lead_commercial: {
    label: 'Leads commerciaux',
    icon: Banknote,
    color: 'text-emerald-500'
  },
  intro: {
    label: 'Demandes intro',
    icon: Handshake,
    color: 'text-violet-500'
  },
  mentorat: {
    label: 'Mentorat',
    icon: GraduationCap,
    color: 'text-indigo-500'
  },
  networking: {
    label: 'Networking',
    icon: Coffee,
    color: 'text-stone-500'
  }
}

const TAG_PILL_COLORS: Record<InboxTag, string> = {
  // Actions
  traiter_aujourdhui:
    'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
  planifier: 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30',
  relancer:
    'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  engagements:
    'bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30',
  lire: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  archive: 'bg-muted text-muted-foreground border-border',
  // Business
  recruteur:
    'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  lead_commercial:
    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  intro:
    'bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30',
  mentorat:
    'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30',
  networking:
    'bg-stone-500/15 text-stone-700 dark:text-stone-400 border-stone-500/30'
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function categoryLabel(id: CategoryId): string {
  if (id === 'all') return 'Tous'
  if (id in ACTION_META) return ACTION_META[id as ActionView].label
  if (id in BUSINESS_META) return BUSINESS_META[id as BusinessTag].label
  return id
}

function timeAgo(d: Date | string | null): string {
  if (!d) return ''
  const date = new Date(d)
  const sec = (Date.now() - date.getTime()) / 1000
  if (sec < 60) return 'à l’instant'
  if (sec < 3600) return `${Math.floor(sec / 60)} min`
  if (sec < 86400) return `${Math.floor(sec / 3600)} h`
  if (sec < 86400 * 7) return `${Math.floor(sec / 86400)} j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function initials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface SyncEvent {
  type: 'step' | 'progress' | 'summary' | 'error'
  step?: 'accounts' | 'threads' | 'messages' | 'done' | 'error' | 'start'
  label?: string
  current?: number
  total?: number
  threads?: number
  messages?: number
  message?: string
  tagged?: number
}

// ─── Main component ────────────────────────────────────────────────────────

export function LinkedinInbox() {
  const [threads, setThreads] = useState<LinkedinThread[] | null>(null)
  const searchParams = useSearchParams()
  const activeCategory = (searchParams.get('view') ?? 'all') as CategoryId
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<LinkedinMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [query, setQuery] = useState('')
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [composing, setComposing] = useState('')
  const [loadingMore, setLoadingMore] = useState(false)
  const [repliesExpanded, setRepliesExpanded] = useState(false)
  const messagesScrollRef = useRef<HTMLDivElement | null>(null)

  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch('/api/inbox/threads')
      if (!res.ok) return
      const data = await res.json()
      setThreads(data.threads ?? [])
    } catch {
      setThreads([])
    }
  }, [])

  const loadMore = useCallback(async () => {
    setLoadingMore(true)
    try {
      const res = await fetch('/api/inbox/sync?more=true', { method: 'POST' })
      if (!res.body) {
        toast.error('Échec du chargement')
        return
      }
      // Drain the SSE stream silently (we don't need to display progress here)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done } = await reader.read().then(r => ({ done: r.done }))
        if (done) break
        decoder.decode() // drain
      }
      await fetchThreads()
      toast.success('10 discussions de plus chargées')
    } catch (err) {
      toast.error(`Échec : ${(err as Error).message}`)
    } finally {
      setLoadingMore(false)
    }
  }, [fetchThreads])

  useEffect(() => {
    fetchThreads()
  }, [fetchThreads])

  const loadMessages = useCallback(async (id: string) => {
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/inbox/threads/${id}`)
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages ?? [])
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    if (selectedId) loadMessages(selectedId)
  }, [selectedId, loadMessages])

  // Clear the selected thread when the view changes so the user lands fresh.
  useEffect(() => {
    setSelectedId(null)
  }, [activeCategory])

  // Auto-scroll to the latest message when the thread or its messages change.
  useEffect(() => {
    const el = messagesScrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [selectedId, messages, loadingMessages])

  const handleSend = useCallback(() => {
    const text = composing.trim()
    if (!text || !selectedId) return

    const threadId = selectedId
    const tempId = `optimistic-${Date.now()}`
    const sentAt = new Date()

    // Optimistic UI: clear input + show message immediately
    setComposing('')
    setMessages(prev => [
      ...prev,
      {
        id: tempId,
        threadId,
        providerMessageId: tempId,
        senderProviderId: null,
        isFromMe: true,
        body: text,
        attachments: [],
        sentAt,
        createdAt: sentAt
      } as LinkedinMessage
    ])
    setThreads(prev =>
      prev
        ? prev.map(t =>
            t.id === threadId
              ? {
                  ...t,
                  lastMessageAt: sentAt,
                  lastMessagePreview: text.slice(0, 280)
                }
              : t
          )
        : prev
    )

    // Fire-and-forget network call
    void (async () => {
      try {
        const res = await fetch(`/api/inbox/threads/${threadId}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          toast.error(data.error ?? 'Échec de l’envoi')
          // Roll back the optimistic message; restore the draft
          setMessages(prev => prev.filter(m => m.id !== tempId))
          setComposing(prevText => prevText || text)
        }
      } catch (err) {
        toast.error(`Échec : ${(err as Error).message}`)
        setMessages(prev => prev.filter(m => m.id !== tempId))
        setComposing(prevText => prevText || text)
      }
    })()
  }, [composing, selectedId])

  const counts = useMemo(() => {
    if (!threads) return {} as Record<CategoryId, number>
    const c: Record<string, number> = { all: threads.length }
    for (const t of threads) {
      for (const tag of t.aiTags ?? []) {
        c[tag] = (c[tag] ?? 0) + 1
      }
    }
    return c as Record<CategoryId, number>
  }, [threads])

  const filteredThreads = useMemo(() => {
    if (!threads) return []
    const q = query.trim().toLowerCase()
    return threads.filter(t => {
      if (activeCategory !== 'all' && !(t.aiTags ?? []).includes(activeCategory)) {
        return false
      }
      if (q) {
        return [t.attendeeName, t.attendeeHeadline, t.lastMessagePreview]
          .filter(Boolean)
          .some(s => String(s).toLowerCase().includes(q))
      }
      return true
    })
  }, [threads, activeCategory, query])

  const selected = useMemo(
    () => threads?.find(t => t.id === selectedId) ?? null,
    [threads, selectedId]
  )

  const hasUntaggedThreads = useMemo(() => {
    if (!threads) return false
    return threads.some(t => !t.aiTags || t.aiTags.length === 0)
  }, [threads])

  // ─ Initial loading ─
  if (threads === null) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  }

  // ─ Empty state ─
  if (threads.length === 0) {
    return (
      <>
        <div className="flex h-full items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="size-16 mx-auto rounded-2xl bg-sky-500/10 flex items-center justify-center mb-5">
              <Linkedin className="size-7 text-sky-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              Ta messagerie LinkedIn est vide
            </h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Synchronise tes 10 premières discussions LinkedIn (tu pourras
              charger les suivantes ensuite). Melron les triera par priorité
              IA et te suggérera des réponses adaptées.
            </p>
            <Button
              size="lg"
              onClick={() => setOptionsOpen(true)}
              className="gap-2"
            >
              <Sparkles className="size-4" />
              Synchroniser ma messagerie
            </Button>
          </div>
        </div>
        <OptionsDialog
          open={optionsOpen}
          onOpenChange={setOptionsOpen}
          onDone={fetchThreads}
          hasUntaggedThreads={hasUntaggedThreads}
        />
      </>
    )
  }

  return (
    <>
      <div className="flex h-full min-h-0">
        {/* ─ Column 1: threads list ─ */}
        <div className="w-80 shrink-0 border-r border-border/60 flex flex-col min-h-0">
          <div className="px-3 h-14 border-b border-border/60 flex items-center gap-2 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={`Rechercher · ${filteredThreads.length}`}
                className="w-full h-8 pl-8 pr-2 text-sm rounded-md border border-border/60 bg-muted/30 outline-none focus:bg-background focus:border-foreground/30"
              />
            </div>
            <button
              onClick={() => setOptionsOpen(true)}
              title="Actualiser le réseau"
              className="size-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
            >
              <RefreshCw className="size-3.5" />
            </button>
          </div>
          {activeCategory === 'all' && (
            <div className="px-3 pt-2 pb-1 shrink-0">
              <div className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                <Sparkles className="size-2.5 text-emerald-500" />
                Trié par date · priorité IA quand activée
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto flex flex-col">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Aucune personne dans cette vue.
              </div>
            ) : (
              filteredThreads.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={cn(
                    'w-full flex items-start gap-3 px-3 py-3 border-b border-border/40 text-left hover:bg-muted/30 transition-colors',
                    selectedId === t.id && 'bg-muted/50'
                  )}
                >
                  <Avatar className="size-9 shrink-0">
                    {t.attendeeProviderId && (
                      <AvatarImage
                        src={`/api/inbox/avatar/${encodeURIComponent(t.attendeeProviderId)}`}
                        alt={t.attendeeName ?? ''}
                      />
                    )}
                    <AvatarFallback className="text-[10px] bg-muted">
                      {initials(t.attendeeName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-sm font-medium truncate">
                        {t.attendeeName ?? '—'}
                      </div>
                      <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                        {timeAgo(t.lastMessageAt)}
                      </span>
                    </div>
                    {t.attendeeHeadline && (
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {t.attendeeHeadline}
                      </div>
                    )}
                    {t.lastMessagePreview && (
                      <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {t.lastMessagePreview}
                      </div>
                    )}
                    <div className="flex items-center gap-1 flex-wrap mt-1.5">
                      {(t.aiTags ?? []).map(tag => (
                        <TagPill key={tag} tag={tag} />
                      ))}
                      {t.unreadCount > 0 && (
                        <span className="inline-flex items-center text-[10px] font-medium text-rose-600 dark:text-rose-400">
                          ● NON LU
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
            {activeCategory === 'all' && filteredThreads.length > 0 && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="mt-auto w-full flex items-center justify-center gap-2 px-3 py-3 text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors border-t border-border/40 disabled:opacity-60"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Chargement…
                  </>
                ) : (
                  <>
                    <RefreshCw className="size-3.5" />
                    Charger 10 discussions de plus
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ─ Columns 2 + 3: resizable conversation + Melron panel ─ */}
        <ResizablePanelGroup direction="horizontal" className="flex-1 min-w-0">
        <ResizablePanel
          defaultSize={selected ? 65 : 100}
          minSize={40}
          className="flex flex-col min-h-0 min-w-0"
        >
          {!selected ? (
            <EmptyPersonState />
          ) : (
            <>
              <div className="h-14 px-3 border-b border-border/60 flex items-center gap-3 shrink-0">
                <Avatar className="size-10">
                  {selected.attendeeProviderId && (
                    <AvatarImage
                      src={`/api/inbox/avatar/${encodeURIComponent(selected.attendeeProviderId)}`}
                      alt={selected.attendeeName ?? ''}
                    />
                  )}
                  <AvatarFallback className="text-xs bg-muted">
                    {initials(selected.attendeeName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold flex items-center gap-1.5 flex-wrap">
                    {selected.attendeeName}
                    <Linkedin className="size-3.5 text-sky-500" />
                    {(selected.aiTags ?? []).map(tag => (
                      <TagPill key={tag} tag={tag} />
                    ))}
                  </div>
                  {selected.attendeeHeadline && (
                    <div className="text-xs text-muted-foreground truncate">
                      {selected.attendeeHeadline}
                    </div>
                  )}
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-0.5 shrink-0 text-muted-foreground">
                  <button
                    type="button"
                    title="Épingler"
                    onClick={() => toast.info('Épingler — bientôt disponible')}
                    className="size-8 inline-flex items-center justify-center rounded-md hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Pin className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Marquer non lu"
                    onClick={() => toast.info('Marquer non lu — bientôt disponible')}
                    className="size-8 inline-flex items-center justify-center rounded-md hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <MailOpen className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Snooze"
                    onClick={() => toast.info('Snooze — bientôt disponible')}
                    className="size-8 inline-flex items-center justify-center rounded-md hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <BellOff className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Archiver"
                    onClick={() => toast.info('Archiver — bientôt disponible')}
                    className="size-8 inline-flex items-center justify-center rounded-md hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Archive className="size-3.5" />
                  </button>
                </div>
              </div>

              <div
                ref={messagesScrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-3"
              >
                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    Aucun message.
                  </div>
                ) : (
                  [...messages]
                    .sort(
                      (a, b) =>
                        new Date(a.sentAt).getTime() -
                        new Date(b.sentAt).getTime()
                    )
                    .map(m => (
                    <div
                      key={m.id}
                      className={cn(
                        'flex',
                        m.isFromMe ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                          m.isFromMe
                            ? 'bg-foreground text-background rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        )}
                      >
                        {m.body ? (
                          <p className="whitespace-pre-wrap break-words">
                            {m.body}
                          </p>
                        ) : (
                          <span className="italic opacity-70">
                            (sans contenu)
                          </span>
                        )}
                        <div
                          className={cn(
                            'text-[10px] mt-2',
                            m.isFromMe
                              ? 'text-background/60'
                              : 'text-muted-foreground'
                          )}
                        >
                          {new Date(m.sentAt).toLocaleString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>


              {/* Composer — LinkedIn-style: tall textarea, action bar below */}
              <div className="border-t border-border/60 p-4 shrink-0">
                <div className="flex flex-col rounded-2xl bg-muted/40 border border-border/60 focus-within:border-foreground/30 transition-colors">
                  <TextareaAutosize
                    value={composing}
                    onChange={e => setComposing(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder="Rédigez un message…"
                    minRows={3}
                    maxRows={10}
                    className="resize-none w-full bg-transparent outline-none text-sm leading-relaxed px-4 pt-4 pb-2 placeholder:text-muted-foreground"
                  />
                  <div className="flex items-center justify-between px-2 pb-2">
                    <div className="flex items-center gap-0.5 text-muted-foreground">
                      <button
                        type="button"
                        title="Image"
                        className="size-8 flex items-center justify-center rounded-md hover:bg-background hover:text-foreground transition-colors"
                      >
                        <ImageIcon className="size-4" />
                      </button>
                      <button
                        type="button"
                        title="Pièce jointe"
                        className="size-8 flex items-center justify-center rounded-md hover:bg-background hover:text-foreground transition-colors"
                      >
                        <Paperclip className="size-4" />
                      </button>
                      <button
                        type="button"
                        title="Emoji"
                        className="size-8 flex items-center justify-center rounded-md hover:bg-background hover:text-foreground transition-colors"
                      >
                        <Smile className="size-4" />
                      </button>
                    </div>
                    <Button
                      size="sm"
                      disabled={!composing.trim()}
                      onClick={handleSend}
                      className="rounded-full px-4"
                    >
                      Envoyer
                      <Send className="size-3.5 ml-1.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </ResizablePanel>

        {selected && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel
              defaultSize={35}
              minSize={20}
              maxSize={55}
              className="flex flex-col min-h-0 min-w-0"
            >
              <PersonChatPanel key={selected.id} thread={selected} />
            </ResizablePanel>
          </>
        )}
        </ResizablePanelGroup>
      </div>

      <OptionsDialog
        open={optionsOpen}
        onOpenChange={setOptionsOpen}
        onDone={fetchThreads}
        hasUntaggedThreads={hasUntaggedThreads}
      />
    </>
  )
}

// ─── Tag pill ───────────────────────────────────────────────────────────────

function TagPill({ tag }: { tag: string }) {
  const t = tag as InboxTag
  if (!(t in TAG_LABELS)) return null
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border whitespace-nowrap',
        TAG_PILL_COLORS[t]
      )}
    >
      {TAG_LABELS[t]}
    </span>
  )
}

function SidebarItem({
  label,
  icon: Icon,
  color,
  count,
  active,
  onClick
}: {
  label: string
  icon: typeof Flame
  color: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors',
        active
          ? 'bg-accent text-accent-foreground font-medium'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className={cn('size-3.5', active ? '' : color)} />
      <span className="flex-1 text-left truncate">{label}</span>
      {count > 0 && (
        <span className="text-xs tabular-nums opacity-70">{count}</span>
      )}
    </button>
  )
}

// ─── Options dialog (sync + auto-tag) ──────────────────────────────────────

interface OptionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone: () => void
  hasUntaggedThreads: boolean
}

type RunningJob = 'sync' | 'retag' | null

function OptionsDialog({
  open,
  onOpenChange,
  onDone,
  hasUntaggedThreads
}: OptionsDialogProps) {
  const [autoTag, setAutoTag] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)
  const [savingTag, setSavingTag] = useState(false)
  const [running, setRunning] = useState<RunningJob>(null)
  const [events, setEvents] = useState<SyncEvent[]>([])
  const [progress, setProgress] = useState<{
    current: number
    total: number
  } | null>(null)
  const [summary, setSummary] = useState<{
    threads?: number
    messages?: number
    tagged?: number
  } | null>(null)

  const resetJob = () => {
    setEvents([])
    setProgress(null)
    setSummary(null)
  }

  useEffect(() => {
    if (!open) return
    fetch('/api/inbox/settings')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data) {
          setAutoTag(Boolean(data.inboxAutoTag))
          setLastSyncAt(data.inboxLastSyncAt ?? null)
        }
      })
      .catch(() => null)
  }, [open])

  const runStream = useCallback(
    async (kind: 'sync' | 'retag', opts: { onlyUntagged?: boolean } = {}) => {
      resetJob()
      setRunning(kind)
      try {
        const path =
          kind === 'sync'
            ? '/api/inbox/sync'
            : `/api/inbox/retag?only_untagged=${opts.onlyUntagged === false ? 'false' : 'true'}`
        const res = await fetch(path, { method: 'POST' })
        if (!res.body) throw new Error('No stream')
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        while (true) {
          const { value, done: streamDone } = await reader.read()
          if (streamDone) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            const data = line.replace(/^data:\s*/, '').trim()
            if (!data) continue
            try {
              const ev = JSON.parse(data) as SyncEvent
              setEvents(prev => [...prev, ev])
              if (ev.type === 'progress' && ev.current && ev.total) {
                setProgress({ current: ev.current, total: ev.total })
              }
              if (ev.type === 'summary') {
                setSummary({
                  threads: ev.threads,
                  messages: ev.messages,
                  tagged: ev.tagged
                })
              }
              if (ev.type === 'step' && ev.step === 'done') {
                onDone()
              }
            } catch {
              /* ignore */
            }
          }
        }
      } catch (err) {
        setEvents(prev => [
          ...prev,
          { type: 'error', message: (err as Error).message }
        ])
      } finally {
        setRunning(null)
      }
    },
    [onDone]
  )

  const onToggleAutoTag = async (next: boolean) => {
    setAutoTag(next)
    setSavingTag(true)
    try {
      const res = await fetch('/api/inbox/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inboxAutoTag: next })
      })
      if (!res.ok) throw new Error()
      toast.success(next ? 'Auto-tag activé' : 'Auto-tag désactivé')
      if (next && hasUntaggedThreads) runStream('retag')
    } catch {
      setAutoTag(!next)
      toast.error('Échec de la sauvegarde')
    } finally {
      setSavingTag(false)
    }
  }

  const isSync = running === 'sync'
  const isRetag = running === 'retag'
  const jobLabel = isSync
    ? 'Synchronisation en cours'
    : isRetag
      ? 'Classification IA en cours'
      : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] w-[50vw] h-[50vh] max-h-[600px] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="size-4" />
            Options de la messagerie
          </DialogTitle>
          <DialogDescription>
            Synchronisation, tag automatique par IA et réponses suggérées.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-4">
          <div className="rounded-xl border border-border/60 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <RefreshCw className="size-4 text-sky-500" />
                  <span className="text-sm font-semibold">Synchronisation</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Récupère tes 10 dernières discussions LinkedIn et leur
                  historique via Unipile.{' '}
                  {autoTag && (
                    <span className="text-emerald-700 dark:text-emerald-400">
                      Tag IA + réponses suggérées générés en parallèle.
                    </span>
                  )}
                </p>
                {lastSyncAt && (
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Dernière sync :{' '}
                    {new Date(lastSyncAt).toLocaleString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                disabled={running !== null}
                onClick={() => runStream('sync')}
                className="shrink-0 gap-1.5"
              >
                {isSync ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                Synchroniser
              </Button>
            </div>
          </div>

          <div
            className={cn(
              'rounded-xl border p-4 transition-colors',
              autoTag
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-border/60'
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="size-4 text-emerald-500" />
                  <span className="text-sm font-semibold">
                    Intelligence IA
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border',
                      autoTag
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'border-border/60 bg-muted text-muted-foreground'
                    )}
                  >
                    {autoTag ? (
                      <>
                        <Check className="size-2.5" /> Activé
                      </>
                    ) : (
                      <>
                        <X className="size-2.5" /> Désactivé
                      </>
                    )}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Classe tes conversations par priorité (
                  <strong>Urgent</strong>, <strong>Important</strong>,{' '}
                  <strong>En cours</strong>…) et pré-rédige 3 réponses avec
                  tons distincts pour chaque discussion. Claude Haiku 4.5.
                </p>
                {!autoTag && hasUntaggedThreads && (
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-2">
                    L'activation lance la classification + génération sur tes
                    discussions existantes.
                  </p>
                )}
                {autoTag && (
                  <button
                    onClick={() =>
                      runStream('retag', { onlyUntagged: false })
                    }
                    disabled={running !== null}
                    className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline disabled:opacity-50"
                  >
                    <Sparkles className="size-3" />
                    Re-générer pour toutes les discussions
                  </button>
                )}
              </div>
              <Button
                size="sm"
                variant={autoTag ? 'outline' : 'default'}
                disabled={savingTag || running !== null}
                onClick={() => onToggleAutoTag(!autoTag)}
                className="shrink-0 min-w-[110px]"
              >
                {savingTag ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : autoTag ? (
                  'Désactiver'
                ) : (
                  'Activer'
                )}
              </Button>
            </div>
          </div>

          {running && (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm font-medium mb-3">
                <Loader2 className="size-3.5 animate-spin text-emerald-500" />
                {jobLabel}
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {events
                  .filter(e => e.type === 'step' || e.type === 'error')
                  .slice(-6)
                  .map((e, i, arr) => {
                    const isCurrent = i === arr.length - 1
                    const isError = e.type === 'error'
                    return (
                      <div
                        key={i}
                        className={cn(
                          'flex items-center gap-2 text-xs',
                          isError
                            ? 'text-rose-600 dark:text-rose-400'
                            : isCurrent
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                        )}
                      >
                        {isError ? (
                          <X className="size-3 text-rose-600" />
                        ) : isCurrent ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="size-3 text-emerald-500" />
                        )}
                        {isError ? e.message : e.label}
                      </div>
                    )
                  })}
              </div>
              {progress && (
                <div className="mt-3">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{
                        width: `${(progress.current / progress.total) * 100}%`
                      }}
                    />
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 tabular-nums">
                    {progress.current} / {progress.total}
                  </div>
                </div>
              )}
            </div>
          )}

          {summary && !running && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
              <div className="font-medium flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 mb-1">
                <CheckCircle2 className="size-4" />
                Terminé
              </div>
              <div className="text-xs text-muted-foreground">
                {summary.threads !== undefined && (
                  <>
                    <strong>{summary.threads}</strong> discussions ·{' '}
                  </>
                )}
                {summary.messages !== undefined && (
                  <>
                    <strong>{summary.messages}</strong> messages
                    {summary.tagged !== undefined ? ' · ' : ''}
                  </>
                )}
                {summary.tagged !== undefined && (
                  <>
                    <strong>{summary.tagged}</strong> discussions taggées
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-border/60">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={running !== null}
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
