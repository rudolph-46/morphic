import { NextResponse } from 'next/server'

import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { userAgents } from '@/lib/db/schema'

const createSchema = z.object({
  name: z.string().min(1).max(256),
  color: z.string().max(32).optional(),
  icon: z.string().max(64).optional(),
  description: z.string().max(2000).optional()
})

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await db
    .select()
    .from(userAgents)
    .where(eq(userAgents.userId, userId))
    .orderBy(desc(userAgents.createdAt))

  return NextResponse.json({ agents: rows })
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.format() },
      { status: 400 }
    )
  }

  const [inserted] = await db
    .insert(userAgents)
    .values({
      userId,
      name: parsed.data.name,
      color: parsed.data.color ?? 'zinc',
      icon: parsed.data.icon ?? 'Sparkles',
      description: parsed.data.description
    })
    .returning()

  return NextResponse.json({ agent: inserted }, { status: 201 })
}
