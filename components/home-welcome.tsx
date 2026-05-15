'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { ArrowRight, Loader2, MessageCircle, StickyNote } from 'lucide-react'

import { useUser } from '@/lib/contexts/user-context'
import type { Chat as DBChat, Note } from '@/lib/db/schema'

import { Card } from '@/components/ui/card'

interface HomeWelcomeProps {
  /** Kept for API compat — no longer used since the AI suggestion card was removed. */
  onSelectPrompt?: (prompt: string) => void
}

export function HomeWelcome(_props: HomeWelcomeProps = {}) {
  const { firstName } = useUser()

  const [chats, setChats] = useState<DBChat[] | null>(null)
  const [notes, setNotes] = useState<Note[] | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch('/api/chats?limit=3')
        .then(r => (r.ok ? r.json() : { chats: [] }))
        .catch(() => ({ chats: [] })),
      fetch('/api/notes')
        .then(r => (r.ok ? r.json() : { notes: [] }))
        .catch(() => ({ notes: [] }))
    ]).then(([chatsRes, notesRes]) => {
      if (cancelled) return
      setChats(chatsRes.chats ?? [])
      setNotes((notesRes.notes ?? []).slice(0, 3))
    })
    return () => {
      cancelled = true
    }
  }, [])

  const greetingName = useMemo(() => {
    if (!firstName) return null
    // Capitalize first letter (in case email-derived)
    return firstName.charAt(0).toUpperCase() + firstName.slice(1)
  }, [firstName])

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-2">
      {/* Greeting */}
      <div className="mb-6 md:mb-8">
        <h1 className="font-serif text-3xl md:text-5xl font-semibold leading-tight tracking-tight">
          {greetingName ? (
            <>
              <span className="rounded-md bg-primary/15 px-2 py-0.5">
                Bonjour, {greetingName}
              </span>{' '}
              👋
            </>
          ) : (
            <>Bonjour 👋</>
          )}
        </h1>
        <p className="mt-2 text-lg md:text-2xl text-muted-foreground">
          Comment puis-je t'aider aujourd'hui&nbsp;?
        </p>
      </div>

      {/* Cards row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <RecentChatsCard chats={chats} />
        <RecentNotesCard notes={notes} />
      </div>
    </div>
  )
}

function RecentChatsCard({ chats }: { chats: DBChat[] | null }) {
  return (
    <Card className="p-4 hover:border-foreground/20 transition-colors">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
        <MessageCircle className="size-3.5" />
        Reprendre où tu étais
      </div>
      {chats === null ? (
        <div className="flex items-center justify-center h-20 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
        </div>
      ) : chats.length === 0 ? (
        <p className="text-sm text-muted-foreground py-3">
          Pas encore de conversation.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {chats.slice(0, 3).map(chat => (
            <li key={chat.id}>
              <Link
                href={`/search/${chat.id}`}
                className="group flex items-center justify-between gap-2 rounded-md px-2 py-1.5 -mx-2 hover:bg-muted transition-colors"
              >
                <span className="text-sm font-medium truncate flex-1">
                  {chat.title || 'Sans titre'}
                </span>
                <ArrowRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function RecentNotesCard({ notes }: { notes: Note[] | null }) {
  return (
    <Card className="p-4 hover:border-foreground/20 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <StickyNote className="size-3.5" />
          Notes récentes
        </div>
        <Link
          href="/notes"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Toutes →
        </Link>
      </div>
      {notes === null ? (
        <div className="flex items-center justify-center h-20 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <Link
          href="/notes"
          className="block text-sm text-muted-foreground py-3 hover:text-foreground transition-colors"
        >
          Crée ta première note →
        </Link>
      ) : (
        <ul className="space-y-1.5">
          {notes.slice(0, 3).map(note => (
            <li key={note.id}>
              <Link
                href="/notes"
                className="group flex items-center justify-between gap-2 rounded-md px-2 py-1.5 -mx-2 hover:bg-muted transition-colors"
              >
                <span className="text-sm font-medium truncate flex-1">
                  {note.title || 'Sans titre'}
                </span>
                <ArrowRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
