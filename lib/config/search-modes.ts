import { Globe, Network, Telescope } from 'lucide-react'

import { SearchMode } from '@/lib/types/search'

export interface SearchModeConfig {
  value: SearchMode
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

// Centralized search mode configuration
export const SEARCH_MODE_CONFIGS: SearchModeConfig[] = [
  {
    value: 'internal',
    label: 'Mon réseau',
    description: 'Recherche dans ton réseau et ton périmètre Melron',
    icon: Network,
    color: 'text-amber-500'
  },
  {
    value: 'external',
    label: 'Hors réseau',
    description: 'Recherche externe — web, sources publiques et tierces',
    icon: Globe,
    color: 'text-sky-500'
  },
  {
    value: 'deep',
    label: 'Approfondie',
    description:
      'Deep research — analyse multi-étapes avec rapport structuré et sources',
    icon: Telescope,
    color: 'text-violet-500'
  }
]

// Helper function to get a specific mode config
export function getSearchModeConfig(
  mode: SearchMode
): SearchModeConfig | undefined {
  return SEARCH_MODE_CONFIGS.find(config => config.value === mode)
}
