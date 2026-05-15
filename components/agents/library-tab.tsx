'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { ArrowRight, Flame } from 'lucide-react'

import promptsData from '@/lib/community/prompts-data.json'
import {
  CATEGORIES as PROMPT_CATEGORIES,
  CATEGORY_ICONS,
  LEVEL_COLORS,
  type Prompt
} from '@/lib/community/types'
import { cn } from '@/lib/utils'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const allPrompts = promptsData as Prompt[]

interface LibraryTabProps {
  search?: string
}

/**
 * Bibliothèque de prompts — l'ancienne page /templates intégrée comme onglet
 * dans /agents. Une carte = un prompt one-shot qui lance une recherche.
 * Pas de DB : tout vient de lib/community/prompts-data.json.
 */
export function LibraryTab({ search = '' }: LibraryTabProps) {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [heartbeatOnly, setHeartbeatOnly] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return allPrompts.filter(p => {
      if (activeCategory !== 'all' && p.category !== activeCategory) return false
      if (heartbeatOnly && !p.heartbeat) return false
      if (q) {
        return (
          p.title.toLowerCase().includes(q) ||
          p.prompt.toLowerCase().includes(q) ||
          p.tags?.some(t => t.toLowerCase().includes(q)) ||
          p.persona.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [search, activeCategory, heartbeatOnly])

  const handleUse = (prompt: Prompt) => {
    router.push(`/search?q=${encodeURIComponent(prompt.prompt)}`)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterPill
          active={activeCategory === 'all'}
          onClick={() => setActiveCategory('all')}
        >
          Toutes catégories
        </FilterPill>
        {PROMPT_CATEGORIES.map(cat => (
          <FilterPill
            key={cat}
            active={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
          >
            <span className="mr-1">{CATEGORY_ICONS[cat]}</span>
            {cat}
          </FilterPill>
        ))}
        <FilterPill
          active={heartbeatOnly}
          onClick={() => setHeartbeatOnly(v => !v)}
          accent
        >
          <Flame className="size-3 mr-1" />
          Heartbeat
        </FilterPill>
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} prompt{filtered.length > 1 ? 's' : ''} disponible
        {filtered.length > 1 ? 's' : ''}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          Aucun prompt ne correspond.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(prompt => (
            <PromptCard key={prompt.id} prompt={prompt} onUse={handleUse} />
          ))}
        </div>
      )}
    </div>
  )
}

function FilterPill({
  children,
  active,
  onClick,
  accent
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  accent?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
        active
          ? accent
            ? 'bg-orange-500/15 border-orange-500/30 text-orange-600 dark:text-orange-400'
            : 'bg-foreground text-background border-foreground'
          : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
      )}
    >
      {children}
    </button>
  )
}

function PromptCard({
  prompt,
  onUse
}: {
  prompt: Prompt
  onUse: (p: Prompt) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onUse(prompt)}
      className="group rounded-lg border bg-card p-4 text-left transition-colors hover:border-foreground/30 hover:bg-muted/40"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xl shrink-0">
          {CATEGORY_ICONS[prompt.category] ?? '✨'}
        </span>
        <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </div>
      <h3 className="text-sm font-semibold leading-snug mb-1.5 line-clamp-2">
        {prompt.title}
      </h3>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
        {prompt.prompt}
      </p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge
          variant="outline"
          className={cn('text-[10px] px-1.5 py-0', LEVEL_COLORS[prompt.level])}
        >
          {prompt.level}
        </Badge>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {prompt.persona}
        </Badge>
        {prompt.heartbeat && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 border-orange-500/30 text-orange-600 dark:text-orange-400"
          >
            <Flame className="size-2.5 mr-0.5" />
            Heartbeat
          </Badge>
        )}
      </div>
    </button>
  )
}
