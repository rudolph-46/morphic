import { NextResponse } from 'next/server'

import { anthropic } from '@ai-sdk/anthropic'
import { type ModelMessage,streamText } from 'ai'
import { and, asc, eq } from 'drizzle-orm'

import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import {
  inboxAiMessages,
  linkedinMessages,
  linkedinProfiles,
  linkedinThreads
} from '@/lib/db/schema'

const MODEL = 'claude-sonnet-4-6'

function buildSystemPrompt(args: {
  attendeeName: string | null
  attendeeHeadline: string | null
  profile: Record<string, unknown> | null
  recentMessages: { isFromMe: boolean; body: string | null; sentAt: Date }[]
}) {
  const { attendeeName, attendeeHeadline, profile, recentMessages } = args

  const p = profile as
    | {
        location?: string
        follower_count?: number
        connections_count?: number
        shared_connections_count?: number
        network_distance?: string
        public_identifier?: string
        is_premium?: boolean
        is_creator?: boolean
      }
    | null

  const profileLines = [
    attendeeName && `Nom : ${attendeeName}`,
    attendeeHeadline && `Bio : ${attendeeHeadline}`,
    p?.location && `Localisation : ${p.location}`,
    p?.network_distance && `Distance réseau : ${p.network_distance}`,
    p?.follower_count != null && `Abonnés : ${p.follower_count}`,
    p?.connections_count != null && `Relations : ${p.connections_count}`,
    p?.shared_connections_count != null &&
      `Relations partagées : ${p.shared_connections_count}`,
    p?.is_premium && 'Compte Premium',
    p?.is_creator && 'Mode Creator',
    p?.public_identifier &&
      `Profil LinkedIn : https://www.linkedin.com/in/${p.public_identifier}`
  ]
    .filter(Boolean)
    .join('\n')

  const conv = recentMessages
    .map(m => {
      const who = m.isFromMe ? 'Rudolph' : (attendeeName ?? 'Contact')
      return `[${m.sentAt.toISOString().slice(0, 10)}] ${who} : ${m.body ?? '(message vide)'}`
    })
    .join('\n')

  return `Tu es Melron, l'answer engine de Rudolph (founder/freelance — networking, prospection commerciale, opportunités).

Tu es invoqué dans le contexte d'une conversation LinkedIn précise. L'utilisateur (Rudolph) va te poser des questions sur cette personne et cette conversation. Tu réponds :
- En français, ton direct, tutoyer Rudolph
- Concis : 1-5 phrases en général, bullets quand utile
- Actionnable : propose toujours un "prochain pas" quand pertinent
- Honnête : si tu ne sais pas, dis-le ; n'invente jamais d'info sur la personne

══════════ CONTEXTE PERSONNE ══════════
${profileLines || '(aucune info enrichie disponible)'}

══════════ HISTORIQUE CONVERSATION (extraits récents) ══════════
${conv || '(aucun message)'}
══════════════════════════════════════`
}

// ─── GET history ──────────────────────────────────────────────────────────
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
    .select({ id: linkedinThreads.id })
    .from(linkedinThreads)
    .where(and(eq(linkedinThreads.id, id), eq(linkedinThreads.userId, userId)))
    .limit(1)
  if (!thread) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const rows = await db
    .select()
    .from(inboxAiMessages)
    .where(eq(inboxAiMessages.threadId, id))
    .orderBy(asc(inboxAiMessages.createdAt))

  return NextResponse.json({ messages: rows })
}

// ─── POST: ask Melron, stream answer, persist both ────────────────────────
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

  // Verify ownership + load context
  const [thread] = await db
    .select()
    .from(linkedinThreads)
    .where(and(eq(linkedinThreads.id, id), eq(linkedinThreads.userId, userId)))
    .limit(1)
  if (!thread) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Recent thread messages (last 20)
  const recent = await db
    .select({
      isFromMe: linkedinMessages.isFromMe,
      body: linkedinMessages.body,
      sentAt: linkedinMessages.sentAt
    })
    .from(linkedinMessages)
    .where(eq(linkedinMessages.threadId, id))
    .orderBy(asc(linkedinMessages.sentAt))
    .limit(20)

  // Profile (may be missing — we keep going)
  const [profile] = thread.attendeeProviderId
    ? await db
        .select({ raw: linkedinProfiles.raw })
        .from(linkedinProfiles)
        .where(eq(linkedinProfiles.providerId, thread.attendeeProviderId))
        .limit(1)
    : [null]

  // History (chat memory)
  const history = await db
    .select({
      role: inboxAiMessages.role,
      content: inboxAiMessages.content
    })
    .from(inboxAiMessages)
    .where(eq(inboxAiMessages.threadId, id))
    .orderBy(asc(inboxAiMessages.createdAt))

  // Persist the user message before streaming
  await db.insert(inboxAiMessages).values({
    threadId: id,
    role: 'user',
    content: text
  })

  const systemPrompt = buildSystemPrompt({
    attendeeName: thread.attendeeName,
    attendeeHeadline: thread.attendeeHeadline,
    profile: profile?.raw ?? null,
    recentMessages: recent
  })

  const messages: ModelMessage[] = [
    ...history.map(h => ({
      role: h.role as 'user' | 'assistant',
      content: h.content
    })),
    { role: 'user', content: text }
  ]

  const result = streamText({
    model: anthropic(MODEL),
    system: systemPrompt,
    messages,
    async onFinish({ text: full }) {
      if (full) {
        await db.insert(inboxAiMessages).values({
          threadId: id,
          role: 'assistant',
          content: full
        })
      }
    }
  })

  return result.toTextStreamResponse()
}
