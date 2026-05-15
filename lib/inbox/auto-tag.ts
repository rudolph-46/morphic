import { anthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { z } from 'zod'

import type { LinkedinMessage, LinkedinThread } from '@/lib/db/schema'

// — Action views (what to DO with this conversation) —
export const ACTION_VIEWS = [
  'traiter_aujourdhui',
  'planifier',
  'relancer',
  'engagements',
  'lire',
  'archive'
] as const

export type ActionView = (typeof ACTION_VIEWS)[number]

// — Business tags (WHY this conversation matters) —
export const BUSINESS_TAGS = [
  'recruteur',
  'lead_commercial',
  'intro',
  'mentorat',
  'networking'
] as const

export type BusinessTag = (typeof BUSINESS_TAGS)[number]

export const INBOX_TAGS = [...ACTION_VIEWS, ...BUSINESS_TAGS] as const

export type InboxTag = (typeof INBOX_TAGS)[number]

export const TAG_LABELS: Record<InboxTag, string> = {
  traiter_aujourdhui: 'À traiter aujourd’hui',
  planifier: 'À planifier',
  relancer: 'À relancer',
  engagements: 'Engagements à tenir',
  lire: 'À lire',
  archive: 'Archive',
  recruteur: 'Recruteur',
  lead_commercial: 'Lead commercial',
  intro: 'Intro',
  mentorat: 'Mentorat',
  networking: 'Networking'
}

const SYSTEM_PROMPT = `Tu catégorises les conversations LinkedIn d'un utilisateur (Rudolph, founder/freelance qui fait prospection commerciale et networking).

Tu dois retourner **exactement entre 2 et 3 tags par conversation**, choisis dans deux dimensions :

DIMENSION 1 — ACTION (obligatoire, EXACTEMENT 1 tag) :
- "traiter_aujourdhui": demande qui mérite une réponse aujourd'hui (deal en cours de closing, demande urgente, RDV à confirmer, lead chaud)
- "planifier": il faut organiser un call/meeting (mention claire d'envie de discuter, créneau à trouver)
- "relancer": Rudolph attend une réponse de l'autre depuis >7j ou doit revenir vers eux après une pause
- "engagements": Rudolph a promis quelque chose (envoi de doc, intro, suivi) et doit livrer
- "lire": info importante mais pas d'action attendue (annonce, mise à jour, contexte)
- "archive": spam, démarchage générique non ciblé, pitch automatisé, message sans contexte

DIMENSION 2 — CONTEXTE BUSINESS (1 à 2 tags si pertinent, sinon 0) :
- "recruteur": offre d'emploi, contact RH, opportunité poste
- "lead_commercial": prospect potentiel pour le produit/service de Rudolph (signal d'achat, intérêt produit, démo demandée)
- "intro": demande de mise en relation, ou Rudolph doit faire une intro
- "mentorat": demande de conseil, retour d'expérience, accompagnement
- "networking": maintien de contact, café, déjeuner, échange amical sans objectif business immédiat

RÈGLES :
1. EXACTEMENT 1 tag d'action + 0 à 2 tags business = total entre 2 et 3
2. Si le contexte business est ambigu, ne mets pas de tag business (juste l'action)
3. Pour "archive", souvent pas de tag business
4. Pour "traiter_aujourdhui" + "lead_commercial", c'est un signal d'achat à fort potentiel`

const ResultSchema = z.object({
  action: z.enum(ACTION_VIEWS),
  business: z.array(z.enum(BUSINESS_TAGS)),
  reason: z.string()
})

interface TagInput {
  thread: Pick<
    LinkedinThread,
    'attendeeName' | 'attendeeHeadline' | 'lastMessageAt'
  >
  messages: Array<Pick<LinkedinMessage, 'body' | 'isFromMe' | 'sentAt'>>
}

export async function classifyThread(input: TagInput): Promise<InboxTag[]> {
  if (!process.env.ANTHROPIC_API_KEY) return []

  // Use the 5 most recent messages (chronological in input).
  const sorted = [...input.messages].sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
  )
  const last = sorted.slice(-5)

  const transcript = last
    .map(
      m =>
        `[${m.isFromMe ? 'MOI' : (input.thread.attendeeName ?? 'EUX')} · ${new Date(m.sentAt).toISOString().slice(0, 10)}]\n${(m.body ?? '').slice(0, 800)}`
    )
    .join('\n\n')

  const daysSinceLast = input.thread.lastMessageAt
    ? Math.floor(
        (Date.now() - new Date(input.thread.lastMessageAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null

  const userPrompt = `INTERLOCUTEUR: ${input.thread.attendeeName ?? '?'} — ${input.thread.attendeeHeadline ?? '?'}
JOURS DEPUIS LE DERNIER MESSAGE: ${daysSinceLast ?? '?'}
DERNIER MESSAGE VIENT DE: ${last[last.length - 1]?.isFromMe ? 'MOI' : 'EUX'}

DERNIERS MESSAGES:
${transcript || '(aucun message)'}

Classifie cette conversation (1 action + 0 à 2 business).`

  try {
    const { object } = await generateObject({
      model: anthropic('claude-haiku-4-5-20251001'),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      schema: ResultSchema,
      maxRetries: 1
    })
    // Enforce 2-3 tags total: 1 action + at most 2 business
    const business = Array.from(new Set(object.business)).slice(0, 2)
    return [object.action, ...business]
  } catch (err) {
    const msg = (err as Error).message
    console.warn('[auto-tag] failed', msg)
    throw new Error(`Classification IA: ${msg}`)
  }
}
