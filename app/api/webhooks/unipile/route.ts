import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db'
import {
  linkedinMessages,
  linkedinThreads,
  unipileAccounts,
  userProfiles
} from '@/lib/db/schema'
import { classifyThread } from '@/lib/inbox/auto-tag'
import { listChatAttendees, listMessages } from '@/lib/unipile/messaging'

// Unipile messaging webhook receiver.
//
// Expected events (Unipile docs): "message_received", "message_read",
// "message_reaction" etc. Payload typically includes:
//   { event, account_id, chat_id, message_id?, message?: {...} }
//
// Optional shared secret: set UNIPILE_WEBHOOK_SECRET and require it as a query
// param `?secret=...` to gate access.

interface UnipileWebhookPayload {
  event?: string
  account_id?: string
  chat_id?: string
  message_id?: string
  message?: {
    id?: string
    text?: string
    sender_id?: string
    sender_attendee_id?: string
    is_sender?: boolean | number
    timestamp?: string
    attachments?: unknown[]
  }
}

export async function POST(req: Request) {
  // Optional secret guard
  const expected = process.env.UNIPILE_WEBHOOK_SECRET
  if (expected) {
    const url = new URL(req.url)
    if (url.searchParams.get('secret') !== expected) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  let payload: UnipileWebhookPayload
  try {
    payload = (await req.json()) as UnipileWebhookPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  console.log('[webhook/unipile]', payload.event, payload.account_id, payload.chat_id)

  const event = payload.event ?? ''
  // We only care about new messages for now.
  if (
    !event.includes('message') ||
    event.includes('read') ||
    event.includes('reaction')
  ) {
    return NextResponse.json({ ok: true, ignored: event })
  }

  const accountId = payload.account_id
  const chatId = payload.chat_id
  if (!accountId || !chatId) {
    return NextResponse.json({ ok: true, missing: ['account_id', 'chat_id'] })
  }

  // Find the linked user via unipile account → user_profiles by email.
  const [acc] = await db
    .select()
    .from(unipileAccounts)
    .where(eq(unipileAccounts.accountId, accountId))
    .limit(1)
  if (!acc?.email) {
    return NextResponse.json({ ok: true, error: 'unknown account' })
  }

  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.linkedinEmail, acc.email))
    .limit(1)
  if (!profile) {
    return NextResponse.json({ ok: true, error: 'no profile' })
  }
  const userId = profile.userId

  // Ensure the thread exists in DB (create if first time we see this chat).
  let [thread] = await db
    .select()
    .from(linkedinThreads)
    .where(
      and(
        eq(linkedinThreads.userId, userId),
        eq(linkedinThreads.providerChatId, chatId)
      )
    )
    .limit(1)

  if (!thread) {
    // Fetch attendee info to enrich
    let attendeeName: string | null = null
    let attendeeHeadline: string | null = null
    let attendeeAvatar: string | null = null
    let attendeeProviderId: string | null = null
    try {
      const att = await listChatAttendees(chatId)
      const other = att.items.find(a => !a.is_self) ?? att.items[0]
      attendeeName = other?.name ?? null
      attendeeHeadline =
        other?.specifics?.occupation ?? other?.specifics?.headline ?? null
      attendeeAvatar = other?.picture_url ?? null
      attendeeProviderId = other?.provider_id ?? null
    } catch (err) {
      console.warn('[webhook] attendee fetch failed', (err as Error).message)
    }

    const [inserted] = await db
      .insert(linkedinThreads)
      .values({
        userId,
        accountId,
        providerChatId: chatId,
        provider: 'LINKEDIN',
        attendeeName,
        attendeeHeadline,
        attendeeProviderId,
        attendeeAvatarUrl: attendeeAvatar,
        unreadCount: 1
      })
      .returning()
    thread = inserted
  }

  // Insert the new message — fall back to fetching from Unipile if payload is thin.
  const msg = payload.message
  const msgId = payload.message_id ?? msg?.id
  if (!msgId) {
    return NextResponse.json({ ok: true, error: 'no message id' })
  }

  const exists = await db
    .select({ id: linkedinMessages.id })
    .from(linkedinMessages)
    .where(eq(linkedinMessages.providerMessageId, msgId))
    .limit(1)

  if (exists.length === 0) {
    let body: string | null = msg?.text ?? null
    let senderProviderId: string | null =
      msg?.sender_id ?? msg?.sender_attendee_id ?? null
    let isFromMe = Boolean(msg?.is_sender)
    let sentAt = msg?.timestamp ? new Date(msg.timestamp) : new Date()
    let attachments: unknown[] = msg?.attachments ?? []

    // If the webhook didn't include the message body, fetch it explicitly.
    if (!body) {
      try {
        const page = await listMessages(chatId, { limit: 5 })
        const m = page.items.find(it => it.id === msgId)
        if (m) {
          body = m.text ?? m.body ?? m.message ?? null
          senderProviderId =
            m.sender_id ?? m.sender_attendee_id ?? senderProviderId
          isFromMe = Boolean(m.is_sender)
          const t = m.timestamp ?? m.sent_at
          sentAt = t ? new Date(t) : sentAt
          attachments = (m.attachments as unknown[]) ?? attachments
        }
      } catch (err) {
        console.warn(
          '[webhook] message fallback fetch failed',
          (err as Error).message
        )
      }
    }

    await db.insert(linkedinMessages).values({
      threadId: thread.id,
      providerMessageId: msgId,
      senderProviderId,
      isFromMe,
      body,
      attachments: attachments as unknown[],
      sentAt
    })

    // Bump thread: update lastMessage*, increment unread when received
    await db
      .update(linkedinThreads)
      .set({
        lastMessageAt: sentAt,
        lastMessagePreview: body,
        unreadCount: isFromMe ? thread.unreadCount : (thread.unreadCount ?? 0) + 1,
        syncedAt: new Date()
      })
      .where(eq(linkedinThreads.id, thread.id))

    // Trigger AI tag if user opted in
    if (profile.inboxAutoTag) {
      const recent = await db
        .select()
        .from(linkedinMessages)
        .where(eq(linkedinMessages.threadId, thread.id))
        .orderBy(linkedinMessages.sentAt)

      try {
        const tags = await classifyThread({
          thread: {
            attendeeName: thread.attendeeName,
            attendeeHeadline: thread.attendeeHeadline,
            lastMessageAt: sentAt
          },
          messages: recent.slice(-5).map(m => ({
            body: m.body,
            isFromMe: m.isFromMe,
            sentAt: m.sentAt
          }))
        })
        if (tags.length > 0) {
          await db
            .update(linkedinThreads)
            .set({ aiTags: tags })
            .where(eq(linkedinThreads.id, thread.id))
        }
      } catch (err) {
        console.warn('[webhook] tag failed', (err as Error).message)
      }
    }
  }

  return NextResponse.json({ ok: true })
}

// Optional GET for Unipile validation handshake (if applicable).
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
