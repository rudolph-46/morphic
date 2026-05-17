'use client'

import { useEffect, useRef, useState } from 'react'

import {
  Archive,
  ArrowUp,
  Calendar,
  Check,
  Clock,
  Command,
  Filter,
  Flame,
  Inbox,
  Linkedin,
  type LucideIcon,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Pin,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Star,
  X} from 'lucide-react'

import { cn } from '@/lib/utils'


// — Types —
type Sender = 'me' | 'them'

interface ThreadMessage {
  from: Sender
  time: string
  text: string
}

interface ReplyDraft {
  tone: string
  text: string
}

interface MessageContext {
  relationship: string
  lastTouch: string
  dealStage: string
  signal: string
  history: string
}

interface InboxMessage {
  id: string
  name: string
  role: string
  avatar: string
  avatarBg: string
  time: string
  preview: string
  unread: boolean
  thread: ThreadMessage[]
  context: MessageContext
  replies: ReplyDraft[]
}

interface CategoryDef {
  id: CategoryId
  icon: LucideIcon
  label: string
  count: number
  color: string
}

type CategoryId =
  | 'urgent'
  | 'important'
  | 'inProgress'
  | 'new'
  | 'toFollowUp'
  | 'lowValue'

interface AiMessage {
  role: 'user' | 'ai'
  content: string
}

// — Mock data —
const CATEGORIES: CategoryDef[] = [
  { id: 'urgent', icon: Flame, label: 'Urgent', count: 3, color: 'text-rose-500' },
  { id: 'important', icon: Star, label: 'Important', count: 8, color: 'text-amber-500' },
  { id: 'inProgress', icon: MessageSquare, label: 'En cours', count: 12, color: 'text-sky-500' },
  { id: 'new', icon: Inbox, label: 'Nouveau', count: 5, color: 'text-muted-foreground' },
  { id: 'toFollowUp', icon: Clock, label: 'À relancer', count: 6, color: 'text-violet-500' },
  { id: 'lowValue', icon: Archive, label: 'Faible valeur', count: 13, color: 'text-muted-foreground/60' }
]

