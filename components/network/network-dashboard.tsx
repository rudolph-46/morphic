'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  Building2,
  GraduationCap,
  Mail,
  MessageSquareText,
  Play,
  Search,
  UserRound,
  Users
} from 'lucide-react'

import { cn } from '@/lib/utils'

type RootMode = 'companies' | 'schools'
type ViewState =
  | { level: 1 }
  | { level: 2; parentId: string; parentName: string }
  | { level: 3; parentId: string; parentName: string; childId: string; childName: string }

type Entity = { id: string; name: string; type?: string }
type Experience = {
  companyId: string
  company: string
  title: string
  startYear: number
  endYear: number | null
}
type Education = {
  schoolId: string
  school: string
  startYear: number
  endYear: number
}
type Profile = {
  id: string
  name: string
  initials: string
  headline: string
  experiences: Experience[]
  educations: Education[]
  hue: number
}
type NodeHit = {
  id: string
  name: string
  type: 'entity' | 'person'
  x: number
  y: number
  radius: number
  profile?: Profile
}

const COMPANIES: Entity[] = [
  { id: 'cap', name: 'Capgemini', type: 'Consulting' },
  { id: 'bnp', name: 'BNP Paribas', type: 'Banking' },
  { id: 'orange', name: 'Orange', type: 'Telecom' },
  { id: 'mtn', name: 'MTN Cameroon', type: 'Telecom' },
  { id: 'wenagoo', name: 'Wenagoo', type: 'Startup' },
  { id: 'station-f', name: 'Station F', type: 'Startup' },
  { id: 'afd', name: 'AFD', type: 'Public' },
  { id: 'thales', name: 'Thales', type: 'Industry' }
]

const SCHOOLS: Entity[] = [
  { id: 'kedge', name: 'KEDGE Bordeaux' },
  { id: 'enseirb', name: 'ENSEIRB-MATMECA' },
  { id: 'iut-bdx', name: 'IUT Bordeaux' },
  { id: 'sup-yde', name: "Sup'Ptic Yaoundé" },
  { id: 'hec', name: 'HEC Paris' },
  { id: 'iae-bdx', name: 'IAE Bordeaux' }
]

