'use client'

import { Sparkles } from 'lucide-react'

interface AnswerCardData {
  title?: string
  subtitle?: string
  rows: Array<{ key: string; value: string }>
}

/**
 * Parse a structured answer card from the model output.
 * The model emits:
 *
 *   <answer-card title="Top 3 opportunités" subtitle="Cette semaine">
 *   - Opportunité #1: Softeam recrute tech bancaire
 *   - Opportunité #2: James Backhurst — poste 65k
 *   - Opportunité #3: Capgemini x AI live
 *   </answer-card>
 *
 * Each line starting with `- key: value` becomes a row.
 */
export function parseAnswerCards(content: string): {
  cards: AnswerCardData[]
  cleaned: string
} {
  const cards: AnswerCardData[] = []
  const cleaned = content.replace(
    /<answer-card([^>]*)>([\s\S]*?)<\/answer-card>/g,
    (_match, attrs: string, body: string) => {
      const title =
        attrs.match(/title=["']([^"']+)["']/)?.[1] ?? undefined
      const subtitle =
        attrs.match(/subtitle=["']([^"']+)["']/)?.[1] ?? undefined
      const rows: AnswerCardData['rows'] = []
      for (const rawLine of body.trim().split('\n')) {
        const line = rawLine.trim().replace(/^[-*]\s*/, '')
        if (!line) continue
        const m = line.match(/^([^:]+?)\s*:\s*(.+)$/)
        if (m) {
          rows.push({ key: m[1].trim(), value: m[2].trim() })
        } else {
          rows.push({ key: '', value: line })
        }
      }
      cards.push({ title, subtitle, rows })
      return '' // strip from final markdown
    }
  )
  return { cards, cleaned }
}

export function AnswerCard({ data }: { data: AnswerCardData }) {
  return (
    <div className="my-4 rounded-2xl border border-border/60 bg-muted/30 overflow-hidden">
      {(data.title || data.subtitle) && (
        <div className="px-5 py-4 border-b border-border/60 bg-card">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-400 mb-1.5">
            <Sparkles className="size-3" />
            Synthèse
          </div>
          {data.title && (
            <h3 className="text-lg font-semibold tracking-tight">
              {data.title}
            </h3>
          )}
          {data.subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {data.subtitle}
            </p>
          )}
        </div>
      )}
      <dl className="divide-y divide-border/40">
        {data.rows.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-[max-content_1fr] gap-4 px-5 py-3 text-sm"
          >
            {row.key && (
              <dt className="font-medium text-muted-foreground min-w-24">
                {row.key}
              </dt>
            )}
            <dd className={row.key ? '' : 'col-span-2'}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
