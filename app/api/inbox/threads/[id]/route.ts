import { and, asc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { linkedinMessages, linkedinThreads } from '@/lib/db/schema'

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params

  const [thread] = await db
    .select()
    .from(linkedinThreads)
    .where(
      and(eq(linkedinThreads.id, id), eq(linkedinThreads.userId, userId))
    )
    .limit(1)

  if (!thread) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const messages = await db
    .select()
    .from(linkedinMessages)
    .where(eq(linkedinMessages.threadId, id))
    .orderBy(asc(linkedinMessages.sentAt))

  return NextResponse.json({ thread, messages })
}