const MESSAGES: Partial<Record<CategoryId, InboxMessage[]>> = {
  urgent: [
    {
      id: 'm1',
      name: 'Sarah Martin',
      role: 'CTO @ Acme SaaS · Lyon',
      avatar: 'SM',
      avatarBg: 'from-rose-200 to-rose-300',
      time: '12 min',
      preview:
        'Je peux faire le call demain 14h pour finaliser le contrat. Tu confirmes ?',
      unread: true,
      thread: [
        { from: 'them', time: 'Il y a 3 semaines', text: "Salut Rudolph ! Jean m'a parlé de ton produit Honelia. On en discute ?" },
        { from: 'me', time: 'Il y a 3 semaines', text: 'Avec plaisir Sarah ! Je peux te montrer une démo cette semaine si tu veux.' },
        { from: 'them', time: 'Il y a 2 semaines', text: "J'ai vu la démo, c'est très solide. Mais ce n'est pas le bon moment pour nous. On en reparle au prochain trimestre ?" },
        { from: 'me', time: 'Il y a 12 jours', text: 'Pas de souci. Je te recontacte début juin avec une proposition adaptée à votre roadmap.' },
        { from: 'them', time: '12 min', text: 'Je peux faire le call demain 14h pour finaliser le contrat. Tu confirmes ?' }
      ],
      context: {
        relationship: 'Connectés via Jean Dupont · il y a 2 mois',
        lastTouch: 'Réponse il y a 12 jours · 4 messages échangés',
        dealStage: 'Pitch Honelia · €45k MRR potentiel · stage : closing',
        signal: 'A posté avant-hier sur "scaling team challenges"',
        history: 'Vous lui aviez envoyé le pricing custom samedi dernier'
      },
      replies: [
        { tone: 'Direct & positif', text: "Parfait Sarah, je confirme pour demain 14h. Je t'envoie le lien Meet juste après ce message. À demain !" },
        { tone: 'Chaleureux', text: "Top Sarah ! Avec plaisir pour demain 14h. J'ai préparé le pricing custom dont on avait parlé — on regarde ça ensemble." },
        { tone: 'Stratégique', text: 'Hello Sarah, 14h ça marche. Petite question pour bien préparer : on aligne sur le scope final ou on garde les options ouvertes ?' }
      ]
    },
    {
      id: 'm2',
      name: 'Pierre Lavalle',
      role: 'Investor @ Kima Ventures',
      avatar: 'PL',
      avatarBg: 'from-amber-200 to-orange-300',
      time: '1 h',
      preview:
        "On peut faire un call cette semaine ? J'ai partagé Honelia avec un autre partner...",
      unread: true,
      thread: [
        { from: 'them', time: 'Il y a 1 mois', text: "Salut Rudolph, j'ai vu ton post sur Honelia. Tu lèves bientôt ?" },
        { from: 'me', time: 'Il y a 1 mois', text: 'Pas en levée active, mais ouvert aux discussions. Tu veux qu\'on en parle ?' },
        { from: 'them', time: 'Il y a 3 semaines', text: 'Oui, envoie-moi un deck quand tu peux.' },
        { from: 'me', time: 'Il y a 2 semaines', text: 'Voici le deck. 9 hôtels payants, 12k€ MRR, croissance 30% MoM.' },
        { from: 'them', time: '1 h', text: "On peut faire un call cette semaine ? J'ai partagé Honelia avec un autre partner — il aime beaucoup." }
      ],
      context: {
        relationship: 'Premier contact via LinkedIn · il y a 1 mois',
        lastTouch: 'Tu as envoyé le deck il y a 2 semaines',
        dealStage: 'Levée seed potentielle · signal très positif',
        signal: 'A partagé avec son équipe = intérêt confirmé',
        history: 'Kima Ventures investit 150k-500k en early stage'
      },
      replies: [
        { tone: 'Enthousiaste', text: "Excellent Pierre ! Je suis dispo jeudi 11h ou vendredi 15h. Tu m'envoies une invit ?" },
        { tone: 'Pro & mesuré', text: 'Merci Pierre. Je peux jeudi ou vendredi après-midi. Tu peux me dire qui sera dans le call et ce que vous voulez creuser ?' },
        { tone: 'Curieux', text: "Top, ravi que ça t'ait plu. Cette semaine ça marche. C'est quoi le partner qui aime ? J'aime bien savoir à qui je parle." }
      ]
    },
    {
      id: 'm3',
      name: 'Aminata Diop',
      role: 'Directrice @ Hôtel Akwa Palace',
      avatar: 'AD',
      avatarBg: 'from-emerald-200 to-teal-300',
      time: '3 h',
      preview:
        'Bonjour Rudolph, on a un problème urgent sur le module réservations Honelia...',
      unread: false,
      thread: [
        { from: 'them', time: 'Il y a 4 mois', text: 'Bonjour, je suis intéressée par Honelia pour notre hôtel à Douala.' },
        { from: 'me', time: 'Il y a 4 mois', text: 'Bonjour Aminata ! Je vous propose un onboarding gratuit. Vous êtes dispo cette semaine ?' },
        { from: 'them', time: 'Il y a 3 mois', text: 'Onboarding fait, nous sommes opérationnels. Merci !' },
        { from: 'them', time: '3 h', text: "Bonjour Rudolph, on a un problème urgent sur le module réservations Honelia. Les emails Booking ne sont plus parsés depuis ce matin. C'est bloquant." }
      ],
      context: {
        relationship: 'Cliente Honelia depuis 3 mois · plan Pro',
        lastTouch: 'Cliente active · 0 ticket support jusqu\'ici',
        dealStage: 'Cliente payante · €99/mois · NPS 9/10',
        signal: 'Problème technique critique en production',
        history: 'Apify scraping a peut-être eu un incident — vérifier logs Convex'
      },
      replies: [
        { tone: 'Action immédiate', text: 'Bonjour Aminata, je regarde ça immédiatement. Je reviens vers vous dans les 30 min avec un état des lieux et une solution.' },
        { tone: 'Rassurant', text: 'Aminata, je suis sur le sujet. Je vérifie le pipeline Resend → Convex maintenant. Je vous appelle si besoin de plus d\'infos.' },
        { tone: 'Diagnostic', text: 'Bonjour Aminata, urgent compris. Quelques questions rapides : depuis quelle heure exactement ? Sur tous les OTAs ou juste Booking ? Captures d\'écran possibles ?' }
      ]
    }
  ]
}

const AI_SUGGESTIONS = [
  'Résume cette conversation',
  'Qui est cette personne ?',
  'Prépare-moi pour le call',
  "Trouve d'autres prospects comme Sarah"
]

