'use client'

import { UseChatHelpers } from '@ai-sdk/react'
import {
  AlertCircle,
  Brain,
  Briefcase,
  Check,
  Loader2,
  MessageSquare,
  Plug,
  Send,
  Users
} from 'lucide-react'

import type { UIDataTypes, UIMessage, UITools } from '@/lib/types/ai'
import type { DynamicToolPart } from '@/lib/types/dynamic-tools'

import { MelronApplyResult } from './melron/melron-apply-result'
import { MelronInterestMapResult } from './melron/melron-interest-map-result'
import { MelronJobSearchResult } from './melron/melron-job-search-result'
import { MelronMessageResult } from './melron/melron-message-result'
import { MelronNetworkUpdateResult } from './melron/melron-network-update-result'
import { MelronPeopleSearchResult } from './melron/melron-people-search-result'
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
  ChainOfThoughtStepReasoning
} from './chain-of-thought'
import { CollapsibleMessage } from './collapsible-message'
import ProcessHeader from './process-header'

interface DynamicToolSectionProps {
  tool: DynamicToolPart
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  status?: UseChatHelpers<UIMessage<unknown, UIDataTypes, UITools>>['status']
  borderless?: boolean
  isFirst?: boolean
  isLast?: boolean
}

const TOOL_META: Record<string, { label: string; Icon: typeof Briefcase }> = {
  smart_job_search: { label: 'LinkedIn job search', Icon: Briefcase },
  smart_people_search: { label: 'LinkedIn people search', Icon: Users },
  smart_apply: { label: 'Apply to job', Icon: Send },
  smart_message: { label: 'Draft message', Icon: MessageSquare },
  smart_send: { label: 'Send message', Icon: Send },
  smart_fire: { label: 'Fire application', Icon: Send },
  smart_network_update: { label: 'Network update', Icon: Users },
  smart_post_planner: { label: 'Plan post', Icon: MessageSquare },
  smart_interest_map: { label: 'Interest map', Icon: Brain }
}

function extractMcpJson(output: unknown): unknown | null {
  if (!output || typeof output !== 'object') return null
  const content = (output as { content?: unknown }).content
  if (!Array.isArray(content) || content.length === 0) return null
  const first = content[0] as { type?: string; text?: string } | undefined
  if (first?.type !== 'text' || typeof first.text !== 'string') return null
  try {
    return JSON.parse(first.text)
  } catch {
    return null
  }
}

function getToolLabel(toolName: string): string {
  return TOOL_META[toolName]?.label ?? toolName
}

function getToolIcon(toolName: string): typeof Briefcase {
  return TOOL_META[toolName]?.Icon ?? Plug
}

function renderToolBody(
  tool: DynamicToolPart,
  parsed: unknown | null,
  label: string
): React.ReactNode {
  if (tool.state === 'output-error') {
    return (
      <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
        {tool.errorText || 'Tool execution failed'}
      </div>
    )
  }
  if (tool.state !== 'output-available') {
    return (
      <div className="text-sm text-muted-foreground p-3">
        Running {label}…
      </div>
    )
  }
  if (tool.toolName === 'smart_job_search' && parsed) {
    return <MelronJobSearchResult data={parsed} />
  }
  if (tool.toolName === 'smart_apply' && parsed) {
    return <MelronApplyResult data={parsed} />
  }
  if (tool.toolName === 'smart_people_search' && parsed) {
    return <MelronPeopleSearchResult data={parsed} />
  }
  if (tool.toolName === 'smart_interest_map' && parsed) {
    return <MelronInterestMapResult data={parsed} />
  }
  if (tool.toolName === 'smart_message' && parsed) {
    return <MelronMessageResult data={parsed} />
  }
  if (
    (tool.toolName === 'smart_network_update' ||
      tool.toolName === 'network_pulse') &&
    parsed
  ) {
    return <MelronNetworkUpdateResult data={parsed} toolCallId={tool.toolCallId} />
  }
  if ((tool.toolName === 'find_people' || tool.toolName === 'smart_people_search') && parsed) {
    return <MelronPeopleSearchResult data={parsed} />
  }
  return (
    <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-96">
      <code>{JSON.stringify(parsed ?? tool.output, null, 2)}</code>
    </pre>
  )
}

// ── Single tool (standalone) ─────────────────────────

