'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  ArrowUp,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Sparkles
} from 'lucide-react'
import TextareaAutosize from 'react-textarea-autosize'
import { toast } from 'sonner'

import type { InboxAiMessage, LinkedinThread } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

import { MarkdownMessage } from '@/components/message'
import { IconBlinkingLogo } from '@/components/ui/icons'

const SUGGESTIONS = [
  'Résume cette conversation',
  'Prépare une relance',
  'Trouve un angle perso',
  'Score d’intérêt commercial'
]

interface UiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function PersonChatPanel({ thread }: { thread: LinkedinThread }) {
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [streaming, setStreaming] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [activated, setActivated] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const loadHistory = useCallback(
    async (signal: AbortSignal) => {
      setLoadingHistory(true)
      try {
        const res = await fetch(`/api/inbox/threads/${thread.id}/ai`, {
          signal
        })
        if (!res.ok) return
        const data = (await res.json()) as { messages: InboxAiMessage[] }
        if (!signal.aborted) {
          const mapped = data.messages.map(m => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content
          }))
          setMessages(mapped)
          if (mapped.length > 0) setActivated(true)
        }
      } catch {
        // swallow
      } finally {
        if (!signal.aborted) setLoadingHistory(false)
      }
    },
    [thread.id]
  )

  useEffect(() => {
    const ctrl = new AbortController()
    loadHistory(ctrl.signal)
    return () => ctrl.abort()
  }, [loadHistory])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, streaming])

  const send = useCallback(
    async (text: string) => {
      const clean = text.trim()
      if (!clean || streaming != null) return

      setActivated(true)
      const userMsg: UiMessage = {
        id: `local-${Date.now()}`,
        role: 'user',
        content: clean
      }
      setMessages(prev => [...prev, userMsg])
      setDraft('')
      setStreaming('')

      try {
        const res = await fetch(`/api/inbox/threads/${thread.id}/ai`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: clean })
        })
        if (!res.ok || !res.body) {
          toast.error('Échec de la requête Melron')
          setStreaming(null)
          setMessages(prev => prev.filter(m => m.id !== userMsg.id))
          return
        }
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let acc = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          acc += decoder.decode(value, { stream: true })
          setStreaming(acc)
        }
        const assistantMsg: UiMessage = {
          id: `local-${Date.now()}-a`,
          role: 'assistant',
          content: acc
        }
        setMessages(prev => [...prev, assistantMsg])
      } catch (err) {
        toast.error(`Échec : ${(err as Error).message}`)
      } finally {
        setStreaming(null)
      }
    },
    [streaming, thread.id]
  )

  // ─── Collapsed strip ─────────────────────────────────────────────────
  if (collapsed) {
    return (
      <aside className="w-12 shrink-0 border-l border-border/60 flex flex-col items-center py-3 bg-muted/10">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          title="Ouvrir Melron"
          className="size-9 rounded-full overflow-hidden hover:ring-2 hover:ring-foreground/20 transition-all"
        >
          <IconBlinkingLogo className="size-9" />
        </button>
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="mt-3 size-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Étendre"
        >
          <ChevronsLeft className="size-4" />
        </button>
        {messages.length > 0 && (
          <div
            className="mt-2 size-1.5 rounded-full bg-emerald-500"
            title="Conversation en cours"
          />
        )}
      </aside>
    )
  }

  // ─── Idle (panel ouvert, pas encore activé) ──────────────────────────
  if (!activated) {
    return (
      <aside className="w-full h-full border-l border-border/60 flex flex-col min-h-0 bg-muted/10">
        <div className="h-14 px-3 border-b border-border/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full overflow-hidden">
              <IconBlinkingLogo className="size-8" />
            </div>
            <div>
              <div className="text-sm font-semibold">Melron</div>
              <div className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                <Sparkles className="size-2.5 text-emerald-500" />
                En attente
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            title="Replier"
            className="size-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronsRight className="size-4" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="size-24 rounded-full overflow-hidden mb-5 ring-4 ring-background shadow-sm">
            <IconBlinkingLogo className="size-24" />
          </div>
          <h3 className="text-base font-semibold mb-1">Melron est là</h3>
          <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed mb-5">
            Prêt à t’aider sur cette personne. Résumé, angle perso, score
            d’intérêt — demande ce que tu veux.
          </p>
          <button
            type="button"
            onClick={() => setActivated(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <Sparkles className="size-3.5" />
            Ask Melron
          </button>
          {loadingHistory && (
            <div className="mt-4 text-[10px] text-muted-foreground">
              <Loader2 className="size-3 inline animate-spin mr-1" />
              chargement de l’historique…
            </div>
          )}
        </div>
      </aside>
    )
  }

  // ─── Activated: full chat UI ─────────────────────────────────────────
  return (
    <aside className="w-full h-full border-l border-border/60 flex flex-col min-h-0 bg-muted/10">
      <div className="p-3 border-b border-border/60 flex items-center gap-2 shrink-0">
        <div className="size-7 rounded-full overflow-hidden ring-1 ring-border/60 shrink-0">
          <IconBlinkingLogo className="size-7" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">Melron</div>
          <div className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
            <Sparkles className="size-2.5 text-emerald-500" />
            Sur le cas
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          title="Replier"
          className="size-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ChevronsRight className="size-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {loadingHistory && messages.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {messages.map(m => (
              <Bubble key={m.id} role={m.role} content={m.content} />
            ))}
            {streaming != null && (
              <Bubble role="assistant" content={streaming} streaming />
            )}
          </>
        )}
      </div>

      <div className="p-3 shrink-0">
        <div className="relative flex flex-col w-full gap-1 bg-muted rounded-3xl border border-input transition-shadow focus-within:ring-1 focus-within:ring-ring/20 focus-within:ring-offset-1 focus-within:ring-offset-background/50">
          {/* Inline suggestion chips */}
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-1 px-3 pt-3">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  disabled={streaming != null}
                  onClick={() => send(s)}
                  className="rounded-full bg-background/60 hover:bg-background border border-border/60 hover:border-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed px-2.5 py-1 text-[11px] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <TextareaAutosize
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send(draft)
              }
            }}
            placeholder="Demande à Melron…"
            minRows={2}
            maxRows={5}
            disabled={streaming != null}
            className="resize-none w-full min-h-12 bg-transparent border-0 px-3 pt-2 text-sm placeholder:text-muted-foreground focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="flex items-center justify-end p-2">
            <button
              type="button"
              disabled={!draft.trim() || streaming != null}
              onClick={() => send(draft)}
              className={cn(
                'size-8 inline-flex items-center justify-center rounded-full shrink-0 transition-colors',
                draft.trim() && streaming == null
                  ? 'bg-foreground text-background hover:opacity-90'
                  : 'bg-background text-muted-foreground'
              )}
            >
              {streaming != null ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowUp className="size-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

function Bubble({
  role,
  content,
  streaming
}: {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}) {
  const isUser = role === 'user'
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed break-words',
          isUser
            ? 'bg-foreground text-background rounded-br-md whitespace-pre-wrap'
            : 'bg-muted rounded-bl-md'
        )}
      >
        {isUser ? (
          content || (streaming ? '…' : '')
        ) : content ? (
          <MarkdownMessage message={content} className="text-xs leading-relaxed" />
        ) : streaming ? (
          '…'
        ) : null}
        {streaming && content && (
          <span className="ml-0.5 inline-block w-1.5 h-3 align-middle bg-current animate-pulse rounded-sm" />
        )}
      </div>
    </div>
  )
}
