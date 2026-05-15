import { getCurrentUser } from '@/lib/auth/get-current-user'

import { BoardShell } from '@/components/board/board-shell'

export const metadata = {
  title: 'Board · Melron'
}

export default async function BoardPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const user = await getCurrentUser()
  const userName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email?.split('@')[0]
  return <BoardShell initialTab={tab ?? 'overview'} userName={userName} />
}
