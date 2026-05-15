'use client'

import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import {
  Building2,
  ChevronRight,
  GraduationCap,
  Info,
  Network,
  Pause,
  Play,
  Search as SearchIcon,
  Sparkles,
  X
} from 'lucide-react'
import { toast } from 'sonner'

import {
  COMPANIES,
  INDUSTRY_COLORS,
  personColor,
  type Profile,
  PROFILES,
  SCHOOL_COLOR,
  SCHOOLS,
  YEAR_MAX,
  YEAR_MIN} from '@/lib/network/mock-data'
import { cn } from '@/lib/utils'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

import { PersonTrajectorySheet } from './person-trajectory-sheet'

// ─── Types ────────────────────────────────────────────────────────────────

type RootMode = 'companies' | 'schools'
type EntityType = 'company' | 'school'

interface PersonInBucket {
  profile: Profile
  role: string
  startYear: number
  endYear: number | null
}

interface Bucket {
  id: string
  name: string
  type: EntityType | 'person'
  industry?: string
  color: string
  persons: PersonInBucket[]
  count: number
  profile?: Profile
}

type View =
  | { level: 1 }
  | {
      level: 2
      parentEntity: {
        type: EntityType
        name: string
        personCount: number
        year: number | null
      }
      parentPersonIds: Set<string>
    }
  | {
      level: 3
      parentEntity: { type: EntityType; name: string; personCount: number }
      parentPersonIds: Set<string>
      grandparentEntity: {
        type: EntityType
        name: string
        personCount: number
        year: number | null
      }
      grandparentPersonIds: Set<string>
    }

interface Bubble {
  id: string
  name: string
  type: 'company' | 'school' | 'person'
  industry?: string
  color: string
  persons: PersonInBucket[]
  count: number
  profile?: Profile
  x: number
  y: number
  vx: number
  vy: number
  r: number
  targetR: number
  opacity: number
  _fading?: boolean
}

// ─── Snapshot logic ───────────────────────────────────────────────────────

function snapshot(view: View, mode: RootMode, year: number): Bucket[] {
  if (view.level === 1) return level1(mode, year)
  if (view.level === 2) return level2(view)
  return level3(view)
}

function level1(mode: RootMode, year: number): Bucket[] {
  const buckets = new Map<string, Bucket>()
  if (mode === 'companies') {
    for (const p of PROFILES) {
      for (const exp of p.experiences) {
        const endY = exp.endYear ?? 2025
        if (!(exp.startYear <= year && endY >= year)) continue
        if (!buckets.has(exp.companyId)) {
          const c = COMPANIES.find(x => x.id === exp.companyId)!
          buckets.set(exp.companyId, {
            id: c.id,
            name: c.name,
            type: 'company',
            industry: c.industry,
            color: INDUSTRY_COLORS[c.industry] ?? '#9ca3af',
            persons: [],
            count: 0
          })
        }
        buckets.get(exp.companyId)!.persons.push({
          profile: p,
          role: exp.title,
          startYear: exp.startYear,
          endYear: exp.endYear
        })
      }
    }
  } else {
    for (const p of PROFILES) {
      for (const edu of p.educations) {
        if (!buckets.has(edu.schoolId)) {
          const s = SCHOOLS.find(x => x.id === edu.schoolId)!
          buckets.set(edu.schoolId, {
            id: s.id,
            name: s.name,
            type: 'school',
            color: SCHOOL_COLOR,
            persons: [],
            count: 0
          })
        }
        buckets.get(edu.schoolId)!.persons.push({
          profile: p,
          role: 'Diplômé·e',
          startYear: edu.startYear,
          endYear: edu.endYear
        })
      }
    }
  }
  return finalize(buckets)
}

function level2(view: Extract<View, { level: 2 }>): Bucket[] {
  const personIds = view.parentPersonIds
  const buckets = new Map<string, Bucket>()
  const targetDim: EntityType =
    view.parentEntity.type === 'company' ? 'school' : 'company'
  for (const p of PROFILES) {
    if (!personIds.has(p.id)) continue
    if (targetDim === 'school') {
      for (const edu of p.educations) {
        if (!buckets.has(edu.schoolId)) {
          const s = SCHOOLS.find(x => x.id === edu.schoolId)!
          buckets.set(edu.schoolId, {
            id: s.id,
            name: s.name,
            type: 'school',
            color: SCHOOL_COLOR,
            persons: [],
            count: 0
          })
        }
        buckets.get(edu.schoolId)!.persons.push({
          profile: p,
          role: 'Diplômé·e',
          startYear: edu.startYear,
          endYear: edu.endYear
        })
      }
    } else {
      for (const exp of p.experiences) {
        if (!buckets.has(exp.companyId)) {
          const c = COMPANIES.find(x => x.id === exp.companyId)!
          buckets.set(exp.companyId, {
            id: c.id,
            name: c.name,
            type: 'company',
            industry: c.industry,
            color: INDUSTRY_COLORS[c.industry] ?? '#9ca3af',
            persons: [],
            count: 0
          })
        }
        buckets.get(exp.companyId)!.persons.push({
          profile: p,
          role: exp.title,
          startYear: exp.startYear,
          endYear: exp.endYear
        })
      }
    }
  }
  return finalize(buckets)
}

