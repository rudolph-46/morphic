import { db } from '@/lib/db'
import { chatPerfTraces } from '@/lib/db/schema'

interface ToolCallTiming {
  name: string
  durationMs: number
}

export interface ChatPerfMetadata {
  userId: string
  chatId?: string
  messageId?: string
  model?: string
  searchMode?: string
  queryLength?: number
  thinkingEnabled?: boolean
  thinkingBudgetTokens?: number
  mcpToolNames?: string[]
  inputTokens?: number
  outputTokens?: number
  cacheReadTokens?: number
  cacheCreationTokens?: number
  /** Free-form tag used to compare optimisations (e.g. "baseline", "mcp-cache"). */
  label?: string
}

/**
 * Tracks per-stage timings for a single chat request and persists them to
 * `chat_perf_traces` for before/after comparison.
 *
 * Marks are timestamps (`performance.now()`); durations are derived as
 * `mark(b) - mark(a)`. The tracer is non-blocking: `persist()` returns void
 * and writes to DB best-effort (errors logged but never propagated).
 */
export class ChatPerfTracer {
  private marks = new Map<string, number>()
  private toolCalls: ToolCallTiming[] = []
  private toolStarts = new Map<string, number>()
  private meta: Partial<ChatPerfMetadata> = {}
  readonly startedAt = performance.now()

  setMeta(meta: Partial<ChatPerfMetadata>): void {
    this.meta = { ...this.meta, ...meta }
  }

  /** Persist using stored metadata + any overrides. */
  flush(overrides?: Partial<ChatPerfMetadata>): void {
    const final = { ...this.meta, ...overrides } as ChatPerfMetadata
    if (!final.userId) return
    this.persist(final)
  }

  /** Record a named timestamp. Subsequent calls with the same label overwrite. */
  mark(label: string): void {
    this.marks.set(label, performance.now())
  }

  /** Duration in ms between two marks. Returns null if either is missing. */
  span(from: string, to: string): number | null {
    const a = this.marks.get(from)
    const b = this.marks.get(to)
    if (a == null || b == null) return null
    return Math.round(b - a)
  }

  /** Duration in ms between a mark and now. */
  since(from: string): number | null {
    const a = this.marks.get(from)
    if (a == null) return null
    return Math.round(performance.now() - a)
  }

  /** Total ms since the tracer was created. */
  totalMs(): number {
    return Math.round(performance.now() - this.startedAt)
  }

  /** Start timing a tool call; pair with `endTool(name)`. */
  startTool(name: string): void {
    this.toolStarts.set(name, performance.now())
  }

  endTool(name: string): void {
    const start = this.toolStarts.get(name)
    if (start == null) return
    this.toolCalls.push({
      name,
      durationMs: Math.round(performance.now() - start)
    })
    this.toolStarts.delete(name)
  }

  recordToolCall(name: string, durationMs: number): void {
    this.toolCalls.push({ name, durationMs: Math.round(durationMs) })
  }

  getToolCalls(): ToolCallTiming[] {
    return [...this.toolCalls]
  }

  /**
   * Persist the trace. Non-blocking: returns immediately, write happens async.
   * Errors are logged but never thrown.
   */
  persist(meta: ChatPerfMetadata): void {
    const totalMs = this.totalMs()
    void (async () => {
      try {
        await db.insert(chatPerfTraces).values({
          chatId: meta.chatId ?? null,
          messageId: meta.messageId ?? null,
          userId: meta.userId,
          model: meta.model ?? null,
          searchMode: meta.searchMode ?? null,
          queryLength: meta.queryLength ?? 0,
          thinkingEnabled: meta.thinkingEnabled ?? false,
          thinkingBudgetTokens: meta.thinkingBudgetTokens ?? null,
          preflightMs: this.span('start', 'preflightDone'),
          mcpSetupMs: this.span('mcpStart', 'mcpReady'),
          ttftMs: this.span('streamStart', 'firstToken'),
          streamingMs: this.span('firstToken', 'streamEnd'),
          totalMs,
          toolCallCount: this.toolCalls.length,
          toolCalls: this.toolCalls,
          mcpToolNames: meta.mcpToolNames ?? [],
          inputTokens: meta.inputTokens ?? null,
          outputTokens: meta.outputTokens ?? null,
          cacheReadTokens: meta.cacheReadTokens ?? null,
          cacheCreationTokens: meta.cacheCreationTokens ?? null,
          label: meta.label ?? null
        })
      } catch (err) {
        console.warn('[chat-perf] persist failed:', (err as Error).message)
      }
    })()
  }
}

/** Read the perf label from env. Set MELRON_PERF_LABEL=baseline / mcp-cache / etc. */
export function getPerfLabel(): string | undefined {
  return process.env.MELRON_PERF_LABEL || undefined
}
