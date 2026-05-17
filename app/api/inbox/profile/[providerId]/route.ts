import { NextResponse } from 'next/server'

import { and, eq } from 'drizzle-orm'

import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { linkedinProfiles, linkedinThreads } from '@/lib/db/schema'
import { getUser } from '@/lib/unipile/messaging'

const REFRESH_AFTER_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ providerId: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { providerId } = await ctx.params

  // Authorize: the user must own at least one thread with this provider_id.
  // This also gives us the accountId to call Unipile with.
  const [thread] = await db
    .select({ accountId: linkedinThreads.accountId })
    .from(linkedinThreads)
    .where(
      and(
        eq(linkedinThreads.userId, userId),
        eq(linkedinThreads.attendeeProviderId, providerId)
      )
    )
    .limit(1)

  if (!thread) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const [cached] = await db
    .select()
    .from(linkedinProfiles)
    .where(eq(linkedinProfiles.providerId, providerId))
    .limit(1)

  const isStale =
    !cached || Date.now() - cached.fetchedAt.getTime() > REFRESH_AFTER_MS

  if (cached && !isStale) {
    return NextResponse.json({ profile: cached.raw, cachedAt: cached.fetchedAt })
  }

  try {
    const fresh = await getUser(providerId, thread.accountId)
    const now = new Date()
    await db
      .insert(linkedinProfiles)
      .values({
        providerId,
        accountId: thread.accountId,
        raw: fresh as Record<string, unknown>,
        fetchedAt: now
      })
      .onConflictDoUpdate({
        target: linkedinProfiles.providerId,
        set: {
          accountId: thread.accountId,
          raw: fresh as Record<string, unknown>,
          fetchedAt: now
        }
      })
    return NextResponse.json({ profile: fresh, cachedAt: now })
  } catch (err) {
    // Fall back to stale cache if Unipile fails
    if (cached) {
      return NextResponse.json({
        profile: cached.raw,
        cachedAt: cached.fetchedAt,
        stale: true
      })
    }
    return NextResponse.json(
      { error: (err as Error).message || 'Unipile fetch failed' },
      { status: 502 }
    )
  }
}