// — Component —
type SyncStatus = 'idle' | 'syncing' | 'error'

export function MelronInbox() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('urgent')
  const [selectedMessage, setSelectedMessage] = useState('m1')
  const [aiInput, setAiInput] = useState('')
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([])
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncProgress, setSyncProgress] = useState(0)
  const [lastSyncAt, setLastSyncAt] = useState<Date>(() => new Date(Date.now() - 2 * 60 * 1000))
  const aiScrollRef = useRef<HTMLDivElement>(null)

  const handleResync = () => {
    if (syncStatus === 'syncing') return
    setSyncStatus('syncing')
    setSyncProgress(0)
    // Mock progress — replace with real Unipile/Gmail sync later.
    let p = 0
    const interval = setInterval(() => {
      p += Math.random() * 15 + 5
      if (p >= 100) {
        p = 100
        setSyncProgress(100)
        clearInterval(interval)
        setTimeout(() => {
          setSyncStatus('idle')
          setLastSyncAt(new Date())
          setSyncProgress(0)
        }, 400)
      } else {
        setSyncProgress(Math.round(p))
      }
    }, 200)
  }

  const lastSyncLabel = (() => {
    const diff = Math.floor((Date.now() - lastSyncAt.getTime()) / 1000)
    if (diff < 60) return `il y a ${diff} s`
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
    return `il y a ${Math.floor(diff / 3600)} h`
  })()

  const currentMessages = MESSAGES[activeCategory] ?? MESSAGES.urgent ?? []
  const selected =
    currentMessages.find(m => m.id === selectedMessage) ?? currentMessages[0]

  useEffect(() => {
    if (aiScrollRef.current) {
      aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight
    }
  }, [aiMessages, isAiThinking])

  const handleAiSubmit = (text: string) => {
    if (!text.trim() || !selected) return
    setAiMessages(prev => [...prev, { role: 'user', content: text }])
    setAiInput('')
    setIsAiThinking(true)

    setTimeout(() => {
      const lower = text.toLowerCase()
      let response: string
      if (lower.includes('résume') || lower.includes('resume')) {
        response = `Voici le résumé avec **${selected.name}** :\n\n• Premier contact il y a 2 mois via Jean Dupont\n• Tu as pitché Honelia → intéressée mais "pas le bon moment"\n• Tu lui as envoyé le pricing custom samedi dernier\n• Maintenant elle demande un call demain 14h pour **finaliser le contrat**\n\nSignal clair : elle est prête à closer. Confirme rapidement et prépare ton agenda du call.`
      } else if (lower.includes('qui est') || lower.includes('profil')) {
        response = `**${selected.name}** — ${selected.role}\n\n📍 Connexion mutuelle : Jean Dupont (que tu connais bien)\n💼 CTO depuis 3 ans chez Acme SaaS, ex-Stripe, ex-Algolia\n🎓 EPITA promo 2014\n📊 Acme SaaS = 80 employés, scale-up B2B\n💬 Active sur LinkedIn (2-3 posts/semaine sur scaling teams)\n\nC'est un profil **technique senior + décisionnaire budget**. Le call demain est clairement un signal d'achat.`
      } else if (lower.includes('prépare') || lower.includes('call')) {
        response = `**Briefing pour le call de demain 14h avec ${selected.name}** :\n\n🎯 **Objectif** : signer. Pas re-pitcher.\n\n📋 **Points à couvrir** :\n1. Confirmer le scope final (modules choisis)\n2. Valider le pricing (€45k MRR ou ajustement ?)\n3. Calendrier d'onboarding\n4. Conditions de paiement\n\n⚠️ **Risque** : si elle re-pose des questions techniques, c'est qu'elle hésite encore.\n\n✅ **Document à préparer** : version finale du contrat Honelia Enterprise.`
      } else if (lower.includes('autres prospects') || lower.includes('similaire')) {
        response = `J'ai trouvé **5 CTOs** dans ton réseau avec un profil proche de ${selected.name} :\n\n1. **Marc Leblanc** — CTO @ Spendesk · Paris\n2. **Lucie Wang** — CTO @ Alma · Paris\n3. **Thomas Petit** — VP Eng @ Doctolib\n4. **Sofia Ramirez** — CTO @ PayFit\n5. **Antoine Royer** — CTO @ Swile\n\nTu veux que je prépare un message d'approche personnalisé pour les 5 ?`
      } else {
        response = `J'ai analysé ta question. Pour ${selected.name} et le contexte actuel : elle attend une **réponse rapide**. Plus tu réponds vite, plus le signal de fiabilité est fort.\n\nUtilise une des 3 réponses suggérées en bas, ou demande-moi d'écrire quelque chose de plus spécifique.`
      }
      setAiMessages(prev => [...prev, { role: 'ai', content: response }])
      setIsAiThinking(false)
    }, 1200)
  }

  if (!selected) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Aucun message
      </div>
    )
  }

  return (
    <div className="relative flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden px-3 pt-3 pb-0 gap-3">
      <div className="flex flex-1 min-w-0 min-h-0 overflow-hidden rounded-lg border flex-col">
      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
      {/* COLUMN 1 — Categories */}
      <aside className="w-52 shrink-0 border-r bg-muted/30 flex flex-col">
        <div className="p-3">
          <button className="w-full inline-flex items-center justify-center gap-2 py-2 bg-foreground text-background rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus className="size-3.5" />
            Nouvelle conversation
          </button>
        </div>

        <div className="px-2 py-1">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Linkedin className="size-3.5 text-[#0A66C2]" />
            <span className="text-xs font-semibold">LinkedIn</span>
            <span className="ml-auto text-xs text-muted-foreground">47</span>
          </div>
        </div>

        <nav className="px-2 space-y-0.5 flex-1 overflow-y-auto">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id)
                  setSelectedMessage(MESSAGES[cat.id]?.[0]?.id ?? 'm1')
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors text-left',
                  isActive
                    ? 'bg-card shadow-sm font-medium'
                    : 'hover:bg-card/60 text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn('size-3.5', cat.color)} />
                <span className="flex-1">{cat.label}</span>
                <span className="text-xs text-muted-foreground">
                  {cat.count}
                </span>
              </button>
            )
          })}
        </nav>

        <div className="p-3 border-t">
          <div className="rounded-lg border bg-card p-2.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                {syncStatus === 'syncing' ? (
                  <RefreshCw className="size-3 text-sky-500 animate-spin shrink-0" />
                ) : (
                  <Check className="size-3 text-emerald-500 shrink-0" />
                )}
                <span className="text-[11px] font-medium truncate">
                  {syncStatus === 'syncing'
                    ? `Synchronisation… ${syncProgress}%`
                    : 'À jour'}
                </span>
              </div>
              <button
                onClick={handleResync}
                disabled={syncStatus === 'syncing'}
                className="text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
              >
                Resynchroniser
              </button>
            </div>
            {syncStatus === 'syncing' ? (
              <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 transition-all duration-200"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground">
                Dernière synchro {lastSyncLabel}
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* COLUMN 2 — Message list */}
      <section className="w-80 shrink-0 border-r bg-card flex flex-col">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="size-4 text-rose-500" />
            <span className="font-semibold text-sm">
              {CATEGORIES.find(c => c.id === activeCategory)?.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {currentMessages.length} messages
            </span>
          </div>
          <button className="p-1 hover:bg-muted rounded">
            <Filter className="size-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="px-3 py-2 border-b flex items-center gap-2 bg-muted/30">
          <Sparkles className="size-3 text-amber-500 shrink-0" />
          <span className="text-[11px] text-muted-foreground leading-tight">
            Trié par priorité IA · basé sur vos deals en cours
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {currentMessages.map(msg => {
            const isSelected = selectedMessage === msg.id
            return (
              <button
                key={msg.id}
                onClick={() => setSelectedMessage(msg.id)}
                className={cn(
                  'w-full text-left px-4 py-3 border-b transition-colors',
                  isSelected ? 'bg-muted' : 'hover:bg-muted/50'
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'size-9 rounded-full bg-gradient-to-br flex items-center justify-center shrink-0',
                      msg.avatarBg
                    )}
                  >
                    <span className="text-xs font-semibold text-stone-700">
                      {msg.avatar}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span
                        className={cn(
                          'text-sm truncate',
                          msg.unread ? 'font-semibold' : 'font-medium'
                        )}
                      >
                        {msg.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {msg.time}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mb-1 truncate">
                      {msg.role}
                    </div>
                    <p
                      className={cn(
                        'text-xs leading-snug line-clamp-2',
                        msg.unread ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {msg.preview}
                    </p>
                    {msg.unread && (
                      <div className="mt-1.5 flex items-center gap-1">
                        <div className="size-1.5 bg-rose-500 rounded-full" />
                        <span className="text-[10px] uppercase tracking-wider text-rose-500 font-medium">
                          Non lu
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* COLUMN 3 — Conversation */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Conversation header */}
        <div className="px-6 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'size-10 rounded-full bg-gradient-to-br flex items-center justify-center',
                selected.avatarBg
              )}
            >
              <span className="text-sm font-semibold text-stone-700">
                {selected.avatar}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{selected.name}</span>
                <Linkedin className="size-3 text-[#0A66C2]" />
              </div>
              <div className="text-xs text-muted-foreground">
                {selected.role}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 hover:bg-muted rounded-md" title="Épingler">
              <Pin className="size-4 text-muted-foreground" />
            </button>
            <button className="p-1.5 hover:bg-muted rounded-md" title="Programmer">
              <Calendar className="size-4 text-muted-foreground" />
            </button>
            <button className="p-1.5 hover:bg-muted rounded-md" title="Archiver">
              <Archive className="size-4 text-muted-foreground" />
            </button>
            <button className="p-1.5 hover:bg-muted rounded-md">
              <MoreHorizontal className="size-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Thread */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {selected.thread.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'flex',
                msg.from === 'me' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[70%] flex flex-col',
                  msg.from === 'me' ? 'items-end' : 'items-start'
                )}
              >
                <div
                  className={cn(
                    'px-4 py-2.5 rounded-2xl',
                    msg.from === 'me'
                      ? 'bg-foreground text-background rounded-br-sm'
                      : 'bg-muted rounded-bl-sm'
                  )}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                  {msg.time}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* AI reply suggestions */}
        <div className="border-t bg-muted/30 px-6 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="size-3 text-foreground" />
            <span className="text-[10px] uppercase tracking-widest font-semibold">
              3 réponses suggérées
            </span>
            <button className="ml-auto text-[10px] text-muted-foreground hover:text-foreground">
              Régénérer
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {selected.replies.map((reply, i) => (
              <button
                key={i}
                className="text-left p-2.5 bg-card border rounded-lg hover:border-foreground/40 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                    {reply.tone}
                  </span>
                  <Send className="size-2.5 text-muted-foreground group-hover:text-foreground" />
                </div>
                <p className="text-[11px] text-foreground/85 leading-snug line-clamp-3">
                  {reply.text}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Compose — same style as the main chat prompt input */}
        <div className="border-t px-4 py-3">
          <div className="relative flex flex-col w-full gap-2 bg-muted rounded-3xl border border-input transition-shadow focus-within:ring-1 focus-within:ring-ring/20 focus-within:ring-offset-1 focus-within:ring-offset-background/50">
            <textarea
              rows={2}
              placeholder="Écrire un message ou cliquer sur une suggestion ↑"
              className="resize-none w-full min-h-12 max-h-40 bg-transparent border-0 p-3 md:p-4 text-sm placeholder:text-muted-foreground focus-visible:outline-hidden"
            />
            <div className="flex items-center justify-between p-2 md:p-3">
              <button
                type="button"
                className="size-8 md:size-9 inline-flex items-center justify-center rounded-full hover:bg-background transition-colors"
                title="Joindre un fichier"
              >
                <Paperclip className="size-4 text-muted-foreground" />
              </button>
              <button
                type="button"
                className="size-8 md:size-10 inline-flex items-center justify-center rounded-full bg-foreground text-background hover:opacity-90 transition-opacity"
                title="Envoyer"
              >
                <Send className="size-4 md:size-5" />
              </button>
            </div>
          </div>
        </div>
      </main>
      </div>
      </div>

      {/* Floating action button to open the AI panel */}
      {!aiPanelOpen && (
        <button
          type="button"
          onClick={() => setAiPanelOpen(true)}
          className={cn(
            'absolute z-40 right-6 bottom-6 flex items-center gap-2 px-4 py-2.5',
            'rounded-full bg-foreground text-background shadow-2xl',
            'hover:scale-105 transition-transform',
            'animate-in fade-in-0 slide-in-from-bottom-4 duration-200'
          )}
          aria-label="Ouvrir Melron AI"
        >
          <Sparkles className="size-4 text-amber-300" />
          <span className="text-sm font-medium">Melron AI</span>
        </button>
      )}

      {/* Floating AI Panel — 80% height × 30% width, anchored bottom-right */}
      {aiPanelOpen && (
        <>
          {/* Click-outside backdrop (transparent) */}
          <div
            className="absolute inset-0 z-40"
            onClick={() => setAiPanelOpen(false)}
            aria-hidden
          />
          <aside
            className={cn(
              'absolute z-50 right-4 bottom-4 flex flex-col bg-background border rounded-xl shadow-2xl overflow-hidden',
              'h-[80%] w-[30%] min-w-[360px] max-w-[520px]',
              'animate-in fade-in-0 slide-in-from-right-4 duration-200'
            )}
            onClick={e => e.stopPropagation()}
          >
          <div className="px-4 py-3 border-b bg-background">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-7 bg-gradient-to-br from-foreground to-foreground/80 rounded-full flex items-center justify-center">
                  <Sparkles className="size-3.5 text-background" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Melron AI</div>
                  <div className="text-[10px] text-muted-foreground">
                    Assistant networking
                  </div>
                </div>
              </div>
              <button
                onClick={() => setAiPanelOpen(false)}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="size-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div ref={aiScrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {aiMessages.length === 0 && (
              <>
                <div className="bg-card border rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="size-3 text-amber-500" />
                    <span className="text-[10px] uppercase tracking-widest font-semibold">
                      Brief du moment
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed mb-3">
                    Salut Rudolph 👋 Voici ce qui mérite ton attention sur la
                    conversation avec <strong>{selected.name}</strong> :
                  </p>
                  <ul className="text-xs text-foreground/85 space-y-1.5 leading-relaxed">
                    <li className="flex gap-2">
                      <span className="text-emerald-500">→</span>
                      Signal d'achat fort : elle veut <strong>finaliser</strong>{' '}
                      le contrat demain
                    </li>
                    <li className="flex gap-2">
                      <span className="text-amber-500">→</span>
                      Tu as envoyé le pricing samedi : il faut confirmer et
                      préparer le contrat
                    </li>
                    <li className="flex gap-2">
                      <span className="text-sky-500">→</span>
                      Deal Honelia Enterprise : ~€45k MRR potentiel
                    </li>
                  </ul>
                </div>

                <div className="px-1">
                  <div className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">
                    Suggestions
                  </div>
                  <div className="space-y-1.5">
                    {AI_SUGGESTIONS.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleAiSubmit(s)}
                        className="w-full text-left px-3 py-2 bg-card border rounded-lg text-xs hover:border-foreground/30 transition-colors flex items-center justify-between group"
                      >
                        <span>{s}</span>
                        <ArrowUp className="size-3 text-muted-foreground rotate-45 group-hover:text-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {aiMessages.map((msg, i) => (
              <div
                key={i}
                className={cn(msg.role === 'user' && 'flex justify-end')}
              >
                {msg.role === 'user' ? (
                  <div className="max-w-[85%] bg-foreground text-background rounded-2xl rounded-br-sm px-3 py-2">
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                ) : (
                  <div className="bg-card border rounded-2xl rounded-bl-sm p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles className="size-2.5 text-amber-500" />
                      <span className="text-[10px] uppercase tracking-widest font-semibold">
                        Melron AI
                      </span>
                    </div>
                    <div
                      className="text-sm leading-relaxed whitespace-pre-wrap"
                      // Simple markdown: **bold** only — mocked.
                      dangerouslySetInnerHTML={{
                        __html: msg.content.replace(
                          /\*\*(.*?)\*\*/g,
                          '<strong>$1</strong>'
                        )
                      }}
                    />
                  </div>
                )}
              </div>
            ))}

            {isAiThinking && (
              <div className="bg-card border rounded-2xl rounded-bl-sm p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="size-2.5 text-amber-500" />
                  <span className="text-[10px] uppercase tracking-widest font-semibold">
                    Melron AI
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="size-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                  <div className="size-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                  <div className="size-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t bg-background">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleAiSubmit(aiInput)
                    }
                  }}
                  placeholder="Demande à Melron…"
                  rows={1}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none bg-background"
                />
              </div>
              <button
                onClick={() => handleAiSubmit(aiInput)}
                disabled={!aiInput.trim()}
                className="p-2 bg-foreground text-background rounded-md hover:opacity-90 disabled:opacity-30 shrink-0 transition-opacity"
              >
                <ArrowUp className="size-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Command className="size-2.5" />
                <span>⌘ + Enter pour envoyer</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                Powered by Claude
              </div>
            </div>
          </div>
        </aside>
        </>
      )}
    </div>
  )
}
