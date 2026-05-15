import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { unipileAccounts, userProfiles } from '@/lib/db/schema'
import { runSync } from '@/lib/unipile/sync'

export const maxDuration = 300

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find all profiles that have a LinkedIn account connected via Unipile.
  // We sync one account per profile (whichever LinkedIn unipileAccount exists).
  const accounts = await db
    .select()
    .from(unipileAccounts)
    .where(eq(unipileAccounts.provider, 'LINKEDIN'))

  const accountByEmail = new Map(accounts.map(a => [a.email, a]))

  const profiles = await db
    .select({
      userId: userProfiles.userId,
      linkedinEmail: userProfiles.linkedinEmail,
      linkedinConnected: userProfiles.linkedinConnected
    })
    .from(userProfiles)

  const targets = profiles.filter(
    p => p.linkedinConnected && p.linkedinEmail
  )

  const summary: Array<{
    userId: string
    threads?: number
    messages?: number
    error?: string
  }> = []

  for (const p of targets) {
    const acc = accountByEmail.get(p.linkedinEmail!)
    if (!acc) {
      summary.push({ userId: p.userId, error: 'no unipile account' })
      continue
    }
    let threads = 0
    let messages = 0
    let err: string | undefined
    try {
      for await (const ev of runSync(p.userId)) {
        if (ev.type === 'summary') {
          threads = ev.threads
          messages = ev.messages
        }
        if (ev.type === 'error') err = ev.message
      }
    } catch (e) {
      err = (e as Error).message
    }
    summary.push({ userId: p.userId, threads, messages, error: err })
  }

  return NextResponse.json({
    ran: targets.length,
    summary
  })
}
