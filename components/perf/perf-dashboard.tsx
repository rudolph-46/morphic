'use client'

import { useCallback, useEffect, useState } from 'react'

import { Activity, Loader2, RefreshCw } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'

interface Trace {
  id: string
  chatId: string | null
  model: string | null
  searchMode: string | null
  queryLength: number
  thinkingEnabled: boolean
  preflightMs: number | null
  mcpSetupMs: number | null
  ttftMs: number | null
  streamingMs: number | null
  totalMs: number
  toolCallCount: number
  toolCalls: Array<{ name: string; durationMs: number }>
  label: string | null
  createdAt: string
}

interface Aggregate {
  count: number
  p50: number
  p95: number
  mean: number
}

interface AggregateGroup {
  label: string
  total: Aggregate
  preflight: Aggregate
  mcpSetup: Aggregate
  ttft: Aggregate
  streaming: Aggregate
  toolCallCount: Aggregate
}

function fmtMs(ms: number | null | undefined): string {
  if (ms == null) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function fmtTime(d: string): string {
  return new Date(d).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function PerfDashboard() {
  const [traces, setTraces] = useState<Trace[]>([])
  const [aggregates, setAggregates] = useState<AggregateGroup[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/perf/traces?limit=200')
      if (!res.ok) return
      const data = await res.json()
      setTraces(data.traces ?? [])
      setAggregates(data.aggregates ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-auto pt-14">
      <div className="max-w-6xl mx-auto w-full px-6 py-8 space-y-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="size-5 text-emerald-500" />
              <h1 className="text-2xl font-semibold tracking-tight">
                Chat performance
              </h1>
            </div>
            <p className="text-sm text-muted-foreground max-w-xl">
              Trace par requête pour comparer les optimisations. Définis{' '}
              <code className="text-xs px-1 py-0.5 rounded bg-muted">
                MELRON_PERF_LABEL=baseline
              </code>{' '}
              dans l'env avant chaque batch de test.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Refresh
          </Button>
        </header>

        {/* Aggregates by label */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Agrégats par label
          </h2>
          {aggregates.length === 0 ? (
            <div className="text-sm text-muted-foreground italic">
              Aucune trace pour l'instant. Pose une question dans le chat pour
              générer la première.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {aggregates.map(g => (
                <AggregateCard key={g.label} group={g} />
              ))}
            </div>
          )}
        </section>

        {/* Recent traces */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Traces récentes ({traces.length})
          </h2>
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <Th>Quand</Th>
                  <Th>Label</Th>
                  <Th>Modèle</Th>
                  <Th>Mode</Th>
                  <Th align="right">Preflight</Th>
                  <Th align="right">MCP</Th>
                  <Th align="right">TTFT</Th>
                  <Th align="right">Stream</Th>
                  <Th align="right">Total</Th>
                  <Th align="right">Tools</Th>
                  <Th>Think</Th>
                </tr>
              </thead>
              <tbody>
                {traces.map(t => (
                  <tr
                    key={t.id}
                    className="border-t border-border/60 hover:bg-muted/20"
                  >
                    <Td>{fmtTime(t.createdAt)}</Td>
                    <Td>
                      {t.label ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted text-foreground font-medium">
                          {t.label}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </Td>
                    <Td className="font-mono text-[10px]">
                      {t.model ?? '—'}
                    </Td>
                    <Td>{t.searchMode ?? '—'}</Td>
                    <Td align="right">{fmtMs(t.preflightMs)}</Td>
                    <Td align="right">{fmtMs(t.mcpSetupMs)}</Td>
                    <Td align="right">{fmtMs(t.ttftMs)}</Td>
                    <Td align="right">{fmtMs(t.streamingMs)}</Td>
                    <Td align="right">
                      <strong>{fmtMs(t.totalMs)}</strong>
                    </Td>
                    <Td align="right">
                      {t.toolCallCount > 0 ? t.toolCallCount : '—'}
                    </Td>
                    <Td>
                      {t.thinkingEnabled ? (
                        <span className="text-emerald-600">on</span>
                      ) : (
                        <span className="text-muted-foreground/50">off</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

function AggregateCard({ group }: { group: AggregateGroup }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold">{group.label}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {group.total.count} traces
        </span>
      </div>
      <dl className="space-y-1.5 text-xs">
        <Row label="Total" agg={group.total} bold />
        <Row label="Preflight" agg={group.preflight} />
        <Row label="MCP setup" agg={group.mcpSetup} />
        <Row label="TTFT" agg={group.ttft} />
        <Row label="Streaming" agg={group.streaming} />
      </dl>
    </div>
  )
}

function Row({
  label,
  agg,
  bold
}: {
  label: string
  agg: Aggregate
  bold?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-2',
        bold && 'font-semibold border-t border-border/40 pt-1.5 mt-1.5'
      )}
    >
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">
        <span className="text-muted-foreground/70 mr-1">p50</span>
        {fmtMs(agg.p50)}
        <span className="text-muted-foreground/70 mx-1">·</span>
        <span className="text-muted-foreground/70 mr-1">p95</span>
        {fmtMs(agg.p95)}
      </dd>
    </div>
  )
}

function Th({
  children,
  align = 'left'
}: {
  children: React.ReactNode
  align?: 'left' | 'right'
}) {
  return (
    <th
      className={cn(
        'px-3 py-2 font-medium uppercase tracking-wider text-[10px]',
        align === 'right' && 'text-right'
      )}
    >
      {children}
    </th>
  )
}

function Td({
  children,
  align = 'left',
  className
}: {
  children: React.ReactNode
  align?: 'left' | 'right'
  className?: string
}) {
  return (
    <td
      className={cn(
        'px-3 py-2 whitespace-nowrap',
        align === 'right' && 'text-right tabular-nums',
        className
      )}
    >
      {children}
    </td>
  )
}
