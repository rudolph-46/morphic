import type { Note } from '@/lib/db/schema'

export type NoteGroup =
  | 'reseau'
  | 'recrutement'
  | 'sales'
  | 'veille'
  | 'analyse'
  | 'messages'
  | 'autre'

export interface NoteGroupMeta {
  id: NoteGroup
  label: string
  emoji: string
  /** Tailwind colour token used as a small accent. */
  color: string
}

export const NOTE_GROUPS: NoteGroupMeta[] = [
  { id: 'reseau', label: 'Réseau', emoji: '🌐', color: 'text-sky-500' },
  { id: 'recrutement', label: 'Recrutement', emoji: '💼', color: 'text-emerald-500' },
  { id: 'sales', label: 'Sales', emoji: '🎯', color: 'text-pink-500' },
  { id: 'veille', label: 'Veille', emoji: '📡', color: 'text-violet-500' },
  { id: 'analyse', label: 'Analyse', emoji: '📊', color: 'text-indigo-500' },
  { id: 'messages', label: 'Messages', emoji: '✉️', color: 'text-amber-500' },
  { id: 'autre', label: 'Autre', emoji: '📝', color: 'text-muted-foreground' }
]

// Keywords used to tag + group notes. Order matters — first matching group wins.
const GROUP_RULES: Array<{ id: NoteGroup; keywords: string[] }> = [
  {
    id: 'recrutement',
    keywords: [
      'recrutement',
      'recruteur',
      'hiring',
      'offre',
      "recherche d'emploi",
      'cv',
      'candidature',
      'interview',
      'entretien'
    ]
  },
  {
    id: 'sales',
    keywords: [
      'sales',
      'vente',
      'prospect',
      'icp',
      'pipeline',
      'deal',
      'closing',
      'mrr',
      'arr',
      'pricing',
      'demo',
      'discovery'
    ]
  },
  {
    id: 'analyse',
    keywords: [
      'analyse',
      'synthèse',
      'briefing',
      'rapport',
      'benchmark',
      'data',
      'étude',
      'roi',
      'kpi',
      'matrice'
    ]
  },
  {
    id: 'veille',
    keywords: [
      'veille',
      'tendance',
      'signal',
      'mouvement',
      'levée',
      'funding',
      'actualités',
      'news',
      'marché',
      'concurrence',
      'opportunité'
    ]
  },
  {
    id: 'messages',
    keywords: [
      'message',
      'draft',
      'relance',
      'email',
      'whatsapp',
      'pitch',
      'introduction',
      'intro',
      'follow-up'
    ]
  },
  {
    id: 'reseau',
    keywords: [
      'réseau',
      'linkedin',
      'contact',
      'connexion',
      'ami',
      'mutuel',
      'profil'
    ]
  }
]

// Tag rules — multiple can match a single note.
const TAG_RULES: Array<{ tag: string; keywords: string[] }> = [
  { tag: 'linkedin', keywords: ['linkedin'] },
  { tag: 'IA', keywords: ['ia ', 'intelligence artificielle', ' ai ', 'gpt', 'llm'] },
  { tag: 'recrutement', keywords: ['recrutement', 'recruteur', 'hiring', 'offre'] },
  { tag: 'data', keywords: ['data', 'analytics', 'sql'] },
  { tag: 'startup', keywords: ['startup', 'scale-up'] },
  { tag: 'fundraising', keywords: ['levée', 'fundraising', 'série a', 'série b', 'seed'] },
  { tag: 'sales', keywords: ['sales', 'vente', 'prospection', 'pipeline'] },
  { tag: 'product', keywords: ['produit', 'roadmap', 'feature'] },
  { tag: 'marketing', keywords: ['marketing', 'growth', 'acquisition'] },
  { tag: 'design', keywords: ['design', 'ux', 'ui'] },
  { tag: 'paris', keywords: ['paris'] },
  { tag: 'bordeaux', keywords: ['bordeaux'] },
  { tag: 'lyon', keywords: ['lyon'] },
  { tag: 'remote', keywords: ['remote', 'télétravail'] },
  { tag: 'cto', keywords: ['cto', 'vp eng'] },
  { tag: 'ceo', keywords: ['ceo', 'founder'] }
]

export interface EnrichedNote extends Note {
  group: NoteGroup
  tags: string[]
}

export function enrichNote(note: Note): EnrichedNote {
  const haystack = `${note.title} ${note.content}`.toLowerCase()

  // Group
  let group: NoteGroup = 'autre'
  for (const rule of GROUP_RULES) {
    if (rule.keywords.some(k => haystack.includes(k.toLowerCase()))) {
      group = rule.id
      break
    }
  }

  // Tags (max 4 visible, deterministic order)
  const tags: string[] = []
  for (const rule of TAG_RULES) {
    if (rule.keywords.some(k => haystack.includes(k.toLowerCase()))) {
      tags.push(rule.tag)
      if (tags.length >= 4) break
    }
  }

  return { ...note, group, tags }
}

export function getGroupMeta(id: NoteGroup): NoteGroupMeta {
  return NOTE_GROUPS.find(g => g.id === id) ?? NOTE_GROUPS[NOTE_GROUPS.length - 1]
}