function level3(view: Extract<View, { level: 3 }>): Bucket[] {
  const personIds = view.parentPersonIds
  return PROFILES.filter(p => personIds.has(p.id))
    .map(
      (p): Bucket => ({
        id: p.id,
        name: p.name,
        type: 'person',
        color: personColor(p),
        profile: p,
        persons: [{ profile: p, role: '', startYear: 0, endYear: null }],
        count: 1
      })
    )
    .sort((a, b) => a.name.localeCompare(b.name))
}

function finalize(buckets: Map<string, Bucket>): Bucket[] {
  for (const b of buckets.values()) {
    const seen = new Map<string, PersonInBucket>()
    for (const pe of b.persons) {
      if (!seen.has(pe.profile.id)) seen.set(pe.profile.id, pe)
    }
    b.persons = Array.from(seen.values())
  }
  return Array.from(buckets.values())
    .filter(b => b.persons.length > 0)
    .map(b => ({ ...b, count: b.persons.length }))
    .sort((a, b) => b.count - a.count)
}

// ─── Component ────────────────────────────────────────────────────────────

export function NetworkDashboard() {
  const [rootMode, setRootMode] = useState<RootMode>('companies')
  const [view, setView] = useState<View>({ level: 1 })
  const [currentYear, setCurrentYear] = useState(2018)
  const [showAvatars, setShowAvatars] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(500)
  const [hint, setHint] = useState<string | null>(null)
  const [popover, setPopover] = useState<{
    profile: Profile
    left: number
    top: number
  } | null>(null)
  const [trajectoryProfile, setTrajectoryProfile] = useState<Profile | null>(
    null
  )

  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bubblesRef = useRef<Bubble[]>([])
  const hoveredRef = useRef<Bubble | null>(null)
  const stageSizeRef = useRef({ w: 0, h: 0 })
  const themeColorsRef = useRef({ bg: '#ffffff', fg: '#0a0a0a' })
  const showAvatarsRef = useRef(showAvatars)
  const viewRef = useRef(view)
  const rootModeRef = useRef(rootMode)
  const currentYearRef = useRef(currentYear)

  useEffect(() => {
    showAvatarsRef.current = showAvatars
  }, [showAvatars])
  useEffect(() => {
    viewRef.current = view
  }, [view])
  useEffect(() => {
    rootModeRef.current = rootMode
  }, [rootMode])
  useEffect(() => {
    currentYearRef.current = currentYear
  }, [currentYear])

  const snap = useMemo(
    () => snapshot(view, rootMode, currentYear),
    [view, rootMode, currentYear]
  )

  const timelineActive = view.level === 1 && rootMode === 'companies'

  // ─── Layout setData ─────────────────────────────────────────────────────

  const applySnap = useCallback((snap: Bucket[], replaceMode: boolean) => {
    const { w, h } = stageSizeRef.current
    if (!w || !h) return
    const cx = w / 2,
      cy = h / 2
    const prevMap = new Map<string, Bubble>()
    for (const b of bubblesRef.current) prevMap.set(b.id, b)

    const isPersonMode = snap.length > 0 && snap[0].type === 'person'
    const calc: (count: number) => number = isPersonMode
      ? () => Math.min(45, Math.max(22, 280 / Math.sqrt(snap.length)))
      : (() => {
          const minR = 14,
            maxR = 95
          const maxCount = Math.max(...snap.map(s => s.count), 1)
          return (c: number) =>
            minR + (maxR - minR) * Math.sqrt(c / maxCount)
        })()

    const next: Bubble[] = []
    if (replaceMode) {
      snap.forEach((s, i) => {
        const angle = (i / Math.max(1, snap.length)) * Math.PI * 2
        const dist = 60 + Math.random() * 80
        next.push({
          id: s.id,
          name: s.name,
          type: s.type,
          industry: s.industry,
          color: s.color,
          persons: s.persons,
          count: s.count,
          profile: s.profile,
          x: cx + Math.cos(angle) * dist,
          y: cy + Math.sin(angle) * dist,
          vx: 0,
          vy: 0,
          r: 1,
          targetR: calc(s.count),
          opacity: 0
        })
      })
    } else {
      for (const s of snap) {
        const prev = prevMap.get(s.id)
        if (prev) {
          next.push({
            ...prev,
            count: s.count,
            persons: s.persons,
            name: s.name,
            color: s.color,
            type: s.type,
            industry: s.industry,
            profile: s.profile,
            targetR: calc(s.count)
          })
        } else {
          const angle = Math.random() * Math.PI * 2
          const dist = 50 + Math.random() * 150
          next.push({
            id: s.id,
            name: s.name,
            type: s.type,
            industry: s.industry,
            color: s.color,
            persons: s.persons,
            count: s.count,
            profile: s.profile,
            x: cx + Math.cos(angle) * dist,
            y: cy + Math.sin(angle) * dist,
            vx: 0,
            vy: 0,
            r: 1,
            targetR: calc(s.count),
            opacity: 0
          })
        }
      }
      const newIds = new Set(next.map(b => b.id))
      for (const p of bubblesRef.current) {
        if (!newIds.has(p.id) && p.r > 0.5) {
          next.push({ ...p, targetR: 0, count: 0, persons: [], _fading: true })
        }
      }
    }
    bubblesRef.current = next
  }, [])

  // ─── Animation loop ─────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current
    const stage = stageRef.current
    if (!canvas || !stage) return
    const ctx = canvas.getContext('2d')!
    let raf = 0

    const readTheme = () => {
      const style = getComputedStyle(stage)
      const bg = style.getPropertyValue('background-color')
      const fg = style.getPropertyValue('color')
      themeColorsRef.current = {
        bg: bg.trim() || '#ffffff',
        fg: fg.trim() || '#0a0a0a'
      }
    }
    const resize = () => {
      const rect = stage.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      stageSizeRef.current = { w: rect.width, h: rect.height }
      readTheme()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(stage)

    const step = () => {
      const { w, h } = stageSizeRef.current
      const cx = w / 2,
        cy = h / 2
      const damping = 0.85,
        centerStrength = 0.012
      const bubbles = bubblesRef.current

      for (const b of bubbles) {
        b.r += (b.targetR - b.r) * 0.18
        const target = b._fading ? 0 : 1
        b.opacity = b.opacity + (target - b.opacity) * 0.15
      }
      for (const b of bubbles) {
        if (b.r < 0.5) continue
        b.vx += (cx - b.x) * centerStrength
        b.vy += (cy - b.y) * centerStrength
      }
      for (let i = 0; i < bubbles.length; i++) {
        const a = bubbles[i]
        if (a.r < 0.5) continue
        for (let j = i + 1; j < bubbles.length; j++) {
          const b = bubbles[j]
          if (b.r < 0.5) continue
          const dx = b.x - a.x,
            dy = b.y - a.y
          const d = Math.sqrt(dx * dx + dy * dy) || 0.01
          const minDist = a.r + b.r + 2
          if (d < minDist) {
            const overlap = (minDist - d) / 2
            const nx = dx / d,
              ny = dy / d
            a.x -= nx * overlap
            a.y -= ny * overlap
            b.x += nx * overlap
            b.y += ny * overlap
            a.vx -= nx * overlap * 0.3
            a.vy -= ny * overlap * 0.3
            b.vx += nx * overlap * 0.3
            b.vy += ny * overlap * 0.3
          }
        }
      }
      for (const b of bubbles) {
        b.vx *= damping
        b.vy *= damping
        b.x += b.vx
        b.y += b.vy
      }
      bubblesRef.current = bubbles.filter(b => !(b._fading && b.r < 0.5))

      draw(
        ctx,
        bubblesRef.current,
        hoveredRef.current,
        showAvatarsRef.current,
        themeColorsRef.current
      )
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  // ─── React to snap changes ──────────────────────────────────────────────

  const prevKeyRef = useRef<string>('')
  useEffect(() => {
    const key = `${view.level}-${rootMode}`
    const isLevelOrModeChange =
      prevKeyRef.current === '' || prevKeyRef.current !== key
    applySnap(snap, isLevelOrModeChange)
    prevKeyRef.current = key
    setPopover(null)
  }, [snap, view, rootMode, applySnap])

  // ─── Hints ──────────────────────────────────────────────────────────────

  useEffect(() => {
    let txt: string | null = null
    if (view.level === 1) {
      txt =
        rootMode === 'companies'
          ? '💡 Clique sur une entreprise pour voir les écoles de ses membres'
          : '💡 Clique sur une école pour voir les entreprises de ses diplômés'
    } else if (view.level === 2) {
      txt = '💡 Clique sur une bulle pour voir les personnes qui s\'y trouvent'
    } else if (view.level === 3) {
      txt = '💡 Clique sur une personne pour voir les actions disponibles'
    }
    setHint(txt)
    const t = setTimeout(() => setHint(null), 4000)
    return () => clearTimeout(t)
  }, [view, rootMode])

  // ─── Playback ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isPlaying) return
    if (!timelineActive) {
      setIsPlaying(false)
      return
    }
    if (currentYear >= YEAR_MAX) {
      setCurrentYear(YEAR_MIN)
      return
    }
    const id = setInterval(() => {
      setCurrentYear(y => {
        if (y >= YEAR_MAX) {
          setIsPlaying(false)
          return y
        }
        return y + 1
      })
    }, speed)
    return () => clearInterval(id)
  }, [isPlaying, speed, timelineActive, currentYear])

  // ─── Mouse interaction on canvas ────────────────────────────────────────

  const handleCanvasMove = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    let found: Bubble | null = null
    for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
      const b = bubblesRef.current[i]
      if (b.r < 5) continue
      if (Math.hypot(x - b.x, y - b.y) <= b.r) {
        found = b
        break
      }
    }
    hoveredRef.current = found
    if (canvasRef.current)
      canvasRef.current.style.cursor = found ? 'pointer' : 'default'
  }

  const handleCanvasClick = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    let found: Bubble | null = null
    for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
      const b = bubblesRef.current[i]
      if (b.r < 5) continue
      if (Math.hypot(x - b.x, y - b.y) <= b.r) {
        found = b
        break
      }
    }
    if (!found) {
      setPopover(null)
      return
    }

    const current = viewRef.current
    if (current.level === 1) {
      const personIds = new Set(found.persons.map(p => p.profile.id))
      setView({
        level: 2,
        parentEntity: {
          type: found.type as EntityType,
          name: found.name,
          personCount: personIds.size,
          year:
            rootModeRef.current === 'companies' ? currentYearRef.current : null
        },
        parentPersonIds: personIds
      })
    } else if (current.level === 2) {
      const personIds = new Set(found.persons.map(p => p.profile.id))
      setView({
        level: 3,
        parentEntity: {
          type: found.type as EntityType,
          name: found.name,
          personCount: personIds.size
        },
        parentPersonIds: personIds,
        grandparentEntity: current.parentEntity,
        grandparentPersonIds: current.parentPersonIds
      })
    } else {
      const p = found.profile
      if (!p) return
      const stageRect = stageRef.current?.getBoundingClientRect()
      const popW = 260
      let left = found.x + found.r + 12
      if (stageRect && left + popW > stageRect.width - 12) {
        left = found.x - found.r - popW - 12
      }
      let top = found.y - 60
      if (top < 60) top = 60
      setPopover({ profile: p, left, top })
    }
  }

  // ─── Keyboard ────────────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (popover) {
        setPopover(null)
        return
      }
      const v = viewRef.current
      if (v.level === 3) {
        setView({
          level: 2,
          parentEntity: v.grandparentEntity,
          parentPersonIds: v.grandparentPersonIds
        })
      } else if (v.level === 2) {
        setView({ level: 1 })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [popover])

  // ─── Derived UI ─────────────────────────────────────────────────────────

  const totalPeople = useMemo(() => {
    const ids = new Set<string>()
    for (const b of snap) for (const p of b.persons) ids.add(p.profile.id)
    return ids.size
  }, [snap])

  const statsText = useMemo(() => {
    if (view.level === 3) {
      return `${snap.length} personne${snap.length > 1 ? 's' : ''}`
    }
    const dimLabel =
      (view.level === 1 && rootMode === 'schools') ||
      (view.level === 2 && view.parentEntity.type === 'company')
        ? 'école'
        : 'entreprise'
    const dimPlural = snap.length > 1 ? 's' : ''
    const yearStr = timelineActive ? ` en ${currentYear}` : ''
    return `${snap.length} ${dimLabel}${dimPlural} · ${totalPeople} personne${
      totalPeople > 1 ? 's' : ''
    }${yearStr}`
  }, [view, rootMode, snap, totalPeople, timelineActive, currentYear])

  const emptyText = useMemo(() => {
    if (snap.length > 0) return null
    if (view.level === 1 && rootMode === 'companies')
      return `Personne dans ton réseau n'était actif en ${currentYear}.`
    if (view.level === 2)
      return view.parentEntity.type === 'company'
        ? 'Aucune école renseignée pour ces personnes.'
        : 'Aucune entreprise renseignée pour ces personnes.'
    return 'Aucune donnée à afficher.'
  }, [snap, view, rootMode, currentYear])

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background text-foreground pt-14">
      {/* Hero header — style consistent with /board, /templates */}
      <header className="border-b border-border/60 px-6 py-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Network className="size-5 text-emerald-500" />
            <h1 className="text-2xl font-semibold tracking-tight">
              Ton réseau
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Explore tes connexions par entreprise ou par école, et voyage dans
            le temps pour voir comment ton réseau s'est construit.
          </p>
          {view.level > 1 && (
            <div className="mt-3">
              <Breadcrumb
                view={view}
                rootMode={rootMode}
                currentYear={currentYear}
                onLevel1={() => setView({ level: 1 })}
                onLevel2={() => {
                  if (view.level === 3) {
                    setView({
                      level: 2,
                      parentEntity: view.grandparentEntity,
                      parentPersonIds: view.grandparentPersonIds
                    })
                  }
                }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {timelineActive && (
            <>
              <button
                onClick={() => setIsPlaying(p => !p)}
                className="size-9 rounded-md border border-border/60 bg-muted/40 hover:bg-muted flex items-center justify-center text-foreground transition-colors active:scale-95"
                aria-label={isPlaying ? 'Pause' : 'Lecture'}
              >
                {isPlaying ? (
                  <Pause className="size-3.5 fill-current" />
                ) : (
                  <Play className="size-3.5 fill-current" />
                )}
              </button>
              <Select
                value={String(currentYear)}
                onValueChange={v => setCurrentYear(Number(v))}
              >
                <SelectTrigger className="h-9 w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(
                    { length: YEAR_MAX - YEAR_MIN + 1 },
                    (_, i) => YEAR_MIN + i
                  ).map(y => (
                    <SelectItem key={y} value={String(y)}>
                      Année {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          <div className="inline-flex rounded-lg border border-border/60 bg-muted/30 p-0.5">
            <ToggleBtn
              active={rootMode === 'companies'}
              disabled={view.level !== 1}
              onClick={() => view.level === 1 && setRootMode('companies')}
              Icon={Building2}
            >
              Entreprises
            </ToggleBtn>
            <ToggleBtn
              active={rootMode === 'schools'}
              disabled={view.level !== 1}
              onClick={() => view.level === 1 && setRootMode('schools')}
              Icon={GraduationCap}
            >
              Écoles
            </ToggleBtn>
          </div>
        </div>
      </header>

      {/* Body : left explanatory panel + canvas stage */}
      <div className="flex-1 min-h-0 flex">
        <aside className="hidden md:flex w-72 shrink-0 flex-col border-r border-border/60 bg-muted/20 overflow-y-auto">
          <ExplainerPanel
            view={view}
            rootMode={rootMode}
            currentYear={currentYear}
            snapCount={snap.length}
            totalPeople={totalPeople}
            timelineActive={timelineActive}
            showAvatars={showAvatars}
            onToggleAvatars={setShowAvatars}
            onReset={() => setView({ level: 1 })}
            onPickPerson={p => {
              const exp = p.experiences[0]
              if (!exp) return
              const company = COMPANIES.find(c => c.id === exp.companyId)
              if (!company) return
              const ids = new Set([p.id])
              setView({
                level: 3,
                parentEntity: {
                  type: 'company',
                  name: company.name,
                  personCount: 1
                },
                parentPersonIds: ids,
                grandparentEntity: {
                  type: 'company',
                  name: company.name,
                  personCount: 1,
                  year: null
                },
                grandparentPersonIds: ids
              })
            }}
          />
        </aside>

        <div ref={stageRef} className="flex-1 relative overflow-hidden">
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none transition-opacity duration-300 text-foreground/[0.04]"
            style={{
              fontSize: 220,
              fontWeight: 700,
              letterSpacing: '-0.05em',
              opacity: timelineActive ? 1 : 0
            }}
          >
            {currentYear}
          </div>

          {emptyText && (
            <div className="absolute left-1/2 top-[56%] -translate-x-1/2 text-xs text-muted-foreground text-center max-w-md pointer-events-none">
              {emptyText}
            </div>
          )}

          <canvas
            ref={canvasRef}
            className="absolute inset-0"
            onMouseMove={handleCanvasMove}
            onClick={handleCanvasClick}
          />

          {hint && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3.5 py-2 rounded-lg text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 pointer-events-none">
              {hint}
            </div>
          )}

          {popover && (
            <PersonPopover
              data={popover}
              view={view}
              onClose={() => setPopover(null)}
              onShowTrajectory={p => {
                setPopover(null)
                setTrajectoryProfile(p)
              }}
            />
          )}
        </div>
      </div>

      <PersonTrajectorySheet
        profile={trajectoryProfile}
        open={!!trajectoryProfile}
        onOpenChange={o => !o && setTrajectoryProfile(null)}
      />
    </div>
  )
}

// ─── Canvas drawing ─────────────────────────────────────────────────────────

function withAlpha(color: string, alpha: number): string {
  if (color.startsWith('hsl(')) {
    return color.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`)
  }
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`)
  }
  // Assume hex (#rrggbb)
  const hex = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0')
  return color + hex
}

function parseRGB(s: string): [number, number, number] {
  const m = s.match(/(\d+(?:\.\d+)?)/g)
  if (!m || m.length < 3) return [255, 255, 255]
  return [parseFloat(m[0]), parseFloat(m[1]), parseFloat(m[2])]
}

function rgbWithAlpha(s: string, alpha: number): string {
  const [r, g, b] = parseRGB(s)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function draw(
  ctx: CanvasRenderingContext2D,
  bubbles: Bubble[],
  hovered: Bubble | null,
  showAvatars: boolean,
  theme: { bg: string; fg: string }
) {
  const { canvas } = ctx
  const fgLow = rgbWithAlpha(theme.fg, 0.5)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  for (const b of bubbles) {
    if (b.r < 0.5) continue
    ctx.globalAlpha = b.opacity
    if (hovered === b) {
      ctx.fillStyle = withAlpha(b.color, 0.13)
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.r + 8, 0, Math.PI * 2)
      ctx.fill()
    }
    const grad = ctx.createRadialGradient(
      b.x - b.r * 0.3,
      b.y - b.r * 0.3,
      b.r * 0.1,
      b.x,
      b.y,
      b.r
    )
    grad.addColorStop(0, withAlpha(b.color, 0.87))
    grad.addColorStop(1, withAlpha(b.color, 0.53))
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = b.color
    ctx.lineWidth = hovered === b ? 2 : 1
    ctx.stroke()

    if (b.type === 'person' && b.profile) {
      ctx.fillStyle = '#fff'
      ctx.font = `700 ${Math.min(15, b.r / 2.5)}px -apple-system, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(b.profile.initials, b.x, b.y - 2)
      if (b.r > 24) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.font = `500 ${Math.min(10, b.r / 4.5)}px -apple-system, sans-serif`
        ctx.fillText(b.profile.name.split(' ')[0], b.x, b.y + b.r * 0.35)
      }
    } else {
      if (b.r > 22) {
        ctx.fillStyle = fgLow
        ctx.font = `${Math.min(11, b.r / 5)}px -apple-system, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(b.type === 'school' ? '🎓' : '🏢', b.x, b.y - b.r * 0.65)
      }
      if (showAvatars && b.r > 30 && b.persons.length > 0) {
        const maxAvatars = Math.min(b.persons.length, Math.floor(b.r / 8))
        const avatarR = Math.max(5, b.r / 6)
        const ringR = b.r * 0.55
        for (let i = 0; i < maxAvatars; i++) {
          const angle = (i / maxAvatars) * Math.PI * 2 - Math.PI / 2
          const ax = b.x + Math.cos(angle) * ringR
          const ay = b.y + Math.sin(angle) * ringR
          const p = b.persons[i].profile
          ctx.fillStyle = personColor(p)
          ctx.beginPath()
          ctx.arc(ax, ay, avatarR, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = theme.bg
          ctx.lineWidth = 1.5
          ctx.stroke()
          if (avatarR > 8) {
            ctx.fillStyle = '#fff'
            ctx.font = `600 ${avatarR * 0.9}px -apple-system, sans-serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(p.initials, ax, ay)
          }
        }
      }
      if (b.r > 18) {
        ctx.fillStyle = '#fff'
        ctx.font = `600 ${Math.min(13, b.r / 3.5)}px -apple-system, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const labelY = showAvatars && b.r > 30 ? b.y - b.r * 0.15 : b.y - 2
        ctx.fillText(b.name, b.x, labelY)
        ctx.fillStyle = 'rgba(255,255,255,0.85)'
        ctx.font = `500 ${Math.min(11, b.r / 4.5)}px -apple-system, sans-serif`
        ctx.fillText(
          `${b.count} personne${b.count > 1 ? 's' : ''}`,
          b.x,
          labelY + Math.min(14, b.r / 3.2)
        )
      }
    }
    ctx.globalAlpha = 1
  }
}

// ─── Subcomponents ─────────────────────────────────────────────────────────

function Breadcrumb({
  view,
  rootMode,
  currentYear,
  onLevel1,
  onLevel2
}: {
  view: View
  rootMode: RootMode
  currentYear: number
  onLevel1: () => void
  onLevel2: () => void
}) {
  const Icon = rootMode === 'companies' ? Building2 : GraduationCap
  const rootLabel =
    rootMode === 'companies'
      ? `Entreprises${view.level === 1 ? ` (${currentYear})` : ''}`
      : 'Écoles'
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
      <button
        onClick={view.level !== 1 ? onLevel1 : undefined}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-2xl border whitespace-nowrap transition-colors',
          view.level === 1
            ? 'bg-emerald-500 border-emerald-500 text-white cursor-default'
            : 'bg-muted/60 border-border/60 hover:bg-muted cursor-pointer'
        )}
      >
        <Icon className="size-3 opacity-85" />
        {rootLabel}
      </button>
      {view.level === 2 && (
        <>
          <ChevronRight className="size-2.5 text-muted-foreground" />
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-2xl bg-emerald-500 border border-emerald-500 text-white whitespace-nowrap cursor-default">
            {view.parentEntity.type === 'company' ? (
              <Building2 className="size-3 opacity-85" />
            ) : (
              <GraduationCap className="size-3 opacity-85" />
            )}
            {view.parentEntity.name}
            {view.parentEntity.year != null && ` · ${view.parentEntity.year}`}
          </div>
        </>
      )}
      {view.level === 3 && (
        <>
          <ChevronRight className="size-2.5 text-muted-foreground" />
          <button
            onClick={onLevel2}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-2xl border bg-muted/60 border-border/60 hover:bg-muted cursor-pointer whitespace-nowrap transition-colors"
          >
            {view.grandparentEntity.type === 'company' ? (
              <Building2 className="size-3 opacity-85" />
            ) : (
              <GraduationCap className="size-3 opacity-85" />
            )}
            {view.grandparentEntity.name}
            {view.grandparentEntity.year != null &&
              ` · ${view.grandparentEntity.year}`}
          </button>
          <ChevronRight className="size-2.5 text-muted-foreground" />
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-2xl bg-emerald-500 border border-emerald-500 text-white whitespace-nowrap cursor-default">
            {view.parentEntity.type === 'company' ? (
              <Building2 className="size-3 opacity-85" />
            ) : (
              <GraduationCap className="size-3 opacity-85" />
            )}
            {view.parentEntity.name}
          </div>
        </>
      )}
    </div>
  )
}

function ToggleBtn({
  active,
  disabled,
  onClick,
  Icon,
  children
}: {
  active: boolean
  disabled: boolean
  onClick: () => void
  Icon: typeof Building2
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'bg-transparent text-muted-foreground hover:text-foreground',
        disabled && 'opacity-40 cursor-not-allowed hover:text-muted-foreground'
      )}
    >
      <Icon className="size-4" />
      {children}
    </button>
  )
}

