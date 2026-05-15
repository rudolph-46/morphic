'use client'

import { Brain, CheckCircle2, Clock } from 'lucide-react'

interface MelronOrchestratorOutput {
  final_text?: string
  iterations?: number
  meta?: {
    elapsed_seconds?: number
    model?: string
  }
  status?: string
  stop_reason?: string
  tools_executed?: string[]
  transcript?: unknown[]
  usage?: {
    input_tokens?: number
    output_tokens?: number
    cache_hit_ratio?: number
  }
}

/**
 * Compact summary for the `melron` meta-agent tool. The actual answer
 * lives in `final_text` which the outer model has already consumed; here
 * we only show a one-line status chip so the chat doesn't dump 30 lines
 * of JSON.
 */
export function MelronOrchestratorResult({ data }: { data: unknown }) {
  const d = (data ?? {}) as MelronOrchestratorOutput
  const tools = d.tools_executed ?? []
  const elapsed = d.meta?.elapsed_seconds
  const ok = d.status === 'completed'

  return (
    <div className="text-xs text-muted-foreground inline-flex items-center gap-2 flex-wrap">
      <span className="inline-flex items-center gap-1">
        {ok ? (
          <CheckCircle2 className="size-3 text-emerald-500" />
        ) : (
          <Brain className="size-3 text-emerald-500" />
        )}
        <strong className="text-foreground">melron</strong>
      </span>
      {tools.length > 0 && (
        <span className="inline-flex items-center gap-1">
          <span className="text-muted-foreground/60">·</span>
          {tools.length} outil{tools.length > 1 ? 's' : ''}
          <span className="text-foreground/60">
            ({tools.slice(0, 3).join(', ')}
            {tools.length > 3 ? '…' : ''})
          </span>
        </span>
      )}
      {typeof elapsed === 'number' && (
        <span className="inline-flex items-center gap-1">
          <span className="text-muted-foreground/60">·</span>
          <Clock className="size-3" />
          {elapsed.toFixed(1)}s
        </span>
      )}
      {typeof d.iterations === 'number' && d.iterations > 1 && (
        <span className="inline-flex items-center gap-1">
          <span className="text-muted-foreground/60">·</span>
          {d.iterations} itérations
        </span>
      )}
    </div>
  )
}
