import { stepCountIs, tool, ToolLoopAgent } from 'ai'

import type { ResearcherTools } from '@/lib/types/agent'
import { type Model } from '@/lib/types/models'

import { fetchTool } from '../tools/fetch'
import {
  createMelronMcpClient,
  type MelronMcpClient
} from '../tools/melron-mcp'
import { createQuestionTool } from '../tools/question'
import { createSearchTool } from '../tools/search'
import { createTodoTools } from '../tools/todo'
import { SearchMode } from '../types/search'
import { getModel } from '../utils/registry'
import { isTracingEnabled } from '../utils/telemetry'

import {
  getAdaptiveModePrompt,
  QUICK_MODE_PROMPT
} from './prompts/search-mode-prompts'

// Enhanced wrapper function with better type safety and streaming support
function wrapSearchToolForQuickMode<
  T extends ReturnType<typeof createSearchTool>
>(originalTool: T): T {
  return tool({
    description: originalTool.description,
    inputSchema: originalTool.inputSchema,
    async *execute(params, context) {
      const executeFunc = originalTool.execute
      if (!executeFunc) {
        throw new Error('Search tool execute function is not defined')
      }

      // Force optimized type for quick mode
      const modifiedParams = {
        ...params,
        type: 'optimized' as const
      }

      // Execute the original tool and pass through all yielded values
      const result = executeFunc(modifiedParams, context)

      // Handle AsyncIterable (streaming) case
      if (
        result &&
        typeof result === 'object' &&
        Symbol.asyncIterator in result
      ) {
        for await (const chunk of result) {
          yield chunk
        }
      } else {
        // Fallback for non-streaming (shouldn't happen with new implementation)
        const finalResult = await result
        yield finalResult || {
          state: 'complete' as const,
          results: [],
          images: [],
          query: params.query,
          number_of_results: 0
        }
      }
    }
  }) as T
}

// Enhanced researcher function with improved type safety using ToolLoopAgent
// Note: abortSignal should be passed to agent.stream() or agent.generate() calls, not to the agent constructor
export async function createResearcher({
  model,
  modelConfig,
  parentTraceId,
  searchMode = 'internal',
  memoryPrompt,
  agentPrompt
}: {
  model: string
  modelConfig?: Model
  parentTraceId?: string
  searchMode?: SearchMode
  memoryPrompt?: string | null
  agentPrompt?: string | null
}): Promise<{
  agent: ToolLoopAgent<never, ResearcherTools, never>
  mcpClient: MelronMcpClient | null
}> {
  let mcpClient: MelronMcpClient | null = null
  try {
    const currentDate = new Date().toLocaleString()

    // Create model-specific tools with proper typing
    const originalSearchTool = createSearchTool(model)
    const askQuestionTool = createQuestionTool(model)
    const todoTools = createTodoTools()

    let systemPrompt: string
    let activeToolsList: (keyof ResearcherTools)[] = []
    let maxSteps: number
    let searchTool = originalSearchTool

    // Configure based on search mode
    switch (searchMode) {
      case 'external':
        console.log(
          '[Researcher] External mode (web/tiers): maxSteps=20, tools=[search, fetch]'
        )
        systemPrompt = QUICK_MODE_PROMPT
        activeToolsList = ['search', 'fetch']
        maxSteps = 20
        searchTool = wrapSearchToolForQuickMode(originalSearchTool)
        break

      case 'deep':
        // TODO: brancher sur research_deep (cf. docs/MELRON_ANSWER_ENGINE_SPEC.md)
        // En attendant, comportement étendu basé sur le mode interne.
        systemPrompt = getAdaptiveModePrompt()
        activeToolsList = ['search', 'fetch', 'todoWrite']
        console.log(
          `[Researcher] Deep mode (placeholder): maxSteps=80, tools=[${activeToolsList.join(', ')}]`
        )
        maxSteps = 80
        searchTool = originalSearchTool
        break

      case 'internal':
      default:
        systemPrompt = getAdaptiveModePrompt()
        activeToolsList = ['search', 'fetch', 'todoWrite']
        console.log(
          `[Researcher] Internal mode (réseau/MCP): maxSteps=50, tools=[${activeToolsList.join(', ')}]`
        )
        maxSteps = 50
        searchTool = originalSearchTool
        break
    }

    // Connect to melron MCP server if configured (env-driven, opt-in)
    mcpClient = await createMelronMcpClient()
    const mcpTools = mcpClient ? await mcpClient.tools() : {}
    const mcpToolNames = Object.keys(mcpTools)
    if (mcpToolNames.length > 0) {
      console.log(
        `[Researcher] Loaded ${mcpToolNames.length} MCP tools from melron: [${mcpToolNames.join(', ')}]`
      )
    }

    // Build tools object — MCP tools are spread in last and exposed in activeTools
    const tools = {
      search: searchTool,
      fetch: fetchTool,
      askQuestion: askQuestionTool,
      ...todoTools,
      ...mcpTools
    } as ResearcherTools

    const activeTools = [
      ...activeToolsList,
      ...(mcpToolNames as (keyof ResearcherTools)[])
    ]

    // Default provider options : enable Anthropic extended thinking so the
    // model emits `reasoning` parts visible in the chain-of-thought.
    // Budget is intentionally modest (4k tokens) to balance cost vs depth.
    // Disable via env MELRON_DISABLE_THINKING=true if needed.
    const isAnthropic = modelConfig?.providerId === 'anthropic'
    const thinkingEnabled =
      isAnthropic && process.env.MELRON_DISABLE_THINKING !== 'true'

    const computedProviderOptions: Record<string, any> = {
      ...(modelConfig?.providerOptions ?? {})
    }
    if (thinkingEnabled) {
      computedProviderOptions.anthropic = {
        ...(computedProviderOptions.anthropic ?? {}),
        thinking: {
          type: 'enabled',
          budgetTokens: Number(
            process.env.MELRON_THINKING_BUDGET_TOKENS ?? 4000
          )
        }
      }
    }
    const hasProviderOptions = Object.keys(computedProviderOptions).length > 0

    // Create ToolLoopAgent with all configuration
    const agent = new ToolLoopAgent({
      model: getModel(model),
      instructions: `${systemPrompt}\nCurrent date and time: ${currentDate}${memoryPrompt ? `\n\n${memoryPrompt}` : ''}${agentPrompt ? `\n\n## Agent personnalisé\n${agentPrompt}` : ''}`,
      tools,
      activeTools,
      stopWhen: stepCountIs(maxSteps),
      ...(hasProviderOptions && {
        providerOptions: computedProviderOptions
      }),
      experimental_telemetry: {
        isEnabled: isTracingEnabled(),
        functionId: 'research-agent',
        metadata: {
          modelId: model,
          agentType: 'researcher',
          searchMode,
          ...(parentTraceId && {
            langfuseTraceId: parentTraceId,
            langfuseUpdateParent: false
          })
        }
      }
    })

    return { agent, mcpClient }
  } catch (error) {
    if (mcpClient) {
      await mcpClient.close().catch(() => {})
    }
    console.error('Error in createResearcher:', error)
    throw error
  }
}

// Helper function to access agent tools
export function getResearcherTools(
  agent: ToolLoopAgent<never, ResearcherTools, never>
): ResearcherTools {
  return agent.tools
}

// Export the legacy function name for backward compatibility
export const researcher = createResearcher

