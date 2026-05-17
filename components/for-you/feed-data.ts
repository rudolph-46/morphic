export type FeedItemType =
  | 'lead'
  | 'job'
  | 'signal'
  | 'intro'
  | 'draft'
  | 'heartbeat'

export interface FeedItemTypeMeta {
  id: FeedItemType
  label: string
  emoji: string
  /** Tailwind text color for the badge. */
  color: string
}

export const FEED_TYPES: FeedItemTypeMeta[] = [
  { id: 'lead', label: 'Lead', emoji: '🎯', color: 'text-pink-500' },
  { id: 'job', label: 'Job', emoji: '💼', color: 'text-emerald-500' },
  { id: 'signal', label: 'Signal', emoji: '📡', color: 'text-violet-500' },
  { id: 'intro', label: 'Intro', emoji: '🤝', color: 'text-amber-500' },
  { id: 'draft', label: 'Draft', emoji: '✉️', color: 'text-sky-500' },
  { id: 'heartbeat', label: 'Heartbeat', emoji: '🔄', color: 'text-rose-500' }
]

export type SourceKind =
  | 'linkedin'
  | 'web'
  | 'news'
  | 'crunchbase'
  | 'job_board'
  | 'internal'

export interface FeedSource {
  /** Short label (display name or domain). */
  label: string
  /** Absolute URL. */
  url: string
  /** Origin kind, used for the small icon/colour. */
  kind?: SourceKind
}

export interface FeedItem {
  id: string
  type: FeedItemType
  title: string
  subtitle: string
  /** AI explanation of relevance — the "why now" hook. */
  whyNow: string
  /** AI relevance score 0-10 (one decimal). */
  score: number
  /** Relative time string. */
  time: string
  /** ISO date for sorting + grouping. */
  date: string
  /** Optional URL the primary action will open. */
  primaryUrl?: string
  /** Primary action label (default: "Voir"). */
  primaryAction?: string
  /**
   * Pre-drafted content ready to be sent / posted / applied.
   * Could be a message, a comment, a cover letter, a brief…
   */
  draft?: string
  /** Sources backing the AI recommendation — clickable for the user to audit. */
  sources?: FeedSource[]
}

const today = '2026-05-17'
const yesterday = '2026-05-16'
const thisWeek = '2026-05-14'

