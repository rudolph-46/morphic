'use client'

import { useRouter } from 'next/navigation'

import {
  Award,
  BarChart3,
  Bell,
  Brain,
  Briefcase,
  Building2,
  Calendar,
  Compass,
  Eye,
  Flame,
  Globe,
  Heart,
  type LucideIcon,
  Mail,
  MessageCircle,
  Newspaper,
  PenLine,
  Radio,
  Rocket,
  Search,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  Zap
} from 'lucide-react'

import { cn } from '@/lib/utils'

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
  Search,
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

interface TemplateCardProps {
  template: HeartbeatTemplate
}

export function TemplateCard({ template }: TemplateCardProps) {
  const router = useRouter()
  const {
    id,
    name,
    slug,
    description,
    icon,
    gradient,
    author,
    rating,
    reviewCount,
    users
  } = template
  const Icon = ICON_MAP[icon] ?? Users

  return (
    <button
      type="button"
      onClick={() => router.push(`/heartbeat/templates/${id}`)}
      className={cn(
        'group flex flex-col text-left rounded-xl border bg-card p-5 transition-all min-h-[200px]',
        'hover:border-foreground/30 hover:shadow-md hover:-translate-y-0.5'
      )}
    >
      {/* Header : icon + title + slug */}
      <div className="flex items-start gap-3 mb-3">
        <span
          className={cn(
            'shrink-0 size-11 rounded-xl flex items-center justify-center bg-gradient-to-br text-white',
            gradient
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-tight truncate">
            {name}
          </h3>
          <p className="text-xs font-mono text-muted-foreground truncate mt-0.5">
            {slug}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1 mb-4">
        {description}
      </p>

      {/* Footer : author + stats */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/50">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
          <span
            className={cn(
              'size-3 rounded-full bg-gradient-to-br shrink-0',
              gradient
            )}
          />
          <span className="truncate font-medium text-foreground/80">
            {author}
          </span>
        </span>

        <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star className="size-3 fill-current" />
            <span className="font-medium text-foreground">{rating}</span>
            <span>({fmt.k(reviewCount)})</span>
          </span>
          <span className="text-muted-foreground/40">|</span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3" />
            {fmt.k(users)}
          </span>
        </div>
      </div>
    </button>
  )
}
