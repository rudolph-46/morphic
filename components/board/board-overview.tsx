'use client'

import { useEffect, useState } from 'react'

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  ClipboardList,
  Clock,
  FileText
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

import { cn } from '@/lib/utils'

interface OverviewData {
  kpis: {
    total: number
    inProgress: number
    completed: number
    overdue: number
    newTasksToday: number
    tasksThisWeek: number
  }
  activity: {
    cells: Array<{ date: string; count: number }>
    total: number
    month: string
  }
  performance: Array<{
    label: string
    complete: number
    created: number
    overdue: number
  }>
  reminders: Array<{
    id: string
    title: string
    subtitle: string
    status: 'overdue' | 'upcoming'
    date: string
  }>
  heartbeats: number
}

interface BoardOverviewProps {
  userName?: string
}

export function BoardOverview(_props: BoardOverviewProps = {}) {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/board/overview')
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8 flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <KpiCard
            Icon={FileText}
            label="Total Task"
            value={data?.kpis.total ?? 0}
            trend={data ? -3.2 : 0}
            subtitle={`+${data?.kpis.newTasksToday ?? 0} new tasks today`}
            loading={loading}
          />
          <KpiCard
            Icon={CheckSquare}
            label="Task In Progress"
            value={data?.kpis.inProgress ?? 0}
            trend={1.5}
            subtitle={`+${data?.kpis.inProgress ?? 0} tasks being worked on`}
            loading={loading}
          />
          <KpiCard
            Icon={CheckCircle2}
            label="Completed Task"
            value={data?.kpis.completed ?? 0}
            trend={2.2}
            subtitle={`+${Math.max(
              0,
              data?.kpis.completed ?? 0
            )} tasks completed today`}
            loading={loading}
          />
          <KpiCard
            Icon={ClipboardList}
            label="Task Overdue"
            value={data?.kpis.overdue ?? 0}
            trend={2.1}
            subtitle={`+${data?.kpis.tasksThisWeek ?? 0} new tasks this week`}
            loading={loading}
          />
        </div>

        <ActivityMap data={data} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PerformanceChart data={data?.performance ?? []} loading={loading} />
        <RemindersList reminders={data?.reminders ?? []} loading={loading} />
      </div>
    </div>
  )
}

function KpiCard({
  Icon,
  label,
  value,
  trend,
  subtitle,
  loading
}: {
  Icon: typeof FileText
  label: string
  value: number
  trend: number
  subtitle: string
  loading: boolean
}) {
  const positive = trend >= 0
  return (
    <div className="group rounded-2xl border border-border/60 bg-card p-5 flex flex-col gap-4 hover:border-foreground/20 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Icon className="size-4" />
          </div>
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div
          className={cn(
            'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
            positive
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 text-red-600 dark:text-red-400'
          )}
        >
          {positive ? (
            <ArrowUpRight className="size-3" />
          ) : (
            <ArrowDownRight className="size-3" />
          )}
          {Math.abs(trend)}%
        </div>
      </div>
      <div className="text-4xl font-semibold tracking-tight tabular-nums">
        {loading ? <span className="text-muted-foreground/30">—</span> : value}
      </div>
      <button className="text-left text-xs text-muted-foreground flex items-center justify-between group/btn hover:text-foreground transition-colors">
        <span>{subtitle}</span>
        <span className="opacity-50 group-hover/btn:opacity-100">›</span>
      </button>
    </div>
  )
}

function ActivityMap({
  data,
  loading
}: {
  data: OverviewData | null
  loading: boolean
}) {
  const cells = data?.activity.cells ?? []
  const max = Math.max(1, ...cells.map(c => c.count))
  const month = data?.activity.month ?? ''
  const total = data?.activity.total ?? 0

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Time-Based Activity Map</h3>
        <span className="text-xs text-muted-foreground capitalize">
          {month}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1.5 flex-1">
        {loading
          ? Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-md bg-muted/30 animate-pulse"
              />
            ))
          : cells.map(cell => {
              const intensity = cell.count === 0 ? 0 : cell.count / max
              const opacityLevel =
                intensity === 0
                  ? 'bg-emerald-500/10'
                  : intensity < 0.34
                    ? 'bg-emerald-500/30'
                    : intensity < 0.67
                      ? 'bg-emerald-500/60'
                      : 'bg-emerald-500'
              return (
                <div
                  key={cell.date}
                  title={`${cell.date}: ${cell.count}`}
                  className={cn(
                    'aspect-square rounded-md transition-colors',
                    opacityLevel
                  )}
                />
              )
            })}
      </div>
      <p className="text-center text-xs text-muted-foreground mt-1">
        <span className="font-semibold text-foreground">{total}</span>{' '}
        contributions en {month}
      </p>
    </div>
  )
}

function PerformanceChart({
  data,
  loading
}: {
  data: Array<{
    label: string
    complete: number
    created: number
    overdue: number
  }>
  loading: boolean
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 flex flex-col gap-4 lg:col-span-2">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold">Task Performance</h3>
          <div className="flex items-center gap-3 mt-2 text-xs">
            <Legend color="bg-emerald-500" label="Complete" />
            <Legend color="bg-amber-500" label="New Task" />
            <Legend color="bg-red-500" label="Overdue" />
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" />
          6 derniers mois
        </div>
      </div>
      <div className="h-64">
        {loading ? (
          <div className="h-full w-full rounded-lg bg-muted/30 animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 8, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="grad-complete" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-created" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-overdue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="currentColor"
                strokeOpacity={0.08}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--popover))',
                  fontSize: 12
                }}
              />
              <Area
                type="monotone"
                dataKey="complete"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#grad-complete)"
                dot={{ r: 0 }}
                activeDot={{ r: 4 }}
              />
              <Area
                type="monotone"
                dataKey="created"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#grad-created)"
                dot={{ r: 0 }}
                activeDot={{ r: 4 }}
              />
              <Area
                type="monotone"
                dataKey="overdue"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#grad-overdue)"
                dot={{ r: 0 }}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <span className={cn('size-2 rounded-full', color)} />
      <span>{label}</span>
    </div>
  )
}

function RemindersList({
  reminders,
  loading
}: {
  reminders: OverviewData['reminders']
  loading: boolean
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Aujourd’hui</h3>
          <span className="size-5 rounded-full bg-muted text-[10px] font-medium flex items-center justify-center">
            {reminders.length}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-muted/30 animate-pulse"
            />
          ))
        ) : reminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="size-6 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">
              Aucun rappel pour aujourd’hui
            </p>
          </div>
        ) : (
          reminders.map(r => (
            <div
              key={r.id}
              className="rounded-xl border border-border/40 p-3 hover:border-border transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium leading-tight">
                  {r.title}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                    r.status === 'overdue'
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  )}
                >
                  {r.status === 'overdue' ? 'En retard' : 'Bientôt'}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <FileText className="size-3" />
                  {r.subtitle || '—'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" />
                  {r.date
                    ? new Intl.DateTimeFormat('fr-FR', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                      }).format(new Date(r.date))
                    : '—'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
