export type InboxCategoryId =
  | 'all'
  | 'urgent'
  | 'important'
  | 'inProgress'
  | 'new'
  | 'toFollowUp'
  | 'lowValue'

export const INBOX_CATEGORIES: {
  id: InboxCategoryId
  label: string
  emoji?: string
}[] = [
  { id: 'all', label: 'Tous' },
  { id: 'urgent', label: '🔥 Urgent' },
  { id: 'important', label: '⭐ Important' },
  { id: 'inProgress', label: '💬 En cours' },
  { id: 'new', label: '📥 Nouveau' },
  { id: 'toFollowUp', label: '⏰ À relancer' },
  { id: 'lowValue', label: '📦 Faible valeur' }
]

export type ConversationChannel = 'linkedin' | 'email' | 'whatsapp'

export interface Conversation {
  id: string
  name: string
  role: string
  /** Initials shown when no photo. */
  avatar: string
  /** Tailwind gradient for the avatar bg. */
  avatarBg: string
  /** Optional profile picture URL. */
  pictureUrl?: string
  preview: string
  time: string
  unread: boolean
  channel: ConversationChannel
  category: Exclude<InboxCategoryId, 'all'>
  /** Optional deal/context badge. */
  dealStage?: string
  /** Optional signal one-liner — short hint of why this matters now. */
  signal?: string
}

