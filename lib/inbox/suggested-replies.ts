import { anthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { z } from 'zod'

import type { LinkedinMessage, LinkedinThread } from '@/lib/db/schema'

export interface SuggestedReply {
  tone: string
  text: string
}

const SYSTEM_PROMPT = `Tu rédiges 3 propositions de réponse pour Rudolph (founder/freelance, prospection commerciale et networking) à une conversation LinkedIn.

Règles :
- Chaque réponse doit avoir une intention différente et un ton distinct
- Maximum 4 phrases par réponse, naturel et conversationnel
- En français, tutoyer si l'interlocuteur tutoie
- Pas de formules toutes faites ("J'espère que ce mail te trouve bien…")
- Ne signe pas (pas de "Bien cordialement, Rudolph")
- Adapte le ton à la situation : un prospect chaud n'attend pas la même chose qu'un recruteur

Choisis 3 tons parmi : "Direct & positif", "Chaleureux", "Stratégique", "Curieux", "Pro & mesuré", "Enthousiaste", "Diagnostic", "Action immédiate", "Rassurant"`

const ResultSchema = z.object({
  replies: z.array(
    z.object({
      tone: z.string(),
      text: z.string()
    })
  )
})

interface ReplyInput {
  thread: Pick<LinkedinThread, 'attendeeName' | 'attendeeHeadline'>
  messages: Array<Pick<LinkedinMessage, 'body' | 'isFromMe' | 'sentAt'>>
}

export async function generateReplies(
  input: ReplyInput
): Promise<SuggestedReply[]> {
  if (!process.env.ANTHROPIC_API_KEY) return []
  if (input.messages.length === 0) return []

  // We only suggest replies when it's our turn to respond (the other person
  // sent the last message). Otherwise skip — no value.
  const last = input.messages[input.messages.length - 1]
  if (last.isFromMe) return []

  const transcript = input.messages
    .slice(-8)
    .map(
      m =>
        `[${m.isFromMe ? 'MOI' : (input.thread.attendeeName ?? 'EUX')}]\n${(m.body ?? '').slice(0, 1000)}`
    )
    .join('\n\n')

  const userPrompt = `INTERLOCUTEUR: ${input.thread.attendeeName ?? '?'} — ${input.thread.attendeeHeadline ?? '?'}

DERNIERS MESSAGES:
${transcript}

Propose 3 réponses possibles avec des tons distincts.`

  try {
    const { object } = await generateObject({
      model: anthropic('claude-haiku-4-5-20251001'),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      schema: ResultSchema,
      maxRetries: 1
    })
    return object.replies.slice(0, 3)
  } catch (err) {
    console.warn('[suggested-replies] failed', (err as Error).message)
    return []
  }
}
