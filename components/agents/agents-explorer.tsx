'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import {
  BookOpen,
  Brain,
  Briefcase,
  Code,
  Compass,
  GraduationCap,
  Heart,
  Lightbulb,
  PenLine,
  Plus,
  Rocket,
  Search,
  Sparkles,
  Star,
  Target,
  Users,
  Wrench
} from 'lucide-react'

import type { UserAgent } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import {
  CreateCollectionModal,
  ICONS
} from '@/components/create-collection-modal'

import { LibraryTab } from './library-tab'

const COLOR_GRADIENT: Record<string, string> = {
  zinc: 'from-zinc-500 to-zinc-700',
  red: 'from-red-400 to-rose-600',
  orange: 'from-orange-400 to-orange-600',
  amber: 'from-amber-400 to-yellow-600',
  green: 'from-emerald-400 to-teal-600',
  blue: 'from-sky-400 to-blue-600',
  violet: 'from-violet-400 to-purple-600',
  pink: 'from-pink-400 to-fuchsia-600'
}

type Category =
  | 'all'
  | 'mine'
  | 'library'
  | 'productivity'
  | 'research'
  | 'writing'
  | 'lifestyle'
  | 'programming'
  | 'education'

const CATEGORIES: Array<{ id: Category; label: string }> = [
  { id: 'all', label: 'Les plus populaires' },
  { id: 'mine', label: 'Mes agents' },
  { id: 'library', label: 'Bibliothèque' },
  { id: 'productivity', label: 'Productivité' },
  { id: 'research', label: 'Research & Analysis' },
  { id: 'writing', label: 'Writing' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'programming', label: 'Programming' },
  { id: 'education', label: 'Education' }
]

interface FeaturedAgent {
  id: string
  name: string
  description: string
  Icon: typeof Sparkles
  color: string
  category: Exclude<Category, 'mine' | 'all'>
  rating: number
  uses: string
  author: string
  featured?: boolean
}

