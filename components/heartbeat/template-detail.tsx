'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import {
  Activity,
  ArrowLeft,
  Bell,
  Calendar,
  ChevronDown,
  Clock,
  Code2,
  Copy,
  Download,
  FileText,
  Filter,
  Loader2,
  type LucideIcon,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Play,
  Settings,
  Star,
  Users,
  Wrench
} from 'lucide-react'
import {
  Award,
  BarChart3,
  Brain,
  Briefcase,
  Building2,
  Compass,
  Eye,
  Flame,
  Globe,
  Heart,
  Newspaper,
  PenLine,
  Radio,
  Rocket,
  Search as SearchIcon,
  Sparkles,
  Target,
  TrendingUp,
  UserPlus,
  Zap} from 'lucide-react'
import { toast } from 'sonner'

import { createHeartbeat } from '@/lib/heartbeat/store'
import { cn } from '@/lib/utils'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import {
  fmt,
  type HeartbeatTemplate,
  type TemplateIconName
} from './template-data'

const ICON_MAP: Record<TemplateIconName, LucideIcon> = {
  UserPlus,
  TrendingUp,
  Briefcase,
  Zap,
  Radio,
  Newspaper,
  Building2,
  Users,
  Search: SearchIcon,
  Mail,
  MessageCircle,
  Award,
  Sparkles,
  Target,
  Globe,
  Calendar,
  Bell,
  BarChart3,
  Compass,
  Flame,
  Eye,
  PenLine,
  Rocket,
  Brain,
  Heart
}

type Tab = 'config' | 'info' | 'runs' | 'reviews'

const TABS: { id: Tab; label: string; count?: number }[] = [
  { id: 'config', label: 'Configuration' },
  { id: 'info', label: 'Information' },
  { id: 'runs', label: 'Runs', count: 0 },
  { id: 'reviews', label: 'Reviews' }
]

const FREQUENCIES = [
  { id: 'daily', label: 'Quotidien' },
  { id: 'weekly', label: 'Hebdo' },
  { id: 'monthly', label: 'Mensuel' }
] as const

const CHANNELS = [
  { id: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle },
  { id: 'email', label: 'Email', Icon: Mail },
  { id: 'app', label: "In-app", Icon: Bell }
] as const

interface AccordionProps {
  icon: LucideIcon
  title: string
  badge?: string
  defaultOpen?: boolean
  children: React.ReactNode
}

function Accordion({ icon: Icon, title, badge, defaultOpen, children }: AccordionProps) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div className="rounded-lg border bg-muted/20 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-muted/40 transition-colors"
      >
        <ChevronDown
          className={cn(
            'size-4 text-muted-foreground transition-transform',
            !open && '-rotate-90'
          )}
        />
        <Icon className="size-4 text-muted-foreground" />
        <span className="flex-1 text-left">{title}</span>
        {badge && (
          <span className="text-xs text-muted-foreground">{badge}</span>
        )}
      </button>
      {open && <div className="px-4 pb-4 pt-2">{children}</div>}
    </div>
  )
}

interface TemplateDetailProps {
  template: HeartbeatTemplate
}