export function DynamicToolSection({
  tool,
  isOpen,
  onOpenChange,
  status,
  borderless = false
}: DynamicToolSectionProps) {
  const label = getToolLabel(tool.toolName)
  const Icon = getToolIcon(tool.toolName)

  const isLoading = status === 'submitted' || status === 'streaming'
  const isToolLoading =
    tool.state === 'input-streaming' || tool.state === 'input-available'
  const isError = tool.state === 'output-error'
  const isComplete = tool.state === 'output-available'

  const parsed = isComplete ? extractMcpJson(tool.output) : null

  const header = (
    <ProcessHeader
      ariaExpanded={isOpen}
      isLoading={isLoading && isToolLoading}
      label={
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate block min-w-0 max-w-full">{label}</span>
        </div>
      }
      meta={
        isError ? (
          <>
            <AlertCircle size={14} className="text-destructive" />
            <span className="text-destructive">Failed</span>
          </>
        ) : isComplete ? (
          <Check size={14} className="text-green-500" />
        ) : isToolLoading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : null
      }
    />
  )

  const body = renderToolBody(tool, parsed, label)

  return (
    <CollapsibleMessage
      role="assistant"
      isCollapsible
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      header={header}
      showBorder={!borderless}
      showIcon={false}
      variant="minimal"
    >
      {body}
    </CollapsibleMessage>
  )
}

// ── Compact summary for chain steps ─────────────────
// In chain-of-thought mode we don't render the full rich result cards
// (too tall, breaks the trace flow). Instead we show small clickable chips
// with the entity names — user clicks a chip to open the source URL in a
// new tab. The rich rendering is reserved for standalone mode (one tool).

type ChipItem = { label: string; href?: string; key: string }

function pickChipsFromOutput(
  toolName: string,
  parsed: any
): ChipItem[] {
  if (!parsed || typeof parsed !== 'object') return []

  if (toolName === 'smart_people_search' || toolName === 'find_people') {
    const people = (parsed.people ?? []) as Array<{
      full_name?: string
      anonymized_name?: string
      profile_url?: string
    }>
    return people.slice(0, 12).map((p, i) => ({
      key: p.profile_url ?? `${i}`,
      label: p.full_name && p.full_name !== 'Utilisateur LinkedIn'
        ? p.full_name
        : p.anonymized_name ?? 'Profil'
    , href: p.profile_url
    }))
  }

  if (toolName === 'smart_job_search' || toolName === 'find_jobs') {
    const jobs = (parsed.curated_jobs ?? parsed.jobs ?? []) as Array<{
      title?: string
      company?: { name?: string } | string
      url?: string
      linkedin_url?: string
    }>
    return jobs.slice(0, 12).map((j, i) => {
      const company =
        typeof j.company === 'string' ? j.company : j.company?.name
      return {
        key: j.url ?? j.linkedin_url ?? `${i}`,
        label: company
          ? `${j.title ?? 'Job'} — ${company}`
          : j.title ?? 'Job',
        href: j.url ?? j.linkedin_url
      }
    })
  }

  if (toolName === 'smart_network_update' || toolName === 'network_pulse') {
    const posts = (parsed.posts ?? parsed.feed ?? []) as Array<{
      author_name?: string
      share_url?: string
    }>
    return posts.slice(0, 12).map((p, i) => ({
      key: p.share_url ?? `${i}`,
      label: p.author_name ?? 'Post',
      href: p.share_url
    }))
  }

  if (toolName === 'smart_message' || toolName === 'draft_message') {
    const name = parsed.recipient?.name
    const url =
      parsed.recipient?.linkedin_url ?? parsed.recipient?.profile_url
    if (!name) return []
    return [{ key: 'recipient', label: `→ ${name}`, href: url }]
  }

  if (toolName === 'smart_apply' || toolName === 'apply_to_job') {
    const title = parsed.application?.job_title ?? parsed.job_title
    if (!title) return []
    return [{ key: 'job', label: title, href: parsed.application?.job_url }]
  }

  if (toolName === 'smart_interest_map') {
    const topics = (parsed.topics ?? []) as Array<{
      name?: string
      label?: string
    }>
    return topics.slice(0, 10).map((t, i) => ({
      key: `${i}`,
      label: t.name ?? t.label ?? 'Sujet'
    }))
  }

  return []
}

