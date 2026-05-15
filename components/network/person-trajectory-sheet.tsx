'use client'

import {
  Briefcase,
  Calendar,
  Clock,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin} from 'lucide-react'

import { COMPANIES, type Profile } from '@/lib/network/mock-data'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'

interface PersonTrajectorySheetProps {
  profile: Profile | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Event =
  | {
      kind: 'experience'
      startYear: number
      endYear: number | null
      title: string
      org: string
      industry?: string
    }
  | {
      kind: 'education'
      startYear: number
      endYear: number
      title: string
      org: string
    }

export function PersonTrajectorySheet({
  profile,
  open,
  onOpenChange
}: PersonTrajectorySheetProps) {
  if (!profile) return null

  const events: Event[] = [
    ...profile.experiences.map(
      (e): Event => ({
        kind: 'experience',
        startYear: e.startYear,
        endYear: e.endYear,
        title: e.title,
        org: e.company,
        industry: COMPANIES.find(c => c.id === e.companyId)?.industry
      })
    ),
    ...profile.educations.map(
      (e): Event => ({
        kind: 'education',
        startYear: e.startYear,
        endYear: e.endYear,
        title: 'Diplômé·e',
        org: e.school
      })
    )
  ].sort((a, b) => {
    const aEnd = a.endYear ?? 9999
    const bEnd = b.endYear ?? 9999
    if (aEnd !== bEnd) return bEnd - aEnd
    return b.startYear - a.startYear
  })

  const totalExpYears = profile.experiences.reduce((sum, e) => {
    const end = e.endYear ?? new Date().getFullYear()
    return sum + Math.max(0, end - e.startYear)
  }, 0)

  const companies = new Set(profile.experiences.map(e => e.companyId)).size
  const schools = new Set(profile.educations.map(e => e.schoolId)).size

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto p-0">
        <div
          className="p-6 pb-5 border-b border-border/60"
          style={{
            background: `linear-gradient(135deg, hsl(${profile.hue},20%,30%)/8, transparent)`
          }}
        >
          <SheetHeader className="p-0 text-left">
            <div className="flex items-start gap-4">
              <div
                className="size-14 rounded-full flex items-center justify-center text-white font-semibold text-lg shrink-0 shadow-sm"
                style={{
                  background: `linear-gradient(135deg, hsl(${profile.hue},20%,30%), hsl(${(profile.hue + 40) % 360},20%,20%))`
                }}
              >
                {profile.initials}
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-xl">{profile.name}</SheetTitle>
                <SheetDescription className="mt-1 text-sm leading-snug">
                  {profile.headline}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="grid grid-cols-3 gap-2 mt-5">
            <StatChip
              Icon={Clock}
              value={`${totalExpYears} ans`}
              label="expérience"
            />
            <StatChip
              Icon={Briefcase}
              value={String(companies)}
              label={companies > 1 ? 'entreprises' : 'entreprise'}
            />
            <StatChip
              Icon={GraduationCap}
              value={String(schools)}
              label={schools > 1 ? 'écoles' : 'école'}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                const q = `Aide-moi à reprendre contact avec ${profile.name} (${profile.headline}). Propose un message d'approche personnalisé.`
                window.location.href = `/search?q=${encodeURIComponent(q)}`
              }}
            >
              <Mail className="size-3.5" />
              Reprendre contact
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                const url = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(profile.name)}`
                window.open(url, '_blank', 'noopener,noreferrer')
              }}
            >
              <ExternalLink className="size-3.5" />
              LinkedIn
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-4 flex items-center gap-1.5">
            <Calendar className="size-3" />
            Trajectoire
          </div>

          <ol className="relative">
            <span
              className="absolute left-[15px] top-1 bottom-1 w-px bg-border"
              aria-hidden
            />
            {events.map((event, idx) => (
              <TimelineItem key={idx} event={event} isLast={idx === events.length - 1} />
            ))}
          </ol>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function StatChip({
  Icon,
  value,
  label
}: {
  Icon: typeof Clock
  value: string
  label: string
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/50 p-2.5">
      <div className="flex items-center gap-1 text-muted-foreground mb-1">
        <Icon className="size-3" />
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-sm font-semibold tabular-nums">{value}</div>
    </div>
  )
}

function TimelineItem({ event, isLast }: { event: Event; isLast: boolean }) {
  const Icon = event.kind === 'experience' ? Briefcase : GraduationCap
  const endLabel = event.endYear ?? 'aujourd’hui'
  const duration =
    (event.endYear ?? new Date().getFullYear()) - event.startYear
  const durationLabel =
    duration <= 0 ? 'moins d’un an' : `${duration} an${duration > 1 ? 's' : ''}`

  return (
    <li className={cn('relative pl-10 pb-5', isLast && 'pb-0')}>
      <span
        className={cn(
          'absolute left-0 top-0 size-8 rounded-full flex items-center justify-center shrink-0',
          event.kind === 'experience'
            ? 'bg-foreground/10 text-foreground'
            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        )}
        aria-hidden
      >
        <Icon className="size-4" />
      </span>

      <div className="flex items-baseline gap-2 text-xs text-muted-foreground tabular-nums">
        <span className="font-medium text-foreground">{event.startYear}</span>
        <span>→</span>
        <span className="font-medium text-foreground">{endLabel}</span>
        <span className="text-muted-foreground/70">· {durationLabel}</span>
      </div>
      <div className="mt-1 font-medium text-sm">{event.title}</div>
      <div className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
        <MapPin className="size-3 shrink-0" />
        {event.org}
      </div>
    </li>
  )
}