export const CONVERSATIONS: Conversation[] = [
  // — Urgent
  {
    id: 'm1',
    name: 'Sarah Martin',
    role: 'CTO @ Acme SaaS · Lyon',
    avatar: 'SM',
    avatarBg: 'from-rose-400 to-rose-600',
    preview:
      'Je peux faire le call demain 14h pour finaliser le contrat. Tu confirmes ?',
    time: '12 min',
    unread: true,
    channel: 'linkedin',
    category: 'urgent',
    dealStage: 'Closing · €45k MRR',
    signal: "Signal d'achat fort — elle veut signer."
  },
  {
    id: 'm2',
    name: 'Pierre Lavalle',
    role: 'Investor @ Kima Ventures',
    avatar: 'PL',
    avatarBg: 'from-amber-400 to-orange-500',
    preview:
      "On peut faire un call cette semaine ? J'ai partagé Honelia avec un autre partner — il aime beaucoup.",
    time: '1 h',
    unread: true,
    channel: 'linkedin',
    category: 'urgent',
    dealStage: 'Levée seed potentielle',
    signal: 'Partagé en interne = intérêt confirmé.'
  },
  {
    id: 'm3',
    name: 'Aminata Diop',
    role: 'Directrice @ Hôtel Akwa Palace',
    avatar: 'AD',
    avatarBg: 'from-emerald-400 to-teal-500',
    preview:
      "Bonjour Rudolph, on a un problème urgent sur le module réservations Honelia. C'est bloquant.",
    time: '3 h',
    unread: false,
    channel: 'email',
    category: 'urgent',
    dealStage: 'Cliente Pro · €99/mois',
    signal: 'Incident production — répondre vite.'
  },

  // — Important
  {
    id: 'm4',
    name: 'Marc Leblanc',
    role: 'CTO @ Spendesk · Paris',
    avatar: 'ML',
    avatarBg: 'from-blue-400 to-indigo-500',
    preview:
      "Je serais intéressé par une démo de Honelia. Tu as 30 min cette semaine ?",
    time: '5 h',
    unread: true,
    channel: 'linkedin',
    category: 'important',
    signal: 'Cible ICP — démarrer le pitch.'
  },
  {
    id: 'm5',
    name: 'Léa Wong',
    role: 'Head of Growth @ Alma',
    avatar: 'LW',
    avatarBg: 'from-violet-400 to-purple-500',
    preview:
      "Salut Rudolph, ton post sur l'IA networker était excellent. On peut en parler ?",
    time: '8 h',
    unread: false,
    channel: 'linkedin',
    category: 'important',
    signal: 'Réagit à ton contenu — moment idéal.'
  },
  {
    id: 'm6',
    name: 'Thomas Petit',
    role: 'VP Eng @ Doctolib',
    avatar: 'TP',
    avatarBg: 'from-sky-400 to-cyan-500',
    preview:
      "Merci pour l'intro. On échange en visio jeudi 16h ?",
    time: 'Hier',
    unread: false,
    channel: 'email',
    category: 'important'
  },

  // — En cours
  {
    id: 'm7',
    name: 'Sofia Ramirez',
    role: 'CTO @ PayFit',
    avatar: 'SR',
    avatarBg: 'from-pink-400 to-rose-500',
    preview:
      "Top, j'ai pris connaissance du pricing. Je reviens vers toi vendredi.",
    time: 'Hier',
    unread: false,
    channel: 'linkedin',
    category: 'inProgress',
    dealStage: 'Discussion en cours'
  },
  {
    id: 'm8',
    name: 'Antoine Royer',
    role: 'CTO @ Swile',
    avatar: 'AR',
    avatarBg: 'from-orange-400 to-amber-500',
    preview:
      "On vient de lever notre Série C. Je te recontacte quand on stabilise la roadmap.",
    time: '2 j',
    unread: false,
    channel: 'linkedin',
    category: 'inProgress'
  },
  {
    id: 'm9',
    name: 'Julie Lambert',
    role: 'COO @ Qonto',
    avatar: 'JL',
    avatarBg: 'from-teal-400 to-emerald-500',
    preview:
      "J'ai parlé de ton produit à notre équipe IT. Ils veulent une démo.",
    time: '3 j',
    unread: true,
    channel: 'linkedin',
    category: 'inProgress',
    dealStage: 'Démo planifiée'
  },

  // — Nouveau
  {
    id: 'm10',
    name: 'Mehdi Benali',
    role: 'Founder @ Nudge',
    avatar: 'MB',
    avatarBg: 'from-fuchsia-400 to-pink-500',
    preview:
      "Bonjour Rudolph, j'ai vu ton profil et je pense qu'on a des synergies. Tu es ouvert à un café ?",
    time: '4 j',
    unread: true,
    channel: 'linkedin',
    category: 'new'
  },
  {
    id: 'm11',
    name: 'Camille Dupont',
    role: 'Recruteuse · TheFamily',
    avatar: 'CD',
    avatarBg: 'from-indigo-400 to-blue-500',
    preview:
      "Une de nos startups cherche un VP Eng senior. Ça pourrait t'intéresser ?",
    time: '5 j',
    unread: true,
    channel: 'linkedin',
    category: 'new'
  },

  // — À relancer
  {
    id: 'm12',
    name: 'Olivier Martin',
    role: 'CFO @ Aircall',
    avatar: 'OM',
    avatarBg: 'from-yellow-400 to-orange-500',
    preview:
      "On en avait parlé en mai, je devais te recontacter pour un call. Tu es dispo cette semaine ?",
    time: '2 sem',
    unread: false,
    channel: 'email',
    category: 'toFollowUp',
    signal: 'Pas relancé depuis 14 jours.'
  },
  {
    id: 'm13',
    name: 'Nathalie Roy',
    role: 'CMO @ Spendesk',
    avatar: 'NR',
    avatarBg: 'from-rose-400 to-pink-500',
    preview:
      "Tu m'avais envoyé une proposition fin avril. Toujours d'actualité ?",
    time: '3 sem',
    unread: false,
    channel: 'email',
    category: 'toFollowUp',
    signal: 'Devis sans réponse depuis 21 jours.'
  },

  // — Faible valeur
  {
    id: 'm14',
    name: 'LinkedIn Premium',
    role: 'Notification automatique',
    avatar: 'LP',
    avatarBg: 'from-stone-400 to-stone-500',
    preview:
      "Profitez de 30 % de réduction sur LinkedIn Sales Navigator pendant 3 mois.",
    time: '1 sem',
    unread: false,
    channel: 'linkedin',
    category: 'lowValue'
  },
  {
    id: 'm15',
    name: 'Newsletter France Digitale',
    role: 'Newsletter',
    avatar: 'FD',
    avatarBg: 'from-stone-400 to-stone-500',
    preview:
      "Les 5 levées de fonds de la semaine en France et 3 articles qu'il faut lire.",
    time: '2 j',
    unread: false,
    channel: 'email',
    category: 'lowValue'
  }
]

// Lightweight count helpers (computed once when imported).
export function countByCategory(category: InboxCategoryId): number {
  if (category === 'all') return CONVERSATIONS.length
  return CONVERSATIONS.filter(c => c.category === category).length
}

export function unreadCount(): number {
  return CONVERSATIONS.filter(c => c.unread).length
}
