'use client'

import { toast } from 'sonner'

import { SHORTCUT_EVENTS, SHORTCUTS } from '@/lib/keyboard-shortcuts'
import { SearchMode } from '@/lib/types/search'

import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut'

import { useSidebar } from './ui/sidebar'
import { KeyboardShortcutDialog } from './keyboard-shortcut-dialog'
import { type Theme, useTheme } from './theme-provider'

const THEME_CYCLE: Record<Theme, Theme> = {
  dark: 'light',
  light: 'system',
  system: 'dark'
}

const SEARCH_MODE_LABELS: Record<SearchMode, string> = {
  internal: 'Mon réseau',
  external: 'Hors réseau',
  deep: 'Approfondie'
}

const SEARCH_MODE_CYCLE: Record<SearchMode, SearchMode> = {
  internal: 'external',
  external: 'deep',
  deep: 'internal'
}

const LEGACY_TO_NEW: Record<string, SearchMode> = {
  quick: 'external',
  adaptive: 'internal'
}

export function KeyboardShortcutHandler() {
  const { theme, setTheme } = useTheme()
  const { toggleSidebar } = useSidebar()

  useKeyboardShortcut(SHORTCUTS.toggleSidebar, toggleSidebar)

  useKeyboardShortcut(SHORTCUTS.newChat, () => {
    window.dispatchEvent(
      new CustomEvent(SHORTCUT_EVENTS.newChat, { cancelable: true })
    )
  })

  useKeyboardShortcut(SHORTCUTS.toggleTheme, () => {
    setTheme(THEME_CYCLE[theme])
  })

  useKeyboardShortcut(SHORTCUTS.copyMessage, () => {
    window.dispatchEvent(
      new CustomEvent(SHORTCUT_EVENTS.copyMessage, { cancelable: true })
    )
  })

  useKeyboardShortcut(SHORTCUTS.toggleSearchMode, () => {
    // Détecte le chatId courant à partir de l'URL (/search/<id>) pour cibler
    // la préférence par-chat. À défaut, applique au "default" (futurs chats).
    const pathname =
      typeof window !== 'undefined' ? window.location.pathname : ''
    const chatIdMatch = pathname.match(/\/search\/([^/?#]+)/)
    const chatId = chatIdMatch?.[1]
     
    const prefs = require('@/lib/utils/chat-preferences') as typeof import('@/lib/utils/chat-preferences')
    const current = prefs.getChatSearchMode(chatId)
    const next: SearchMode = SEARCH_MODE_CYCLE[current] ?? 'internal'
    prefs.setChatSearchMode(chatId, next)
    toast.info(`Mode de recherche : ${SEARCH_MODE_LABELS[next]}`)
  })

  useKeyboardShortcut(SHORTCUTS.showShortcuts, () => {
    window.dispatchEvent(new CustomEvent(SHORTCUT_EVENTS.showShortcuts))
  })

  return <KeyboardShortcutDialog />
}
