import { NextResponse } from 'next/server'

import { desc, eq } from 'drizzle-orm'

import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { type ChatPerfTrace,chatPerfTraces } from '@/lib/db/schema'

interface Aggregate {
  count: number
  p50: number
  p95: number
  mean: number
}

function aggregate(values: Array<number | null>): Aggregate {
  const v = values.filter((n): n is number => typeof n === 'number').sort(
    (a, b) => a - b
  )
  if (v.length === 0) return { count: 0, p50: 0, p95: 0, mean: 0 }
  const p = (q: number) => v[Math.min(v.length - 1, Math.floor(v.length * q))]
  const mean = v.reduce((s, n) => s + n, 0) / v.length
  return { count: v.length, p50: p(0.5), p95: p(0.95), mean: Math.round(mean) }
}

function group(rows: ChatPerfTrace[]) {
  const byLabel = new Map<string, ChatPerfTrace[]>()
  for (const r of rows) {
    const k = r.label ?? 'unlabeled'
    if (!byLabel.has(k)) byLabel.set(k, [])
    byLabel.get(k)!.push(r)
  }
  const groups: Array<{
    label: string
    total: Aggregate
    preflight: Aggregate
    mcpSetup: Aggregate
    ttft: Aggregate
    streaming: Aggregate
    toolCallCount: Aggregate
  }> = []
  for (const [label, items] of byLabel.entries()) {
    groups.push({
      label,
      total: aggregate(items.map(r => r.totalMs)),
      preflight: aggregate(items.map(r => r.preflightMs)),
      mcpSetup: aggregate(items.map(r => r.mcpSetupMs)),
      ttft: aggregate(items.map(r => r.ttftMs)),
      streaming: aggregate(items.map(r => r.streamingMs)),
      toolCallCount: aggregate(items.map(r => r.toolCallCount))
    })
  }
  groups.sort((a, b) => (a.label < b.label ? -1 : 1))
  return groups
}

export async function GET(req: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const url = new URL(req.url)
  const limit = Math.min(500, Number(url.searchParams.get('limit') ?? 100))

  const rows = await db
    .select()
    .from(chatPerfTraces)
    .where(eq(chatPerfTraces.userId, userId))
    .orderBy(desc(chatPerfTraces.createdAt))
    .limit(limit)

  return NextResponse.json({
    traces: rows,
    aggregates: group(rows)
  })
}