const FEATURED: FeaturedAgent[] = [
  {
    id: 'job-scout',
    name: 'Job Scout',
    description:
      'Trouve les offres qui matchent vraiment ton profil. Scanne LinkedIn, Welcome to the Jungle et 30+ jobboards en continu.',
    Icon: Briefcase,
    color: 'blue',
    category: 'productivity',
    rating: 4.8,
    uses: '12k',
    author: 'Melron',
    featured: true
  },
  {
    id: 'network-coach',
    name: 'Network Coach',
    description:
      'Te dit qui contacter, quand, et avec quel message. Analyse ton réseau LinkedIn et propose des actions concrètes chaque semaine.',
    Icon: Rocket,
    color: 'violet',
    category: 'productivity',
    rating: 4.7,
    uses: '8.4k',
    author: 'Melron',
    featured: true
  },
  {
    id: 'pitch-writer',
    name: 'Pitch Writer',
    description:
      'Rédige tes messages d’approche et candidatures dans ton ton. Apprend ton style à partir de tes envois précédents.',
    Icon: PenLine,
    color: 'amber',
    category: 'writing',
    rating: 4.6,
    uses: '15k',
    author: 'Melron',
    featured: true
  },
  {
    id: 'cv-doctor',
    name: 'CV Doctor',
    description:
      'Optimise ton CV pour chaque offre. ATS-friendly, keywords ciblés, et formulations qui passent les filtres recruteurs.',
    Icon: Wrench,
    color: 'orange',
    category: 'writing',
    rating: 4.9,
    uses: '23k',
    author: 'Melron'
  },
  {
    id: 'salary-analyst',
    name: 'Salary Analyst',
    description:
      'Benchmark de salaire par rôle, ville et séniorité. Te coache aussi sur la négociation avec les bons arguments.',
    Icon: Brain,
    color: 'green',
    category: 'research',
    rating: 4.5,
    uses: '6.2k',
    author: 'Melron'
  },
  {
    id: 'interview-prep',
    name: 'Interview Prep',
    description:
      'Simulations d’entretien réalistes (technique, RH, comportemental) avec feedback détaillé après chaque réponse.',
    Icon: GraduationCap,
    color: 'pink',
    category: 'education',
    rating: 4.7,
    uses: '9.1k',
    author: 'Melron'
  },
  {
    id: 'code-mentor',
    name: 'Code Mentor',
    description:
      'Pair-programming sur tes side-projects. Te pousse à mieux structurer ton code et te corrige sans juger.',
    Icon: Code,
    color: 'zinc',
    category: 'programming',
    rating: 4.8,
    uses: '11k',
    author: 'Melron'
  },
  {
    id: 'career-therapist',
    name: 'Career Therapist',
    description:
      'Quand tu doutes de ta trajectoire. T’aide à clarifier ce que tu veux vraiment, sans bullshit motivationnel.',
    Icon: Heart,
    color: 'red',
    category: 'lifestyle',
    rating: 4.9,
    uses: '4.8k',
    author: 'Melron'
  },
  {
    id: 'learning-buddy',
    name: 'Learning Buddy',
    description:
      'Construit un plan d’apprentissage personnalisé sur n’importe quel sujet, avec ressources et exercices.',
    Icon: BookOpen,
    color: 'blue',
    category: 'education',
    rating: 4.6,
    uses: '7.3k',
    author: 'Melron'
  },
  {
    id: 'product-strategist',
    name: 'Product Strategist',
    description:
      'Te challenge sur ta roadmap, identifie les angles morts et propose des priorisations data-driven.',
    Icon: Compass,
    color: 'violet',
    category: 'productivity',
    rating: 4.4,
    uses: '5.1k',
    author: 'Melron'
  },
  {
    id: 'idea-generator',
    name: 'Idea Generator',
    description:
      'Brainstorm sans limites. Te sort 20 angles différents sur n’importe quel problème en 2 minutes.',
    Icon: Lightbulb,
    color: 'amber',
    category: 'writing',
    rating: 4.5,
    uses: '14k',
    author: 'Melron'
  },
  {
    id: 'community-builder',
    name: 'Community Builder',
    description:
      'Stratégies concrètes pour faire grandir une communauté authentique autour de ton produit ou contenu.',
    Icon: Users,
    color: 'pink',
    category: 'lifestyle',
    rating: 4.3,
    uses: '3.9k',
    author: 'Melron'
  },
  {
    id: 'focus-keeper',
    name: 'Focus Keeper',
    description:
      'Découpe tes tâches en sessions deep work. Te rappelle pourquoi tu fais ce que tu fais.',
    Icon: Target,
    color: 'green',
    category: 'productivity',
    rating: 4.4,
    uses: '8.7k',
    author: 'Melron'
  }
]

const SECTION_ORDER: Array<{
  cat: Exclude<Category, 'mine' | 'all'>
  label: string
  sub: string
}> = [
  {
    cat: 'productivity',
    label: 'Productivité',
    sub: 'Les agents qui te font gagner du temps'
  },
  {
    cat: 'research',
    label: 'Research & Analysis',
    sub: 'Trouver, analyser, comprendre'
  },
  {
    cat: 'writing',
    label: 'Writing',
    sub: 'Écrire mieux, plus vite'
  },
  {
    cat: 'education',
    label: 'Education',
    sub: 'Apprendre et progresser'
  },
  {
    cat: 'lifestyle',
    label: 'Lifestyle',
    sub: 'Mieux vivre ton parcours'
  },
  {
    cat: 'programming',
    label: 'Programming',
    sub: 'Code, debug, ship'
  }
]

interface AgentsExplorerProps {
  myAgents: UserAgent[]
}

