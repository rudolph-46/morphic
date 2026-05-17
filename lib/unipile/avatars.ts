import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { linkedinAvatars } from '@/lib/db/schema'

import { getUser } from './messaging'

const MAX_BYTES = 1_000_000 // hard cap per avatar to keep DB sane
const REFRESH_AFTER_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

/**
 * Ensure we have a usable, downloaded avatar for this attendee. Returns true
 * when a row exists (either previously cached or freshly fetched).
 *
 * Safe to call many times: it short-circuits when a recent row is already
 * present, and swallows network errors silently (so sync never fails because
 * one avatar 403'd).
 */
export async function cacheAvatar(
  providerId: string | null | undefined,
  accountId: string
): Promise<boolean> {
  if (!providerId) return false

  const [existing] = await db
    .select({ fetchedAt: linkedinAvatars.fetchedAt })
    .from(linkedinAvatars)
    .where(eq(linkedinAvatars.providerId, providerId))
    .limit(1)

  if (existing && Date.now() - existing.fetchedAt.getTime() < REFRESH_AFTER_MS) {
    return true
  }

  try {
    const user = await getUser(providerId, accountId)
    const url = user.profile_picture_url ?? user.profile_picture_url_large
    if (!url) return Boolean(existing)

    const res = await fetch(url)
    if (!res.ok) return Boolean(existing)
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) {
      return Boolean(existing)
    }
    const mime = res.headers.get('content-type') ?? 'image/jpeg'

    await db
      .insert(linkedinAvatars)
      .values({
        providerId,
        accountId,
        mime,
        bytes: buf,
        sourceUrl: url,
        fetchedAt: new Date()
      })
      .onConflictDoUpdate({
        target: linkedinAvatars.providerId,
        set: {
          accountId,
          mime,
          bytes: buf,
          sourceUrl: url,
          fetchedAt: new Date()
        }
      })
    return true
  } catch {
    return Boolean(existing)
  }
}
