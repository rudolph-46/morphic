import { sql } from 'drizzle-orm'

import { db } from '@/lib/db'
import { linkedinThreads } from '@/lib/db/schema'

const [counts] = await db
  .select({
    withAvatar: sql<number>`count(*) filter (where ${linkedinThreads.attendeeAvatarUrl} is not null and ${linkedinThreads.attendeeAvatarUrl} <> '')`,
    total: sql<number>`count(*)`
  })
  .from(linkedinThreads)
console.log('Counts:', counts)

const rows = await db
  .select({
    name: linkedinThreads.attendeeName,
    providerId: linkedinThreads.attendeeProviderId,
    avatar: linkedinThreads.attendeeAvatarUrl
  })
  .from(linkedinThreads)
  .limit(8)
for (const r of rows) {
  console.log('-', r.name, '|', r.providerId?.slice(0, 30), '|', r.avatar?.slice(0, 80) ?? 'NULL')
}
process.exit(0)
