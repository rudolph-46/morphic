'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import {
  ArrowUp,
  ClipboardList,
  Copy,
  Eye,
  Heart,
  ListChecks,
  MessageSquarePlus,
  PencilLine,
  Plus,
  Search,
  Sparkles,
  StickyNote,
  Trash2,
  Users,
  X
} from 'lucide-react'
import { Streamdown } from 'streamdown'
import { toast } from 'sonner'

import type { Note } from '@/lib/db/schema'
import {
  enrichNote,
  getGroupMeta,
  NOTE_GROUPS,
  type EnrichedNote,
  type NoteGroup
} from '@/lib/notes/enrich'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { PageNavbar, SectionHeader } from '@/components/page-header'

interface NotesExplorerProps {
  initialNotes: Note[]
}

// Pills d'actions AI : chaque pill construit un prompt qui inclut la note
// en contexte et lance un nouveau chat. Le chat lit `pendingMessage` depuis
// sessionStorage et envoie automatiquement (cf. components/chat.tsx).
type NoteAction = {
  key: string
  label: string
  Icon: React.ComponentType<{ className?: string }>
  buildPrompt: (note: { title: string; content: string }) => string
}

const NOTE_ACTIONS: NoteAction[] = [
  {
    key: 'find_contacts',
    label: 'Trouve des contacts liés',
    Icon: Users,
    buildPrompt: ({ title, content }) =>
      `Voici une note de mon journal Melron :\n\n# ${title}\n\n${content}\n\n` +
      `À partir de cette note, identifie les personnes, entreprises et signaux pertinents. ` +
      `Cherche dans mon réseau LinkedIn (mode "Mon réseau") les contacts qui correspondent ou qui peuvent m'aider, ` +
      `et propose des actions concrètes triées par priorité.`
  },
  {
    key: 'draft_message',
    label: 'Drafte un message',
    Icon: MessageSquarePlus,
    buildPrompt: ({ title, content }) =>
      `Voici une note de mon journal Melron :\n\n# ${title}\n\n${content}\n\n` +
      `À partir du contexte ci-dessus, drafte un message LinkedIn (ou email) à envoyer. ` +
      `Si tu as besoin du destinataire ou de l'objectif précis, demande-moi avant de rédiger.`
  },
  {
    key: 'create_heartbeat',
    label: 'Crée un Heartbeat',
    Icon: Heart,
    buildPrompt: ({ title, content }) =>
      `Voici une note de mon journal Melron :\n\n# ${title}\n\n${content}\n\n` +
      `Transforme cette note en veille récurrente (Heartbeat) : propose un titre court, ` +
      `la fréquence (quotidienne/hebdo), et la requête exacte à exécuter à chaque run pour me notifier des nouveautés.`
  },
  {
    key: 'extract_actions',
    label: 'Liste les actions',
    Icon: ListChecks,
    buildPrompt: ({ title, content }) =>
      `Voici une note de mon journal Melron :\n\n# ${title}\n\n${content}\n\n` +
      `Extrait toutes les actions à faire (next steps) sous forme de checklist priorisée. ` +
      `Pour chaque action, précise qui contacter, quand, et le canal recommandé.`
  },
  {
    key: 'summarize',
    label: 'Résumé',
    Icon: ClipboardList,
    buildPrompt: ({ title, content }) =>
      `Voici une note de mon journal Melron :\n\n# ${title}\n\n${content}\n\n` +
      `Donne-moi un résumé en 5 points maximum, suivi des 3 takeaways les plus importants pour moi.`
  }
]

function launchChatWithPrompt(prompt: string, router: ReturnType<typeof useRouter>) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('pendingMessage', prompt)
  }
  router.push('/')
}

