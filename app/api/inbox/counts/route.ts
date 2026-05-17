import { NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { linkedinThreads } from '@/lib/db/schema'
import { INBOX_TAGS, type InboxTag } from '@/lib/inbox/auto-tag'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await db
    .select({ aiTags: linkedinThreads.aiTags })
    .from(linkedinThreads)
    .where(eq(linkedinThreads.userId, userId))

  const byTag: Record<string, number> = {}
  for (const tag of INBOX_TAGS) byTag[tag] = 0

  for (const r of rows) {
    for (const t of r.aiTags ?? []) {
      if (t in byTag) byTag[t as InboxTag] += 1
    }
  }

  return NextResponse.json({ all: rows.length, byTag })
}
