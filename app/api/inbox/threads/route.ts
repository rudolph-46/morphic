import { desc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { linkedinThreads } from '@/lib/db/schema'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await db
    .select()
    .from(linkedinThreads)
    .where(eq(linkedinThreads.userId, userId))
    .orderBy(desc(linkedinThreads.lastMessageAt))
    .limit(200)

  return NextResponse.json({ threads: rows })
}