export function AgentsExplorer({ myAgents }: AgentsExplorerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = (() => {
    const raw = searchParams.get('tab')
    if (raw && CATEGORIES.some(c => c.id === raw)) {
      return raw as Category
    }
    return 'all' as Category
  })()
  const [activeTab, setActiveTab] = useState<Category>(initialTab)
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  // Keep URL in sync with tab so links like /agents?tab=library land correctly.
  useEffect(() => {
    const current = searchParams.get('tab')
    if (activeTab === 'all') {
      if (current) router.replace('/agents', { scroll: false })
    } else if (current !== activeTab) {
      router.replace(`/agents?tab=${activeTab}`, { scroll: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const q = query.trim().toLowerCase()

  const filteredFeatured = useMemo(() => {
    return FEATURED.filter(a => {
      if (q && !`${a.name} ${a.description}`.toLowerCase().includes(q)) {
        return false
      }
      if (activeTab === 'all') return true
      if (activeTab === 'mine') return false
      return a.category === activeTab
    })
  }, [q, activeTab])

  const filteredMine = useMemo(() => {
    if (activeTab !== 'all' && activeTab !== 'mine') return []
    return myAgents.filter(
      a => !q || `${a.name} ${a.description ?? ''}`.toLowerCase().includes(q)
    )
  }, [myAgents, q, activeTab])

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-auto">
      <div className="max-w-5xl mx-auto w-full px-6 py-10 flex flex-col gap-10">
        <header className="flex flex-col items-center text-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Agents</h1>
          <p className="text-sm text-muted-foreground max-w-lg">
            Découvre et crée des versions personnalisées de Melron, dotées
            d’instructions et de connaissances supplémentaires.
          </p>
          <div className="relative w-full max-w-xl mt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher dans les agents"
              className="pl-10 h-12 rounded-full bg-muted/40 border-transparent focus-visible:bg-background"
            />
          </div>
          <Button onClick={() => setModalOpen(true)} className="mt-2 gap-1.5">
            <Plus className="size-4" />
            Créer un agent
          </Button>
        </header>

        <div className="flex flex-wrap gap-1 justify-center border-b border-border/60 pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={cn(
                'px-3 py-2 text-sm font-medium transition-colors relative',
                activeTab === cat.id
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {cat.label}
              {activeTab === cat.id && (
                <span className="absolute inset-x-3 -bottom-1 h-0.5 bg-foreground rounded-full" />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'library' && <LibraryTab search={q} />}

        {activeTab !== 'library' && filteredMine.length > 0 && (
          <Section
            title="Mes agents"
            sub="Les agents que tu as créés"
            kind="grid"
          >
            {filteredMine.map(agent => (
              <MyAgentCard key={agent.id} agent={agent} />
            ))}
          </Section>
        )}

        {activeTab !== 'library' && activeTab === 'all' && filteredFeatured.length > 0 && (
          <>
            <Section
              title="À la une"
              sub="Les coups de cœur de la semaine"
              kind="featured"
            >
              {filteredFeatured
                .filter(a => a.featured)
                .map(agent => (
                  <FeaturedCard key={agent.id} agent={agent} />
                ))}
            </Section>

            <Section
              title="Tendances"
              sub="Les agents les plus populaires de la communauté"
              kind="ranked"
            >
              {filteredFeatured.slice(0, 8).map((agent, i) => (
                <RankedCard key={agent.id} agent={agent} rank={i + 1} />
              ))}
            </Section>

            {SECTION_ORDER.map(({ cat, label, sub }) => {
              const items = filteredFeatured.filter(a => a.category === cat)
              if (items.length === 0) return null
              return (
                <Section key={cat} title={label} sub={sub} kind="ranked">
                  {items.map((agent, i) => (
                    <RankedCard key={agent.id} agent={agent} rank={i + 1} />
                  ))}
                </Section>
              )
            })}
          </>
        )}

        {activeTab !== 'all' &&
          activeTab !== 'mine' &&
          activeTab !== 'library' &&
          filteredFeatured.length > 0 && (
            <Section
              title={CATEGORIES.find(c => c.id === activeTab)?.label ?? ''}
              sub="Sélection de la communauté"
              kind="ranked"
            >
              {filteredFeatured.map((agent, i) => (
                <RankedCard key={agent.id} agent={agent} rank={i + 1} />
              ))}
            </Section>
          )}

        {activeTab !== 'library' &&
          filteredFeatured.length === 0 &&
          filteredMine.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="size-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {activeTab === 'mine'
                ? 'Tu n’as pas encore créé d’agent.'
                : 'Aucun agent ne correspond.'}
            </p>
            {activeTab === 'mine' && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setModalOpen(true)}
              >
                <Plus className="size-4" />
                Créer mon premier agent
              </Button>
            )}
          </div>
        )}
      </div>

      <CreateCollectionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        type="agent"
        onCreated={() => router.refresh()}
      />
    </div>
  )
}

function Section({
  title,
  sub,
  kind,
  children
}: {
  title: string
  sub: string
  kind: 'featured' | 'ranked' | 'grid'
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
      <div
        className={cn(
          'grid gap-3',
          kind === 'featured' && 'grid-cols-1 sm:grid-cols-2',
          kind === 'ranked' && 'grid-cols-1 sm:grid-cols-2',
          kind === 'grid' && 'grid-cols-1 sm:grid-cols-2'
        )}
      >
        {children}
      </div>
    </section>
  )
}

function FeaturedCard({ agent }: { agent: FeaturedAgent }) {
  const Icon = agent.Icon
  return (
    <div className="group relative flex items-start gap-4 rounded-2xl bg-muted/40 hover:bg-muted/60 p-5 transition-colors cursor-pointer">
      <div
        className={cn(
          'size-16 shrink-0 rounded-full flex items-center justify-center text-white bg-gradient-to-br shadow-sm',
          COLOR_GRADIENT[agent.color] ?? COLOR_GRADIENT.zinc
        )}
      >
        <Icon className="size-7" />
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <div className="font-semibold text-sm">{agent.name}</div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-xs font-medium">{agent.rating}</span>
          <Star className="size-3 fill-foreground text-foreground" />
          <span className="text-xs text-muted-foreground">
            · {agent.uses} utilisations
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-3 mt-1.5 leading-relaxed">
          {agent.description}
        </p>
        <p className="text-[11px] text-muted-foreground/70 mt-2">
          Par {agent.author}
        </p>
      </div>
    </div>
  )
}

function RankedCard({ agent, rank }: { agent: FeaturedAgent; rank: number }) {
  const Icon = agent.Icon
  return (
    <div className="group flex items-start gap-3 py-3 px-1 cursor-pointer">
      <div className="w-6 shrink-0 pt-2 text-lg font-medium text-muted-foreground tabular-nums">
        {rank}
      </div>
      <div
        className={cn(
          'size-12 shrink-0 rounded-full flex items-center justify-center text-white bg-gradient-to-br shadow-sm',
          COLOR_GRADIENT[agent.color] ?? COLOR_GRADIENT.zinc
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-sm truncate group-hover:underline">
            {agent.name}
          </div>
          <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
            <Star className="size-3 fill-foreground/60 text-foreground/60" />
            {agent.rating}
          </div>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
          {agent.description}
        </p>
        <p className="text-[11px] text-muted-foreground/70 mt-1">
          Par {agent.author} · {agent.uses} utilisations
        </p>
      </div>
    </div>
  )
}

function MyAgentCard({ agent }: { agent: UserAgent }) {
  const Icon = ICONS[agent.icon] ?? Sparkles
  return (
    <Link
      href={`/agent/${agent.id}`}
      className="group flex items-start gap-4 rounded-2xl bg-muted/40 hover:bg-muted/60 p-5 transition-colors"
    >
      <div
        className={cn(
          'size-16 shrink-0 rounded-full flex items-center justify-center text-white bg-gradient-to-br shadow-sm',
          COLOR_GRADIENT[agent.color] ?? COLOR_GRADIENT.zinc
        )}
      >
        <Icon className="size-7" />
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <div className="font-semibold text-sm truncate">{agent.name}</div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
          {agent.description || 'Aucune description'}
        </p>
        <p className="text-[11px] text-muted-foreground/70 mt-2">Par toi</p>
      </div>
    </Link>
  )
}