export function TemplateDetail({ template }: TemplateDetailProps) {
  const router = useRouter()
  const Icon = ICON_MAP[template.icon] ?? Users

  const [tab, setTab] = useState<Tab>('config')
  const [mode, setMode] = useState<'form' | 'json'>('form')
  const [query, setQuery] = useState(template.defaultQuery)
  // Backend supports daily/weekly/custom — we surface daily/weekly/monthly to
  // the user and map "monthly" to "custom" at submit time.
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [channel, setChannel] = useState<'whatsapp' | 'email' | 'app'>('whatsapp')
  const [name, setName] = useState(template.name)
  const [isActivating, startActivating] = useTransition()

  const handleActivate = () => {
    if (!query.trim()) {
      toast.error('La requête ne peut pas être vide')
      return
    }
    startActivating(async () => {
      try {
        await createHeartbeat({
          chatId: `template-${template.id}-${Date.now()}`,
          chatTitle: name,
          query,
          frequency: frequency === 'monthly' ? 'custom' : frequency,
          channel: channel === 'app' ? 'whatsapp' : channel
        })
        toast.success(`Heartbeat « ${name} » activé`, {
          description: 'Première exécution dans les prochaines heures.'
        })
        window.dispatchEvent(new CustomEvent('heartbeat-updated'))
        router.push('/heartbeat')
      } catch (err) {
        console.error('Failed to activate heartbeat:', err)
        toast.error("Impossible d'activer ce Heartbeat")
      }
    })
  }

  const copySlug = async () => {
    await navigator.clipboard.writeText(template.slug)
    toast.success('Slug copié')
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-auto">
      {/* Top bar : back link */}
      <div className="px-8 pt-6">
        <button
          onClick={() => router.push('/heartbeat')}
          className="inline-flex items-center gap-1 text-sm text-sky-500 hover:text-sky-600 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Tous les templates
        </button>
      </div>

      {/* Header */}
      <div className="px-8 pt-4 pb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <span
              className={cn(
                'shrink-0 size-16 rounded-2xl flex items-center justify-center bg-gradient-to-br text-white',
                template.gradient
              )}
            >
              <Icon className="size-8" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold tracking-tight">
                  {template.name}
                </h1>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border bg-muted/40">
                  <Activity className="size-3 text-emerald-500" />
                  Heartbeat template
                </span>
              </div>
              <button
                type="button"
                onClick={copySlug}
                className="inline-flex items-center gap-1 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors mt-1 group"
              >
                {template.slug}
                <Copy className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3 fill-current text-amber-500" />
                  <span className="font-medium text-foreground">
                    {template.rating}
                  </span>
                  <span>({fmt.k(template.reviewCount)})</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3" />
                  {fmt.k(template.users)} utilisateurs
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={cn(
                      'size-3 rounded-full bg-gradient-to-br',
                      template.gradient
                    )}
                  />
                  Crafted by{' '}
                  <span className="font-medium text-foreground">
                    {template.author}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleActivate}
              disabled={isActivating}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-60"
            >
              {isActivating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Activation…
                </>
              ) : (
                <>
                  <Play className="size-4 fill-current" />
                  Activer
                </>
              )}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
            >
              <FileText className="size-4" />
              Sauvegarder
            </button>
            <button
              type="button"
              className="size-9 inline-flex items-center justify-center rounded-lg border hover:bg-muted transition-colors"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-4 max-w-3xl leading-relaxed">
          {template.description}
        </p>
      </div>

      {/* Tabs */}
      <div className="px-8 border-b">
        <div className="flex items-center gap-1">
          {TABS.map(t => {
            const isActive = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'relative px-3 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t.label}
                {t.count !== undefined && (
                  <span className="ml-1.5 inline-flex items-center justify-center size-5 rounded-full bg-muted text-[10px] text-muted-foreground">
                    {t.count}
                  </span>
                )}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-foreground" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-8 py-6 max-w-3xl">
        {tab === 'config' && (
          <>
            {/* Form/JSON toggle */}
            <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 mb-6">
              {(['form', 'json'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                    mode === m
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {m === 'form' ? 'Form' : 'JSON'}
                </button>
              ))}
            </div>

            {mode === 'form' ? (
              <div className="space-y-5">
                {/* Help text */}
                <div className="rounded-lg bg-muted/40 p-4 text-sm leading-relaxed">
                  Configure ton Heartbeat puis clique sur{' '}
                  <span className="font-semibold">Activer</span> pour le lancer.
                  Tu peux personnaliser la requête, la fréquence et le canal de
                  notification. Les autres options sont optionnelles et
                  permettent de filtrer plus finement les résultats.
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Nom du Heartbeat
                  </label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nom affiché dans la sidebar"
                    maxLength={120}
                  />
                </div>

                {/* Query */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    🔍 Requête à exécuter
                  </label>
                  <Textarea
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Décris ce que Melron doit chercher à chaque run…"
                    rows={4}
                    className="resize-y"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Cette requête sera envoyée à Melron à chaque exécution
                    programmée.
                  </p>
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    ⏱ Fréquence
                  </label>
                  <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
                    {FREQUENCIES.map(f => (
                      <button
                        key={f.id}
                        onClick={() => setFrequency(f.id)}
                        className={cn(
                          'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                          frequency === f.id
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Channel */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    🔔 Canal de notification
                  </label>
                  <div className="grid grid-cols-3 gap-2 max-w-md">
                    {CHANNELS.map(c => {
                      const ChIcon = c.Icon
                      const isActive = channel === c.id
                      return (
                        <button
                          key={c.id}
                          onClick={() => setChannel(c.id)}
                          className={cn(
                            'flex items-center justify-center gap-1.5 py-2 rounded-md border text-sm font-medium transition-colors',
                            isActive
                              ? 'border-foreground bg-foreground/5'
                              : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                          )}
                        >
                          <ChIcon className="size-4" />
                          {c.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Add-ons (placeholder collapsibles) */}
                <div className="space-y-2 pt-2">
                  <Accordion icon={Filter} title="Add-on : Filtres avancés">
                    <p className="text-sm text-muted-foreground">
                      Filtre par mot-clé, score de signal minimum, fraîcheur,
                      ou toute autre dimension supportée.
                    </p>
                  </Accordion>

                  <Accordion icon={Bell} title="Add-on : Notifications">
                    <p className="text-sm text-muted-foreground">
                      Personnalise quand et comment tu reçois les résultats
                      (heure, jour, condition de déclenchement).
                    </p>
                  </Accordion>

                  <Accordion icon={Clock} title="Add-on : Plage horaire">
                    <p className="text-sm text-muted-foreground">
                      Limite l'exécution à certaines heures (ex: jamais avant
                      8 h).
                    </p>
                  </Accordion>

                  <Accordion
                    icon={Settings}
                    title="Options avancées"
                    badge="Coût · Build · Timeout · Memory"
                  >
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Coût max par run
                        </p>
                        <p className="font-medium">Illimité</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Build
                        </p>
                        <p className="font-medium">latest</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Timeout
                        </p>
                        <p className="font-medium">300 s</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Memory
                        </p>
                        <p className="font-medium">1 GB</p>
                      </div>
                    </div>
                  </Accordion>
                </div>

                {/* Bottom actions */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleActivate}
                    disabled={isActivating}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-60"
                  >
                    {isActivating ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Activation…
                      </>
                    ) : (
                      <>
                        <Play className="size-4 fill-current" />
                        Activer
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Sauvegarder
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery(template.defaultQuery)
                      setName(template.name)
                      setFrequency('daily')
                      setChannel('whatsapp')
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Réinitialiser
                  </button>
                </div>

                <p className="text-xs text-muted-foreground pt-2">
                  Note : la configuration ci-dessus est appliquée uniquement
                  aux Heartbeats lancés depuis Melron. Pour piloter via API,
                  consulte la doc API.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border bg-muted/30 p-4 font-mono text-xs overflow-x-auto">
                <pre>{JSON.stringify(
                  {
                    name,
                    query,
                    frequency,
                    channel,
                    template_id: template.id,
                    template_slug: template.slug
                  },
                  null,
                  2
                )}</pre>
              </div>
            )}
          </>
        )}

        {tab === 'info' && (
          <div className="space-y-6">
            <Section title="À propos">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {template.description}
              </p>
            </Section>

            <Section title="Comment ça marche">
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li>Tu configures la fréquence et le canal de notification.</li>
                <li>Melron exécute la requête à chaque période.</li>
                <li>
                  Tu reçois les nouveaux résultats sur ton canal préféré, avec
                  un récap actionnable.
                </li>
                <li>Tu peux pauser, modifier ou supprimer à tout moment.</li>
              </ol>
            </Section>

            <Section title="Catégorie">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium">
                {template.category}
              </span>
            </Section>

            <Section title="Auteur">
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={cn(
                    'size-6 rounded-full bg-gradient-to-br',
                    template.gradient
                  )}
                />
                <span className="font-medium">{template.author}</span>
              </div>
            </Section>
          </div>
        )}

        {tab === 'runs' && (
          <EmptyTab
            icon={Activity}
            title="Aucun run pour le moment"
            description="Active ce Heartbeat pour voir l'historique de ses exécutions ici."
          />
        )}

        {tab === 'reviews' && (
          <EmptyTab
            icon={Star}
            title="Aucun avis pour le moment"
            description="Sois le premier à partager ton expérience avec ce template."
          />
        )}
      </div>
    </div>
  )
}

function Section({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </h3>
      {children}
    </div>
  )
}

function EmptyTab({
  icon: Icon,
  title,
  description
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="size-10 text-muted-foreground/40 mb-3" />
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
  )
}