export function NotesExplorer({ initialNotes }: NotesExplorerProps) {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  // Pas d'auto-sélection : le pane droit ne s'ouvre que sur clic explicite.
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [search, setSearch] = useState('')
  const [activeGroup, setActiveGroup] = useState<NoteGroup | 'all'>('all')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')
  const [discussInput, setDiscussInput] = useState('')
  const [isSaving, startSaving] = useTransition()
  const [isCreating, startCreating] = useTransition()

  const selected = notes.find(n => n.id === selectedId) || null

  // Sync editor when selection changes
  useEffect(() => {
    if (selected) {
      setDraftTitle(selected.title)
      setDraftContent(selected.content)
      // Open in read (markdown) mode by default; user clicks Éditer to edit.
      setIsEditing(false)
    } else {
      setDraftTitle('')
      setDraftContent('')
      setIsEditing(false)
    }
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Enrich each note with AI-derived group + tags (computed locally for now,
  // will be persisted on the server once the AI enrichment runs at save time).
  const enriched = useMemo<EnrichedNote[]>(
    () => notes.map(enrichNote),
    [notes]
  )

  // Aggregate available tags + per-group counts for the filter UI.
  const availableTags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const n of enriched) {
      for (const t of n.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([tag, count]) => ({ tag, count }))
  }, [enriched])

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = { all: enriched.length }
    for (const n of enriched) counts[n.group] = (counts[n.group] ?? 0) + 1
    return counts
  }, [enriched])

  const filtered = useMemo<EnrichedNote[]>(() => {
    const q = search.trim().toLowerCase()
    return enriched.filter(n => {
      if (activeGroup !== 'all' && n.group !== activeGroup) return false
      if (activeTags.length > 0 && !activeTags.every(t => n.tags.includes(t))) {
        return false
      }
      if (q) {
        const hay = `${n.title} ${n.content} ${n.tags.join(' ')}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [enriched, search, activeGroup, activeTags])

  const toggleTag = (tag: string) =>
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )

  const clearFilters = () => {
    setActiveGroup('all')
    setActiveTags([])
    setSearch('')
  }

  const dirty =
    !!selected &&
    (draftTitle !== selected.title || draftContent !== selected.content)

  const handleCreate = () => {
    startCreating(async () => {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Nouvelle note', content: '' })
      })
      if (!res.ok) {
        toast.error('Création impossible')
        return
      }
      const { note } = await res.json()
      setNotes(prev => [note, ...prev])
      setSelectedId(note.id)
    })
  }

  const handleSave = () => {
    if (!selected || !dirty) return
    startSaving(async () => {
      const res = await fetch(`/api/notes/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draftTitle.trim() || 'Sans titre',
          content: draftContent
        })
      })
      if (!res.ok) {
        toast.error("Échec de l'enregistrement")
        return
      }
      const { note } = await res.json()
      setNotes(prev =>
        prev
          .map(n => (n.id === note.id ? note : n))
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() -
              new Date(a.updatedAt).getTime()
          )
      )
      toast.success('Note enregistrée')
    })
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Suppression impossible')
      return
    }
    setNotes(prev => prev.filter(n => n.id !== id))
    if (selectedId === id) {
      setSelectedId(prev => {
        const remaining = notes.filter(n => n.id !== id)
        return remaining[0]?.id ?? null
      })
    }
    toast.success('Note supprimée')
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Hero — same typo as Heartbeat / Inbox for consistency */}
      <div className="px-8 pt-8 pb-4 shrink-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3 mb-2">
              <StickyNote className="size-7 text-amber-500" />
              Notes
              {notes.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full bg-muted text-foreground text-sm font-semibold">
                  {notes.length}
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Tes notes personnelles — capture, retrouve et active ce qui
              compte sans quitter Melron.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              className="gap-1 shrink-0"
            >
              <Plus className="size-4" />
              Nouvelle
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 w-full overflow-hidden px-8 pb-6 gap-0">
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
      {/* Grid pane */}
      <section className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* AI-generated filters: groups + tags */}
        {enriched.length > 0 && (
          <div className="shrink-0 pb-4 space-y-2">
            {/* Group pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
                Groupes
              </span>
              <FilterPill
                active={activeGroup === 'all'}
                onClick={() => setActiveGroup('all')}
              >
                Tous
                <Counter active={activeGroup === 'all'}>
                  {groupCounts.all ?? 0}
                </Counter>
              </FilterPill>
              {NOTE_GROUPS.map(g => {
                const count = groupCounts[g.id] ?? 0
                if (count === 0) return null
                const isActive = activeGroup === g.id
                return (
                  <FilterPill
                    key={g.id}
                    active={isActive}
                    onClick={() => setActiveGroup(isActive ? 'all' : g.id)}
                  >
                    <span className="mr-1">{g.emoji}</span>
                    {g.label}
                    <Counter active={isActive}>{count}</Counter>
                  </FilterPill>
                )
              })}
            </div>

            {/* Tag chips */}
            {availableTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
                  Tags
                </span>
                {availableTags.map(({ tag, count }) => {
                  const isActive = activeTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border transition-colors',
                        isActive
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                          : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      #{tag}
                      <span className="opacity-60">·{count}</span>
                    </button>
                  )
                })}
                {(activeTags.length > 0 || activeGroup !== 'all') && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="ml-1 text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <StickyNote className="size-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                {notes.length === 0
                  ? 'Aucune note pour le moment.'
                  : 'Aucun résultat.'}
              </p>
              {notes.length === 0 && (
                <Button
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="gap-1"
                >
                  <Plus className="size-4" />
                  Créer ma première note
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {filtered.map(n => (
                <NoteCard
                  key={n.id}
                  note={n}
                  isActive={selectedId === n.id}
                  onSelect={() => setSelectedId(n.id)}
                  onDiscuss={() => {
                    const prompt =
                      `Voici une note de mon journal Melron :\n\n# ${n.title || 'Sans titre'}\n\n${n.content}\n\n` +
                      `---\nDe quoi veux-tu qu'on parle à propos de cette note ? Propose-moi 3 angles intéressants pour démarrer.`
                    launchChatWithPrompt(prompt, router)
                  }}
                  onDelete={() => handleDelete(n.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Editor pane (right side panel, opens when a note is selected) */}
      <aside
        className={cn(
          'shrink-0 border-l flex flex-col overflow-hidden bg-background transition-all duration-200',
          selected ? 'w-[440px]' : 'w-0'
        )}
      >
        {selected ? (
          <>
            {/* Header riche : titre + actions. pr-24 pour éviter le chevauchement
                avec le toggle Dev + avatar fixés en haut à droite de l'écran. */}
            <div className="border-b p-3 flex items-center gap-1 pr-24">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedId(null)}
                title="Fermer"
                className="size-8 shrink-0"
              >
                <X className="size-4" />
              </Button>
              {isEditing ? (
                <Input
                  value={draftTitle}
                  onChange={e => setDraftTitle(e.target.value)}
                  placeholder="Titre"
                  className="text-base font-medium border-0 shadow-none focus-visible:ring-0 px-1 flex-1 min-w-0"
                  maxLength={256}
                />
              ) : (
                <h2 className="text-base font-semibold flex-1 min-w-0 truncate px-1">
                  {draftTitle || 'Sans titre'}
                </h2>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(v => !v)}
                title={isEditing ? 'Aperçu' : 'Éditer'}
                className="size-8"
              >
                {isEditing ? (
                  <Eye className="size-4" />
                ) : (
                  <PencilLine className="size-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  await navigator.clipboard.writeText(draftContent)
                  toast.success('Contenu copié')
                }}
                title="Copier le contenu"
                className="size-8"
              >
                <Copy className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(selected.id)}
                title="Supprimer la note"
                className="size-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
              {isEditing && (
                <Button
                  onClick={handleSave}
                  disabled={!dirty || isSaving}
                  size="sm"
                  className="ml-1"
                >
                  {isSaving ? '…' : 'OK'}
                </Button>
              )}
            </div>

            {/* Pills d'actions AI */}
            <div className="border-b px-3 py-2 overflow-x-auto">
              <div className="flex items-center gap-1.5 min-w-max">
                <Sparkles className="size-3.5 text-violet-500 shrink-0 mr-0.5" />
                {NOTE_ACTIONS.map(action => {
                  const Icon = action.Icon
                  const isDisabled = !draftContent.trim() && !draftTitle.trim()
                  return (
                    <button
                      key={action.key}
                      type="button"
                      disabled={isDisabled}
                      onClick={() =>
                        launchChatWithPrompt(
                          action.buildPrompt({
                            title: draftTitle.trim() || 'Sans titre',
                            content: draftContent.trim()
                          }),
                          router
                        )
                      }
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                        'border-border text-muted-foreground hover:text-foreground hover:bg-muted',
                        isDisabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <Icon className="size-3" />
                      {action.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Note body — markdown rendered en lecture, textarea en édition */}
            {isEditing ? (
              <Textarea
                value={draftContent}
                onChange={e => setDraftContent(e.target.value)}
                placeholder="Écris ta note ici… (markdown supporté)"
                className="flex-1 resize-none border-0 shadow-none focus-visible:ring-0 p-4 text-sm leading-relaxed font-mono"
                autoFocus
              />
            ) : (
              <div
                className="flex-1 overflow-y-auto px-4 py-3 text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none cursor-text"
                onDoubleClick={() => setIsEditing(true)}
              >
                {draftContent.trim() ? (
                  <Streamdown>{draftContent}</Streamdown>
                ) : (
                  <p className="text-muted-foreground italic">
                    Note vide. Double-clique ou utilise l'icône crayon pour éditer.
                  </p>
                )}
              </div>
            )}

            {/* Discuter avec cette note */}
            <div className="border-t p-3">
              <form
                onSubmit={e => {
                  e.preventDefault()
                  const question = discussInput.trim()
                  if (!question) return
                  const prompt =
                    `Voici une note de mon journal Melron :\n\n# ${draftTitle.trim() || 'Sans titre'}\n\n${draftContent.trim()}\n\n` +
                    `---\nMa question à propos de cette note : ${question}`
                  launchChatWithPrompt(prompt, router)
                  setDiscussInput('')
                }}
                className="flex items-center gap-2 rounded-full border bg-muted/40 pl-3 pr-1 py-1 focus-within:ring-1 focus-within:ring-ring/30"
              >
                <MessageSquarePlus className="size-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={discussInput}
                  onChange={e => setDiscussInput(e.target.value)}
                  placeholder="Demande quelque chose à propos de cette note…"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground py-1"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!discussInput.trim()}
                  className="size-7 rounded-full shrink-0"
                >
                  <ArrowUp className="size-3.5" />
                </Button>
              </form>
            </div>
          </>
        ) : null}
      </aside>
      </div>
      </div>
    </div>
  )
}

// — Helpers for the filter UI

function FilterPill({
  active,
  onClick,
  children
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors',
        active
          ? 'bg-foreground text-background border-foreground'
          : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
      )}
    >
      {children}
    </button>
  )
}

function Counter({
  active,
  children
}: {
  active: boolean
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[10px]',
        active ? 'bg-background/20 text-background' : 'text-muted-foreground'
      )}
    >
      {children}
    </span>
  )
}

// — Card composant pour la grille de notes (style "page" type Apify)
function NoteCard({
  note,
  isActive,
  onSelect,
  onDiscuss,
  onDelete
}: {
  note: EnrichedNote
  isActive: boolean
  onSelect: () => void
  onDiscuss: () => void
  onDelete: () => void
}) {
  const dateLabel = new Date(note.updatedAt).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  })
  const groupMeta = getGroupMeta(note.group)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group relative flex flex-col text-left rounded-xl p-2 h-72 overflow-hidden transition-all',
        // Outer wrapper = soft amber/peach tone (Notes accent colour) like
        // the Apify "page preview" cards.
        'bg-amber-500/10 hover:bg-amber-500/15',
        isActive && 'ring-2 ring-amber-500/40'
      )}
    >
      {/* Quick actions */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            onDiscuss()
          }}
          className="rounded-md bg-background/90 backdrop-blur p-1.5 text-muted-foreground hover:text-foreground border"
          aria-label="Discuter avec cette note"
          title="Discuter avec cette note"
        >
          <MessageSquarePlus className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            onDelete()
          }}
          className="rounded-md bg-background/90 backdrop-blur p-1.5 text-muted-foreground hover:text-destructive border"
          aria-label="Supprimer"
          title="Supprimer"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {/* "Page" — inner white sheet with title + markdown preview */}
      <div className="relative flex-1 rounded-lg bg-background overflow-hidden p-3 flex flex-col">
        {/* Group badge */}
        <span
          className={cn(
            'self-start inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-medium mb-2',
            groupMeta.color
          )}
        >
          <span>{groupMeta.emoji}</span>
          {groupMeta.label}
        </span>

        <h3 className="text-sm font-semibold leading-snug line-clamp-2 pr-12 mb-2">
          {note.title || 'Sans titre'}
        </h3>

        <div className="flex-1 overflow-hidden text-xs leading-relaxed prose prose-xs dark:prose-invert max-w-none [&_*]:text-foreground/70 [&_h1]:text-sm [&_h1]:my-1 [&_h2]:text-xs [&_h2]:my-1 [&_h3]:text-xs [&_p]:my-0.5 [&_ul]:my-0.5 [&_ol]:my-0.5 [&_pre]:text-[10px] [&_pre]:p-1.5">
          {note.content?.trim() ? (
            <Streamdown>{note.content}</Streamdown>
          ) : (
            <p className="text-muted-foreground italic">Note vide</p>
          )}
        </div>

        {/* Bottom fade so the preview blends out cleanly */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-12 h-14 bg-gradient-to-t from-background via-background/85 to-transparent" />

        {/* Tags row above the date */}
        {note.tags.length > 0 && (
          <div className="absolute bottom-9 left-3 right-3 flex flex-wrap gap-1 z-10">
            {note.tags.slice(0, 3).map(t => (
              <span
                key={t}
                className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-medium"
              >
                #{t}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="inline-flex items-center px-1 text-[10px] text-muted-foreground">
                +{note.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Date pill — bottom-right */}
        <span className="absolute bottom-2 right-2 z-10 px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px] font-medium text-amber-700 dark:text-amber-300">
          {dateLabel}
        </span>
      </div>
    </button>
  )
}
