import { SettingsShell } from '@/components/settings/settings-shell'

export const metadata = {
  title: 'Paramètres · Melron'
}

export default async function SettingsPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  return <SettingsShell initialTab={tab ?? 'general'} />
}
