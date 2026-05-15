import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { userProfiles } from '@/lib/db/schema'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const [row] = await db
    .select({
      inboxAutoTag: userProfiles.inboxAutoTag,
      inboxLastSyncAt: userProfiles.inboxLastSyncAt
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1)
  return NextResponse.json({
    inboxAutoTag: row?.inboxAutoTag ?? false,
    inboxLastSyncAt: row?.inboxLastSyncAt ?? null
  })
}

const PatchSchema = z.object({
  inboxAutoTag: z.boolean().optional()
})

export async function PATCH(req: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  await db
    .insert(userProfiles)
    .values({
      userId,
      inboxAutoTag: parsed.data.inboxAutoTag ?? false
    })
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: { inboxAutoTag: parsed.data.inboxAutoTag ?? false }
    })

  return NextResponse.json({ ok: true })
}
