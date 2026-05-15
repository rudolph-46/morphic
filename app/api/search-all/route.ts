import { NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { chats, userMemories } from '@/lib/db/schema'

const MCP_URL = process.env.MELRON_MCP_URL
const MCP_TOKEN = process.env.MELRON_MCP_TOKEN

async function fetchCards(): Promise<unknown[]> {
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

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [chatRows, memoryRows, cards] = await Promise.all([
    db
      .select({
        id: chats.id,
        title: chats.title,
        createdAt: chats.createdAt
      })
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(chats.createdAt)
      .limit(200),
    db
      .select({
        id: userMemories.id,
        category: userMemories.category,
        content: userMemories.content,
        updatedAt: userMemories.updatedAt
      })
      .from(userMemories)
      .where(eq(userMemories.userId, userId))
      .limit(200),
    fetchCards()
  ])

  return NextResponse.json({
    chats: chatRows,
    memories: memoryRows,
    cards
  })
}
