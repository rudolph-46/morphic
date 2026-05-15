// Icon names allowed in templates. The actual lucide component is resolved
// client-side in <TemplateCard> — keeps this file free of non-serializable
// React components so it can be imported from server components.
export type TemplateIconName =
  | 'UserPlus'
  | 'TrendingUp'
  | 'Briefcase'
  | 'Zap'
  | 'Radio'
  | 'Newspaper'
  | 'Building2'
  | 'Users'
  | 'Search'
  | 'Mail'
  | 'MessageCircle'
  | 'Award'
  | 'Sparkles'
  | 'Target'
  | 'Globe'
  | 'Calendar'
  | 'Bell'
  | 'BarChart3'
  | 'Compass'
  | 'Flame'
  | 'Eye'
  | 'PenLine'
  | 'Rocket'
  | 'Brain'
  | 'Heart'

export type TemplateCategory =
  | 'all'
  | 'networking'
  | 'recruitment'
  | 'sales'
  | 'fundraising'
  | 'content'
  | 'market'

export const CATEGORIES: { id: TemplateCategory; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'networking', label: 'Networking' },
  { id: 'recruitment', label: 'Recrutement' },
  { id: 'sales', label: 'Sales / BD' },
  { id: 'fundraising', label: 'Levée de fonds' },
  { id: 'content', label: 'Contenu' },
  { id: 'market', label: 'Veille marché' }
]

export interface HeartbeatTemplate {
  id: string
  name: string
  /** Namespace identifier (author/slug). */
  slug: string
  description: string
  icon: TemplateIconName
  /** Tailwind colour for the icon background gradient. */
  gradient: string
  category: Exclude<TemplateCategory, 'all'>
  author: string
  rating: number
  reviewCount: number
  users: number
  /** Default query that will run when the heartbeat is activated. */
  defaultQuery: string
  /** Featured = appears in the "Tendances" section. */
  featured?: boolean
}

const k = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : `${n}`
export const fmt = { k }

