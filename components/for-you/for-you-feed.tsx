'use client'

import { Fragment, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  ArrowRight,
  Calendar,
  ChevronDown,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Globe,
  Inbox,
  Linkedin,
  MessageSquarePlus,
  Newspaper,
  Search,
  Send,
  Sparkles,
  TrendingUp,
  X,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import {
  FEED_ITEMS,
  FEED_TYPES,
  getTypeMeta,
  groupByDay,
  type FeedItem,
  type FeedItemType,
  type FeedSource,
  type SourceKind
} from './feed-data'

const SOURCE_ICON: Record<SourceKind, typeof Globe> = {
  linkedin: Linkedin,
  web: Globe,
  news: Newspaper,
  crunchbase: TrendingUp,
  job_board: FileText,
  internal: Sparkles
}

const SOURCE_COLOR: Record<SourceKind, string> = {
  linkedin: 'text-[#0A66C2]',
  web: 'text-muted-foreground',
  news: 'text-orange-500',
  crunchbase: 'text-cyan-500',
  job_board: 'text-emerald-500',
  internal: 'text-violet-500'
}

export function ForYouFeed() {
  const [activeType, setActiveType] = useState<FeedItemType | 'all'>('all')
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [feedbackItem, setFeedbackItem] = useState<FeedItem | null>(null)

  const filtered = useMemo<FeedItem[]>(() => {
    const q = search.trim().toLowerCase()
    return FEED_ITEMS.filter(it => {
      if (dismissed.has(it.id)) return false
      if (activeType !== 'all' && it.type !== activeType) return false
      if (q) {
        const hay =
          `${it.title} ${it.subtitle} ${it.whyNow} ${it.draft ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [activeType, dismissed, search])

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 }
    for (const it of FEED_ITEMS) {
      if (dismissed.has(it.id)) continue
      counts.all += 1
      counts[it.type] = (counts[it.type] ?? 0) + 1
    }
    return counts
  }, [dismissed])

  const groups = useMemo(() => groupByDay(filtered), [filtered])
  const totalFresh = filtered.length

  return (
    <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-auto">
      {/* Hero */}
      <div className="px-8 pt-8 pb-4 shrink-0">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3 mb-2">
          <Inbox className="size-7 text-violet-500" />
          Boîte de réception
          {totalFresh > 0 && (
            <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full bg-violet-500 text-white text-sm font-semibold">
              {totalFresh}
            </span>
          )}
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          Ce que Melron a trouvé pour toi — leads, jobs, signaux et drafts
          classés par priorité IA.
        </p>
      </div>

      {/* Search + filters row — search on the LEFT, filters on the RIGHT */}
      <div className="px-8 pb-4 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un lead, job, signal…"
              className="pl-10 h-9 rounded-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
            <FilterPill
              active={activeType === 'all'}
              onClick={() => setActiveType('all')}
            >
              Tous
              <Counter active={activeType === 'all'}>
                {typeCounts.all}
              </Counter>
            </FilterPill>
            {FEED_TYPES.map(t => {
              const count = typeCounts[t.id] ?? 0
              const isActive = activeType === t.id
              return (
                <FilterPill
                  key={t.id}
                  active={isActive}
                  onClick={() => setActiveType(isActive ? 'all' : t.id)}
                  disabled={count === 0}
                >
                  <span className="mr-1">{t.emoji}</span>
                  {t.label}
                  <Counter active={isActive}>{count}</Counter>
                </FilterPill>
              )
            })}
          </div>
        </div>
      </div>

      {/* Body — grouped tables */}
      <div className="px-8 pb-12 space-y-6">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center">
            <Sparkles className="size-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {FEED_ITEMS.length === 0
                ? "Aucun item pour le moment — active un Heartbeat pour recevoir un flux."
                : 'Aucun item ne correspond à ce filtre.'}
            </p>
          </div>
        ) : (
          groups.map(group => (
            <section key={group.label}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {group.label}
              </h3>
              <div className="rounded-xl border bg-card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/40">
                    <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="text-left font-semibold px-3 py-2 w-24">
                        Type
                      </th>
                      <th className="text-left font-semibold px-3 py-2">
                        Item
                      </th>
                      <th className="text-left font-semibold px-3 py-2 hidden md:table-cell">
                        Pourquoi maintenant
                      </th>
                      <th className="text-left font-semibold px-3 py-2 w-20">
                        Score
                      </th>
                      <th className="text-left font-semibold px-3 py-2 w-20 hidden sm:table-cell">
                        Quand
                      </th>
                      <th className="text-right font-semibold px-3 py-2 w-44">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {group.items.map(item => (
                      <FeedRow
                        key={item.id}
                        item={item}
                        expanded={expandedId === item.id}
                        onToggleExpand={() =>
                          setExpandedId(prev =>
                            prev === item.id ? null : item.id
                          )
                        }
                        onDismiss={() => setFeedbackItem(item)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))
        )}
      </div>

      {/* Feedback dialog when user dismisses an item */}
      <DismissFeedbackDialog
        item={feedbackItem}
        onClose={() => setFeedbackItem(null)}
        onConfirm={(item, reason, note) => {
          setDismissed(prev => new Set(prev).add(item.id))
          setFeedbackItem(null)
          toast.success('Merci ! Melron apprend de tes retours.', {
            description: note ? `${reason} · « ${note} »` : reason
          })
          // Persist later via /api/feedback or similar.
          console.log('[for-you] dismiss feedback:', {
            id: item.id,
            type: item.type,
            reason,
            note
          })
        }}
      />
    </div>
  )
}

function FeedRow({
  item,
  expanded,
  onToggleExpand,
  onDismiss
}: {
  item: FeedItem
  expanded: boolean
  onToggleExpand: () => void
  onDismiss: () => void
}) {
  const router = useRouter()
  const meta = getTypeMeta(item.type)
  const sourceCount = item.sources?.length ?? 0
  const hasDraft = !!item.draft?.trim()
  const [customScheduleOpen, setCustomScheduleOpen] = useState(false)

  const openInMelron = () => {
    if (typeof window === 'undefined') return
    const intro = `Voici un draft de Melron pour un « ${meta.label.toLowerCase()} » — ${item.title}.\n\nMerci de l'améliorer / personnaliser avant envoi :\n\n---\n${item.draft ?? '(pas de draft)'}\n---\n\nContexte : ${item.subtitle}\nPourquoi maintenant : ${item.whyNow}`
    sessionStorage.setItem('pendingMessage', intro)
    router.push('/')
  }

  const schedule = (when: string) => {
    // TODO: brancher sur Unipile / queue côté serveur.
    console.log('[for-you] schedule send:', { id: item.id, when })
    toast.success(
      when === 'now' ? 'Message envoyé' : `Programmé : ${when}`,
      {
        description:
          item.title.length > 60
            ? item.title.slice(0, 60) + '…'
            : item.title
      }
    )
  }

  return (
    <Fragment>
      <tr
        className={cn(
          'group cursor-pointer transition-colors',
          expanded ? 'bg-muted/40' : 'hover:bg-muted/30'
        )}
        onClick={onToggleExpand}
      >
        <td className="px-3 py-3 align-top">
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-[11px] font-medium',
              meta.color
            )}
          >
            <span>{meta.emoji}</span>
            {meta.label}
          </span>
        </td>
        <td className="px-3 py-3 align-top">
          <div className="flex items-start gap-2">
            <ChevronDown
              className={cn(
                'size-3.5 text-muted-foreground/60 mt-1 transition-transform shrink-0',
                expanded ? '' : '-rotate-90'
              )}
            />
            <div className="min-w-0">
              <div className="text-sm font-medium leading-tight">
                {item.title}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {item.subtitle}
              </div>
              <div className="md:hidden mt-1.5 text-[11px] text-amber-600 dark:text-amber-400 flex items-start gap-1">
                <span>💡</span>
                <span>{item.whyNow}</span>
              </div>
            </div>
          </div>
        </td>
        <td className="px-3 py-3 align-top hidden md:table-cell">
          <span className="text-xs text-foreground/80 leading-snug flex items-start gap-1">
            <span className="text-amber-500 shrink-0">💡</span>
            <span>{item.whyNow}</span>
          </span>
          {sourceCount > 0 && !expanded && (
            <div className="flex items-center gap-1 mt-2">
              {item.sources?.slice(0, 3).map((s, i) => (
                <SourceIcon key={i} source={s} compact />
              ))}
              {sourceCount > 3 && (
                <span className="text-[10px] text-muted-foreground">
                  +{sourceCount - 3}
                </span>
              )}
            </div>
          )}
        </td>
        <td className="px-3 py-3 align-top">
          <ScorePill score={item.score} />
        </td>
        <td className="px-3 py-3 align-top hidden sm:table-cell">
          <span className="text-xs text-muted-foreground">{item.time}</span>
        </td>
        <td className="px-3 py-3 align-top">
          <div
            className="flex items-center justify-end gap-1"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onToggleExpand}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
            >
              {expanded ? 'Réduire' : item.primaryAction ?? 'Voir'}
              <ArrowRight
                className={cn(
                  'size-3 transition-transform',
                  expanded && 'rotate-90'
                )}
              />
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="size-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Skip"
              aria-label="Skip"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded row : draft + sources */}
      {expanded && (
        <tr className="bg-muted/30">
          <td colSpan={6} className="px-3 pt-0 pb-4">
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 mt-2">
              {/* Draft */}
              {hasDraft && (
                <div className="rounded-lg border bg-background p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
                      <Send className="size-3 text-violet-500" />
                      Draft prêt à envoyer
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard
                            .writeText(item.draft!)
                            .then(
                              () => toast.success('Draft copié'),
                              () => toast.error('Impossible de copier')
                            )
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Copy className="size-3" />
                        Copier
                      </button>
                    </div>
                  </div>
                  <pre className="text-sm whitespace-pre-wrap leading-relaxed font-sans text-foreground/90 mb-3">
                    {item.draft}
                  </pre>

                  {/* Action bar — Ouvrir avec Melron + Envoyer (scheduling) */}
                  <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border/50">
                    <button
                      type="button"
                      onClick={openInMelron}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium hover:bg-muted transition-colors"
                      title="Pré-charger le draft dans le chat principal pour itérer"
                    >
                      <MessageSquarePlus className="size-3.5 text-violet-500" />
                      Ouvrir avec Melron
                    </button>

                    <div className="ml-auto inline-flex rounded-md overflow-hidden border">
                      <button
                        type="button"
                        onClick={() => schedule('now')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
                      >
                        <Send className="size-3.5" />
                        Envoyer
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="px-1.5 bg-foreground text-background hover:opacity-90 transition-opacity border-l border-background/20"
                            aria-label="Options d'envoi"
                          >
                            <ChevronDown className="size-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-48">
                          <DropdownMenuItem
                            className="gap-2"
                            onSelect={() => schedule('now')}
                          >
                            <Zap className="size-4 text-amber-500" />
                            Envoyer maintenant
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2"
                            onSelect={() => schedule('in_1h')}
                          >
                            <Clock className="size-4" />
                            Dans 1 heure
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2"
                            onSelect={() => schedule('tomorrow_9am')}
                          >
                            <Clock className="size-4" />
                            Demain 9 h
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2"
                            onSelect={e => {
                              e.preventDefault()
                              setCustomScheduleOpen(true)
                            }}
                          >
                            <Calendar className="size-4" />
                            Personnalisé…
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              )}

              {/* Sources */}
              {sourceCount > 0 && (
                <div className="rounded-lg border bg-background p-4">
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Sources ({sourceCount})
                  </span>
                  <ul className="space-y-1.5">
                    {item.sources?.map((s, i) => (
                      <li key={i}>
                        <a
                          href={s.url}
                          target={s.url.startsWith('/') ? '_self' : '_blank'}
                          rel="noopener noreferrer"
                          className="group flex items-start gap-2 rounded-md px-2 py-1.5 -mx-2 hover:bg-muted transition-colors"
                          onClick={e => e.stopPropagation()}
                        >
                          <SourceIcon source={s} />
                          <span className="flex-1 min-w-0">
                            <span className="text-xs font-medium text-foreground leading-tight truncate block">
                              {s.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate block">
                              {prettyHost(s.url)}
                            </span>
                          </span>
                          <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}

      {/* Custom schedule dialog */}
      <CustomScheduleDialog
        open={customScheduleOpen}
        onClose={() => setCustomScheduleOpen(false)}
        onConfirm={iso => {
          setCustomScheduleOpen(false)
          schedule(iso)
        }}
      />
    </Fragment>
  )
}

function CustomScheduleDialog({
  open,
  onClose,
  onConfirm
}: {
  open: boolean
  onClose: () => void
  onConfirm: (isoDateTime: string) => void
}) {
  // Default = tomorrow 9 AM in the user's local timezone.
  const defaultValue = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(9, 0, 0, 0)
    // Format YYYY-MM-DDTHH:mm for <input type="datetime-local">
    const pad = (n: number) => `${n}`.padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }, [])
  const [value, setValue] = useState(defaultValue)

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-md bg-background text-foreground border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="size-4 text-violet-500" />
            Programmer l&apos;envoi
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Date & heure
          </label>
          <Input
            type="datetime-local"
            value={value}
            onChange={e => setValue(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
          <p className="text-xs text-muted-foreground">
            Le message sera envoyé via Unipile à l&apos;heure programmée.
            Heure locale.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            disabled={!value}
            onClick={() => onConfirm(`custom:${value}`)}
          >
            Programmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SourceIcon({
  source,
  compact = false
}: {
  source: FeedSource
  compact?: boolean
}) {
  const Icon = SOURCE_ICON[source.kind ?? 'web'] ?? Globe
  const colour = SOURCE_COLOR[source.kind ?? 'web'] ?? 'text-muted-foreground'
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center shrink-0',
        compact ? 'size-4' : 'size-5 rounded-md bg-muted'
      )}
      title={source.label}
    >
      <Icon className={cn(compact ? 'size-3' : 'size-3', colour)} />
    </span>
  )
}

function prettyHost(url: string): string {
  if (url.startsWith('/')) return 'melron · interne'
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function ScorePill({ score }: { score: number }) {
  const tone =
    score >= 9
      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
      : score >= 7
        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
        : 'bg-muted text-muted-foreground'
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums',
        tone
      )}
    >
      {score.toFixed(1)}
    </span>
  )
}

function FilterPill({
  active,
  onClick,
  disabled,
  children
}: {
  active: boolean
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors',
        active
          ? 'bg-foreground text-background border-foreground'
          : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted',
        disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
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

// — Dismiss feedback dialog ────────────────────────────

const DISMISS_REASONS: Record<FeedItemType, string[]> = {
  lead: [
    'Pas dans mon ICP',
    'Mauvais timing',
    'Profil pas assez senior / trop senior',
    'Déjà en contact avec cette personne',
    'Pas pertinent géographiquement'
  ],
  job: [
    'Pas mon profil / pas la bonne séniorité',
    'Salaire pas aligné',
    'Lieu / remote pas OK',
    'Pas le bon moment pour bouger',
    'Entreprise pas intéressante'
  ],
  signal: [
    'Pas pertinent pour moi',
    'Déjà vu / déjà commenté',
    'Auteur pas dans mes priorités',
    'Sujet pas dans mon expertise'
  ],
  intro: [
    "Pas le bon canal",
    'Pas le bon timing',
    "Pas envie de demander cette intro",
    'Je préfère approcher directement'
  ],
  draft: [
    'Mauvais ton / pas mon style',
    'Mauvais destinataire',
    'Pas le bon timing',
    'Je préfère rédiger moi-même',
    'Trop long / trop court'
  ],
  heartbeat: [
    'Pas pertinent cette semaine',
    'Trop de résultats',
    'Désactiver ce Heartbeat',
    'Heartbeat à reconfigurer'
  ]
}

function DismissFeedbackDialog({
  item,
  onClose,
  onConfirm
}: {
  item: FeedItem | null
  onClose: () => void
  onConfirm: (item: FeedItem, reason: string, note?: string) => void
}) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [note, setNote] = useState('')

  // Reset when item changes
  useMemo(() => {
    setSelectedReason(null)
    setNote('')
  }, [item?.id])

  if (!item) return null

  const meta = getTypeMeta(item.type)
  const reasons = DISMISS_REASONS[item.type]

  return (
    <Dialog open={!!item} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-background text-foreground border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{meta.emoji}</span>
            Pourquoi tu skips ce {meta.label.toLowerCase()} ?
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-lg bg-muted/40 p-3 text-sm">
          <div className="font-medium">{item.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {item.subtitle}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Raison
          </label>
          {reasons.map(r => {
            const isActive = selectedReason === r
            return (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedReason(r)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md border text-sm transition-colors',
                  isActive
                    ? 'border-foreground bg-foreground/5 font-medium'
                    : 'border-border hover:bg-muted'
                )}
              >
                {r}
              </button>
            )
          })}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Note libre (optionnel)
          </label>
          <Textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Donne plus de contexte à Melron pour t'envoyer mieux la prochaine fois…"
            rows={2}
            className="resize-none text-sm"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              const reason = selectedReason ?? 'Autre raison'
              onConfirm(item, reason, note.trim() || undefined)
            }}
            disabled={!selectedReason && !note.trim()}
          >
            Skip + apprendre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
