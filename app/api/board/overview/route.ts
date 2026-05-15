import { NextResponse } from 'next/server'

import { and, eq, gte, sql } from 'drizzle-orm'

import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { chats, heartbeatRuns, heartbeats } from '@/lib/db/schema'

const MCP_URL = process.env.MELRON_MCP_URL
const MCP_TOKEN = process.env.MELRON_MCP_TOKEN

async function fetchCards(): Promise<Array<Record<string, unknown>>> {
  if (!MCP_URL || !MCP_TOKEN) return []
  try {
    const res = await fetch(`${MCP_URL}?token=${MCP_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'list_cards', arguments: {} }
      })
    })
    const text = await res.text()
    const dataLine = text.split('data: ')[1]
    if (!dataLine) return []
    const parsed = JSON.parse(dataLine)
    const content = parsed?.result?.content?.[0]?.text
    if (!content) return []
    const data = JSON.parse(content)
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.cards)) return data.cards
    return []
  } catch {
    return []
  }
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const last35 = new Date(now)
  last35.setDate(now.getDate() - 35)
  const last7 = new Date(now)
  last7.setDate(now.getDate() - 7)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const [cards, recentChats, hbs, recentRuns] = await Promise.all([
    fetchCards(),
    db
      .select({ id: chats.id, createdAt: chats.createdAt })
      .from(chats)
      .where(and(eq(chats.userId, userId), gte(chats.createdAt, last35))),
    db
      .select({
        id: heartbeats.id,
        name: heartbeats.chatTitle,
        status: heartbeats.status,
        lastRunAt: heartbeats.lastRunAt
      })
      .from(heartbeats)
      .where(eq(heartbeats.userId, userId)),
    db
      .select({
        id: heartbeatRuns.id,
        heartbeatId: heartbeatRuns.heartbeatId,
        runAt: heartbeatRuns.runAt,
        resultsCount: heartbeatRuns.resultsCount
      })
      .from(heartbeatRuns)
      .innerJoin(heartbeats, eq(heartbeatRuns.heartbeatId, heartbeats.id))
      .where(
        and(
          eq(heartbeats.userId, userId),
          gte(heartbeatRuns.runAt, last35)
        )
      )
  ])

  // KPIs from cards
  const total = cards.length
  const inProgress = cards.filter(c => {
    const s = String(c.column ?? c.status ?? '').toLowerCase()
    return s.includes('progress') || s.includes('cours') || s.includes('doing')
  }).length
  const completed = cards.filter(c => {
    const s = String(c.column ?? c.status ?? '').toLowerCase()
    return s.includes('done') || s.includes('fini') || s.includes('completed')
  }).length
  const overdue = cards.filter(c => {
    const due = c.due_date ?? c.dueDate
    if (!due) return false
    return new Date(String(due)) < now
  }).length

  // Activity map (35 days) — chats + runs combined
  const activity: Record<string, number> = {}
  for (const c of recentChats) {
    if (!c.createdAt) continue
    const k = dayKey(new Date(c.createdAt))
    activity[k] = (activity[k] ?? 0) + 1
  }
  for (const r of recentRuns) {
    if (!r.runAt) continue
    const k = dayKey(new Date(r.runAt))
    activity[k] = (activity[k] ?? 0) + 1
  }
  const activityCells: Array<{ date: string; count: number }> = []
  for (let i = 34; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const k = dayKey(d)
    activityCells.push({ date: k, count: activity[k] ?? 0 })
  }
  const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(now)
  const monthContribs = activityCells.reduce((s, c) => s + c.count, 0)

  // Performance (last 6 months) — synthetic counts of chats per month
  const months: Array<{ label: string; complete: number; created: number; overdue: number }> = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const created = recentChats.filter(c => {
      const t = c.createdAt ? new Date(c.createdAt).getTime() : 0
      return t >= d.getTime() && t < next.getTime()
    }).length
    const runs = recentRuns.filter(r => {
      const t = r.runAt ? new Date(r.runAt).getTime() : 0
      return t >= d.getTime() && t < next.getTime()
    })
    months.push({
      label: new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d),
      created,
      complete: runs.filter(r => (r.resultsCount ?? 0) > 0).length,
      overdue: runs.filter(r => (r.resultsCount ?? 0) === 0).length
    })
  }

  // Today's reminders — overdue cards + heartbeats running today
  const reminders = cards
    .filter(c => {
      const due = c.due_date ?? c.dueDate
      if (!due) return false
      return new Date(String(due)) < now
    })
    .slice(0, 5)
    .map(c => ({
      id: String(c.id ?? ''),
      title: String(c.title ?? c.name ?? 'Carte'),
      subtitle: String(c.column ?? c.status ?? ''),
      status: 'overdue' as const,
      date: String(c.due_date ?? c.dueDate ?? '')
    }))

  for (const hb of hbs) {
    if (hb.status !== 'active') continue
    reminders.push({
      id: hb.id,
      title: hb.name,
      subtitle: 'Heartbeat',
      status: 'upcoming' as unknown as 'overdue',
      date: hb.lastRunAt
        ? new Date(hb.lastRunAt).toISOString()
        : new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    })
  }

  const newTasksToday = recentChats.filter(c => {
    const t = c.createdAt ? new Date(c.createdAt).getTime() : 0
    return t >= today.getTime()
  }).length

  return NextResponse.json({
    kpis: {
      total,
      inProgress,
      completed,
      overdue,
      newTasksToday,
      tasksThisWeek: recentChats.filter(c => {
        const t = c.createdAt ? new Date(c.createdAt).getTime() : 0
        return t >= last7.getTime()
      }).length
    },
    activity: {
      cells: activityCells,
      total: monthContribs,
      month: monthName
    },
    performance: months,
    reminders: reminders.slice(0, 6),
    heartbeats: hbs.length
  })
}
