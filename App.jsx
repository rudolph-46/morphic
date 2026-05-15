import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Send, Inbox, Star, Clock, Archive, Trash2, Filter,
  Sparkles, Brain, Zap, Linkedin, MoreHorizontal, Paperclip,
  ChevronDown, Settings, Plus, Command, MessageSquare, Bell,
  TrendingUp, AlertCircle, CheckCircle2, ArrowUp, X, Pin,
  Calendar, User, Hash, Flame, Heart, Eye, Forward, Reply
} from 'lucide-react';

export default function MelronInbox() {
  const [activeCategory, setActiveCategory] = useState('urgent');
  const [selectedMessage, setSelectedMessage] = useState('m1');
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const aiScrollRef = useRef(null);

  const categories = [
    { id: 'urgent', icon: Flame, label: 'Urgent', count: 3, color: 'text-rose-600' },
    { id: 'important', icon: Star, label: 'Important', count: 8, color: 'text-amber-600' },
    { id: 'inProgress', icon: MessageSquare, label: 'En cours', count: 12, color: 'text-sky-600' },
    { id: 'new', icon: Inbox, label: 'Nouveau', count: 5, color: 'text-stone-600' },
    { id: 'toFollowUp', icon: Clock, label: 'À relancer', count: 6, color: 'text-violet-600' },
    { id: 'lowValue', icon: Archive, label: 'Faible valeur', count: 13, color: 'text-stone-400' },
  ];

  const messages = {
    urgent: [
      {
        id: 'm1',
        name: 'Sarah Martin',
        role: 'CTO @ Acme SaaS · Lyon',
        avatar: 'SM',
        avatarBg: 'from-rose-200 to-rose-300',
        time: '12min',
        preview: 'Je peux faire le call demain 14h pour finaliser le contrat. Tu confirmes ?',
        unread: true,
        thread: [
          { from: 'them', time: 'Il y a 3 semaines', text: 'Salut Rudolph ! Jean m\'a parlé de ton produit Honelia. On en discute ?' },
          { from: 'me', time: 'Il y a 3 semaines', text: 'Avec plaisir Sarah ! Je peux te montrer une démo cette semaine si tu veux.' },
          { from: 'them', time: 'Il y a 2 semaines', text: 'J\'ai vu la démo, c\'est très solide. Mais ce n\'est pas le bon moment pour nous. On en reparle au prochain trimestre ?' },
          { from: 'me', time: 'Il y a 12 jours', text: 'Pas de souci. Je te recontacte début juin avec une proposition adaptée à votre roadmap.' },
          { from: 'them', time: '12min', text: 'Je peux faire le call demain 14h pour finaliser le contrat. Tu confirmes ?' },
        ],
        context: {
          relationship: 'Connectés via Jean Dupont · il y a 2 mois',
          lastTouch: 'Réponse il y a 12 jours · 4 messages échangés',
          dealStage: 'Pitch Honelia · €45k MRR potentiel · stage : closing',
          signal: 'A posté avant-hier sur "scaling team challenges"',
          history: 'Vous lui aviez envoyé le pricing custom samedi dernier',
        },
        replies: [
          { tone: 'Direct & positif', text: 'Parfait Sarah, je confirme pour demain 14h. Je t\'envoie le lien Meet juste après ce message. À demain !' },
          { tone: 'Chaleureux', text: 'Top Sarah ! Avec plaisir pour demain 14h. J\'ai préparé le pricing custom dont on avait parlé — on regarde ça ensemble.' },
          { tone: 'Stratégique', text: 'Hello Sarah, 14h ça marche. Petite question pour bien préparer : on aligne sur le scope final ou on garde les options ouvertes ?' },
        ]
      },
      {
        id: 'm2',
        name: 'Pierre Lavalle',
        role: 'Investor @ Kima Ventures',
        avatar: 'PL',
        avatarBg: 'from-amber-200 to-orange-300',
        time: '1h',
        preview: 'On peut faire un call cette semaine ? J\'ai partagé Honelia avec un autre partner...',
        unread: true,
        thread: [
          { from: 'them', time: 'Il y a 1 mois', text: 'Salut Rudolph, j\'ai vu ton post sur Honelia. Tu lèves bientôt ?' },
          { from: 'me', time: 'Il y a 1 mois', text: 'Pas en levée active, mais ouvert aux discussions. Tu veux qu\'on en parle ?' },
          { from: 'them', time: 'Il y a 3 semaines', text: 'Oui, envoie-moi un deck quand tu peux.' },
          { from: 'me', time: 'Il y a 2 semaines', text: 'Voici le deck. 9 hôtels payants, 12k€ MRR, croissance 30% MoM.' },
          { from: 'them', time: '1h', text: 'On peut faire un call cette semaine ? J\'ai partagé Honelia avec un autre partner — il aime beaucoup.' },
        ],
        context: {
          relationship: 'Premier contact via LinkedIn · il y a 1 mois',
          lastTouch: 'Tu as envoyé le deck il y a 2 semaines',
          dealStage: 'Levée seed potentielle · signal très positif',
          signal: 'A partagé avec son équipe = intérêt confirmé',
          history: 'Kima Ventures investit 150k-500k en early stage',
        },
        replies: [
          { tone: 'Enthousiaste', text: 'Excellent Pierre ! Je suis dispo jeudi 11h ou vendredi 15h. Tu m\'envoies une invit ?' },
          { tone: 'Pro & mesuré', text: 'Merci Pierre. Je peux jeudi ou vendredi après-midi. Tu peux me dire qui sera dans le call et ce que vous voulez creuser ?' },
          { tone: 'Curieux', text: 'Top, ravi que ça t\'ait plu. Cette semaine ça marche. C\'est quoi le partner qui aime ? J\'aime bien savoir à qui je parle.' },
        ]
      },
      {
        id: 'm3',
        name: 'Aminata Diop',
        role: 'Directrice @ Hôtel Akwa Palace',
        avatar: 'AD',
        avatarBg: 'from-emerald-200 to-teal-300',
        time: '3h',
        preview: 'Bonjour Rudolph, on a un problème urgent sur le module réservations Honelia...',
        unread: false,
        thread: [
          { from: 'them', time: 'Il y a 4 mois', text: 'Bonjour, je suis intéressée par Honelia pour notre hôtel à Douala.' },
          { from: 'me', time: 'Il y a 4 mois', text: 'Bonjour Aminata ! Je vous propose un onboarding gratuit. Vous êtes dispo cette semaine ?' },
          { from: 'them', time: 'Il y a 3 mois', text: 'Onboarding fait, nous sommes opérationnels. Merci !' },
          { from: 'them', time: '3h', text: 'Bonjour Rudolph, on a un problème urgent sur le module réservations Honelia. Les emails Booking ne sont plus parsés depuis ce matin. C\'est bloquant.' },
        ],
        context: {
          relationship: 'Cliente Honelia depuis 3 mois · plan Pro',
          lastTouch: 'Cliente active · 0 ticket support jusqu\'ici',
          dealStage: 'Cliente payante · €99/mois · NPS 9/10',
          signal: 'Problème technique critique en production',
          history: 'Apify scraping a peut-être eu un incident — vérifier logs Convex',
        },
        replies: [
          { tone: 'Action immédiate', text: 'Bonjour Aminata, je regarde ça immédiatement. Je reviens vers vous dans les 30 min avec un état des lieux et une solution.' },
          { tone: 'Rassurant', text: 'Aminata, je suis sur le sujet. Je vérifie le pipeline Resend → Convex maintenant. Je vous appelle si besoin de plus d\'infos.' },
          { tone: 'Diagnostic', text: 'Bonjour Aminata, urgent compris. Quelques questions rapides : depuis quelle heure exactement ? Sur tous les OTAs ou juste Booking ? Captures d\'écran possibles ?' },
        ]
      },
    ]
  };

  const currentMessages = messages[activeCategory] || messages.urgent;
  const selected = currentMessages.find(m => m.id === selectedMessage) || currentMessages[0];

  const aiSuggestions = [
    "Résume cette conversation",
    "Qui est cette personne ?",
    "Prépare-moi pour le call",
    "Trouve d'autres prospects comme Sarah",
  ];

  useEffect(() => {
    if (aiScrollRef.current) {
      aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
    }
  }, [aiMessages, isAiThinking]);

  const handleAiSubmit = (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput('');
    setIsAiThinking(true);

    setTimeout(() => {
      let aiResponse = '';
      const lower = text.toLowerCase();
      if (lower.includes('résume') || lower.includes('resume')) {
        aiResponse = `Voici le résumé avec **${selected.name}** :\n\n• Premier contact il y a 2 mois via Jean Dupont\n• Tu as pitché Honelia → intéressée mais "pas le bon moment"\n• Tu lui as envoyé le pricing custom samedi dernier\n• Maintenant elle demande un call demain 14h pour **finaliser le contrat**\n\nSignal clair : elle est prête à closer. Confirme rapidement et prépare ton agenda du call.`;
      } else if (lower.includes('qui est') || lower.includes('profil')) {
        aiResponse = `**${selected.name}** — ${selected.role}\n\n📍 Connexion mutuelle : Jean Dupont (que tu connais bien)\n💼 CTO depuis 3 ans chez Acme SaaS, ex-Stripe, ex-Algolia\n🎓 EPITA promo 2014\n📊 Acme SaaS = 80 employés, scale-up B2B\n💬 Active sur LinkedIn (2-3 posts/semaine sur scaling teams)\n\nC'est un profil **technique senior + décisionnaire budget**. Le call demain est clairement un signal d'achat.`;
      } else if (lower.includes('prépare') || lower.includes('call')) {
        aiResponse = `**Briefing pour le call de demain 14h avec ${selected.name}** :\n\n🎯 **Objectif** : signer. Pas re-pitcher.\n\n📋 **Points à couvrir** :\n1. Confirmer le scope final (modules choisis)\n2. Valider le pricing (€45k MRR ou ajustement ?)\n3. Calendrier d'onboarding\n4. Conditions de paiement\n\n⚠️ **Risque** : si elle re-pose des questions techniques, c'est qu'elle hésite encore. Reprends sur les ROI vs features.\n\n✅ **Document à préparer** : version finale du contrat Honelia Enterprise.`;
      } else if (lower.includes('autres prospects') || lower.includes('similaire')) {
        aiResponse = `J'ai trouvé **5 CTOs** dans ton réseau avec un profil proche de ${selected.name} :\n\n1. **Marc Leblanc** — CTO @ Spendesk · Paris · ex-Stripe\n2. **Lucie Wang** — CTO @ Alma · Paris · 2 connexions en commun\n3. **Thomas Petit** — VP Eng @ Doctolib · scaling 200→500 employés\n4. **Sofia Ramirez** — CTO @ PayFit · ex-LinkedIn (relation directe)\n5. **Antoine Royer** — CTO @ Swile · vient de lever Série C\n\nTu veux que je prépare un message d'approche personnalisé pour les 5 ?`;
      } else {
        aiResponse = `J'ai analysé ta question. Pour ${selected.name} et le contexte actuel, voici ma recommandation :\n\nElle attend une **réponse rapide** sur le call de demain. Plus tu réponds vite, plus le signal de fiabilité est fort.\n\nJe te suggère d'utiliser la réponse "Direct & positif" en bas, ou de me demander d'écrire quelque chose de plus spécifique. Que veux-tu faire ?`;
      }
      setAiMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
      setIsAiThinking(false);
    }, 1200);
  };

  return (
    <div className="h-screen w-screen bg-stone-100 flex flex-col overflow-hidden" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
        .serif { font-family: "Cormorant Garamond", Georgia, serif; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
        @keyframes pulse-dot { 0%, 80%, 100% { opacity: 0.3; } 40% { opacity: 1; } }
        .dot-1 { animation: pulse-dot 1.4s infinite; animation-delay: 0s; }
        .dot-2 { animation: pulse-dot 1.4s infinite; animation-delay: 0.2s; }
        .dot-3 { animation: pulse-dot 1.4s infinite; animation-delay: 0.4s; }
        @keyframes slide-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
      `}</style>

      {/* TOP BAR */}
      <div className="h-12 bg-white border-b border-stone-200 flex items-center px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center">
            <div className="flex gap-0.5">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
          <span className="serif text-lg font-medium">Melron</span>
          <span className="text-xs text-stone-500 hidden md:inline">· Inbox</span>
        </div>

        <div className="flex-1 max-w-md mx-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Rechercher dans 247 conversations..."
              className="w-full pl-9 pr-12 py-1.5 bg-stone-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-stone-400">
              <kbd className="px-1.5 py-0.5 bg-white border border-stone-200 rounded text-[10px]">⌘K</kbd>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-stone-100 rounded-md">
            <Bell className="w-4 h-4 text-stone-600" />
          </button>
          <button className="p-1.5 hover:bg-stone-100 rounded-md">
            <Settings className="w-4 h-4 text-stone-600" />
          </button>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-stone-700 to-stone-900 flex items-center justify-center text-white text-xs font-medium">
            R
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT - 4 columns */}
      <div className="flex-1 flex overflow-hidden">

        {/* COLUMN 1: Sidebar categories */}
        <div className="w-56 bg-stone-50 border-r border-stone-200 flex flex-col flex-shrink-0">
          <div className="p-3">
            <button className="w-full flex items-center justify-center gap-2 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-stone-800 transition-colors">
              <Plus className="w-3.5 h-3.5" />
              Nouvelle conversation
            </button>
          </div>

          <div className="px-2 py-1">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
              <span className="text-xs font-semibold text-stone-700">LinkedIn</span>
              <span className="ml-auto text-xs text-stone-500">47</span>
            </div>
          </div>

          <div className="px-2 space-y-0.5 flex-1 overflow-y-auto">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setSelectedMessage(messages[cat.id]?.[0]?.id || 'm1'); }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                    isActive ? 'bg-white shadow-sm font-medium' : 'hover:bg-white/60 text-stone-700'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                  <span className="flex-1 text-left">{cat.label}</span>
                  <span className="text-xs text-stone-500">{cat.count}</span>
                </button>
              );
            })}
          </div>

          <div className="p-3 border-t border-stone-200">
            <div className="p-3 bg-gradient-to-br from-stone-900 to-stone-700 rounded-lg text-white">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3 h-3" />
                <span className="text-[10px] uppercase tracking-wider font-medium">Melron IA</span>
              </div>
              <p className="text-xs text-stone-300 leading-snug">
                J'ai trié vos 47 messages. <span className="text-white font-medium">5 méritent vraiment votre attention</span> aujourd'hui.
              </p>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Message list */}
        <div className="w-80 bg-white border-r border-stone-200 flex flex-col flex-shrink-0">
          <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-600" />
              <span className="font-semibold text-sm">Urgent</span>
              <span className="text-xs text-stone-400">3 messages</span>
            </div>
            <button className="p-1 hover:bg-stone-100 rounded">
              <Filter className="w-3.5 h-3.5 text-stone-500" />
            </button>
          </div>

          <div className="px-3 py-2 border-b border-stone-100 flex items-center gap-2 bg-stone-50/50">
            <Sparkles className="w-3 h-3 text-amber-600 flex-shrink-0" />
            <span className="text-[11px] text-stone-600 leading-tight">Trié par priorité IA · basé sur vos deals en cours</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {currentMessages.map((msg) => {
              const isSelected = selectedMessage === msg.id;
              return (
                <button
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg.id)}
                  className={`w-full text-left px-4 py-3 border-b border-stone-100 transition-colors ${
                    isSelected ? 'bg-stone-100' : 'hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${msg.avatarBg} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-xs font-semibold text-stone-700">{msg.avatar}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className={`text-sm truncate ${msg.unread ? 'font-semibold' : 'font-medium'}`}>{msg.name}</span>
                        <span className="text-[11px] text-stone-500 flex-shrink-0">{msg.time}</span>
                      </div>
                      <div className="text-[11px] text-stone-500 mb-1 truncate">{msg.role}</div>
                      <p className={`text-xs leading-snug line-clamp-2 ${msg.unread ? 'text-stone-800' : 'text-stone-600'}`}>
                        {msg.preview}
                      </p>
                      {msg.unread && (
                        <div className="mt-1.5 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                          <span className="text-[10px] uppercase tracking-wider text-rose-600 font-medium">Non lu</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* COLUMN 3: Conversation */}
        <div className="flex-1 bg-white flex flex-col min-w-0">
          {/* Conversation header */}
          <div className="px-6 py-3 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${selected.avatarBg} flex items-center justify-center`}>
                <span className="text-sm font-semibold text-stone-700">{selected.avatar}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{selected.name}</span>
                  <Linkedin className="w-3 h-3 text-[#0A66C2]" />
                </div>
                <div className="text-xs text-stone-500">{selected.role}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 hover:bg-stone-100 rounded-md" title="Épingler">
                <Pin className="w-4 h-4 text-stone-500" />
              </button>
              <button className="p-1.5 hover:bg-stone-100 rounded-md" title="Programmer">
                <Calendar className="w-4 h-4 text-stone-500" />
              </button>
              <button className="p-1.5 hover:bg-stone-100 rounded-md" title="Archiver">
                <Archive className="w-4 h-4 text-stone-500" />
              </button>
              <button className="p-1.5 hover:bg-stone-100 rounded-md">
                <MoreHorizontal className="w-4 h-4 text-stone-500" />
              </button>
            </div>
          </div>

          {/* AI Context bar */}
          <div className="px-6 py-3 bg-gradient-to-r from-amber-50 via-stone-50 to-stone-50 border-b border-stone-200">
            <div className="flex items-start gap-2">
              <Brain className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-amber-800">Contexte Melron</span>
                  <span className="text-[10px] text-stone-500">·</span>
                  <span className="text-[10px] text-stone-600">{selected.context.dealStage}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-[11px] text-stone-700">
                  <div className="flex items-start gap-1.5">
                    <span className="text-stone-400">📍</span>
                    <span className="leading-snug">{selected.context.relationship}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-stone-400">💬</span>
                    <span className="leading-snug">{selected.context.lastTouch}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-stone-400">💡</span>
                    <span className="leading-snug">{selected.context.signal}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-stone-400">🕐</span>
                    <span className="leading-snug">{selected.context.history}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Thread */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {selected.thread.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${msg.from === 'me' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`px-4 py-2.5 rounded-2xl ${
                    msg.from === 'me'
                      ? 'bg-stone-900 text-white rounded-br-sm'
                      : 'bg-stone-100 text-stone-900 rounded-bl-sm'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                  <span className="text-[10px] text-stone-400 mt-1 px-1">{msg.time}</span>
                </div>
              </div>
            ))}
          </div>

          {/* AI Reply suggestions */}
          <div className="border-t border-stone-200 bg-stone-50/50 px-6 py-3">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3 h-3 text-stone-700" />
              <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-700">3 réponses suggérées</span>
              <button className="ml-auto text-[10px] text-stone-500 hover:text-stone-800">Régénérer</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {selected.replies.map((reply, i) => (
                <button
                  key={i}
                  className="text-left p-2.5 bg-white border border-stone-200 rounded-lg hover:border-stone-400 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-600">{reply.tone}</span>
                    <Send className="w-2.5 h-2.5 text-stone-400 group-hover:text-stone-700" />
                  </div>
                  <p className="text-[11px] text-stone-700 leading-snug line-clamp-3">{reply.text}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Compose */}
          <div className="border-t border-stone-200 px-6 py-3 bg-white">
            <div className="flex items-end gap-2">
              <button className="p-2 hover:bg-stone-100 rounded-md flex-shrink-0">
                <Paperclip className="w-4 h-4 text-stone-500" />
              </button>
              <div className="flex-1 relative">
                <textarea
                  placeholder="Écrire un message ou cliquer sur une suggestion ↑"
                  rows={1}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none"
                />
              </div>
              <button className="p-2 bg-black text-white rounded-md hover:bg-stone-800 flex-shrink-0">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* COLUMN 4: AI Chat Panel */}
        <div className="w-96 bg-stone-50 border-l border-stone-200 flex flex-col flex-shrink-0">
          <div className="px-4 py-3 border-b border-stone-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-br from-stone-900 to-stone-700 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Melron AI</div>
                  <div className="text-[10px] text-stone-500">Assistant networking</div>
                </div>
              </div>
              <button className="p-1 hover:bg-stone-100 rounded">
                <X className="w-3.5 h-3.5 text-stone-500" />
              </button>
            </div>
          </div>

          <div ref={aiScrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {aiMessages.length === 0 && (
              <>
                <div className="bg-white border border-stone-200 rounded-2xl p-4 animate-slide-up">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-700">Brief du moment</span>
                  </div>
                  <p className="text-sm text-stone-800 leading-relaxed mb-3">
                    Salut Rudolph 👋 Voici ce qui mérite ton attention sur la conversation avec <strong>{selected.name}</strong> :
                  </p>
                  <ul className="text-xs text-stone-700 space-y-1.5 leading-relaxed">
                    <li className="flex gap-2"><span className="text-emerald-600">→</span> Signal d'achat fort : elle veut <strong>finaliser</strong> le contrat demain</li>
                    <li className="flex gap-2"><span className="text-amber-600">→</span> Tu as envoyé le pricing samedi : il faut confirmer et préparer le contrat</li>
                    <li className="flex gap-2"><span className="text-sky-600">→</span> Deal Honelia Enterprise : ~€45k MRR potentiel</li>
                  </ul>
                </div>

                <div className="px-1">
                  <div className="text-[10px] uppercase tracking-widest font-semibold text-stone-500 mb-2">Suggestions</div>
                  <div className="space-y-1.5">
                    {aiSuggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleAiSubmit(s)}
                        className="w-full text-left px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-700 hover:border-stone-400 hover:bg-stone-50 transition-colors flex items-center justify-between group"
                      >
                        <span>{s}</span>
                        <ArrowUp className="w-3 h-3 text-stone-400 rotate-45 group-hover:text-stone-700" />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {aiMessages.map((msg, i) => (
              <div key={i} className={`animate-slide-up ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                {msg.role === 'user' ? (
                  <div className="max-w-[85%] bg-stone-900 text-white rounded-2xl rounded-br-sm px-3 py-2">
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                ) : (
                  <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-sm p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                      <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-700">Melron AI</span>
                    </div>
                    <div className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{
                      __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    }} />
                  </div>
                )}
              </div>
            ))}

            {isAiThinking && (
              <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-sm p-3 animate-slide-up">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-700">Melron AI</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-stone-400 rounded-full dot-1"></div>
                  <div className="w-1.5 h-1.5 bg-stone-400 rounded-full dot-2"></div>
                  <div className="w-1.5 h-1.5 bg-stone-400 rounded-full dot-3"></div>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-stone-200 bg-white">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAiSubmit(aiInput);
                    }
                  }}
                  placeholder="Demande à Melron..."
                  rows={1}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none"
                />
              </div>
              <button
                onClick={() => handleAiSubmit(aiInput)}
                disabled={!aiInput.trim()}
                className="p-2 bg-black text-white rounded-md hover:bg-stone-800 disabled:bg-stone-300 flex-shrink-0 transition-colors"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <div className="text-[10px] text-stone-400 flex items-center gap-1">
                <Command className="w-2.5 h-2.5" />
                <span>⌘ + Enter pour envoyer</span>
              </div>
              <div className="text-[10px] text-stone-400">Powered by Claude</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