const LEGEND_ITEMS: Array<{ color: string; label: string }> = [
  { color: INDUSTRY_COLORS.consulting, label: 'Conseil' },
  { color: INDUSTRY_COLORS.bank, label: 'Banque' },
  { color: INDUSTRY_COLORS.telco, label: 'Télécom' },
  { color: INDUSTRY_COLORS.startup, label: 'Startup' },
  { color: INDUSTRY_COLORS.public, label: 'Public' },
  { color: SCHOOL_COLOR, label: 'École' }
]

function ExplainerPanel({
  view,
  rootMode,
  currentYear,
  snapCount,
  totalPeople,
  timelineActive,
  showAvatars,
  onToggleAvatars,
  onPickPerson,
  onReset
}: {
  view: View
  rootMode: RootMode
  currentYear: number
  snapCount: number
  totalPeople: number
  timelineActive: boolean
  showAvatars: boolean
  onToggleAvatars: (v: boolean) => void
  onPickPerson: (p: Profile) => void
  onReset: () => void
}) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return [] as Profile[]
    return PROFILES.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.headline.toLowerCase().includes(q)
    ).slice(0, 6)
  }, [query])

  let title = ''
  let body: React.ReactNode = null

  if (view.level === 1) {
    if (rootMode === 'companies') {
      title = `Entreprises en ${currentYear}`
      body = (
        <p>
          Chaque bulle est une <strong>entreprise</strong> où au moins une
          personne de ton réseau travaillait en {currentYear}. La{' '}
          <strong>taille</strong> reflète le nombre de personnes. Clique sur
          une bulle pour voir les écoles d'où elles viennent.
        </p>
      )
    } else {
      title = 'Écoles de ton réseau'
      body = (
        <p>
          Chaque bulle est une <strong>école</strong> par laquelle au moins une
          personne de ton réseau est passée. Clique pour voir où ses anciens
          travaillent.
        </p>
      )
    }
  } else if (view.level === 2) {
    const dim = view.parentEntity.type === 'company' ? 'écoles' : 'entreprises'
    title = `Les ${dim} derrière ${view.parentEntity.name}`
    body = (
      <p>
        Tu vois maintenant les <strong>{dim}</strong> des{' '}
        <strong>{view.parentEntity.personCount}</strong> personnes de ton
        réseau passées par <strong>{view.parentEntity.name}</strong>
        {view.parentEntity.year ? ` en ${view.parentEntity.year}` : ''}. Clique
        sur une bulle pour voir qui s'y trouve.
      </p>
    )
  } else {
    title = `${snapCount} personne${snapCount > 1 ? 's' : ''}`
    body = (
      <p>
        Les personnes de ton réseau passées par{' '}
        <strong>{view.parentEntity.name}</strong>. Clique sur quelqu'un pour
        ouvrir les actions disponibles.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-5">
      <div>
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
          <Info className="size-3" />
          Tu regardes
        </div>
        <h2 className="text-base font-semibold leading-snug">{title}</h2>
        <div className="text-sm text-muted-foreground mt-2 leading-relaxed">
          {body}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat
          value={snapCount}
          label={view.level === 3 ? 'personnes' : 'bulles'}
        />
        {view.level !== 3 && <Stat value={totalPeople} label="personnes" />}
      </div>

      {view.level > 1 && (
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 h-9 rounded-md border border-border/60 bg-background/40 hover:bg-muted text-sm transition-colors"
        >
          <X className="size-3.5" />
          Effacer la sélection
        </button>
      )}

      {/* Search */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
          Rechercher
        </div>
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Nom, poste, entreprise…"
            className="w-full h-9 pl-8 pr-3 text-sm rounded-md border border-border/60 bg-background/40 focus:bg-background outline-none focus:border-foreground/30 transition-colors placeholder:text-muted-foreground"
          />
        </div>
        {results.length > 0 && (
          <div className="mt-2 rounded-md border border-border/60 bg-background overflow-hidden">
            {results.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  onPickPerson(p)
                  setQuery('')
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-muted/60 transition-colors"
              >
                <span
                  className="size-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0"
                  style={{
                    background: `linear-gradient(135deg, hsl(${p.hue},25%,35%), hsl(${(p.hue + 40) % 360},25%,25%))`
                  }}
                >
                  {p.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium truncate">
                    {p.name}
                  </span>
                  <span className="block text-[11px] text-muted-foreground truncate">
                    {p.headline}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
        {query && results.length === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Aucune personne trouvée.
          </p>
        )}
      </div>

      {/* Legend — always visible */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
          Légende
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {LEGEND_ITEMS.map(item => (
            <div
              key={item.label}
              className="flex items-center gap-2 text-xs text-foreground"
            >
              <span
                className="size-3 rounded-full shrink-0"
                style={{ background: item.color }}
              />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {timelineActive && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
          <Sparkles className="size-3.5 shrink-0 mt-0.5" />
          <span>
            Change l'année pour voir comment ton réseau évoluait, ou lance la
            lecture.
          </span>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={showAvatars}
          onChange={e => onToggleAvatars(e.target.checked)}
          className="accent-emerald-500"
        />
        Avatars dans les bulles
      </label>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-3">
      <div className="text-2xl font-semibold tabular-nums leading-none">
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider">
        {label}
      </div>
    </div>
  )
}

function PersonPopover({
  data,
  view,
  onClose,
  onShowTrajectory
}: {
  data: { profile: Profile; left: number; top: number }
  view: View
  onClose: () => void
  onShowTrajectory: (p: Profile) => void
}) {
  const { profile: p, left, top } = data
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return
      if (ref.current.contains(e.target as Node)) return
      if ((e.target as HTMLElement).tagName === 'CANVAS') return
      onClose()
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [onClose])

  const ctxText =
    view.level === 3
      ? `Vue depuis ${view.parentEntity.name}${
          view.grandparentEntity.year
            ? ` (${view.grandparentEntity.name} en ${view.grandparentEntity.year})`
            : ` de ${view.grandparentEntity.name}`
        }`
      : ''

  return (
    <div
      ref={ref}
      className="absolute z-20 rounded-xl p-3.5 min-w-[240px] max-w-[280px] shadow-2xl bg-popover/97 backdrop-blur border border-border/60 text-popover-foreground"
      style={{ left, top }}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center gap-3 pb-3 border-b border-border/60 mb-2.5">
        <div
          className="size-11 rounded-full flex items-center justify-center text-white font-semibold text-[15px] shrink-0"
          style={{
            background: `linear-gradient(135deg, hsl(${p.hue},65%,58%), hsl(${(p.hue + 40) % 360},65%,48%))`
          }}
        >
          {p.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">{p.name}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
            {p.headline}
          </div>
        </div>
      </div>
      {ctxText && (
        <div className="text-[11px] text-emerald-500 mb-2 px-2 py-1.5 rounded bg-emerald-500/10">
          {ctxText}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <PopAction
          primary
          icon="✉"
          onClick={() => {
            const q = `Aide-moi à reprendre contact avec ${p.name} (${p.headline}). Propose un message d'approche personnalisé.`
            window.location.href = `/search?q=${encodeURIComponent(q)}`
          }}
        >
          Reprendre contact
        </PopAction>
        <PopAction
          icon="↗"
          onClick={() => {
            const url = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(p.name)}`
            window.open(url, '_blank', 'noopener,noreferrer')
          }}
        >
          Voir le profil LinkedIn
        </PopAction>
        <PopAction
          icon="★"
          onClick={() => {
            toast.success(`${p.name} ajouté·e aux favoris`)
            onClose()
          }}
        >
          Ajouter aux favoris
        </PopAction>
        <PopAction icon="⏱" onClick={() => onShowTrajectory(p)}>
          Voir sa trajectoire
        </PopAction>
      </div>
    </div>
  )
}

function PopAction({
  primary,
  icon,
  onClick,
  children
}: {
  primary?: boolean
  icon: string
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-2.5 py-2 rounded text-xs text-left w-full transition-colors hover:bg-muted',
        primary ? 'text-emerald-500 font-medium' : 'text-foreground'
      )}
    >
      <span className="w-3.5 text-center opacity-80 shrink-0">{icon}</span>
      {children}
    </button>
  )
}
