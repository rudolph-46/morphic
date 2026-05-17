import { NextResponse } from 'next/server'

import { and, eq } from 'drizzle-orm'

import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { linkedinMessages, linkedinThreads } from '@/lib/db/schema'
import { sendMessage } from '@/lib/unipile/messaging'

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params

  const body = (await req.json().catch(() => null)) as { text?: string } | null
  const text = body?.text?.trim()
  if (!text) {
    return NextResponse.json({ error: 'Empty message' }, { status: 400 })
  }

  const [thread] = await db
    .select()
    .from(linkedinThreads)
    .where(and(eq(linkedinThreads.id, id), eq(linkedinThreads.userId, userId)))
    .limit(1)

  if (!thread) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let providerMessageId: string
  try {
    const sent = await sendMessage(thread.providerChatId, text)
    providerMessageId =
      sent.message_id ?? sent.id ?? sent.provider_id ?? `local-${Date.now()}`
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Unipile send failed' },
      { status: 502 }
    )
  }

  const sentAt = new Date()

  const [inserted] = await db
    .insert(linkedinMessages)
    .values({
      threadId: thread.id,
      providerMessageId,
      isFromMe: true,
      body: text,
      sentAt
    })
    .returning()

  await db
    .update(linkedinThreads)
    .set({
      lastMessageAt: sentAt,
      lastMessagePreview: text.slice(0, 280)
    })
    .where(eq(linkedinThreads.id, thread.id))

  return NextResponse.json({ message: inserted })
}
