import { isNotNull } from 'drizzle-orm'

import { db } from '@/lib/db'
import { linkedinThreads } from '@/lib/db/schema'
import { cacheAvatar } from '@/lib/unipile/avatars'

const rows = await db
  .select({
    name: linkedinThreads.attendeeName,
    providerId: linkedinThreads.attendeeProviderId,
    accountId: linkedinThreads.accountId
  })
  .from(linkedinThreads)
  .where(isNotNull(linkedinThreads.attendeeProviderId))

console.log(`Backfilling ${rows.length} avatars…`)
let ok = 0
let fail = 0
for (const r of rows) {
  const success = await cacheAvatar(r.providerId, r.accountId)
  if (success) ok++
  else fail++
  process.stdout.write(success ? '.' : 'x')
}
console.log(`\nDone — ${ok} cached, ${fail} failed`)
process.exit(0)