function getStepDescription(
  toolName: string,
  parsed: any
): string | null {
  if (!parsed || typeof parsed !== 'object') return null
  if (toolName === 'smart_people_search' || toolName === 'find_people') {
    const found = parsed.search_meta?.total_found ?? parsed.people?.length
    if (found != null) return `${found} profil${found > 1 ? 's' : ''} trouvé${found > 1 ? 's' : ''}`
  }
  if (toolName === 'smart_job_search' || toolName === 'find_jobs') {
    const found = parsed.search_meta?.total_found ?? parsed.curated_jobs?.length
    if (found != null) return `${found} offre${found > 1 ? 's' : ''}`
  }
  if (toolName === 'smart_network_update' || toolName === 'network_pulse') {
    const count = parsed.posts?.length ?? parsed.feed?.length
    if (count != null) return `${count} post${count > 1 ? 's' : ''}`
  }
  if (toolName === 'smart_message' || toolName === 'draft_message') {
    return 'Message drafté'
  }
  return null
}

function renderCompactSummary(
  tool: DynamicToolPart,
  parsed: unknown
): React.ReactNode {
  if (tool.state === 'output-error') {
    return (
      <div className="text-xs text-destructive/90">
        {tool.errorText || 'Erreur'}
      </div>
    )
  }
  if (tool.state !== 'output-available') return null

  const chips = pickChipsFromOutput(tool.toolName, parsed)
  if (chips.length === 0) return null

  return (
    <ChainOfThoughtSearchResults>
      {chips.map(chip =>
        chip.href ? (
          <a
            key={chip.key}
            href={chip.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
          >
            <ChainOfThoughtSearchResult className="cursor-pointer hover:bg-muted">
              {chip.label}
            </ChainOfThoughtSearchResult>
          </a>
        ) : (
          <ChainOfThoughtSearchResult key={chip.key}>
            {chip.label}
          </ChainOfThoughtSearchResult>
        )
      )}
    </ChainOfThoughtSearchResults>
  )
}

// ── Chain of thought (multiple tools) ────────────────

export function DynamicToolChain({
  tools,
  status,
  reasoningByToolCallId
}: {
  tools: DynamicToolPart[]
  status?: UseChatHelpers<UIMessage<unknown, UIDataTypes, UITools>>['status']
  /** Per-tool reasoning text (model thinking that preceded the call). */
  reasoningByToolCallId?: Record<string, string>
}) {
  // Auto-open while at least one step is still running so the user sees the
  // process live; once everything is done the user can collapse to summary.
  const hasRunning = tools.some(
    t => t.state === 'input-streaming' || t.state === 'input-available'
  )
  const completedCount = tools.filter(
    t => t.state === 'output-available'
  ).length

  return (
    <ChainOfThought defaultOpen={hasRunning}>
      <ChainOfThoughtHeader>
        {hasRunning
          ? `Recherche en cours (${completedCount}/${tools.length})`
          : `${tools.length} étape${tools.length > 1 ? 's' : ''}`}
      </ChainOfThoughtHeader>
      <ChainOfThoughtContent>
        {tools.map((tool, i) => {
          const isLast = i === tools.length - 1
          const label = getToolLabel(tool.toolName)
          const Icon = getToolIcon(tool.toolName)
          const isComplete = tool.state === 'output-available'
          const isError = tool.state === 'output-error'
          const isLoading =
            tool.state === 'input-streaming' ||
            tool.state === 'input-available'
          const parsed = isComplete ? extractMcpJson(tool.output) : null

          const stepStatus = isError
            ? ('error' as const)
            : isLoading
              ? ('loading' as const)
              : ('complete' as const)

          // Description : compteur succint quand on connaît le nombre d'items
          const description = isComplete ? getStepDescription(tool.toolName, parsed) : null

          const reasoningText = reasoningByToolCallId?.[tool.toolCallId]

          return (
            <ChainOfThoughtStep
              key={tool.toolCallId}
              icon={Icon}
              label={label}
              description={description}
              status={stepStatus}
              isLast={isLast}
            >
              <ChainOfThoughtStepReasoning isStreaming={isLoading}>
                {reasoningText}
              </ChainOfThoughtStepReasoning>
              {renderCompactSummary(tool, parsed)}
            </ChainOfThoughtStep>
          )
        })}
      </ChainOfThoughtContent>
    </ChainOfThought>
  )
}