export const FEED_ITEMS: FeedItem[] = [
  // — Aujourd'hui
  {
    id: 'f1',
    type: 'lead',
    title: 'Marie Dupont — CTO @ Stripe',
    subtitle: 'Match ICP "founder-friendly tech" · 2 contacts mutuels',
    whyNow: 'A posté hier sur "scaling teams under hyper-growth".',
    score: 9.2,
    time: 'il y a 2 h',
    date: today,
    primaryAction: 'Drafter intro',
    draft:
      "Bonjour Marie,\n\nTon post d'hier sur les défis de scaling m'a beaucoup parlé — on a justement vécu un passage similaire chez Honelia (de 5 à 25 dans l'équipe Tech en 8 mois).\n\nJ'ai une approche un peu différente sur la délégation tech vs produit qui pourrait t'intéresser. 20 min de visio cette semaine pour en discuter ?\n\nRudolph",
    sources: [
      {
        label: 'Post LinkedIn « Scaling teams under hyper-growth »',
        url: 'https://www.linkedin.com/posts/marie-dupont-cto_scaling-teams',
        kind: 'linkedin'
      },
      {
        label: 'Profil LinkedIn — Marie Dupont',
        url: 'https://www.linkedin.com/in/marie-dupont-cto',
        kind: 'linkedin'
      },
      {
        label: 'Stripe — Crunchbase',
        url: 'https://www.crunchbase.com/organization/stripe',
        kind: 'crunchbase'
      }
    ]
  },
  {
    id: 'f2',
    type: 'job',
    title: 'Senior PM @ Doctolib',
    subtitle: 'Paris · 70-90 k€ · remote OK',
    whyNow:
      'Match profil 92 %, hiring manager Antoine R. (1 connexion mutuelle).',
    score: 9.0,
    time: 'il y a 4 h',
    date: today,
    primaryAction: 'Postuler',
    draft:
      "Bonjour Antoine,\n\nVotre offre de Senior PM m'a immédiatement parlé — votre focus sur l'expérience patient + la consolidation API correspond exactement à ce que j'ai construit chez Honelia ces 3 dernières années.\n\nJe joins mon CV et serais ravi d'échanger 30 min sur votre roadmap produit. Disponibilités : jeudi 11h-15h, vendredi après-midi.\n\nMerci,\nRudolph",
    sources: [
      {
        label: 'Offre Doctolib — LinkedIn Jobs',
        url: 'https://www.linkedin.com/jobs/view/senior-pm-doctolib',
        kind: 'job_board'
      },
      {
        label: 'Profil Antoine R. (hiring manager)',
        url: 'https://www.linkedin.com/in/antoine-r',
        kind: 'linkedin'
      },
      {
        label: 'Welcome to the Jungle — Doctolib',
        url: 'https://www.welcometothejungle.com/companies/doctolib',
        kind: 'job_board'
      }
    ]
  },
  {
    id: 'f3',
    type: 'signal',
    title: 'Pierre Lavalle (Kima Ventures)',
    subtitle: 'A posté sur les levées Series A en IA',
    whyNow:
      'Tu as discuté pricing avec lui samedi — opportunité parfaite pour commenter.',
    score: 8.7,
    time: 'il y a 5 h',
    date: today,
    primaryAction: 'Drafter commentaire',
    draft:
      "Excellent retour Pierre 👏 Le passage sur le timing des Series A en pré-product-market-fit résonne fort avec ce qu'on observe sur Honelia. La discipline de la traction MRR > narrative reste sous-estimée. Curieux d'avoir ton avis sur l'inflation des valos seed en parallèle.",
    sources: [
      {
        label: 'Post LinkedIn — Pierre Lavalle',
        url: 'https://www.linkedin.com/posts/pierre-lavalle_series-a-ai',
        kind: 'linkedin'
      },
      {
        label: 'Thèse Kima Ventures 2026',
        url: 'https://kimaventures.com/thesis-2026',
        kind: 'web'
      }
    ]
  },
  {
    id: 'f4',
    type: 'intro',
    title: 'Intro warm chez Spendesk',
    subtitle: 'Via Léa Wong → Marc Leblanc (CTO)',
    whyNow: 'Marc cherche un VP Eng senior depuis 2 semaines.',
    score: 8.5,
    time: 'il y a 6 h',
    date: today,
    primaryAction: 'Demander intro',
    draft:
      "Léa, t'es la meilleure 🙌\n\nJe vois que tu es connectée avec Marc Leblanc (CTO Spendesk). Il cherche un VP Eng depuis 2 semaines et j'ai un profil parfait dans mon réseau (ex-Stripe, scaled une équipe 80+).\n\nTu peux nous mettre en lien rapidement ? Je drafte un message d'intro si ça t'aide.\n\nMerci !\nRudolph",
    sources: [
      {
        label: 'Offre VP Eng Spendesk',
        url: 'https://www.spendesk.com/careers/vp-engineering',
        kind: 'job_board'
      },
      {
        label: 'Profil Marc Leblanc',
        url: 'https://www.linkedin.com/in/marc-leblanc',
        kind: 'linkedin'
      },
      {
        label: 'Profil Léa Wong (intro)',
        url: 'https://www.linkedin.com/in/lea-wong',
        kind: 'linkedin'
      }
    ]
  },
  {
    id: 'f5',
    type: 'draft',
    title: 'Relance Sarah Martin (Acme SaaS)',
    subtitle: 'Pas répondu depuis 12 jours · deal Honelia en closing',
    whyNow: "Le pricing a été envoyé samedi, signal d'achat encore chaud.",
    score: 8.3,
    time: 'il y a 8 h',
    date: today,
    primaryAction: 'Envoyer',
    draft:
      "Bonjour Sarah,\n\nJe me permets une petite relance — j'ai vu que tu as posté hier sur les défis de scaling, signe que la roadmap se concrétise.\n\nLe pricing custom Honelia (€45 k MRR) est toujours valable. Si tu veux un call rapide pour aligner sur le calendrier d'onboarding, je peux me caler demain ou vendredi.\n\nÀ très vite,\nRudolph",
    sources: [
      {
        label: 'Profil Sarah Martin — Acme SaaS',
        url: 'https://www.linkedin.com/in/sarah-martin-cto',
        kind: 'linkedin'
      },
      {
        label: 'Conversation précédente (Inbox)',
        url: '/inbox?conv=m1',
        kind: 'internal'
      },
      {
        label: 'Pricing custom envoyé · Notes',
        url: '/notes',
        kind: 'internal'
      }
    ]
  },

  // — Hier
  {
    id: 'f6',
    type: 'heartbeat',
    title: 'Recruteurs actifs cette semaine',
    subtitle: '8 nouveaux recruteurs ont posté ou contacté du monde',
    whyNow: 'Heartbeat "Recruteurs actifs" — run quotidien.',
    score: 7.8,
    time: 'hier',
    date: yesterday,
    primaryAction: 'Voir tous',
    draft:
      "8 recruteurs LinkedIn actifs cette semaine sur ton segment :\n\n• Camille Dupont (TheFamily) — cherche VP Eng senior\n• Thomas P. (Spendesk Talent) — Senior PM × 2\n• Anna B. (Doctolib) — Head of Platform\n• ... (+5 autres)\n\n→ 3 de ces postes ont un hiring manager dans ton 2e degré : potentiel d'intro warm.",
    sources: [
      {
        label: 'Heartbeat « Recruteurs actifs » · runs',
        url: '/heartbeat',
        kind: 'internal'
      },
      {
        label: 'Camille Dupont',
        url: 'https://www.linkedin.com/in/camille-dupont',
        kind: 'linkedin'
      },
      {
        label: 'Thomas P.',
        url: 'https://www.linkedin.com/in/thomas-p',
        kind: 'linkedin'
      }
    ]
  },
  {
    id: 'f7',
    type: 'lead',
    title: 'Sofia Ramirez — CPO @ PayFit',
    subtitle: 'Profil aligné, levée Series C récente',
    whyNow: 'A liké 3 de tes posts ce mois-ci — réceptive à une approche.',
    score: 7.6,
    time: 'hier',
    date: yesterday,
    primaryAction: 'Drafter intro',
    draft:
      "Salut Sofia,\n\nMerci pour tes likes récents 🙏 — j'ai vu que vous veniez de boucler votre Series C, félicitations à toute l'équipe.\n\nJe construis Honelia (IA networker pour founders), et ton expertise produit chez PayFit serait précieuse sur quelques choix UX qu'on fait actuellement. Tu serais ouverte à 20 min de discussion ?\n\nRudolph",
    sources: [
      {
        label: 'Profil Sofia Ramirez',
        url: 'https://www.linkedin.com/in/sofia-ramirez-cpo',
        kind: 'linkedin'
      },
      {
        label: 'PayFit Series C — TechCrunch',
        url: 'https://techcrunch.com/payfit-series-c',
        kind: 'news'
      },
      {
        label: 'PayFit — Crunchbase',
        url: 'https://www.crunchbase.com/organization/payfit',
        kind: 'crunchbase'
      }
    ]
  },
  {
    id: 'f8',
    type: 'signal',
    title: 'Antoine Royer (Swile) — changement de poste',
    subtitle: 'Devient VP Product chez Alma',
    whyNow:
      'Moment idéal pour le féliciter et ouvrir une conversation business.',
    score: 7.4,
    time: 'hier',
    date: yesterday,
    primaryAction: 'Drafter félicitations',
    draft:
      "Hello Antoine,\n\nGrosse nouvelle ! 🎉 Félicitations pour ton arrivée chez Alma — le timing avec leur expansion européenne est parfait.\n\nOn devrait reprendre le café qu'on s'était promis avant ton départ de Swile. Cette semaine ou la prochaine ?\n\nRudolph",
    sources: [
      {
        label: 'Annonce LinkedIn — Antoine Royer',
        url: 'https://www.linkedin.com/posts/antoine-royer_new-role-alma',
        kind: 'linkedin'
      },
      {
        label: 'Profil Antoine Royer',
        url: 'https://www.linkedin.com/in/antoine-royer',
        kind: 'linkedin'
      }
    ]
  },
  {
    id: 'f9',
    type: 'job',
    title: 'Head of Platform @ Alma',
    subtitle: 'Paris · 100-130 k€',
    whyNow: 'Récemment publié · ton réseau a 3 contacts chez Alma.',
    score: 7.2,
    time: 'hier',
    date: yesterday,
    primaryAction: 'Postuler',
    draft:
      "Bonjour,\n\nVotre offre de Head of Platform attire toute mon attention — j'ai construit chez Honelia une plateforme distribuée gérant +10 M events/mois et je connais bien les enjeux de scalabilité d'Alma (via Antoine Royer qui vient de vous rejoindre).\n\nCV joint, disponible pour échanger dès cette semaine.\n\nCordialement,\nRudolph",
    sources: [
      {
        label: 'Offre Alma — LinkedIn Jobs',
        url: 'https://www.linkedin.com/jobs/view/head-of-platform-alma',
        kind: 'job_board'
      },
      {
        label: 'Alma — Welcome to the Jungle',
        url: 'https://www.welcometothejungle.com/companies/alma',
        kind: 'job_board'
      }
    ]
  },

  // — Cette semaine
  {
    id: 'f10',
    type: 'signal',
    title: 'Mistral AI lève 600 M€ — Series B',
    subtitle: 'Annonce officielle ce matin',
    whyNow: '4 contacts de ton réseau y travaillent — opportunités business.',
    score: 6.9,
    time: '3 j',
    date: thisWeek,
    primaryAction: 'Voir contacts',
    draft:
      "Mistral AI vient de lever 600 M€ en Series B. 4 de tes contacts y travaillent :\n\n• Julien C. (CTO) — connecté en 1er degré\n• Aïcha M. (Head of Research) — 2e degré via Pierre Lavalle\n• Mathieu S. (Senior ML Eng) — 1er degré\n• Hugo R. (PM) — 2e degré via Sofia Ramirez\n\n→ Julien et Mathieu sont les meilleurs entry points pour un partenariat technique.",
    sources: [
      {
        label: 'Annonce officielle Mistral AI',
        url: 'https://mistral.ai/news/series-b',
        kind: 'web'
      },
      {
        label: 'Coverage TechCrunch',
        url: 'https://techcrunch.com/mistral-series-b-600m',
        kind: 'news'
      },
      {
        label: 'Mistral AI — Crunchbase',
        url: 'https://www.crunchbase.com/organization/mistral-ai',
        kind: 'crunchbase'
      }
    ]
  },
  {
    id: 'f11',
    type: 'intro',
    title: 'Intro warm chez Qonto',
    subtitle: 'Via Julie Lambert → équipe IT',
    whyNow: 'Julie a parlé de ton produit à leur CTO la semaine dernière.',
    score: 6.7,
    time: '3 j',
    date: thisWeek,
    primaryAction: 'Demander intro',
    draft:
      "Salut Julie,\n\nMerci encore d'avoir parlé de Honelia à l'équipe IT de Qonto la semaine dernière 🙏\n\nTu pourrais nous mettre directement en lien avec leur CTO ? Je leur prépare une présentation produit ciblée sur leurs besoins.\n\nMerci !\nRudolph",
    sources: [
      {
        label: 'Profil Julie Lambert',
        url: 'https://www.linkedin.com/in/julie-lambert',
        kind: 'linkedin'
      },
      {
        label: 'Qonto — site officiel',
        url: 'https://qonto.com',
        kind: 'web'
      }
    ]
  },
  {
    id: 'f12',
    type: 'heartbeat',
    title: 'Pouls global réseau · semaine 20',
    subtitle: '3 levées · 7 changements de poste · 12 signaux chauds',
    whyNow: 'Heartbeat "Pouls global" — synthèse hebdo.',
    score: 6.5,
    time: '4 j',
    date: thisWeek,
    primaryAction: 'Voir le rapport',
    draft:
      "**Pouls réseau · semaine 20**\n\n💰 Levées (3) : Mistral 600 M€, Alan 50 M€, Spendesk 100 M€\n\n🔄 Changements de poste (7) :\n• Antoine Royer → Alma (VP Product)\n• Léa Wong → Spendesk (Head of Growth)\n• ...\n\n🔥 Signaux chauds (12) :\n• 4 posts viraux dans ton réseau\n• 5 hiring intent détectés\n• 3 RFP publics matchant ton ICP",
    sources: [
      {
        label: 'Heartbeat « Pouls global » · run',
        url: '/heartbeat',
        kind: 'internal'
      },
      {
        label: 'Mistral lève 600 M€',
        url: 'https://techcrunch.com/mistral-series-b-600m',
        kind: 'news'
      },
      {
        label: 'Alan Series F',
        url: 'https://techcrunch.com/alan-series-f',
        kind: 'news'
      }
    ]
  }
]

export function getTypeMeta(id: FeedItemType): FeedItemTypeMeta {
  return FEED_TYPES.find(t => t.id === id) ?? FEED_TYPES[0]
}

export function groupByDay(items: FeedItem[]): {
  label: string
  items: FeedItem[]
}[] {
  const groups = new Map<string, FeedItem[]>()
  for (const item of items) {
    const list = groups.get(item.date) ?? []
    list.push(item)
    groups.set(item.date, list)
  }
  const sortedDates = Array.from(groups.keys()).sort().reverse()
  const todayIso = today
  const yesterdayIso = yesterday
  return sortedDates.map(date => ({
    label:
      date === todayIso
        ? "Aujourd'hui"
        : date === yesterdayIso
          ? 'Hier'
          : new Date(date).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long'
            }),
    items: groups.get(date)!
  }))
}
