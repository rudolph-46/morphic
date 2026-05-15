import { NextResponse } from 'next/server'

import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { notes } from '@/lib/db/schema'

const createSchema = z.object({
  title: z.string().min(1).max(256),
  content: z.string().max(50_000).optional(),
  chatId: z.string().max(191).optional()
})

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await db
    .select()
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.updatedAt))

  return NextResponse.json({ notes: rows })
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.format() },
      { status: 400 }
    )
  }

  const [inserted] = await db
    .insert(notes)
    .values({
      userId,
      title: parsed.data.title,
      content: parsed.data.content ?? '',
      chatId: parsed.data.chatId
    })
    .returning()

  return NextResponse.json({ note: inserted }, { status: 201 })
}