const PEOPLE: Profile[] = [
  {
    id: 'p1',
    name: 'Sophie Martin',
    initials: 'SM',
    headline: 'Senior Data Analyst @ Capgemini',
    hue: 210,
    experiences: [
      { companyId: 'cap', company: 'Capgemini', title: 'Senior Data Analyst', startYear: 2019, endYear: null },
      { companyId: 'bnp', company: 'BNP Paribas', title: 'BI Analyst', startYear: 2015, endYear: 2019 }
    ],
    educations: [{ schoolId: 'kedge', school: 'KEDGE Bordeaux', startYear: 2011, endYear: 2014 }]
  },
  {
    id: 'p2',
    name: 'Marc Dubois',
    initials: 'MD',
    headline: 'Product Manager @ Station F',
    hue: 18,
    experiences: [
      { companyId: 'station-f', company: 'Station F', title: 'Product Manager', startYear: 2021, endYear: null },
      { companyId: 'wenagoo', company: 'Wenagoo', title: 'Founder', startYear: 2017, endYear: 2021 }
    ],
    educations: [{ schoolId: 'hec', school: 'HEC Paris', startYear: 2013, endYear: 2016 }]
  },
  {
    id: 'p3',
    name: 'Aïssatou Mbarga',
    initials: 'AM',
    headline: 'Digital Lead @ MTN Cameroon',
    hue: 145,
    experiences: [
      { companyId: 'mtn', company: 'MTN Cameroon', title: 'Digital Lead', startYear: 2020, endYear: null },
      { companyId: 'orange', company: 'Orange', title: 'B2B Account Manager', startYear: 2016, endYear: 2020 }
    ],
    educations: [{ schoolId: 'sup-yde', school: "Sup'Ptic Yaoundé", startYear: 2010, endYear: 2014 }]
  },
  {
    id: 'p4',
    name: 'Camille Laurent',
    initials: 'CL',
    headline: 'Risk Analyst @ BNP Paribas',
    hue: 270,
    experiences: [
      { companyId: 'bnp', company: 'BNP Paribas', title: 'Risk Analyst', startYear: 2018, endYear: null },
      { companyId: 'afd', company: 'AFD', title: 'Policy Analyst', startYear: 2014, endYear: 2018 }
    ],
    educations: [{ schoolId: 'iae-bdx', school: 'IAE Bordeaux', startYear: 2011, endYear: 2013 }]
  },
  {
    id: 'p5',
    name: 'Patrick Nguemo',
    initials: 'PN',
    headline: 'Software Engineer @ Thales',
    hue: 35,
    experiences: [
      { companyId: 'thales', company: 'Thales', title: 'Software Engineer', startYear: 2022, endYear: null },
      { companyId: 'mtn', company: 'MTN Cameroon', title: 'Network Engineer', startYear: 2017, endYear: 2022 }
    ],
    educations: [{ schoolId: 'enseirb', school: 'ENSEIRB-MATMECA', startYear: 2014, endYear: 2017 }]
  },
  {
    id: 'p6',
    name: 'Julie Bernard',
    initials: 'JB',
    headline: 'Founder @ Wenagoo',
    hue: 320,
    experiences: [
      { companyId: 'wenagoo', company: 'Wenagoo', title: 'Founder', startYear: 2020, endYear: null },
      { companyId: 'cap', company: 'Capgemini', title: 'Consultant', startYear: 2016, endYear: 2020 }
    ],
    educations: [{ schoolId: 'iut-bdx', school: 'IUT Bordeaux', startYear: 2012, endYear: 2014 }]
  }
]

const YEARS = Array.from({ length: 18 }, (_, index) => 2008 + index)

function isActiveInYear(profile: Profile, year: number) {
  return profile.experiences.some(
    exp => exp.startYear <= year && (exp.endYear ?? 2026) >= year
  )
}

function profileColor(profile: Profile) {
  return `hsl(${profile.hue} 60% 34%)`
}

function relationCount(mode: RootMode, entityId: string, year: number) {
  return PEOPLE.filter(profile => {
    if (!isActiveInYear(profile, year)) return false

    return mode === 'companies'
      ? profile.experiences.some(exp => exp.companyId === entityId)
      : profile.educations.some(edu => edu.schoolId === entityId)
  }).length
}