// Mock catalogue — replace with real templates fetched from MCP later.
export const HEARTBEAT_TEMPLATES: HeartbeatTemplate[] = [
  // — Networking —
  {
    id: 'job-changes',
    name: 'Changements de poste',
    slug: 'melron/job-changes',
    description:
      "Sois notifié quand un contact change d'entreprise. Moment idéal pour féliciter et garder une relation chaude.",
    icon: 'Briefcase',
    gradient: 'from-sky-400 to-blue-500',
    category: 'networking',
    author: 'Melron',
    rating: 4.9,
    reviewCount: 196,
    users: 12500,
    defaultQuery:
      'Liste les contacts de mon réseau qui ont changé de poste cette semaine.',
    featured: true
  },
  {
    id: 'work-anniversaries',
    name: 'Anniversaires pro',
    slug: 'melron/work-anniversaries',
    description:
      "Rappels hebdo des anniversaires pro de tes contacts. Excellent prétexte pour reprendre contact sans forcer.",
    icon: 'Calendar',
    gradient: 'from-rose-400 to-pink-500',
    category: 'networking',
    author: 'Melron',
    rating: 4.6,
    reviewCount: 88,
    users: 5400,
    defaultQuery:
      "Liste les contacts qui célèbrent leur anniversaire pro cette semaine."
  },
  {
    id: 'mutual-intros',
    name: "Opportunités d'intro",
    slug: 'melron/mutual-intros',
    description:
      "3 opportunités d'intro warm chaque semaine via tes contacts mutuels chez des entreprises cibles.",
    icon: 'Users',
    gradient: 'from-fuchsia-400 to-pink-500',
    category: 'networking',
    author: 'Melron',
    rating: 4.7,
    reviewCount: 155,
    users: 7800,
    defaultQuery:
      'Identifie 3 opportunités d\'intro cette semaine via mes contacts mutuels.',
    featured: true
  },
  {
    id: 'dormant-contacts',
    name: 'Contacts dormants',
    slug: 'melron/dormant-contacts',
    description:
      "Détecte les contacts importants que tu n'as pas relancés depuis 3+ mois. Suggestion de message inclus.",
    icon: 'Bell',
    gradient: 'from-orange-400 to-red-500',
    category: 'networking',
    author: 'Melron',
    rating: 4.5,
    reviewCount: 72,
    users: 4200,
    defaultQuery:
      "Liste les contacts importants que je n'ai pas relancés depuis 3+ mois."
  },

  // — Recrutement (job seekers) —
  {
    id: 'recruiters-active',
    name: 'Recruteurs actifs',
    slug: 'melron/active-recruiters',
    description:
      'Surveille les recruteurs de ton réseau qui postent des offres ou cherchent des profils chaque semaine.',
    icon: 'UserPlus',
    gradient: 'from-emerald-400 to-teal-500',
    category: 'recruitment',
    author: 'Melron',
    rating: 4.8,
    reviewCount: 1326,
    users: 12400,
    defaultQuery:
      'Liste les recruteurs de mon réseau qui ont posté des offres ou cherché des profils cette semaine.',
    featured: true
  },
  {
    id: 'job-matches',
    name: 'Offres qui matchent',
    slug: 'melron/job-matches',
    description:
      "Scanne LinkedIn, Welcome to the Jungle et 30+ jobboards pour les offres qui collent à ton profil.",
    icon: 'Target',
    gradient: 'from-violet-400 to-indigo-500',
    category: 'recruitment',
    author: 'Melron',
    rating: 4.7,
    reviewCount: 412,
    users: 18200,
    defaultQuery:
      'Trouve les offres publiées cette semaine qui matchent mon profil et mes critères.'
  },
  {
    id: 'salary-benchmark',
    name: 'Benchmark salaire',
    slug: 'melron/salary-benchmark',
    description:
      'Évolution mensuelle des salaires pour ton rôle dans ta ville et séniorité. Données de marché à jour.',
    icon: 'BarChart3',
    gradient: 'from-amber-400 to-orange-500',
    category: 'recruitment',
    author: 'Melron',
    rating: 4.4,
    reviewCount: 64,
    users: 3100,
    defaultQuery:
      'Donne-moi le benchmark salarial actuel pour mon rôle, ma ville et ma séniorité.'
  },
  {
    id: 'hiring-managers',
    name: 'Hiring managers identifiés',
    slug: 'melron/hiring-managers',
    description:
      "Pour chaque offre intéressante de la semaine, identifie le hiring manager et propose un message d'approche.",
    icon: 'Search',
    gradient: 'from-cyan-400 to-blue-500',
    category: 'recruitment',
    author: 'Melron',
    rating: 4.6,
    reviewCount: 109,
    users: 5800,
    defaultQuery:
      'Pour les offres intéressantes de la semaine, identifie les hiring managers et drafte un message.'
  },

  // — Sales / Business Development —
  {
    id: 'target-companies',
    name: 'Entreprises cibles',
    slug: 'melron/target-companies',
    description:
      "Suis l'activité (offres, posts, hires) de tes entreprises cibles. Alerte hebdo personnalisée.",
    icon: 'Building2',
    gradient: 'from-cyan-400 to-teal-500',
    category: 'sales',
    author: 'Melron',
    rating: 4.4,
    reviewCount: 171,
    users: 6900,
    defaultQuery:
      'Quoi de neuf cette semaine sur mes entreprises cibles ? Offres, posts, hires.'
  },
  {
    id: 'icp-prospects',
    name: 'Prospects ICP qualifiés',
    slug: 'melron/icp-prospects',
    description:
      "Trouve chaque semaine 10 nouveaux prospects qui matchent ton ICP avec scoring + raison de contact.",
    icon: 'Target',
    gradient: 'from-pink-400 to-rose-500',
    category: 'sales',
    author: 'Melron',
    rating: 4.8,
    reviewCount: 287,
    users: 14300,
    defaultQuery:
      '10 nouveaux prospects qui matchent mon ICP cette semaine, avec scoring et raison de contact.',
    featured: true
  },
  {
    id: 'buyer-signals',
    name: "Signaux d'achat",
    slug: 'melron/buyer-signals',
    description:
      "Détecte les signaux d'achat (changements stratégiques, hiring, posts) chez tes prospects en cours.",
    icon: 'Flame',
    gradient: 'from-red-400 to-orange-500',
    category: 'sales',
    author: 'Melron',
    rating: 4.7,
    reviewCount: 204,
    users: 9100,
    defaultQuery:
      "Quels signaux d'achat détectes-tu cette semaine chez mes prospects ?"
  },
  {
    id: 'follow-up-reminders',
    name: 'Relances pipeline',
    slug: 'melron/pipeline-followups',
    description:
      "Alerte sur les deals où tu n'as pas relancé depuis X jours. Drafte automatiquement les relances.",
    icon: 'Mail',
    gradient: 'from-yellow-400 to-amber-500',
    category: 'sales',
    author: 'Melron',
    rating: 4.5,
    reviewCount: 96,
    users: 4500,
    defaultQuery:
      "Liste les deals à relancer cette semaine et drafte les messages."
  },

  // — Fundraising —
  {
    id: 'investors-ai',
    name: 'Investisseurs IA',
    slug: 'melron/ai-investors',
    description:
      "Identifie les VCs et BAs actifs sur l'IA dans ton 2e degré. Levées récentes, posts thèses, signaux.",
    icon: 'TrendingUp',
    gradient: 'from-violet-400 to-purple-500',
    category: 'fundraising',
    author: 'Melron',
    rating: 4.7,
    reviewCount: 282,
    users: 8400,
    defaultQuery:
      "Liste les VCs/BAs actifs sur l'IA dans mon 2e degré, avec leurs activités récentes."
  },
  {
    id: 'company-funding',
    name: 'Levées dans mon réseau',
    slug: 'melron/network-fundings',
    description:
      "Track les levées des entreprises où tu connais quelqu'un. Idéal pour pitcher ou se positionner.",
    icon: 'Zap',
    gradient: 'from-amber-400 to-orange-500',
    category: 'fundraising',
    author: 'Melron',
    rating: 4.7,
    reviewCount: 409,
    users: 26300,
    defaultQuery:
      'Quelles entreprises de mon réseau ont levé cette semaine ?',
    featured: true
  },
  {
    id: 'investor-warm-intros',
    name: 'Intros warm vers VCs',
    slug: 'melron/investor-intros',
    description:
      "Identifie les chemins d'intro warm vers les fonds qui matchent ton stage et secteur.",
    icon: 'Compass',
    gradient: 'from-indigo-400 to-violet-500',
    category: 'fundraising',
    author: 'Melron',
    rating: 4.8,
    reviewCount: 121,
    users: 4900,
    defaultQuery:
      "Identifie 5 chemins d'intro warm vers des VCs qui matchent mon stage et secteur."
  },
  {
    id: 'thesis-match',
    name: 'Match de thèse VC',
    slug: 'melron/thesis-match',
    description:
      "Alertes sur les VCs qui publient des thèses ou tweets alignés avec ton produit. Fenêtre d'opportunité.",
    icon: 'Brain',
    gradient: 'from-purple-400 to-fuchsia-500',
    category: 'fundraising',
    author: 'Melron',
    rating: 4.6,
    reviewCount: 78,
    users: 3200,
    defaultQuery:
      'Quels VCs ont publié des thèses ou posts alignés avec mon produit cette semaine ?'
  },

  // — Contenu / Personal branding —
  {
    id: 'viral-posts',
    name: 'Posts viraux du réseau',
    slug: 'melron/viral-posts',
    description:
      "Repère les posts à fort engagement (>100 réactions) dans ton réseau pour commenter au bon moment.",
    icon: 'Radio',
    gradient: 'from-pink-400 to-rose-500',
    category: 'content',
    author: 'Melron',
    rating: 4.6,
    reviewCount: 131,
    users: 12400,
    defaultQuery:
      "Quels posts du réseau ont fait >100 réactions cette semaine ? Propose des commentaires pertinents."
  },
  {
    id: 'content-ideas',
    name: 'Idées de contenu',
    slug: 'melron/content-ideas',
    description:
      "5 idées de posts par semaine basées sur l'actu de ton industrie et ce que ton audience aime.",
    icon: 'PenLine',
    gradient: 'from-yellow-400 to-orange-500',
    category: 'content',
    author: 'Melron',
    rating: 4.5,
    reviewCount: 145,
    users: 8200,
    defaultQuery:
      "Donne-moi 5 idées de posts pour la semaine, basées sur l'actu de mon industrie."
  },
  {
    id: 'engagement-tracker',
    name: 'Tracker engagement',
    slug: 'melron/engagement-tracker',
    description:
      "Stats hebdo de tes posts : top 3 performants, taux d'engagement, suggestions d'amélioration.",
    icon: 'Eye',
    gradient: 'from-emerald-400 to-cyan-500',
    category: 'content',
    author: 'Melron',
    rating: 4.4,
    reviewCount: 56,
    users: 2900,
    defaultQuery:
      'Donne-moi les stats de mes posts cette semaine et 3 suggestions pour la prochaine.'
  },

  // — Veille marché —
  {
    id: 'industry-news',
    name: 'Veille sectorielle',
    slug: 'melron/industry-news',
    description:
      "Synthèse hebdo des news clés de ton industrie : annonces produits, changements stratégiques, mouvements RH.",
    icon: 'Newspaper',
    gradient: 'from-indigo-400 to-blue-600',
    category: 'market',
    author: 'Melron',
    rating: 4.5,
    reviewCount: 42,
    users: 10000,
    defaultQuery:
      "Synthèse des news clés de mon industrie cette semaine."
  },
  {
    id: 'competitor-watch',
    name: 'Veille concurrence',
    slug: 'melron/competitor-watch',
    description:
      "Track les annonces, posts, hires et levées de tes concurrents directs. Détecte les angles d'attaque.",
    icon: 'Eye',
    gradient: 'from-red-400 to-rose-500',
    category: 'market',
    author: 'Melron',
    rating: 4.6,
    reviewCount: 89,
    users: 4700,
    defaultQuery:
      'Quoi de neuf cette semaine chez mes concurrents directs ?'
  },
  {
    id: 'trend-spotting',
    name: 'Détection de tendances',
    slug: 'melron/trend-spotting',
    description:
      "Repère les sujets émergents dans ton industrie avant qu'ils ne deviennent mainstream.",
    icon: 'Sparkles',
    gradient: 'from-purple-400 to-pink-500',
    category: 'market',
    author: 'Melron',
    rating: 4.5,
    reviewCount: 67,
    users: 3400,
    defaultQuery:
      "Quels sujets émergent dans mon industrie en ce moment ?"
  },
  {
    id: 'global-pulse',
    name: 'Pouls global réseau',
    slug: 'melron/global-pulse',
    description:
      "Vue d'ensemble hebdo : signaux faibles, mouvements clés, opportunités à activer cette semaine.",
    icon: 'Globe',
    gradient: 'from-teal-400 to-emerald-500',
    category: 'market',
    author: 'Melron',
    rating: 4.8,
    reviewCount: 234,
    users: 15600,
    defaultQuery:
      "Donne-moi le pouls global de mon réseau cette semaine : signaux, mouvements, opportunités.",
    featured: true
  }
]
