import { notFound } from 'next/navigation'

import { eq } from 'drizzle-orm'

import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { userProjects } from '@/lib/db/schema'

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

export default async function ProjectPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const userId = await getCurrentUserId()
  if (!userId) notFound()

  const [project] = await db
    .select()
    .from(userProjects)
    .where(eq(userProjects.id, id))
    .limit(1)

  if (!project || project.userId !== userId) notFound()

  const Icon = ICONS[project.icon] ?? ICONS.Folder
  const colorClass = COLOR_CLASS[project.color] ?? 'bg-zinc-700'

  return (
    <div className="flex flex-col flex-1 min-h-0 p-8 overflow-auto">
      <div className="flex items-center gap-3 mb-6">
        <div
          className={`size-10 rounded-lg flex items-center justify-center text-white ${colorClass}`}
        >
          <Icon className="size-5" />
        </div>
        <h1 className="text-2xl font-semibold">{project.name}</h1>
      </div>
      <p className="text-sm text-muted-foreground max-w-prose">
        Cette page projet est encore vide. Bientôt tu pourras y attacher des
        chats, des fichiers et des instructions personnalisées.
      </p>
    </div>
  )
}
