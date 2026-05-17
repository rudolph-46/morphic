import { NextResponse } from 'next/server'

import { asc, eq } from 'drizzle-orm'

import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { linkedinMessages, linkedinThreads } from '@/lib/db/schema'
import { classifyThread } from '@/lib/inbox/auto-tag'
import { generateReplies } from '@/lib/inbox/suggested-replies'

export const maxDuration = 300

export async function POST(req: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const onlyUntagged = url.searchParams.get('only_untagged') !== 'false'

  const threads = await db
    .select()
    .from(linkedinThreads)
    .where(eq(linkedinThreads.userId, userId))

  console.log(
    `[retag] userId=${userId} threads_total=${threads.length} only_untagged=${onlyUntagged}`
  )

  const targets = onlyUntagged
    ? threads.filter(t => !t.aiTags || t.aiTags.length === 0)
    : threads

  console.log(`[retag] targets=${targets.length}`)

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))

      send({
        type: 'step',
        step: 'start',
        label: `Classification de ${targets.length} discussion${targets.length > 1 ? 's' : ''}…`
      })

      let tagged = 0
      for (let i = 0; i < targets.length; i++) {
        const t = targets[i]
        try {
          const msgs = await db
            .select()
            .from(linkedinMessages)
            .where(eq(linkedinMessages.threadId, t.id))
            .orderBy(asc(linkedinMessages.sentAt))

          if (msgs.length === 0) {
            send({
              type: 'progress',
              current: i + 1,
              total: targets.length,
              label: `${t.attendeeName ?? 'sans nom'} — pas de messages`
            })
            continue
          }

          const threadMsgs = msgs.slice(-8).map(m => ({
            body: m.body,
            isFromMe: m.isFromMe,
            sentAt: m.sentAt
          }))

          const [tags, replies] = await Promise.all([
            classifyThread({
              thread: {
                attendeeName: t.attendeeName,
                attendeeHeadline: t.attendeeHeadline,
                lastMessageAt: t.lastMessageAt
              },
              messages: threadMsgs.slice(-5)
            }),
            generateReplies({
              thread: {
                attendeeName: t.attendeeName,
                attendeeHeadline: t.attendeeHeadline
              },
              messages: threadMsgs
            })
          ])

          const patch: {
            aiTags?: string[]
            suggestedReplies?: typeof replies
          } = {}
          if (tags.length > 0) patch.aiTags = tags
          if (replies.length > 0) patch.suggestedReplies = replies
          if (Object.keys(patch).length > 0) {
            await db
              .update(linkedinThreads)
              .set(patch)
              .where(eq(linkedinThreads.id, t.id))
            if (tags.length > 0) tagged++
          }

          send({
            type: 'progress',
            current: i + 1,
            total: targets.length,
            label: t.attendeeName ?? t.id,
            tags
          })
        } catch (err) {
          const msg = (err as Error).message
          send({
            type: 'error',
            message: `${t.attendeeName ?? 'thread'}: ${msg}`
          })
          // If first thread errors out, abort early — likely a global config issue.
          if (i === 0) {
            send({
              type: 'summary',
              total: targets.length,
              tagged
            })
            send({
              type: 'step',
              step: 'done',
              label: 'Arrêté après erreur initiale.'
            })
            controller.close()
            return
          }
        }
      }

      send({
        type: 'summary',
        total: targets.length,
        tagged
      })
      send({ type: 'step', step: 'done', label: 'Classification terminée.' })
      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  })
}
