import { desc, eq } from 'drizzle-orm'

import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { userAgents } from '@/lib/db/schema'

import { AgentsExplorer } from '@/components/agents/agents-explorer'

export const metadata = {
  title: 'Agents · Melron'
}

export default async function AgentsPage() {
  const userId = await getCurrentUserId()

  const myAgents = userId
    ? await db
        .select()
        .from(userAgents)
        .where(eq(userAgents.userId, userId))
        .orderBy(desc(userAgents.createdAt))
    : []

  return <AgentsExplorer myAgents={myAgents} />
}
