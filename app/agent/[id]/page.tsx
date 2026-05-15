import { notFound } from 'next/navigation'

import { eq } from 'drizzle-orm'

import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { userAgents } from '@/lib/db/schema'

import { ICONS } from '@/components/create-collection-modal'

const COLOR_CLASS: Record<string, string> = {
  zinc: 'bg-zinc-700',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  green: 'bg-emerald-500',
  blue: 'bg-blue-500',
  violet: 'bg-violet-500',
  pink: 'bg-pink-500'
}

export default async function AgentPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const userId = await getCurrentUserId()
  if (!userId) notFound()

  const [agent] = await db
    .select()
    .from(userAgents)
    .where(eq(userAgents.id, id))
    .limit(1)

  if (!agent || agent.userId !== userId) notFound()

  const Icon = ICONS[agent.icon] ?? ICONS.Sparkles
  const colorClass = COLOR_CLASS[agent.color] ?? 'bg-zinc-700'

  return (
    <div className="flex flex-col flex-1 min-h-0 p-8 overflow-auto">
      <div className="flex items-center gap-3 mb-6">
        <div
          className={`size-10 rounded-lg flex items-center justify-center text-white ${colorClass}`}
        >
          <Icon className="size-5" />
        </div>
        <h1 className="text-2xl font-semibold">{agent.name}</h1>
      </div>
      {agent.description && (
        <p className="text-sm text-muted-foreground max-w-prose mb-4">
          {agent.description}
        </p>
      )}
      <p className="text-sm text-muted-foreground max-w-prose">
        Cet agent est encore vide. Tu pourras bientôt lui définir un prompt
        système, lui attacher des outils et lancer des conversations
        dédiées.
      </p>
    </div>
  )
}
