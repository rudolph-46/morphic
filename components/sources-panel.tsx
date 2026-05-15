'use client'

import { useState } from 'react'

import { ChevronDown, ExternalLink, Layers } from 'lucide-react'

import type { SearchResultItem } from '@/lib/types'
import { displayUrlName } from '@/lib/utils/domain'
import { cn } from '@/lib/utils'

interface SourcesPanelProps {
  citationMaps?: Record<string, Record<number, SearchResultItem>>
}

interface FlatSource extends SearchResultItem {
  toolCallId: string
  number: number
}

function flatten(
  maps: Record<string, Record<number, SearchResultItem>>
): FlatSource[] {
  const out: FlatSource[] = []
  for (const [toolCallId, map] of Object.entries(maps)) {
    for (const [num, item] of Object.entries(map)) {
      out.push({ ...item, toolCallId, number: Number(num) })
    }
  }
  return out
}

function favicon(url: string): string | null {
  try {
    const { hostname } = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
  } catch {
    return null
  }
}

export function SourcesPanel({ citationMaps }: SourcesPanelProps) {
  const [open, setOpen] = useState(true)

  if (!citationMaps) return null
  const sources = flatten(citationMaps)
  if (sources.length === 0) return null

  return (
    <div className="my-4 rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <Layers className="size-3.5 text-muted-foreground" />
          Sources
          <span className="text-xs text-muted-foreground tabular-nums">
            ({sources.length})
          </span>
        </div>
        <ChevronDown
          className={cn(
            'size-4 text-muted-foreground transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="pb-3">
          <div className="flex gap-2 overflow-x-auto px-3 pt-1 pb-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
            {sources.map(src => {
              const fav = favicon(src.url)
              const domain = displayUrlName(src.url)
              return (
                <a
                  key={`${src.toolCallId}-${src.number}`}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 w-56 rounded-lg border border-border/40 bg-card hover:border-foreground/30 hover:shadow-sm transition-all p-2.5 flex flex-col gap-1 group"
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="size-4 rounded-full bg-foreground text-background font-semibold flex items-center justify-center tabular-nums text-[9px]">
                      {src.number}
                    </span>
                    {fav && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={fav}
                        alt=""
                        className="size-3 rounded-sm"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <span className="uppercase tracking-wider truncate flex-1">
                      {domain}
                    </span>
                    <ExternalLink className="size-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-xs font-medium leading-snug line-clamp-2">
                    {src.title}
                  </div>
                  {src.content && (
                    <div className="text-[10px] text-muted-foreground line-clamp-2 leading-snug">
                      {src.content}
                    </div>
                  )}
                </a>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
