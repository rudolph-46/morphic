'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

import { Box, Folder, FolderPlus, Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'

import {
  type CollectionType,
  CreateCollectionModal,
  ICONS
} from '@/components/create-collection-modal'

interface CollectionRow {
  id: string
  name: string
  color: string
  icon: string
}

const COLOR_CLASS: Record<string, string> = {
  zinc: 'text-zinc-500',
  red: 'text-red-500',
  orange: 'text-orange-500',
  amber: 'text-amber-500',
  green: 'text-emerald-500',
  blue: 'text-blue-500',
  violet: 'text-violet-500',
  pink: 'text-pink-500'
}

interface SidebarCollectionsProps {
  type: CollectionType
  label: string
}

export function SidebarCollections({ type, label }: SidebarCollectionsProps) {
  const [rows, setRows] = useState<CollectionRow[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const endpoint = type === 'project' ? '/api/projects' : '/api/agents'
  const responseKey = type === 'project' ? 'projects' : 'agents'
  const hrefBase = type === 'project' ? '/project' : '/agent'
  const fallbackIcon = type === 'project' ? Folder : Sparkles
  const createLabel =
    type === 'project' ? 'Nouveau projet' : 'Explorer les agents'

  const fetchRows = useCallback(async () => {
    try {
      const res = await fetch(endpoint)
      if (!res.ok) return
      const data = await res.json()
      setRows(data[responseKey] ?? [])
    } catch (err) {
      console.error(`Failed to load ${type}s`, err)
    } finally {
      setLoaded(true)
    }
  }, [endpoint, responseKey, type])

  useEffect(() => {
    fetchRows()
  }, [fetchRows])

  return (
    <div className="flex flex-col gap-0.5">
      <div className="px-2 pt-1 text-xs font-medium text-muted-foreground">
        {label}
      </div>
      <SidebarMenu>
        <SidebarMenuItem>
          {type === 'agent' ? (
            <SidebarMenuButton asChild>
              <Link href="/agents" className="flex items-center gap-2">
                <Box className="size-4" />
                <span>{createLabel}</span>
              </Link>
            </SidebarMenuButton>
          ) : (
            <SidebarMenuButton onClick={() => setModalOpen(true)}>
              <FolderPlus className="size-4" />
              <span>{createLabel}</span>
            </SidebarMenuButton>
          )}
        </SidebarMenuItem>

        {loaded && rows.length === 0 && type === 'project' && (
          <li className="px-2 py-1 text-xs text-muted-foreground/60 italic">
            Aucun projet
          </li>
        )}

        {rows.slice(0, 8).map(row => {
          const Icon = ICONS[row.icon] ?? fallbackIcon
          return (
            <SidebarMenuItem key={row.id}>
              <SidebarMenuButton asChild>
                <Link
                  href={`${hrefBase}/${row.id}`}
                  className="flex items-center gap-2"
                >
                  <Icon
                    className={cn(
                      'size-4',
                      COLOR_CLASS[row.color] ?? 'text-muted-foreground'
                    )}
                  />
                  <span className="truncate">{row.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>

      <CreateCollectionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        type={type}
        onCreated={fetchRows}
      />
    </div>
  )
}
