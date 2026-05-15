'use client'

import { useMemo, useState } from 'react'

import { Activity, ArrowRight, Search, Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Input } from '@/components/ui/input'

import { TemplateCard } from './template-card'
import {
  CATEGORIES,
  HEARTBEAT_TEMPLATES,
  type HeartbeatTemplate,
  type TemplateCategory
} from './template-data'

interface SectionProps {
  title: string
  subtitle?: string
  templates: HeartbeatTemplate[]
  onSeeAll?: () => void
}

function Section({ title, subtitle, templates, onSeeAll }: SectionProps) {
  if (templates.length === 0) return null
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            Voir tout <ArrowRight className="size-3.5" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {templates.map(t => (
          <TemplateCard key={t.id} template={t} />
        ))}
      </div>
    </section>
  )
}

interface PromoBannerProps {
  title: string
  description: string
  cta: string
  gradient: string
  onClick?: () => void
}

function PromoBanner({
  title,
  description,
  cta,
  gradient,
  onClick
}: PromoBannerProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-8 md:p-10',
        'bg-gradient-to-br',
        gradient
      )}
    >
      {/* Decorative SVG geometry */}
      <svg
        className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:block opacity-50 pointer-events-none"
        width="320"
        height="200"
        viewBox="0 0 320 200"
        fill="none"
      >
        <ellipse cx="100" cy="100" rx="80" ry="80" stroke="currentColor" strokeWidth="0.6" />
        <ellipse cx="100" cy="100" rx="80" ry="40" stroke="currentColor" strokeWidth="0.6" />
        <ellipse cx="100" cy="100" rx="40" ry="80" stroke="currentColor" strokeWidth="0.6" />
        <ellipse cx="220" cy="100" rx="80" ry="80" stroke="currentColor" strokeWidth="0.6" />
        <ellipse cx="220" cy="100" rx="80" ry="40" stroke="currentColor" strokeWidth="0.6" />
        <ellipse cx="220" cy="100" rx="40" ry="80" stroke="currentColor" strokeWidth="0.6" />
      </svg>

      <div className="relative max-w-md">
        <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          {description}
        </p>
        <button
          onClick={onClick}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {cta}
        </button>
      </div>
    </div>
  )
}

export function HeartbeatStore() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] =
    useState<TemplateCategory>('all')

  const q = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    return HEARTBEAT_TEMPLATES.filter(t => {
      if (q) {
        const hay = `${t.name} ${t.description} ${t.slug}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (activeCategory !== 'all' && t.category !== activeCategory) {
        return false
      }
      return true
    })
  }, [q, activeCategory])

  // Sub-groups for the rich layout (only when no filter active)
  const featured = HEARTBEAT_TEMPLATES.filter(t => t.featured)
  const networking = HEARTBEAT_TEMPLATES.filter(
    t => t.category === 'networking'
  )
  const recruitment = HEARTBEAT_TEMPLATES.filter(
    t => t.category === 'recruitment'
  )
  const sales = HEARTBEAT_TEMPLATES.filter(t => t.category === 'sales')
  const fundraising = HEARTBEAT_TEMPLATES.filter(
    t => t.category === 'fundraising'
  )
  const content = HEARTBEAT_TEMPLATES.filter(t => t.category === 'content')
  const market = HEARTBEAT_TEMPLATES.filter(t => t.category === 'market')

  const isFiltering = q !== '' || activeCategory !== 'all'

  return (
    <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-auto">
      {/* Hero / header */}
      <div className="px-8 pt-8 pb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3 mb-2">
          <Activity className="size-7 text-emerald-500 animate-pulse" />
          Heartbeat Store
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          Active des veilles automatiques préconçues. Tes recherches qui
          tournent en arrière-plan et te notifient des nouveaux résultats.
        </p>

        {/* Search */}
        <div className="relative max-w-xl mt-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un Heartbeat…"
            className="pl-10 h-11 rounded-full"
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'px-3 py-1.5 rounded-full border text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Body */}
      <div className="px-8 pb-12 space-y-10">
        {isFiltering ? (
          <Section
            title={
              activeCategory === 'all'
                ? `Résultats (${filtered.length})`
                : `${CATEGORIES.find(c => c.id === activeCategory)?.label} (${filtered.length})`
            }
            templates={filtered}
          />
        ) : (
          <>
            <Section
              title="Tendances"
              subtitle="Les templates les plus utilisés cette semaine"
              templates={featured}
              onSeeAll={() => setActiveCategory('all')}
            />

            <PromoBanner
              title="Active ton réseau, automatiquement"
              description="Nos meilleurs templates pour faire vivre ton networking sans y penser : changements de poste, intros warm, contacts dormants."
              cta="Explorer Networking"
              gradient="from-blue-500/10 via-violet-500/5 to-transparent text-blue-500/70"
              onClick={() => setActiveCategory('networking')}
            />

            <Section
              title="Networking"
              subtitle="Garde tes relations chaudes sans effort"
              templates={networking}
              onSeeAll={() => setActiveCategory('networking')}
            />

            <Section
              title="Recrutement"
              subtitle="Pour les job seekers actifs et les recruteurs"
              templates={recruitment}
              onSeeAll={() => setActiveCategory('recruitment')}
            />

            <PromoBanner
              title="Vendre intelligemment, sans spam"
              description="Templates pour identifier les bons prospects au bon moment, détecter les signaux d'achat et relancer ton pipeline."
              cta="Explorer Sales"
              gradient="from-pink-500/10 via-rose-500/5 to-transparent text-pink-500/70"
              onClick={() => setActiveCategory('sales')}
            />

            <Section
              title="Sales / BD"
              subtitle="Prospection et signaux d'achat ciblés"
              templates={sales}
              onSeeAll={() => setActiveCategory('sales')}
            />

            <Section
              title="Levée de fonds"
              subtitle="Pour les founders en mode lever ou se positionner"
              templates={fundraising}
              onSeeAll={() => setActiveCategory('fundraising')}
            />

            <PromoBanner
              title="Découvre les signaux faibles"
              description="Repère les tendances émergentes, surveille tes concurrents et garde une longueur d'avance sur ton marché."
              cta="Explorer Veille marché"
              gradient="from-emerald-500/10 via-teal-500/5 to-transparent text-emerald-500/70"
              onClick={() => setActiveCategory('market')}
            />

            <Section
              title="Veille marché"
              subtitle="News sectorielles, concurrence, tendances"
              templates={market}
              onSeeAll={() => setActiveCategory('market')}
            />

            <Section
              title="Contenu / Personal branding"
              subtitle="Idées de posts, engagement, viralité"
              templates={content}
              onSeeAll={() => setActiveCategory('content')}
            />
          </>
        )}

        {filtered.length === 0 && isFiltering && (
          <div className="rounded-xl border border-dashed py-16 text-center">
            <Sparkles className="size-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Aucun template ne correspond à ta recherche.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
