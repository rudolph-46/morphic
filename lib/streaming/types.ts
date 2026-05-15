import { UIMessage } from '@ai-sdk/react'

import type { ChatPerfTracer } from '@/lib/perf/chat-tracer'

import { Model } from '../types/models'
import { SearchMode } from '../types/search'

export interface BaseStreamConfig {
  message: UIMessage | null
  model: Model
  chatId: string
  userId: string
  trigger?: 'submit-user-message' | 'regenerate-assistant-message'
  messageId?: string
  abortSignal?: AbortSignal
  isNewChat?: boolean
  searchMode?: SearchMode
  /** Optional user-defined agent system prompt to layer on top of the default. */
  agentPrompt?: string | null
  /** Display name of the selected agent (for tracing/UX). */
  agentName?: string | null
  /** Per-request perf tracer. The stream layer adds marks and persists on finish. */
  perfTracer?: ChatPerfTracer
}
