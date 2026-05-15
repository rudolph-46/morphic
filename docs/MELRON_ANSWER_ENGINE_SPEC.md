# Melron Answer Engine — Spec d'implémentation

**Audience** : devs app (Next.js / Morphic) + devs MCP (melron-mcp).
**Objectif** : livrer un answer engine agentique — ChatGPT (fluidité) + Perplexity (sources) + Deep Research (structure) + couche réseau actionnable.
**Promesse produit** : *"Find who matters, why now, and what to do next."*

---

## Sommaire

1. [Contrats de types partagés](#1-contrats-de-types-partagés)
2. [Format de réponse universel des tools MCP](#2-format-de-réponse-universel-des-tools-mcp)
3. [Spec par tool](#3-spec-par-tool)
4. [Tools nouveaux à créer](#4-tools-nouveaux-à-créer)
5. [Streaming partiel](#5-streaming-partiel)
6. [Tool metadata & discovery](#6-tool-metadata--discovery)
7. [Côté app — pipeline](#7-côté-app--pipeline)
8. [Renderers UI par mode](#8-renderers-ui-par-mode)
9. [Erreurs, cache, idempotence](#9-erreurs-cache-idempotence)
10. [Checklist de livraison](#10-checklist-de-livraison)

---

## 1. Contrats de types partagés

À créer dans **un package commun** consommé par app + MCP (ex: `@melron/contracts`). Sinon, dupliquer à l'identique côté app (`lib/types/answer-engine.ts`) et côté MCP.

### 1.1 Enums

```ts
type Intent =
  | 'quick_question'
  | 'people_search'
  | 'job_search'
  | 'smart_message'
  | 'market_research'
  | 'network_report'
  | 'follow_up'
  | 'monitoring'
  | 'board_action'
  | 'unknown'

type ResponseMode =
  | 'quick_answer'
  | 'action_cards'
  | 'research_report'
  | 'network_intelligence'

type CardType =
  | 'person'
  | 'job'
  | 'company'
  | 'signal'
  | 'message_draft'
  | 'opportunity'
  | 'task'

type SignalKind =
  | 'job_change'
  | 'promotion'
  | 'company_news'
  | 'funding'
  | 'viral_post'
  | 'anniversary'
  | 'mutual_connection'
  | 'custom'

type EvidenceType =
  | 'linkedin_profile'
  | 'linkedin_post'
  | 'web_page'
  | 'news_article'
  | 'company_page'
  | 'internal_board'
  | 'user_memory'
```

### 1.2 Evidence (citation type Perplexity)

```ts
interface Evidence {
  id: string                  // hash stable, utilisable comme ancre
  type: EvidenceType
  url: string | null          // null si interne (board, mémoire)
  title: string
  snippet: string             // extrait visible (max 280 chars)
  source: string              // ex: "linkedin.com", "techcrunch.com"
  publishedAt: string | null  // ISO 8601
  retrievedAt: string         // ISO 8601 — toujours présent
  confidence: number          // 0..1
  claims: string[]            // claims supportés par cette evidence (ids)
}
```

### 1.3 Signal (cœur de la couche Network)

```ts
interface Signal {
  id: string
  kind: SignalKind
  detectedAt: string          // ISO 8601
  freshness: 'hot' | 'warm' | 'cold'   // <24h | <7j | >7j
  personId: string | null     // référence carte personne si applicable
  companyId: string | null
  summary: string             // 1 ligne
  evidence: string[]          // ids Evidence
  score: number               // 0..1, pertinence pour l'utilisateur
  why: string                 // pourquoi pertinent MAINTENANT pour cet user
}
```

### 1.4 SuggestedAction (next step machine-readable)

```ts
interface SuggestedAction {
  id: string
  label: string               // texte du bouton
  kind: 'send_message' | 'create_alert' | 'add_to_board'
       | 'deep_research' | 'export' | 'open_url' | 'tool_call'
  priority: number            // 0..1
  payload: Record<string, unknown>  // params nécessaires pour exécuter
                                    // ex: { tool: 'smart_message', args: {...} }
  requiresConfirmation: boolean
}
```

### 1.5 Card (résultat affichable)

```ts
interface Card {
  id: string
  type: CardType
  title: string
  subtitle: string | null
  imageUrl: string | null
  fields: Record<string, string | number | null>  // key-value affichés
  evidence: string[]          // ids Evidence
  signals: string[]           // ids Signal
  actions: SuggestedAction[]
  score: number | null        // ranking si applicable
  raw: Record<string, unknown>  // payload brut tool-specific
}
```

### 1.6 Enveloppe universelle de retour tool

```ts
interface ToolResponse<T = unknown> {
  // Contrat OBLIGATOIRE — tous les tools retournent cette shape
  ok: boolean
  toolName: string
  toolVersion: string         // semver, ex: "1.0.0"
  durationMs: number

  // Données métier brutes
  data: T

  // Couche evidence-ready (peut être vide mais TOUJOURS présent)
  cards: Card[]
  evidence: Evidence[]
  signals: Signal[]
  suggestedActions: SuggestedAction[]

  // Meta
  confidence: number          // 0..1, confiance globale du tool dans son output
  cacheHit: boolean
  partial: boolean            // true si streaming pas terminé

  // Si ok=false
  error?: {
    code: string              // ex: 'AUTH_REQUIRED', 'RATE_LIMITED', 'INVALID_PARAMS'
    message: string
    retryable: boolean
    needsClarification?: {
      missingParams: string[]
      suggestedQuestion: string
    }
  }

  // Hints pour l'orchestrateur app
  hints?: {
    suggestedMode?: ResponseMode   // tool peut suggérer un mode
    followUpTools?: string[]       // tools logiques à appeler ensuite
    followUpQuestions?: string[]   // suggestions de questions à l'user
  }
}
```

---

## 2. Format de réponse universel des tools MCP

**Règle dure** : aucun tool ne retourne de payload brut sans passer par `ToolResponse`.
Si un tool n'a pas de cards (ex: `set_reminder`), `cards: []` mais le champ existe.

### 2.1 Conventions

- Tous les `id` sont stables sur (params identiques → mêmes ids), pour déduplication côté app.
- `evidence[].id` est référencé par `cards[].evidence` et `signals[].evidence` — ne JAMAIS dupliquer le contenu, toujours référence par id.
- Dates en **ISO 8601 UTC** strict (`2026-05-14T10:23:00Z`).
- Champs `null` plutôt qu'absents pour les optionnels documentés.
- Payloads `raw` dans `Card.raw` pour permettre extensions sans casser le contrat.

### 2.2 Versioning

- Chaque tool expose `toolVersion`. Bump **major** si breaking change sur la shape.
- L'app log `toolVersion` dans la telemetry pour détecter les drifts.

---

## 3. Spec par tool

Pour chaque tool : **inputs**, **output `data`**, **cards produits**, **evidence attendue**, **signals attendus**, **suggestedActions par défaut**.

### 3.1 `connect_linkedin`
**But** : initier la connexion OAuth LinkedIn.

- **Inputs** : `{ }` (utilise contexte user)
- **data** : `{ status: 'connected' | 'pending' | 'failed', authUrl: string | null }`
- **cards** : `[]`
- **evidence** : `[]`
- **signals** : `[]`
- **suggestedActions** :
  - si `pending` : `{ kind: 'open_url', label: 'Connect LinkedIn', payload: { url: authUrl } }`
  - si `connected` : `{ kind: 'tool_call', label: 'Find people', payload: { tool: 'smart_people_search' } }`
- **hints.suggestedMode** : `quick_answer`

---

### 3.2 `smart_people_search`
**But** : trouver des personnes pertinentes (réseau ou élargi).

- **Inputs** :
  ```ts
  {
    query: string                    // langage naturel
    role?: string
    seniority?: string
    location?: string
    company?: string
    industry?: string
    networkScope: '1st' | '2nd' | '3rd' | 'all'
    limit?: number                   // default 10, max 50
    minSignalScore?: number          // filtre signal
  }
  ```
- **data** : `{ totalFound: number, returned: number, query: string }`
- **cards** : `Card[]` de type `person` :
  - `title` : nom complet
  - `subtitle` : poste actuel + entreprise
  - `imageUrl` : photo LinkedIn
  - `fields` : `{ headline, location, mutualConnections, lastActivityAt, connectionDegree }`
  - `evidence` : ref vers profil LinkedIn
  - `signals` : signaux récents (job_change, viral_post…)
  - `actions` :
    - `send_message` (pré-rempli via `smart_message`)
    - `add_to_board`
    - `deep_research` (sur cette personne)
- **evidence** : 1 par profil minimum (`type: 'linkedin_profile'`), + posts récents si signaux
- **signals** : tous signaux <30j attachés aux personnes
- **suggestedActions globaux** :
  - `create_alert` ("Notify me when more match")
  - `tool_call: smart_message` ("Draft messages to top 3")
- **hints.suggestedMode** : `action_cards` (ou `network_intelligence` si signaux dominants)
- **hints.followUpTools** : `['smart_message', 'smart_interest_map']`

---

### 3.3 `smart_job_search`
**But** : jobs pertinents pour l'utilisateur ou un profil cible.

- **Inputs** :
  ```ts
  {
    query: string
    targetProfileId?: string         // si recherche pour quelqu'un d'autre
    role?: string
    location?: string
    remote?: 'remote' | 'hybrid' | 'onsite' | 'any'
    seniority?: string
    minSalary?: number
    postedWithinDays?: number        // default 30
    limit?: number
  }
  ```
- **data** : `{ totalFound, returned, query }`
- **cards** : type `job`
  - `title` : intitulé
  - `subtitle` : entreprise + lieu
  - `fields` : `{ salary, postedAt, applicants, matchScore, hiringManager }`
  - `actions` : `smart_apply`, `add_to_board`, `open_url` (vers offre)
- **evidence** : page de l'offre + page entreprise
- **signals** : `funding`, `company_news` si entreprise levée récemment
- **hints.suggestedMode** : `action_cards`
- **hints.followUpTools** : `['smart_apply', 'smart_people_search']` (trouver le hiring manager)

---

### 3.4 `smart_message`
**But** : drafter un message contextuel.

- **Inputs** :
  ```ts
  {
    recipientId: string              // person card id
    intent: 'intro' | 'follow_up' | 'pitch' | 'ask_intro' | 'congrats' | 'custom'
    context?: string                 // contexte libre
    relatedCardIds?: string[]        // cartes en cours (job, signal…)
    tone?: 'professional' | 'casual' | 'warm'
    length?: 'short' | 'medium' | 'long'
    language?: string                // ISO 639-1
  }
  ```
- **data** : `{ subject: string | null, body: string, channel: 'linkedin' | 'email' }`
- **cards** : 1 carte `message_draft`
  - `fields` : `{ recipient, channel, length, tone, language }`
  - `actions` :
    - `send_message` → calls `smart_send`
    - `tool_call: smart_message` avec variantes (`tone: warm`, `length: short`)
- **evidence** : signaux/cartes utilisées pour ancrer le message
- **suggestedActions** : `[send, regenerate, edit]`
- **hints.suggestedMode** : `action_cards`

---

### 3.5 `smart_send`
**But** : envoyer un message drafté.

- **Inputs** : `{ draftId: string, confirm: true }`
- **data** : `{ sent: boolean, sentAt: string, messageId: string }`
- **cards** : 1 carte `task` (status: sent)
- **suggestedActions** : `set_reminder` (relance dans X jours)
- **hints.suggestedMode** : `quick_answer`

---

### 3.6 `smart_apply`
**But** : générer/envoyer une candidature.

- **Inputs** :
  ```ts
  {
    jobId: string
    customCoverLetter?: boolean
    targetProfileId?: string         // candidat (default: user)
    autoSend?: boolean               // default false
  }
  ```
- **data** : `{ applicationId, status: 'draft' | 'submitted', coverLetter?: string }`
- **cards** : `task` (application)
- **evidence** : job page + profil utilisé
- **suggestedActions** :
  - `tool_call: smart_message` (au hiring manager)
  - `set_reminder` (relance J+7)
- **hints.suggestedMode** : `action_cards`

---

### 3.7 `smart_fire`
**But** : retirer une candidature / désengager.

- **Inputs** : `{ applicationId: string, reason?: string }`
- **data** : `{ status: 'withdrawn', at: string }`
- **cards** : `[]`
- **suggestedActions** : `tool_call: smart_job_search` (alternatives)
- **hints.suggestedMode** : `quick_answer`

---

### 3.8 `smart_interest_map`
**But** : cartographier les intérêts d'une personne ou d'un segment.

- **Inputs** :
  ```ts
  {
    targetType: 'person' | 'company' | 'segment'
    targetId?: string
    segment?: { role?, location?, industry? }
    depth?: 'shallow' | 'deep'
  }
  ```
- **data** :
  ```ts
  {
    topics: { name, weight, evidence: string[] }[]
    influencers: string[]            // person ids
    contentTypes: string[]
  }
  ```
- **cards** : `opportunity` cards par topic majeur (avec angle d'approche)
- **evidence** : posts/articles qui supportent chaque topic
- **suggestedActions** :
  - `tool_call: smart_post_planner` (créer du contenu sur ces topics)
  - `tool_call: smart_message` (pitch aligné)
- **hints.suggestedMode** : `research_report` si `depth: deep`, sinon `action_cards`

---

### 3.9 `smart_post_planner`
**But** : planifier des posts LinkedIn alignés intérêts.

- **Inputs** :
  ```ts
  {
    topic: string
    audience?: string                // segment cible
    count?: number                   // nb de posts
    horizon?: 'week' | 'month'
    format?: 'text' | 'carousel' | 'mixed'
  }
  ```
- **data** : `{ posts: { scheduledAt, body, format, hooks: string[] }[] }`
- **cards** : 1 carte `task` par post
- **evidence** : signaux d'intérêt ayant motivé les sujets
- **suggestedActions** : `add_to_board`, `tool_call: smart_send` (publier)
- **hints.suggestedMode** : `action_cards`

---

### 3.10 `smart_network_update`
**But** : refresh des données réseau (nouveau scan).

- **Inputs** : `{ scope?: 'all' | 'starred' | 'recent', force?: boolean }`
- **data** : `{ scanned: number, newSignals: number, updatedProfiles: number, durationMs: number }`
- **cards** : top 5 nouveaux signaux comme cards `signal`
- **signals** : tous les nouveaux signaux détectés
- **suggestedActions** :
  - `tool_call: network_intelligence` (analyser les signaux)
  - `create_alert` (récurrence)
- **hints.suggestedMode** : `network_intelligence`
- **STREAMING OBLIGATOIRE** (peut durer >30s)

---

### 3.11 `get_board_summary`
**But** : état du board (pipeline de relations/jobs/etc).

- **Inputs** : `{ boardId?: string }`
- **data** :
  ```ts
  {
    columns: { id, name, count }[]
    totals: { active, stale, hot }
    staleCardIds: string[]
  }
  ```
- **cards** : top cards "hot" (besoin attention)
- **suggestedActions** : `tool_call: smart_message` pour relancer les stales
- **hints.suggestedMode** : `action_cards`

---

### 3.12 `list_cards`
**But** : lister cartes d'un board.

- **Inputs** : `{ boardId?, columnId?, status?, limit?, offset? }`
- **data** : `{ total, returned, offset }`
- **cards** : cartes (type variable selon contenu)
- **hints.suggestedMode** : `action_cards`

---

### 3.13 `create_card`
**But** : créer une carte board.

- **Inputs** : `{ boardId, columnId, type: CardType, payload: Record<string, unknown> }`
- **data** : `{ cardId }`
- **cards** : 1 carte créée
- **hints.suggestedMode** : `quick_answer`

---

### 3.14 `move_card`
**But** : déplacer une carte (changement statut).

- **Inputs** : `{ cardId, toColumnId, position?: number }`
- **data** : `{ cardId, fromColumn, toColumn }`
- **cards** : carte mise à jour
- **suggestedActions** : action contextuelle selon nouvelle colonne (ex: si "à relancer" → `smart_message`)
- **hints.suggestedMode** : `quick_answer`

---

### 3.15 `set_reminder`
**But** : créer un rappel.

- **Inputs** : `{ cardId?, at: string (ISO), note: string, channel?: 'app' | 'email' }`
- **data** : `{ reminderId, at }`
- **cards** : `task` card
- **hints.suggestedMode** : `quick_answer`

---

## 4. Tools nouveaux à créer

### 4.1 `research_deep` ⭐
**But** : produire un rapport structuré multi-sections avec evidence par claim.

- **Inputs** :
  ```ts
  {
    question: string
    scope?: 'network' | 'market' | 'company' | 'person' | 'auto'
    targetIds?: string[]             // personnes/entreprises à analyser
    depth?: 'standard' | 'deep'      // standard ~30s, deep ~3min
    maxSources?: number              // default 20
    language?: string
  }
  ```
- **data** :
  ```ts
  {
    title: string
    executiveSummary: string         // markdown, 3-5 lignes
    methodology: string              // markdown, ce qui a été checké
    sections: {
      id: string
      title: string
      body: string                   // markdown
      evidence: string[]             // ids Evidence supportant cette section
      cards: string[]                // ids Card affichés dans la section
    }[]
    findings: { claim: string, evidence: string[], confidence: number }[]
    rankedOpportunities: { rank, title, why, score, cardId? }[]
    risks: { description, severity: 'low' | 'med' | 'high', evidence: string[] }[]
    recommendedActions: SuggestedAction[]
    followUpQuestions: string[]
  }
  ```
- **cards** : toutes les personnes/entreprises/jobs cités
- **evidence** : ≥10 evidence pour mode `standard`, ≥20 pour `deep`
- **suggestedActions** :
  - `tool_call: monitor_create` ("Turn into Heartbeat")
  - `export` (PDF/markdown)
  - `tool_call: smart_message` (drafter messages aux top opportunities)
- **hints.suggestedMode** : `research_report`
- **STREAMING OBLIGATOIRE** : émettre `section` dès que prête + `evidence` au fur et à mesure.

---

### 4.2 `network_intelligence` ⭐
**But** : transformer signaux bruts en opportunités actionnables priorisées.

- **Inputs** :
  ```ts
  {
    timeframe?: 'today' | 'week' | 'month'   // default week
    scope?: 'all' | 'starred' | 'segment'
    segment?: { role?, industry?, location? }
    minScore?: number                // default 0.5
    limit?: number                   // default 10
  }
  ```
- **data** :
  ```ts
  {
    timeframe: string
    totalSignalsAnalyzed: number
    topOpportunities: {
      personId: string
      signalIds: string[]
      why: string                    // pourquoi maintenant
      timing: 'now' | 'this_week' | 'this_month'
      suggestedActionId: string      // ref dans suggestedActions
    }[]
  }
  ```
- **cards** : `person` card par opportunité (top N) + `signal` cards
- **signals** : tous les signaux analysés (>= minScore)
- **evidence** : posts/articles supportant chaque signal
- **suggestedActions** : 1 action priorisée par opportunité (typiquement `smart_message`)
- **hints.suggestedMode** : `network_intelligence`
- **STREAMING OBLIGATOIRE**

---

### 4.3 `monitor_create` ⭐
**But** : transformer une query/rapport en heartbeat récurrent.

- **Inputs** :
  ```ts
  {
    name: string
    sourceType: 'query' | 'report' | 'tool_call'
    source: {                        // discriminé selon sourceType
      query?: string
      reportId?: string
      tool?: string
      args?: Record<string, unknown>
    }
    schedule: string                 // cron expression
    notifyChannels: ('app' | 'email' | 'slack')[]
    diffMode: 'all' | 'new_only' | 'significant_changes'
  }
  ```
- **data** : `{ monitorId, nextRunAt, schedule }`
- **cards** : 1 `task` card (le monitor lui-même)
- **suggestedActions** : `open_url` vers la page heartbeat
- **hints.suggestedMode** : `quick_answer`

---

### 4.4 `clarify_required` ⭐ (meta-tool)
**But** : permettre à l'agent de demander une clarif au lieu d'halluciner.

- **Inputs** :
  ```ts
  {
    intent: Intent
    missingParams: string[]
    suggestedQuestion: string
    options?: { label: string, value: string }[]   // si choix
  }
  ```
- **data** : `{ questionAsked: true }`
- **cards** : `[]`
- **suggestedActions** : aucune — c'est l'app qui rend l'UI question
- **hints.suggestedMode** : `quick_answer`
- **Note** : ce tool ne fait pas d'IO réel, c'est un signal structuré pour l'app.

---

## 5. Streaming partiel

Tools marqués **STREAMING OBLIGATOIRE** : `smart_network_update`, `research_deep`, `network_intelligence`, et tout tool dont `expectedDuration > 5000ms`.

### Format des chunks (SSE / MCP streaming)

Chaque chunk est un `ToolResponse` avec `partial: true` et un sous-ensemble peuplé :

```ts
// Chunk 1 : annonce
{ ok: true, partial: true, data: { phase: 'scanning', message: 'Scanning 200 connections…' } }

// Chunk 2 : evidence ajoutée
{ ok: true, partial: true, evidence: [/* nouvelle evidence */] }

// Chunk 3 : signal détecté
{ ok: true, partial: true, signals: [/* nouveau signal */] }

// Chunk N : carte prête
{ ok: true, partial: true, cards: [/* nouvelle card */] }

// Final
{ ok: true, partial: false, /* aggregat complet */ }
```

**Côté app** : merger par `id` (cards/evidence/signals dédupliqués). Render incrémental.

---

## 6. Tool metadata & discovery

L'app doit pouvoir découvrir les tools dynamiquement. MCP doit exposer `list_tools()` enrichi :

```ts
interface ToolMetadata {
  name: string
  version: string
  description: string
  category: 'search' | 'message' | 'board' | 'analysis' | 'monitor' | 'meta'
  inputSchema: JSONSchema           // Zod → JSON Schema
  outputSchema: JSONSchema          // référence à ToolResponse<T>
  expectedDurationMs: number        // estimation médiane
  maxDurationMs: number             // SLO
  streaming: boolean
  requiresAuth: ('linkedin' | 'gmail' | 'none')[]
  rateLimit: { perMinute: number, perDay: number }
  cacheTtlSeconds: number           // 0 = no cache
  outputMode: ResponseMode          // mode suggéré par défaut
  tags: string[]
}
```

---

## 7. Côté app — pipeline

### 7.1 Fichiers à créer

```
lib/types/answer-engine.ts          # types section 1
lib/schema/evidence.ts              # zod schemas
lib/agents/intent-classifier.ts     # LLM Haiku, retourne {intent, mode, missingParams, confidence}
lib/agents/prompt-booster.ts        # enrichit, décide clarify vs execute
lib/agents/mode-selector.ts         # règles déterministes
lib/agents/answer-engine.ts         # orchestrateur (remplace researcher pour les intents Melron)
lib/tools/melron-mcp-adapter.ts     # mappe ToolResponse → types app
lib/streaming/answer-engine-stream.ts  # stream events: intent-detected, tool-start, partial, final
```

### 7.2 Stream events à émettre vers le front

```ts
type AnswerEngineEvent =
  | { type: 'intent-detected', intent, mode, confidence }
  | { type: 'clarification-needed', question, options? }
  | { type: 'tool-planned', tools: { name, args }[] }
  | { type: 'tool-start', tool, callId }
  | { type: 'tool-partial', callId, patch: Partial<ToolResponse> }
  | { type: 'tool-end', callId, response: ToolResponse }
  | { type: 'card', card: Card }
  | { type: 'evidence', evidence: Evidence }
  | { type: 'signal', signal: Signal }
  | { type: 'section', section }   // pour research_report
  | { type: 'final', mode, summary, nextActions }
  | { type: 'error', error }
```

### 7.3 Pipeline d'orchestration

```
1. receive user message
2. intent-classifier → {intent, mode, missingParams, confidence}
3. emit 'intent-detected'
4. if missingParams.length > 0 && confidence < threshold:
     call clarify_required tool → emit 'clarification-needed' → STOP
5. prompt-booster → enriched query + tool plan
6. emit 'tool-planned'
7. for each tool in plan (parallel where possible):
     emit 'tool-start'
     execute MCP call (streaming if applicable, emit 'tool-partial')
     normalize via adapter
     emit 'tool-end' + per-item events ('card', 'evidence', 'signal')
8. mode-selector (final, peut overrider initial mode selon résultats)
9. compose final summary (LLM avec evidence injectée)
10. emit 'final'
```

---

## 8. Renderers UI par mode

### 8.1 Composants à créer (dans `components/answer-engine/`)

```
answer-header.tsx              # intent badge + mode + confidence + tools
answer-summary.tsx             # 3-5 lignes
evidence-list.tsx              # citations cliquables
evidence-citation.tsx          # composant inline [1] avec hover
cards/
  card-router.tsx              # switch sur card.type
  person-card.tsx
  job-card.tsx
  company-card.tsx
  signal-card.tsx
  message-draft-card.tsx
  opportunity-card.tsx
  task-card.tsx
next-actions.tsx               # rendu SuggestedAction[]
renderers/
  quick-answer-renderer.tsx
  action-cards-renderer.tsx
  research-report-renderer.tsx
  network-intelligence-renderer.tsx
answer-router.tsx              # switch sur responseMode
clarification-prompt.tsx       # UI pour clarify_required
tool-planning-indicator.tsx    # "Researching network…"
```

### 8.2 Mapping mode → blocs

| Mode | Header | Summary | Evidence | Cards | NextActions | Sections |
|---|---|---|---|---|---|---|
| `quick_answer` | ✓ | ✓ | si web utilisé | ✗ | follow-ups | ✗ |
| `action_cards` | ✓ | court | ✓ | ✓ | ✓ | ✗ |
| `research_report` | ✓ | exec summary | ✓ inline | ✓ par section | ✓ globaux + par section | ✓ TOC |
| `network_intelligence` | ✓ | ✓ | ✓ | signal+person timeline | 1 par opportunité | ✗ |

---

## 9. Erreurs, cache, idempotence

### 9.1 Erreurs

Codes standards :
- `AUTH_REQUIRED` — l'utilisateur doit connecter LinkedIn/Gmail. `suggestedActions` doit contenir `connect_linkedin`.
- `RATE_LIMITED` — `retryable: true`, app affiche un délai.
- `INVALID_PARAMS` — `needsClarification` rempli, déclenche flow clarify.
- `UPSTREAM_ERROR` — service externe HS, `retryable: true`.
- `NOT_FOUND` — ressource inexistante.
- `PERMISSION_DENIED`.

### 9.2 Cache

- Clé : `hash(toolName + toolVersion + normalizedInputs + userId)`.
- TTL par tool dans metadata.
- `cacheHit: true` dans le retour.
- Bypass : input `_noCache: true` (jamais exposé à l'utilisateur, debug only).

### 9.3 Idempotence

- Tools en lecture : naturellement idempotents (cache OK).
- Tools en écriture (`create_card`, `move_card`, `smart_send`, `set_reminder`, `monitor_create`) : accepter un `idempotencyKey` optionnel. Si reçu deux fois en <1h → retourner le résultat précédent.

---

## 10. Checklist de livraison

### Côté MCP (melron-mcp)

- [ ] Package `@melron/contracts` publié (ou types dupliqués documentés)
- [ ] Wrapper universel produisant `ToolResponse` pour tous les tools existants
- [ ] Tous les tools existants migrés au nouveau format (15 tools)
- [ ] `research_deep` implémenté + streaming
- [ ] `network_intelligence` implémenté + streaming
- [ ] `monitor_create` implémenté
- [ ] `clarify_required` implémenté
- [ ] `list_tools` enrichi avec `ToolMetadata`
- [ ] Cache + TTL par tool
- [ ] Idempotency keys sur tools d'écriture
- [ ] Codes d'erreur standardisés
- [ ] Logs structurés `{toolName, version, durationMs, cacheHit, ok, errorCode}`
- [ ] Tests unitaires par tool (input → output shape valide)
- [ ] Tests de streaming (chunks valides, final cohérent)

### Côté app (Morphic)

- [ ] Types `lib/types/answer-engine.ts`
- [ ] Schemas Zod `lib/schema/evidence.ts`
- [ ] Feature flag `MELRON_ANSWER_ENGINE`
- [ ] `intent-classifier.ts` (Haiku, prompt + JSON parse strict)
- [ ] `prompt-booster.ts`
- [ ] `mode-selector.ts` + tests
- [ ] `answer-engine.ts` orchestrateur
- [ ] `melron-mcp-adapter.ts` (tool catalog dynamique + normalisation)
- [ ] `answer-engine-stream.ts` (events typés)
- [ ] Intégration dans `app/api/chat/route.ts` (gated par flag)
- [ ] 5 blocs UI (`answer-header`, `summary`, `evidence-list`, `cards/*`, `next-actions`)
- [ ] 4 renderers (quick / action / research / network)
- [ ] `answer-router.tsx`
- [ ] `clarification-prompt.tsx`
- [ ] Boutons override mode (Détaille / Plus court / Analyse complète)
- [ ] Telemetry `{intent, mode, tools, duration, success, userId}`
- [ ] Tests intent-classifier (≥1 cas par intent)
- [ ] Tests mode-selector (table de vérité)
- [ ] Snapshot tests par renderer

### Cross-cutting

- [ ] Doc README MCP avec exemples `ToolResponse` par tool
- [ ] Versioning sémantique respecté (bump major si breaking)
- [ ] Migration guide pour passer du format actuel → nouveau (si tools déjà consommés ailleurs)
- [ ] Monitoring : dashboard tools (latence p50/p99, error rate, cache hit rate)

---

## Annexe A — Exemple complet

**User input** : *"Trouve les meilleurs profils sales à Paris dans mon réseau qui pourraient m'aider à lever"*

### 1. Intent classifier
```json
{
  "intent": "people_search",
  "responseMode": "network_intelligence",
  "missingParams": [],
  "confidence": 0.92
}
```

### 2. Tool plan
```json
[
  { "tool": "smart_people_search", "args": { "role": "sales", "location": "Paris", "networkScope": "2nd" } },
  { "tool": "network_intelligence", "args": { "timeframe": "month", "segment": { "role": "sales", "location": "Paris" } } }
]
```

### 3. ToolResponse (extrait de `smart_people_search`)
```json
{
  "ok": true,
  "toolName": "smart_people_search",
  "toolVersion": "1.0.0",
  "durationMs": 1840,
  "data": { "totalFound": 47, "returned": 10, "query": "sales Paris 2nd" },
  "cards": [
    {
      "id": "person_abc123",
      "type": "person",
      "title": "Marie Dupont",
      "subtitle": "VP Sales @ Acme",
      "imageUrl": "https://…",
      "fields": {
        "headline": "Scaling B2B SaaS",
        "location": "Paris",
        "mutualConnections": 12,
        "lastActivityAt": "2026-05-13T08:00:00Z",
        "connectionDegree": "2nd"
      },
      "evidence": ["ev_001"],
      "signals": ["sig_001"],
      "actions": [
        {
          "id": "act_001",
          "label": "Draft message",
          "kind": "tool_call",
          "priority": 0.9,
          "payload": { "tool": "smart_message", "args": { "recipientId": "person_abc123", "intent": "ask_intro" } },
          "requiresConfirmation": false
        }
      ],
      "score": 0.87,
      "raw": { "linkedinId": "marie-dupont" }
    }
  ],
  "evidence": [
    {
      "id": "ev_001",
      "type": "linkedin_profile",
      "url": "https://linkedin.com/in/marie-dupont",
      "title": "Marie Dupont — VP Sales @ Acme",
      "snippet": "12+ years scaling B2B SaaS sales teams across EMEA…",
      "source": "linkedin.com",
      "publishedAt": null,
      "retrievedAt": "2026-05-14T10:23:00Z",
      "confidence": 1.0,
      "claims": ["c_001"]
    }
  ],
  "signals": [
    {
      "id": "sig_001",
      "kind": "viral_post",
      "detectedAt": "2026-05-13T08:00:00Z",
      "freshness": "warm",
      "personId": "person_abc123",
      "companyId": null,
      "summary": "Posted about Series A fundraising tips, 1.2k likes",
      "evidence": ["ev_002"],
      "score": 0.78,
      "why": "Topic directly aligned with your fundraising goal"
    }
  ],
  "suggestedActions": [
    {
      "id": "act_global_1",
      "label": "Draft messages to top 3",
      "kind": "tool_call",
      "priority": 1.0,
      "payload": { "tool": "smart_message", "args": { "recipientIds": ["person_abc123", "person_def456", "person_ghi789"], "intent": "ask_intro" } },
      "requiresConfirmation": true
    }
  ],
  "confidence": 0.85,
  "cacheHit": false,
  "partial": false,
  "hints": {
    "suggestedMode": "network_intelligence",
    "followUpTools": ["smart_message", "research_deep"],
    "followUpQuestions": [
      "Lesquels ont déjà levé une Series A ?",
      "Drafte un message pour les top 3"
    ]
  }
}
```

### 4. Render
- Mode : `network_intelligence`
- Header : "Found 10 sales contacts in Paris (2nd degree), 3 with active fundraising signals"
- Timeline : 3 personnes en haut (warm signals), 7 autres en dessous
- Per-card : carte personne + signal "viral post on fundraising" + bouton "Draft message"
- Global next actions : "Draft messages to top 3", "Turn into Heartbeat", "Deep dive on Marie Dupont"

---

## Annexe B — Convention images (avatars, logos)

L'app affiche maintenant systématiquement avatars/logos via le composant
`<EntityAvatar>` (cf. `components/melron/entity-avatar.tsx`). Pour que les
résultats des tools s'affichent correctement, le MCP **doit** renseigner les
champs suivants quand les données sont disponibles côté LinkedIn / job board.

### Conventions de nommage (snake_case côté tools)

| Entité | Champ obligatoire | Notes |
|---|---|---|
| **Person** | `profile_picture_url` | URL absolue vers la photo LinkedIn. Format JPG/PNG. |
| **Person** (current company) | `company_name`, `company_logo_url` | Société actuelle + logo, pour sous-ligne enrichie. |
| **Company** | `logo_url` | Logo entreprise. |
| **Job** | `company_logo_url` | Logo de l'entreprise qui recrute. Alias accepté : `company.logo` (backward-compat). |
| **Post** (network update) | `author_picture_url` | Photo de l'auteur du post. |
| **Recipient/Recruiter** | `profile_picture_url` | Idem pour les messages drafts et apply results. |

### Règles

1. **URLs absolues HTTPS** uniquement. Pas de paths relatifs.
2. **Pas d'image lazy-loadée derrière un cookie** : LinkedIn signe parfois ses URLs avec `?` token court-vivant. Le MCP doit re-fetcher au moment de la réponse pour garantir la fraîcheur (ou utiliser un proxy / CDN).
3. **Si pas d'image disponible** : envoyer le champ comme `null` ou ne pas l'inclure. Surtout **NE PAS** envoyer une URL placeholder ou cassée — l'app affiche un fallback intelligent (initiales / icône).
4. **Hostnames** : pas besoin de whitelister côté `next.config.images` — `<EntityAvatar>` utilise un `<img>` natif avec `referrerPolicy="no-referrer"` pour contourner les blocages CDN.
5. **Taille suggérée** : 100×100 minimum. L'app rend en 28/36/48px et upscale via `object-cover`.

### Exemple de payload Person

```json
{
  "full_name": "Marie Dupont",
  "headline": "VP Sales @ Acme — Scaling B2B SaaS",
  "profile_url": "https://linkedin.com/in/marie-dupont",
  "profile_picture_url": "https://media.licdn.com/dms/image/...",
  "company_name": "Acme",
  "company_logo_url": "https://media.licdn.com/dms/image/.../acme-logo.png",
  "location": "Paris",
  "network_distance": "2"
}
```

### Exemple de payload Job

```json
{
  "title": "Senior Sales Engineer",
  "company": { "name": "Acme", "link": "https://...", "logo": "https://..." },
  "company_logo_url": "https://media.licdn.com/.../acme-logo.png",
  "location": "Paris (remote OK)",
  "salary": "70-90k€"
}
```

### Tools impactés

Tous les tools qui retournent des entités identifiables doivent populer les champs ci-dessus :
- `find_people` / `smart_people_search`
- `find_jobs` / `smart_job_search`
- `apply_to_job` / `smart_apply` (recruiter)
- `draft_message` / `smart_message` (recipient)
- `network_pulse` / `smart_network_update` (post authors)
- `analyze_person` (subject)
- `show_board` / `board_stats` (cards with people/companies)
- `find_contacts` (toute carte personne)

Si un nouveau tool retourne une entité sans champ image, c'est un bug à corriger côté MCP.

---

**Fin du spec.** Toute déviation doit être documentée et versionnée.
