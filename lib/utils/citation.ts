import type { SearchResultItem, SearchResults } from '@/lib/types'
import type { UIMessage } from '@/lib/types/ai'
import { displayUrlName } from '@/lib/utils/domain'

/**
 * Validate if a string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Extract citation maps from a message's tool parts
 * Returns a map of toolCallId to citation map
 */
export function extractCitationMaps(
  message: UIMessage
): Record<string, Record<number, SearchResultItem>> {
  const citationMaps: Record<string, Record<number, SearchResultItem>> = {}

  if (!message.parts) return citationMaps

  message.parts.forEach((part: any) => {
    // Web search tool
    if (
      part.type === 'tool-search' &&
      part.state === 'output-available' &&
      part.output &&
      part.toolCallId
    ) {
      const searchResults = part.output as SearchResults
      if (searchResults.citationMap) {
        citationMaps[part.toolCallId] = searchResults.citationMap
      }
    }

    // Dynamic (MCP) tools — convert MCP-specific outputs into the citation
    // shape so the model can cite results with [N](#toolCallId).
    if (
      part.type === 'dynamic-tool' &&
      part.state === 'output-available' &&
      part.toolCallId
    ) {
      const map = extractDynamicToolCitations(part.toolName, part.output)
      if (map && Object.keys(map).length > 0) {
        citationMaps[part.toolCallId] = map
      }
    }
  })

  return citationMaps
}

/**
 * Build a citation map for an MCP dynamic-tool output.
 * Each tool may need to expose a different field as the canonical URL/title.
 */
function extractDynamicToolCitations(
  toolName: string,
  output: unknown
): Record<number, SearchResultItem> | null {
  if (!output || typeof output !== 'object') return null

  // The Unipile/Melron MCP wraps results in { content: [{ type: 'text', text: '<json>' }] }.
  let payload: any = output
  if (Array.isArray((output as any).content)) {
    const text = (output as any).content?.[0]?.text
    if (typeof text === 'string') {
      try {
        payload = JSON.parse(text)
      } catch {
        return null
      }
    }
  }

  if (toolName === 'network_pulse' || toolName === 'smart_network_update') {
    const posts = (payload?.posts ?? []) as Array<{
      author_name?: string
      author_headline?: string
      text_preview?: string
      share_url?: string
    }>
    const map: Record<number, SearchResultItem> = {}
    posts.slice(0, 12).forEach((p, i) => {
      if (!p.share_url) return
      map[i + 1] = {
        title: p.author_name ?? 'Post LinkedIn',
        url: p.share_url,
        content: p.text_preview ?? p.author_headline ?? ''
      }
    })
    return map
  }

  return null
}

/**
 * Extract citation maps from multiple messages
 * Returns a combined map of toolCallId to citation map
 */
export function extractCitationMapsFromMessages(
  messages: UIMessage[]
): Record<string, Record<number, SearchResultItem>> {
  const combinedCitationMaps: Record<
    string,
    Record<number, SearchResultItem>
  > = {}

  messages.forEach(message => {
    const messageCitationMaps = extractCitationMaps(message)
    // Merge citation maps from this message
    Object.assign(combinedCitationMaps, messageCitationMaps)
  })

  return combinedCitationMaps
}

/**
 * Process citations in content, replacing [number](#toolCallId) with [domain](url)
 * Display text uses domain name instead of number (e.g., [google](url))
 */
export function processCitations(
  content: string,
  citationMaps: Record<string, Record<number, SearchResultItem>>
): string {
  if (!citationMaps || !content || Object.keys(citationMaps).length === 0) {
    return content || ''
  }

  // Replace [number](#toolCallId) with [domain](actual-url)
  // Also handle cases with spaces: [ number ]
  return content.replace(
    /\[\s*(\d+)\s*\]\(#([^)]+)\)/g,
    (_match, num, toolCallId) => {
      const citationNum = parseInt(num, 10)

      // Validate citation number bounds
      if (isNaN(citationNum) || citationNum < 1 || citationNum > 100) {
        return '' // Return empty string for invalid citation numbers
      }

      // Get the citation map for this toolCallId
      const citationMap = citationMaps[toolCallId]
      if (!citationMap) {
        return '' // Return empty string if no citation map found
      }

      const citation = citationMap[citationNum]
      if (!citation || !isValidUrl(citation.url)) {
        return '' // Return empty string for invalid citations
      }

      // For LinkedIn / Melron MCP sources, keep the number as label (the
      // visible source cards already show the rich info, the number is the
      // anchor). For generic web sources, fall back to domain name.
      const url = citation.url
      const isLinkedinPost =
        url.includes('linkedin.com/posts') || url.includes('linkedin.com/feed')
      const label = isLinkedinPost ? String(citationNum) : displayUrlName(url)

      return `[${label}](${encodeURI(url)})`
    }
  )
}
