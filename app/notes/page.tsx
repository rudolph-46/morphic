import { desc, eq } from 'drizzle-orm'

import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { db } from '@/lib/db'
import { notes } from '@/lib/db/schema'

import { NotesExplorer } from '@/components/notes/notes-explorer'

export const metadata = {
  title: 'Notes · Melron'
}

export default async function NotesPage() {
  const userId = await getCurrentUserId()

  const myNotes = userId
    ? await db
        .select()
        .from(notes)
        .where(eq(notes.userId, userId))
        .orderBy(desc(notes.updatedAt))
    : []

  return <NotesExplorer initialNotes={myNotes} />
}