export function NetworkDashboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hitsRef = useRef<NodeHit[]>([])
  const [mode, setMode] = useState<RootMode>('companies')
  const [year, setYear] = useState(2025)
  const [view, setView] = useState<ViewState>({ level: 1 })
  const [selected, setSelected] = useState<NodeHit | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  const rootEntities = mode === 'companies' ? COMPANIES : SCHOOLS
  const oppositeEntities = mode === 'companies' ? SCHOOLS : COMPANIES

  const visibleNodes = useMemo(() => {
    if (view.level === 1) {
      return rootEntities
        .map(entity => ({
          ...entity,
          count: relationCount(mode, entity.id, year)
        }))
        .filter(entity => entity.count > 0)
    }

    if (view.level === 2) {
      return oppositeEntities
        .map(entity => {
          const count = PEOPLE.filter(profile => {
            if (!isActiveInYear(profile, year)) return false
            const hasParent =
              mode === 'companies'
                ? profile.experiences.some(exp => exp.companyId === view.parentId)
                : profile.educations.some(edu => edu.schoolId === view.parentId)
            const hasChild =
              mode === 'companies'
                ? profile.educations.some(edu => edu.schoolId === entity.id)
                : profile.experiences.some(exp => exp.companyId === entity.id)

            return hasParent && hasChild
          }).length

          return { ...entity, count }
        })
        .filter(entity => entity.count > 0)
    }

    return PEOPLE.filter(profile => {
      if (!isActiveInYear(profile, year)) return false
      const hasCompany =
        mode === 'companies'
          ? profile.experiences.some(exp => exp.companyId === view.parentId)
          : profile.experiences.some(exp => exp.companyId === view.childId)
      const hasSchool =
        mode === 'companies'
          ? profile.educations.some(edu => edu.schoolId === view.childId)
          : profile.educations.some(edu => edu.schoolId === view.parentId)

      return hasCompany && hasSchool
    })
  }, [mode, oppositeEntities, rootEntities, view, year])

  const stats = useMemo(() => {
    const people = PEOPLE.filter(profile => isActiveInYear(profile, year))
    const companies = new Set(
      people.flatMap(profile => profile.experiences.map(exp => exp.companyId))
    )
    return {
      people: people.length,
      companies: companies.size,
      nodes: visibleNodes.length
    }
  }, [visibleNodes.length, year])

  const resetView = useCallback((nextMode?: RootMode) => {
    setView({ level: 1 })
    setSelected(null)
    if (nextMode) setMode(nextMode)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.floor(rect.width * dpr)
    canvas.height = Math.floor(rect.height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const width = rect.width
    const height = rect.height
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) * 0.31
    const hits: NodeHit[] = []

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = 'hsl(0 0% 99%)'
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = 'hsl(0 0% 0% / 0.035)'
    ctx.font = '700 132px ui-sans-serif, system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(year), centerX, centerY)

    if (visibleNodes.length === 0) {
      ctx.fillStyle = 'hsl(0 0% 44%)'
      ctx.font = '500 14px ui-sans-serif, system-ui'
      ctx.fillText('No relationships visible for this year.', centerX, centerY)
      hitsRef.current = []
      return
    }

    visibleNodes.forEach((node, index) => {
      const angle = (Math.PI * 2 * index) / visibleNodes.length - Math.PI / 2
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius
      const isPerson = 'headline' in node
      const count = isPerson ? 1 : node.count
      const nodeRadius = isPerson ? 34 : Math.max(36, Math.min(70, 34 + count * 8))

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(x, y)
      ctx.strokeStyle = 'hsl(0 0% 0% / 0.08)'
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(x, y, nodeRadius, 0, Math.PI * 2)
      ctx.fillStyle = isPerson
        ? profileColor(node as Profile)
        : hovered === node.id
          ? 'hsl(0 0% 0%)'
          : 'hsl(0 0% 12%)'
      ctx.fill()

      ctx.strokeStyle = 'hsl(0 0% 100% / 0.92)'
      ctx.lineWidth = 3
      ctx.stroke()

      ctx.fillStyle = 'white'
      ctx.font = isPerson
        ? '700 13px ui-sans-serif, system-ui'
        : '700 17px ui-sans-serif, system-ui'
      ctx.fillText(isPerson ? (node as Profile).initials : String(count), x, y - 2)

      ctx.fillStyle = 'hsl(0 0% 0%)'
      ctx.font = '600 12px ui-sans-serif, system-ui'
      ctx.fillText(node.name, x, y + nodeRadius + 18)

      if (!isPerson) {
        ctx.fillStyle = 'hsl(0 0% 44%)'
        ctx.font = '500 11px ui-sans-serif, system-ui'
        ctx.fillText(`${count} relation${count > 1 ? 's' : ''}`, x, y + nodeRadius + 34)
      }

      hits.push({
        id: node.id,
        name: node.name,
        type: isPerson ? 'person' : 'entity',
        x,
        y,
        radius: nodeRadius,
        profile: isPerson ? (node as Profile) : undefined
      })
    })

    hitsRef.current = hits
  }, [hovered, visibleNodes, year])

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const hit = hitsRef.current.find(node => {
      const dx = x - node.x
      const dy = y - node.y
      return Math.sqrt(dx * dx + dy * dy) <= node.radius
    })

    if (!hit) {
      setSelected(null)
      return
    }

    if (hit.type === 'person') {
      setSelected(hit)
      return
    }

    if (view.level === 1) {
      setView({ level: 2, parentId: hit.id, parentName: hit.name })
      setSelected(null)
    } else if (view.level === 2) {
      setView({
        level: 3,
        parentId: view.parentId,
        parentName: view.parentName,
        childId: hit.id,
        childName: hit.name
      })
      setSelected(null)
    }
  }

  const handleCanvasMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const hit = hitsRef.current.find(node => {
      const dx = x - node.x
      const dy = y - node.y
      return Math.sqrt(dx * dx + dy * dy) <= node.radius
    })

    setHovered(hit?.id ?? null)
    event.currentTarget.style.cursor = hit ? 'pointer' : 'default'
  }

  return (
    <div className="flex h-full min-w-0 flex-col bg-background">
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b px-4 py-3 md:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Users className="size-5" />
            <h1 className="text-lg font-semibold tracking-tight">My Network</h1>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <button
              className="rounded-full border px-2.5 py-1 transition-colors hover:bg-muted"
              onClick={() => resetView()}
            >
              Overview
            </button>
            {(view.level === 2 || view.level === 3) && (
              <>
                <span>/</span>
                <button
                  className="rounded-full border px-2.5 py-1 transition-colors hover:bg-muted"
                  onClick={() =>
                    setView({ level: 2, parentId: view.parentId, parentName: view.parentName })
                  }
                >
                  {view.parentName}
                </button>
              </>
            )}
            {view.level === 3 && (
              <>
                <span>/</span>
                <span className="rounded-full bg-foreground px-2.5 py-1 text-background">
                  {view.childName}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-xs tabular-nums text-muted-foreground sm:block">
            {stats.people} people · {stats.companies} companies · {stats.nodes} visible
          </div>
          <div className="flex rounded-lg border bg-muted p-1">
            <button
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                mode === 'companies'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => resetView('companies')}
            >
              <Building2 className="size-3.5" />
              Companies
            </button>
            <button
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                mode === 'schools'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => resetView('schools')}
            >
              <GraduationCap className="size-3.5" />
              Schools
            </button>
          </div>
        </div>
      </header>

      <main className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute left-1/2 top-5 z-10 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full border bg-background/90 px-4 py-2 text-center text-xs text-muted-foreground shadow-sm backdrop-blur">
          Click a bubble to drill down. Click a person to prepare a next action.
        </div>
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMove}
          onMouseLeave={() => setHovered(null)}
        />

        {selected?.profile && (
          <div
            className="absolute z-20 w-[min(300px,calc(100vw-2rem))] rounded-2xl border bg-background p-4 shadow-2xl"
            style={{
              left: Math.min(selected.x + 18, window.innerWidth - 340),
              top: Math.max(selected.y - 80, 24)
            }}
          >
            <div className="flex items-center gap-3 border-b pb-3">
              <div
                className="flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: profileColor(selected.profile) }}
              >
                {selected.profile.initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {selected.profile.name}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {selected.profile.headline}
                </p>
              </div>
            </div>
            <div className="mt-3 grid gap-1">
              <button className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium transition-colors hover:bg-muted">
                <MessageSquareText className="size-4" />
                Draft a smart message
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium transition-colors hover:bg-muted">
                <Search className="size-4" />
                Research this profile
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium transition-colors hover:bg-muted">
                <Mail className="size-4" />
                Add to follow-up list
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t bg-background px-4 py-3 md:px-6">
        <div className="flex items-center gap-4">
          <button className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-90">
            <Play className="ml-0.5 size-4 fill-current" />
          </button>
          <input
            type="range"
            min={2008}
            max={2025}
            value={year}
            onChange={event => setYear(Number(event.target.value))}
            className="w-full accent-foreground"
          />
          <div className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums">
            {year}
          </div>
        </div>
      </footer>
    </div>
  )
}
