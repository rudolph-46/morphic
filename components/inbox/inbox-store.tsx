'use client'

import { useSearchParams } from 'next/navigation'

import {
  Archive,
  Banknote,
  Briefcase,
  CalendarClock,
  Coffee,
  Eye,
  Gift,
  GraduationCap,
  Handshake,
  Repeat,
  Users,
  Zap
} from 'lucide-react'

import type { InboxTag } from '@/lib/inbox/auto-tag'

import { LinkedinInbox } from './linkedin-inbox'

type ViewKey = 'all' | InboxTag

interface HeroCopy {
  icon: typeof Users
  iconColor: string
  title: string
  subtitle: string
}

const HERO: Record<ViewKey, HeroCopy> = {
  all: {
    icon: Users,
    iconColor: 'text-sky-500',
    title: 'Mon Réseau',
    subtitle:
      'Ton stock de relations LinkedIn, trié par priorité IA. Clique sur quelqu’un et demande à Melron qui matters, why now, what to do next.'
  },
  traiter_aujourdhui: {
    icon: Zap,
    iconColor: 'text-rose-500',
    title: 'À traiter aujourd’hui',
    subtitle:
      'Les personnes qui demandent une action de ta part maintenant. Ne laisse pas refroidir.'
  },
  planifier: {
    icon: CalendarClock,
    iconColor: 'text-sky-500',
    title: 'À planifier',
    subtitle:
      'Conversations qui méritent un créneau dédié. Bloque-toi du temps avant d’attaquer.'
  },
  relancer: {
    icon: Repeat,
    iconColor: 'text-amber-500',
    title: 'À relancer',
    subtitle:
      'Discussions en attente d’une relance. Rouvre, garde le contact, ne laisse pas mourir.'
  },
  engagements: {
    icon: Gift,
    iconColor: 'text-violet-500',
    title: 'Engagements',
    subtitle:
      'Promesses tenues, suivi attendu. Ces personnes attendent quelque chose de toi.'
  },
  lire: {
    icon: Eye,
    iconColor: 'text-emerald-500',
    title: 'À lire',
    subtitle:
      'Messages à parcourir calmement quand tu auras un moment. Pas urgent, mais à voir.'
  },
  archive: {
    icon: Archive,
    iconColor: 'text-muted-foreground',
    title: 'Archive',
    subtitle:
      'Tout ce que tu as classé pour plus tard. Le passé organisé, à portée de recherche.'
  },
  recruteur: {
    icon: Briefcase,
    iconColor: 'text-blue-500',
    title: 'Recruteurs',
    subtitle:
      'Les recruteurs dans ton réseau. Cultive-les avant d’en avoir besoin.'
  },
  lead_commercial: {
    icon: Banknote,
    iconColor: 'text-emerald-500',
    title: 'Leads commerciaux',
    subtitle:
      'Opportunités business actives ou en éveil. Suis le pipe, demande à Melron quoi faire ensuite.'
  },
  intro: {
    icon: Handshake,
    iconColor: 'text-violet-500',
    title: 'Demandes intro',
    subtitle:
      'Personnes qui t’ont demandé une intro, ou à qui tu en dois une. Honore la promesse.'
  },
  mentorat: {
    icon: GraduationCap,
    iconColor: 'text-indigo-500',
    title: 'Mentorat',
    subtitle:
      'Relations de mentorat — donneur ou receveur. Cultive la qualité, pas le volume.'
  },
  networking: {
    icon: Coffee,
    iconColor: 'text-stone-500',
    title: 'Networking',
    subtitle:
      'Tes connexions networking long-terme. Pas de pipe immédiat, juste des graines à planter.'
  }
}

export function InboxStore() {
  const searchParams = useSearchParams()
  const view = (searchParams.get('view') ?? 'all') as ViewKey
  const copy = HERO[view] ?? HERO.all
  const Icon = copy.icon

  return (
    <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
      <div className="px-8 pt-8 pb-4 shrink-0">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3 mb-2">
          <Icon className={`size-7 ${copy.iconColor}`} />
          {copy.title}
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          {copy.subtitle}
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <LinkedinInbox />
      </div>
    </div>
  )
}
