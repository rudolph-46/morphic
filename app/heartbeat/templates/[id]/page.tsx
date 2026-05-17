import { notFound } from 'next/navigation'

import { HEARTBEAT_TEMPLATES } from '@/components/heartbeat/template-data'
import { TemplateDetail } from '@/components/heartbeat/template-detail'

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tpl = HEARTBEAT_TEMPLATES.find(t => t.id === id)
  return {
    title: tpl ? `${tpl.name} · Heartbeat · Melron` : 'Template introuvable'
  }
}

export default async function HeartbeatTemplatePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const template = HEARTBEAT_TEMPLATES.find(t => t.id === id)
  if (!template) notFound()

  return <TemplateDetail template={template} />
}
