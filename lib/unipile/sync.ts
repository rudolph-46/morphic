import { and, eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import {
  linkedinMessages,
  linkedinThreads,
  unipileAccounts,
  userProfiles
} from '@/lib/db/schema'
import { classifyThread } from '@/lib/inbox/auto-tag'
import { generateReplies } from '@/lib/inbox/suggested-replies'

import { cacheAvatar } from './avatars'
import {
  listAllMessages,
  listChatAttendees,
  listChats,
  type UnipileChat,
  type UnipileChatAttendee,
  type UnipileMessage} from './messaging'

export type SyncEvent =
  | { type: 'step'; step: 'accounts' | 'threads' | 'messages' | 'done' | 'error'; label: string }
  | { type: 'progress'; current: number; total: number; label?: string }
  | {
      type: 'summary'
      threads: number
      messages: number
      durationMs: number
    }
  | { type: 'error'; message: string }

const DEFAULT_THREADS = 10
const PER_THREAD_PAGE_SIZE = 100
const MAX_PAGES_PER_THREAD = 30

function pickOtherAttendee(
  attendees: UnipileChatAttendee[],
  chat: UnipileChat
) {
  const other = attendees.find(a => !a.is_self) ?? attendees[0]
  return {
    providerId: other?.provider_id ?? chat.attendee_provider_id ?? null,
    name: other?.name ?? chat.name ?? null,
    headline: other?.specifics?.occupation ?? other?.specifics?.headline ?? null,
    avatar: other?.picture_url ?? null
  }
}

function pickSentAt(m: UnipileMessage): Date {
  const raw = m.timestamp ?? m.sent_at
  const d = raw ? new Date(raw) : new Date()
  return isNaN(d.getTime()) ? new Date() : d
}

function pickBody(m: UnipileMessage): string | null {
  return m.text ?? m.body ?? m.message ?? null
}

function pickChatTimestamp(chat: UnipileChat): Date | null {
  const raw = chat.last_message_at ?? chat.timestamp ?? chat.last_message?.timestamp
  if (!raw) return null
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

export interface SyncOptions {
  limit?: number
  /** When 'next', resume from the stored cursor (load more). When undefined, fresh fetch from the top. */
  mode?: 'fresh' | 'next'
}

export async function* runSync(
  userId: string,
  opts: SyncOptions = {}
): AsyncGenerator<SyncEvent> {
  const started = Date.now()
  const limit = opts.limit ?? DEFAULT_THREADS

  // Read user prefs (auto-tag flag + stored cursor for pagination)
  const [profile] = await db
    .select({
      inboxAutoTag: userProfiles.inboxAutoTag,
      inboxNextCursor: userProfiles.inboxNextCursor
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1)
  const autoTag = profile?.inboxAutoTag === true
  const cursor =
    opts.mode === 'next' ? (profile?.inboxNextCursor ?? undefined) : undefined

  yield { type: 'step', step: 'accounts', label: 'Recherche du compte LinkedIn lié…' }

  const [account] = await db
    .select()
    .from(unipileAccounts)
    .where(eq(unipileAccounts.provider, 'LINKEDIN'))
    .limit(1)

  if (!account) {
    yield {
      type: 'error',
      message:
        'Aucun compte LinkedIn lié. Connecte-toi via l’onboarding d’abord.'
    }
    return
  }

  yield {
    type: 'step',
    step: 'threads',
    label:
      opts.mode === 'next'
        ? `Chargement de ${limit} discussions supplémentaires…`
        : `Récupération des ${limit} discussions les plus récentes…`
  }

  let chats: UnipileChat[] = []
  let nextCursor: string | null | undefined
  try {
    const page = await listChats(account.accountId, { limit, cursor })
    chats = page.items ?? []
    nextCursor = page.cursor ?? null
  } catch (err) {
    yield {
      type: 'error',
      message: `Échec liste des chats : ${(err as Error).message}`
    }
    return
  }

  if (chats.length === 0) {
    yield {
      type: 'summary',
      threads: 0,
      messages: 0,
      durationMs: Date.now() - started
    }
    yield { type: 'step', step: 'done', label: 'Aucune discussion trouvée.' }
    return
  }

  yield {
    type: 'step',
    step: 'messages',
    label: `Synchronisation des messages (${chats.length} discussions)…`
  }

  let totalMessages = 0

  for (let i = 0; i < chats.length; i++) {
    const chat = chats[i]

    // Fetch attendees for this chat
    let attendees: UnipileChatAttendee[] = []
    try {
      const page = await listChatAttendees(chat.id)
      attendees = page.items ?? []
    } catch (err) {
      console.warn(
        `[sync] attendees ${chat.id} failed: ${(err as Error).message}`
      )
    }

    const attendee = pickOtherAttendee(attendees, chat)
    const lastMessageAt = pickChatTimestamp(chat)

    // Fetch all messages for this chat first (we'll need them for the preview)
    let msgs: UnipileMessage[] = []
    try {
      msgs = await listAllMessages(
        chat.id,
        MAX_PAGES_PER_THREAD,
        PER_THREAD_PAGE_SIZE
      )
    } catch (err) {
      console.warn(
        `[sync] thread ${chat.id} messages failed: ${(err as Error).message}`
      )
    }

    // Latest message body becomes the thread preview
    const sortedDesc = [...msgs].sort(
      (a, b) => pickSentAt(b).getTime() - pickSentAt(a).getTime()
    )
    const previewBody = sortedDesc[0] ? pickBody(sortedDesc[0]) : null
    const latestSentAt = sortedDesc[0]
      ? pickSentAt(sortedDesc[0])
      : lastMessageAt

    // Upsert thread (lookup by providerChatId + accountId)
    const existing = await db
      .select()
      .from(linkedinThreads)
      .where(
        and(
          eq(linkedinThreads.userId, userId),
          eq(linkedinThreads.providerChatId, chat.id)
        )
      )
      .limit(1)

    let threadDbId: string
    if (existing.length > 0) {
      threadDbId = existing[0].id
      await db
        .update(linkedinThreads)
        .set({
          accountId: account.accountId,
          attendeeName: attendee.name,
          attendeeHeadline: attendee.headline,
          attendeeProviderId: attendee.providerId,
          attendeeAvatarUrl: attendee.avatar,
          lastMessageAt: latestSentAt,
          lastMessagePreview: previewBody,
          unreadCount: chat.unread_count ?? chat.unread ?? 0,
          syncedAt: new Date()
        })
        .where(eq(linkedinThreads.id, threadDbId))
    } else {
      const [inserted] = await db
        .insert(linkedinThreads)
        .values({
          userId,
          accountId: account.accountId,
          providerChatId: chat.id,
          provider: 'LINKEDIN',
          attendeeName: attendee.name,
          attendeeHeadline: attendee.headline,
          attendeeProviderId: attendee.providerId,
          attendeeAvatarUrl: attendee.avatar,
          lastMessageAt: latestSentAt,
          lastMessagePreview: previewBody,
          unreadCount: chat.unread_count ?? chat.unread ?? 0
        })
        .returning({ id: linkedinThreads.id })
      threadDbId = inserted.id
    }

    // Cache the attendee avatar locally (fetched via /users/... which gives
    // publicly fetchable URLs, unlike the /chats/.../attendees endpoint).
    // Fire-and-forget per-thread: errors swallowed inside cacheAvatar.
    await cacheAvatar(attendee.providerId, account.accountId)

    // Upsert messages (skip if providerMessageId already exists for this thread)
    if (msgs.length > 0) {
      const existingIds = new Set(
        (
          await db
            .select({ pid: linkedinMessages.providerMessageId })
            .from(linkedinMessages)
            .where(eq(linkedinMessages.threadId, threadDbId))
        ).map(r => r.pid)
      )

      const fresh = msgs.filter(m => !existingIds.has(m.id))
      if (fresh.length > 0) {
        await db.insert(linkedinMessages).values(
          fresh.map(m => ({
            threadId: threadDbId,
            providerMessageId: m.id,
            senderProviderId: m.sender_id ?? m.sender_attendee_id ?? null,
            isFromMe: Boolean(m.is_sender),
            body: pickBody(m),
            attachments: (m.attachments as unknown[]) ?? [],
            sentAt: pickSentAt(m)
          }))
        )
        totalMessages += fresh.length
      }
    }

    // Optional AI auto-tag + suggested replies (only when user opted in)
    if (autoTag && msgs.length > 0) {
      const threadMessages = sortedDesc
        .slice(0, 8)
        .reverse()
        .map(m => ({
          body: pickBody(m),
          isFromMe: Boolean(m.is_sender),
          sentAt: pickSentAt(m)
        }))

      try {
        const [tags, replies] = await Promise.all([
          classifyThread({
            thread: {
              attendeeName: attendee.name,
              attendeeHeadline: attendee.headline,
              lastMessageAt: latestSentAt
            },
            messages: threadMessages.slice(-5)
          }),
          generateReplies({
            thread: {
              attendeeName: attendee.name,
              attendeeHeadline: attendee.headline
            },
            messages: threadMessages
          })
        ])

        const patch: { aiTags?: string[]; suggestedReplies?: typeof replies } = {}
        if (tags.length > 0) patch.aiTags = tags
        if (replies.length > 0) patch.suggestedReplies = replies
        if (Object.keys(patch).length > 0) {
          await db
            .update(linkedinThreads)
            .set(patch)
            .where(eq(linkedinThreads.id, threadDbId))
        }
      } catch (err) {
        console.warn(
          `[sync] enrich ${chat.id} failed: ${(err as Error).message}`
        )
      }
    }

    yield {
      type: 'progress',
      current: i + 1,
      total: chats.length,
      label: attendee.name ?? chat.id
    }
  }

  // Persist cursor for "Load more" + sync timestamp
  await db
    .insert(userProfiles)
    .values({
      userId,
      inboxLastSyncAt: new Date(),
      inboxNextCursor: nextCursor ?? null
    })
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: {
        inboxLastSyncAt: new Date(),
        inboxNextCursor: nextCursor ?? null
      }
    })

  yield {
    type: 'summary',
    threads: chats.length,
    messages: totalMessages,
    durationMs: Date.now() - started
  }
  yield { type: 'step', step: 'done', label: 'Synchronisation terminée.' }
}
