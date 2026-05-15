import type { SearchMode } from '@/lib/types/search'

/**
 * Per-chat preferences (search mode + selected agent), persisted in
 * localStorage and keyed by chatId. The "default" key is used for new chats
 * (the mode/agent of the latest conversation propagates to the next new one).
 *
 * Why not cookies: the previous implementation used a single global cookie,
 * which leaked the mode across every conversation. The user explicitly wants
 * per-conversation persistence.
 *
 * Why not the DB: adding a `metadata` column to `chats` requires a migration.
 * localStorage is good enough for now and works offline. A future migration
 * can copy values into chat.metadata when shipping the answer engine.
 */

export const VALID_SEARCH_MODES: SearchMode[] = ['internal', 'external', 'deep']

const LEGACY_MODE_MAP: Record<string, SearchMode> = {
  quick: 'external',
  adaptive: 'internal'
}

const DEFAULT_KEY = 'default'
const STORAGE_PREFIX = 'melron:pref:'
const CHANGE_EVENT = 'melron:chat-preferences-change'
const LEGACY_COOKIE = 'searchMode'

type PreferenceKey = 'searchMode' | 'agentId'

function storageKey(chatId: string | undefined | null, key: PreferenceKey) {
  return `${STORAGE_PREFIX}${chatId || DEFAULT_KEY}:${key}`
}

function readLegacyCookie(): SearchMode | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${LEGACY_COOKIE}=([^;]*)`)
  )
  if (!match) return null
  const raw = decodeURIComponent(match[1])
  return normalizeSearchMode(raw)
}

export function normalizeSearchMode(value: string | null | undefined): SearchMode | null {
  if (!value) return null
  if ((VALID_SEARCH_MODES as string[]).includes(value)) {
    return value as SearchMode
  }
  if (LEGACY_MODE_MAP[value]) return LEGACY_MODE_MAP[value]
  return null
}

export function getChatSearchMode(chatId?: string | null): SearchMode {
  if (typeof window === 'undefined') return 'internal'
  const direct = window.localStorage.getItem(storageKey(chatId, 'searchMode'))
  const fromDirect = normalizeSearchMode(direct)
  if (fromDirect) return fromDirect
  // For new chats, fall back to the user's last-selected default
  const fallback = window.localStorage.getItem(
    storageKey(DEFAULT_KEY, 'searchMode')
  )
  const fromFallback = normalizeSearchMode(fallback)
  if (fromFallback) return fromFallback
  // One-time legacy cookie migration so existing users don't lose their pick
  const legacy = readLegacyCookie()
  if (legacy) {
    window.localStorage.setItem(storageKey(DEFAULT_KEY, 'searchMode'), legacy)
    return legacy
  }
  return 'internal'
}

export function setChatSearchMode(
  chatId: string | undefined | null,
  mode: SearchMode
) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKey(chatId, 'searchMode'), mode)
  // Propagate to the default key so the next new chat starts with this mode
  window.localStorage.setItem(storageKey(DEFAULT_KEY, 'searchMode'), mode)
  window.dispatchEvent(
    new CustomEvent(CHANGE_EVENT, {
      detail: { chatId: chatId || DEFAULT_KEY, key: 'searchMode' }
    })
  )
}

export function getChatAgentId(chatId?: string | null): string | null {
  if (typeof window === 'undefined') return null
  const direct = window.localStorage.getItem(storageKey(chatId, 'agentId'))
  if (direct) return direct
  const fallback = window.localStorage.getItem(
    storageKey(DEFAULT_KEY, 'agentId')
  )
  return fallback || null
}

export function setChatAgentId(
  chatId: string | undefined | null,
  agentId: string | null
) {
  if (typeof window === 'undefined') return
  if (agentId) {
    window.localStorage.setItem(storageKey(chatId, 'agentId'), agentId)
    window.localStorage.setItem(storageKey(DEFAULT_KEY, 'agentId'), agentId)
  } else {
    window.localStorage.removeItem(storageKey(chatId, 'agentId'))
    window.localStorage.removeItem(storageKey(DEFAULT_KEY, 'agentId'))
  }
  window.dispatchEvent(
    new CustomEvent(CHANGE_EVENT, {
      detail: { chatId: chatId || DEFAULT_KEY, key: 'agentId' }
    })
  )
}

export function subscribeToChatPreferences(
  chatId: string | undefined | null,
  listener: () => void
): () => void {
  if (typeof window === 'undefined') return () => {}
  const target = chatId || DEFAULT_KEY
  const onChange = (event: Event) => {
    const detail = (event as CustomEvent).detail as
      | { chatId?: string }
      | undefined
    if (!detail || detail.chatId === target || detail.chatId === DEFAULT_KEY) {
      listener()
    }
  }
  const onStorage = (event: StorageEvent) => {
    if (!event.key) return
    if (event.key.startsWith(STORAGE_PREFIX)) listener()
  }
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onStorage)
  }
}
