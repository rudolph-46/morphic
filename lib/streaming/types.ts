import { UIMessage } from '@ai-sdk/react'

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
}
