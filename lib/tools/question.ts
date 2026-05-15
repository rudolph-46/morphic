import { tool } from 'ai'

import { getQuestionSchemaForModel } from '@/lib/schema/question'

/**
 * Creates a question tool with the appropriate schema for the specified model.
 */
export function createQuestionTool(fullModel: string) {
  return tool({
    description:
      'Ask the user a clarifying question with clickable options. ' +
      'Use this BEFORE running expensive MCP tools when the user request is ' +
      'ambiguous (missing location, scope, tone, target audience, etc.). ' +
      'Parameters: ' +
      'question (string, required) — the question text. ' +
      'options (array of {value, label}, 2-5 items, required) — the choices. ' +
      'selectMode ("single" | "multiple", default "single") — how the user picks. ' +
      'allowsInput (boolean, default true) — show a "Something else" free text option. ' +
      'inputPlaceholder (string, optional) — placeholder for the free text. ' +
      'Example: { "question": "Quelle zone géographique ?", "options": [{"value":"paris","label":"Paris"}, {"value":"fr","label":"France entière"}, {"value":"intl","label":"International"}], "selectMode": "single", "allowsInput": true }',
    inputSchema: getQuestionSchemaForModel(fullModel)
    // execute function removed to enable frontend confirmation
  })
}

// Default export for backward compatibility, using a default model
export const askQuestionTool = createQuestionTool('openai:gpt-4o-mini')
