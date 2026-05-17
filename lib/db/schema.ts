import { createId } from '@paralleldrive/cuid2'
import { InferSelectModel, sql } from 'drizzle-orm'
import {
  boolean,
  check,
  customType,
  index,
  integer,
  json,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  varchar
} from 'drizzle-orm/pg-core'

const bytea = customType<{ data: Buffer; default: false }>({
  dataType() {
    return 'bytea'
  }
})

// Constants
const ID_LENGTH = 191
const USER_ID_LENGTH = 255
const VARCHAR_LENGTH = 256
const FILENAME_LENGTH = 1024

// ID generation function
export const generateId = () => createId()

// Chats table
export const chats = pgTable(
  'chats',
  {
    id: varchar('id', { length: ID_LENGTH })
      .primaryKey()
      .$defaultFn(() => generateId()),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    title: text('title').notNull(),
    userId: varchar('user_id', { length: USER_ID_LENGTH }).notNull(),
    visibility: varchar('visibility', {
      length: VARCHAR_LENGTH,
      enum: ['public', 'private']
    })
      .notNull()
      .default('private')
  },
  table => [
    // Indexes
    index('chats_user_id_idx').on(table.userId),
    index('chats_user_id_created_at_idx').on(
      table.userId,
      table.createdAt.desc()
    ),
    index('chats_created_at_idx').on(table.createdAt.desc()),
    // Composite index for RLS subqueries in messages and parts tables
    index('chats_id_user_id_idx').on(table.id, table.userId),

    // RLS Policies
    pgPolicy('users_manage_own_chats', {
      as: 'permissive',
      for: 'all',
      to: 'public',
      using: sql`user_id = current_setting('app.current_user_id', true)`,
      withCheck: sql`user_id = current_setting('app.current_user_id', true)`
    }),
    pgPolicy('public_chats_readable', {
      as: 'permissive',
      for: 'select',
      to: 'public',
      using: sql`visibility = 'public'`
    })
  ]
).enableRLS()

export type Chat = InferSelectModel<typeof chats>

// Messages table (simplified)
export const messages = pgTable(
  'messages',
  {
    id: varchar('id', { length: ID_LENGTH })
      .primaryKey()
      .$defaultFn(() => generateId()),
    chatId: varchar('chat_id', { length: ID_LENGTH })
      .notNull()
      .references(() => chats.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: VARCHAR_LENGTH }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at'),
    metadata: jsonb('metadata').$type<Record<string, any>>()
  },
  table => [
    index('messages_chat_id_idx').on(table.chatId),
    index('messages_chat_id_created_at_idx').on(table.chatId, table.createdAt),

    // RLS Policies - allow access to messages if user owns the chat
    pgPolicy('users_manage_chat_messages', {
      as: 'permissive',
      for: 'all',
      to: 'public',
      using: sql`EXISTS (
        SELECT 1 FROM ${chats}
        WHERE ${chats}.id = chat_id
        AND ${chats}.user_id = current_setting('app.current_user_id', true)
      )`,
      withCheck: sql`EXISTS (
        SELECT 1 FROM ${chats}
        WHERE ${chats}.id = chat_id
        AND ${chats}.user_id = current_setting('app.current_user_id', true)
      )`
    }),
    pgPolicy('public_chat_messages_readable', {
      as: 'permissive',
      for: 'select',
      to: 'public',
      using: sql`EXISTS (
        SELECT 1 FROM ${chats}
        WHERE ${chats}.id = chat_id
        AND ${chats}.visibility = 'public'
      )`
    })
  ]
).enableRLS()

export type Message = InferSelectModel<typeof messages>

// Parts table
export const parts = pgTable(
  'parts',
  {
    id: varchar('id', { length: ID_LENGTH })
      .primaryKey()
      .$defaultFn(() => generateId()),
    messageId: varchar('message_id', { length: ID_LENGTH })
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    order: integer('order').notNull(),
    type: varchar('type', { length: VARCHAR_LENGTH }).notNull(),

    // Text parts
    text_text: text('text_text'),

    // Reasoning parts
    reasoning_text: text('reasoning_text'),

    // File parts
    file_mediaType: varchar('file_media_type', { length: VARCHAR_LENGTH }),
    file_filename: varchar('file_filename', { length: FILENAME_LENGTH }),
    file_url: text('file_url'),

    // Source URL parts
    source_url_sourceId: varchar('source_url_source_id', {
      length: VARCHAR_LENGTH
    }),
    source_url_url: text('source_url_url'),
    source_url_title: text('source_url_title'),

    // Source document parts
    source_document_sourceId: varchar('source_document_source_id', {
      length: VARCHAR_LENGTH
    }),
    source_document_mediaType: varchar('source_document_media_type', {
      length: VARCHAR_LENGTH
    }),
    source_document_title: text('source_document_title'),
    source_document_filename: varchar('source_document_filename', {
      length: FILENAME_LENGTH
    }),
    source_document_url: text('source_document_url'),
    source_document_snippet: text('source_document_snippet'),

    // Tool parts (generic)
    tool_toolCallId: varchar('tool_tool_call_id', { length: VARCHAR_LENGTH }),
    tool_state: varchar('tool_state', { length: VARCHAR_LENGTH }),
    tool_errorText: text('tool_error_text'),

    // Tool-specific columns (all Morphic tools)
    tool_search_input: json('tool_search_input').$type<any>(),
    tool_search_output: json('tool_search_output').$type<any>(),
    tool_fetch_input: json('tool_fetch_input').$type<any>(),
    tool_fetch_output: json('tool_fetch_output').$type<any>(),
    tool_question_input: json('tool_question_input').$type<any>(),
    tool_question_output: json('tool_question_output').$type<any>(),

    // Todo tool columns
    tool_todoWrite_input: json('tool_todoWrite_input').$type<any>(),
    tool_todoWrite_output: json('tool_todoWrite_output').$type<any>(),
    tool_todoRead_input: json('tool_todoRead_input').$type<any>(),
    tool_todoRead_output: json('tool_todoRead_output').$type<any>(),

    // Dynamic tools (includes MCP and other runtime-defined tools)
    tool_dynamic_input: json('tool_dynamic_input').$type<any>(),
    tool_dynamic_output: json('tool_dynamic_output').$type<any>(),
    tool_dynamic_name: varchar('tool_dynamic_name', { length: VARCHAR_LENGTH }),
    tool_dynamic_type: varchar('tool_dynamic_type', { length: VARCHAR_LENGTH }),

    // Data parts (generic support)
    data_prefix: varchar('data_prefix', { length: VARCHAR_LENGTH }),
    data_content: json('data_content').$type<any>(),
    data_id: varchar('data_id', { length: VARCHAR_LENGTH }),

    // Provider metadata
    providerMetadata: json('provider_metadata').$type<Record<string, any>>(),

    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    // Indexes
    index('parts_message_id_idx').on(table.messageId),
    index('parts_message_id_order_idx').on(table.messageId, table.order),

    // Constraints
    check('text_text_required', sql`(type != 'text' OR text_text IS NOT NULL)`),
    check(
      'reasoning_text_required',
      sql`(type != 'reasoning' OR reasoning_text IS NOT NULL)`
    ),
    check(
      'file_fields_required',
      sql`(type != 'file' OR (file_media_type IS NOT NULL AND file_filename IS NOT NULL AND file_url IS NOT NULL))`
    ),
    check(
      'tool_state_valid',
      sql`(tool_state IS NULL OR tool_state IN ('input-streaming', 'input-available', 'output-available', 'output-error'))`
    ),
    check(
      'tool_fields_required',
      sql`(type NOT LIKE 'tool-%' OR (tool_tool_call_id IS NOT NULL AND tool_state IS NOT NULL))`
    ),

    // RLS Policies - allow access to parts if user owns the related chat
    pgPolicy('users_manage_message_parts', {
      as: 'permissive',
      for: 'all',
      to: 'public',
      using: sql`EXISTS (
        SELECT 1 FROM ${messages}
        INNER JOIN ${chats} ON ${chats}.id = ${messages}.chat_id
        WHERE ${messages}.id = message_id
        AND ${chats}.user_id = current_setting('app.current_user_id', true)
      )`,
      withCheck: sql`EXISTS (
        SELECT 1 FROM ${messages}
        INNER JOIN ${chats} ON ${chats}.id = ${messages}.chat_id
        WHERE ${messages}.id = message_id
        AND ${chats}.user_id = current_setting('app.current_user_id', true)
      )`
    }),
    pgPolicy('public_chat_parts_readable', {
      as: 'permissive',
      for: 'select',
      to: 'public',
      using: sql`EXISTS (
        SELECT 1 FROM ${messages}
        INNER JOIN ${chats} ON ${chats}.id = ${messages}.chat_id
        WHERE ${messages}.id = message_id
        AND ${chats}.visibility = 'public'
      )`
    })
  ]
).enableRLS()

export type Part = InferSelectModel<typeof parts>
export type NewPart = typeof parts.$inferInsert

// User profiles table (onboarding + preferences)
export const userProfiles = pgTable(
  'user_profiles',
  {
    userId: varchar('user_id', { length: USER_ID_LENGTH }).primaryKey(),
    onboardingCompleted: boolean('onboarding_completed')
      .notNull()
      .default(false),
    onboardingStep: integer('onboarding_step').notNull().default(0),
    linkedinConnected: boolean('linkedin_connected').notNull().default(false),
    linkedinEmail: varchar('linkedin_email', { length: VARCHAR_LENGTH }),
    unipileAccountId: varchar('unipile_account_id', { length: VARCHAR_LENGTH }),
    whatsappNumber: varchar('whatsapp_number', { length: 50 }),
    whatsappEnabled: boolean('whatsapp_enabled').notNull().default(false),
    inboxAutoTag: boolean('inbox_auto_tag').notNull().default(false),
    inboxLastSyncAt: timestamp('inbox_last_sync_at'),
    inboxNextCursor: text('inbox_next_cursor'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    pgPolicy('profile_select_own', {
      as: 'permissive',
      for: 'select',
      to: 'public',
      using: sql`true`
    }),
    pgPolicy('profile_insert_own', {
      for: 'insert',
      to: 'public',
      withCheck: sql`true`
    }),
    pgPolicy('profile_update_own', {
      for: 'update',
      to: 'public',
      using: sql`true`
    })
  ]
).enableRLS()

export type UserProfile = InferSelectModel<typeof userProfiles>

// Unipile accounts table (synced from Unipile API)
export const unipileAccounts = pgTable(
  'unipile_accounts',
  {
    accountId: varchar('account_id', { length: VARCHAR_LENGTH })
      .primaryKey(),
    email: varchar('email', { length: VARCHAR_LENGTH }),
    provider: varchar('provider', { length: 50 }).notNull().default('LINKEDIN'),
    name: varchar('name', { length: VARCHAR_LENGTH }),
    publicIdentifier: varchar('public_identifier', { length: VARCHAR_LENGTH }),
    linkedinUrnId: varchar('linkedin_urn_id', { length: VARCHAR_LENGTH }),
    status: varchar('status', { length: 50 }).notNull().default('RUNNING'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    syncedAt: timestamp('synced_at').notNull().defaultNow()
  },
  table => [
    index('unipile_accounts_email_idx').on(table.email),
    pgPolicy('unipile_select', {
      as: 'permissive',
      for: 'select',
      to: 'public',
      using: sql`true`
    }),
    pgPolicy('unipile_insert', {
      for: 'insert',
      to: 'public',
      withCheck: sql`true`
    }),
    pgPolicy('unipile_update', {
      for: 'update',
      to: 'public',
      using: sql`true`
    })
  ]
).enableRLS()

export type UnipileAccount = InferSelectModel<typeof unipileAccounts>

// User memories table (structured facts derived from conversations)
export const userMemories = pgTable(
  'user_memories',
  {
    id: varchar('id', { length: ID_LENGTH })
      .primaryKey()
      .$defaultFn(() => generateId()),
    userId: varchar('user_id', { length: USER_ID_LENGTH }).notNull(),
    category: varchar('category', {
      length: 50,
      enum: [
        'identity',
        'business',
        'icp',
        'positioning',
        'goals',
        'relationships',
        'preferences',
        'constraints'
      ]
    }).notNull(),
    content: text('content').notNull(),
    confidence: integer('confidence').notNull().default(80),
    sourceConversationId: varchar('source_conversation_id', {
      length: ID_LENGTH
    }),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('user_memories_user_id_idx').on(table.userId),
    index('user_memories_user_category_idx').on(table.userId, table.category),
    pgPolicy('memories_select', {
      as: 'permissive',
      for: 'select',
      to: 'public',
      using: sql`true`
    }),
    pgPolicy('memories_insert', {
      for: 'insert',
      to: 'public',
      withCheck: sql`true`
    }),
    pgPolicy('memories_update', {
      for: 'update',
      to: 'public',
      using: sql`true`
    }),
    pgPolicy('memories_delete', {
      for: 'delete',
      to: 'public',
      using: sql`true`
    })
  ]
).enableRLS()

export type UserMemory = InferSelectModel<typeof userMemories>

// User memory edits (explicit user instructions)
export const userMemoryEdits = pgTable(
  'user_memory_edits',
  {
    id: varchar('id', { length: ID_LENGTH })
      .primaryKey()
      .$defaultFn(() => generateId()),
    userId: varchar('user_id', { length: USER_ID_LENGTH }).notNull(),
    instruction: text('instruction').notNull(),
    type: varchar('type', {
      length: 20,
      enum: ['add', 'exclude', 'correct']
    }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    index('user_memory_edits_user_id_idx').on(table.userId),
    pgPolicy('edits_select', {
      as: 'permissive',
      for: 'select',
      to: 'public',
      using: sql`true`
    }),
    pgPolicy('edits_insert', {
      for: 'insert',
      to: 'public',
      withCheck: sql`true`
    })
  ]
).enableRLS()

export type UserMemoryEdit = InferSelectModel<typeof userMemoryEdits>

// Heartbeats table
export const heartbeats = pgTable(
  'heartbeats',
  {
    id: varchar('id', { length: ID_LENGTH })
      .primaryKey()
      .$defaultFn(() => generateId()),
    userId: varchar('user_id', { length: USER_ID_LENGTH }).notNull(),
    chatId: varchar('chat_id', { length: ID_LENGTH }),
    chatTitle: varchar('chat_title', { length: VARCHAR_LENGTH }).notNull(),
    query: text('query').notNull(),
    frequency: varchar('frequency', {
      length: 20,
      enum: ['daily', 'weekly', 'custom']
    })
      .notNull()
      .default('daily'),
    channel: varchar('channel', {
      length: 20,
      enum: ['email', 'whatsapp']
    })
      .notNull()
      .default('whatsapp'),
    whatsappNumber: varchar('whatsapp_number', { length: 50 }),
    status: varchar('status', {
      length: 20,
      enum: ['active', 'paused']
    })
      .notNull()
      .default('active'),
    lastRunAt: timestamp('last_run_at'),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    index('heartbeats_user_id_idx').on(table.userId),
    index('heartbeats_status_idx').on(table.status),
    pgPolicy('heartbeats_select', {
      as: 'permissive',
      for: 'select',
      to: 'public',
      using: sql`true`
    }),
    pgPolicy('heartbeats_insert', {
      for: 'insert',
      to: 'public',
      withCheck: sql`true`
    }),
    pgPolicy('heartbeats_update', {
      for: 'update',
      to: 'public',
      using: sql`true`
    }),
    pgPolicy('heartbeats_delete', {
      for: 'delete',
      to: 'public',
      using: sql`true`
    })
  ]
).enableRLS()

export type Heartbeat = InferSelectModel<typeof heartbeats>

// Heartbeat runs table
export const heartbeatRuns = pgTable(
  'heartbeat_runs',
  {
    id: varchar('id', { length: ID_LENGTH })
      .primaryKey()
      .$defaultFn(() => generateId()),
    heartbeatId: varchar('heartbeat_id', { length: ID_LENGTH })
      .notNull()
      .references(() => heartbeats.id, { onDelete: 'cascade' }),
    results: jsonb('results').$type<any[]>().notNull().default([]),
    resultsCount: integer('results_count').notNull().default(0),
    viewToken: varchar('view_token', { length: 50 })
      .notNull()
      .$defaultFn(() => generateId().slice(0, 12)),
    notifiedVia: varchar('notified_via', { length: 20 }).notNull().default('whatsapp'),
    runAt: timestamp('run_at').notNull().defaultNow()
  },
  table => [
    index('heartbeat_runs_heartbeat_id_idx').on(table.heartbeatId),
    index('heartbeat_runs_view_token_idx').on(table.viewToken),
    pgPolicy('runs_select', {
      as: 'permissive',
      for: 'select',
      to: 'public',
      using: sql`true`
    }),
    pgPolicy('runs_insert', {
      for: 'insert',
      to: 'public',
      withCheck: sql`true`
    })
  ]
).enableRLS()

export type HeartbeatRun = InferSelectModel<typeof heartbeatRuns>

// Feedback table
export const feedback = pgTable(
  'feedback',
  {
    id: varchar('id', { length: ID_LENGTH })
      .primaryKey()
      .$defaultFn(() => generateId()),
    userId: varchar('user_id', { length: USER_ID_LENGTH }),
    sentiment: varchar('sentiment', {
      length: VARCHAR_LENGTH,
      enum: ['positive', 'neutral', 'negative']
    }).notNull(),
    message: text('message').notNull(),
    pageUrl: text('page_url').notNull(),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    // Indexes
    index('feedback_user_id_idx').on(table.userId),
    index('feedback_created_at_idx').on(table.createdAt),

    // RLS Policies - Allow reads (for INSERT ... RETURNING and app visibility)
    pgPolicy('feedback_select_policy', {
      as: 'permissive',
      for: 'select',
      to: 'public',
      using: sql`true`
    }),

    // RLS Policy - Allow anyone to insert feedback
    pgPolicy('anyone_can_insert_feedback', {
      for: 'insert',
      to: 'public',
      withCheck: sql`true`
    })
  ]
).enableRLS()

export type Feedback = InferSelectModel<typeof feedback>

// User projects (folders to group chats, like ChatGPT projects)
export const userProjects = pgTable(
  'user_projects',
  {
    id: varchar('id', { length: ID_LENGTH })
      .primaryKey()
      .$defaultFn(() => generateId()),
    userId: varchar('user_id', { length: USER_ID_LENGTH }).notNull(),
    name: varchar('name', { length: VARCHAR_LENGTH }).notNull(),
    color: varchar('color', { length: 32 }).notNull().default('zinc'),
    icon: varchar('icon', { length: 64 }).notNull().default('Folder'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('user_projects_user_idx').on(table.userId),
    pgPolicy('user_projects_select_own', {
      for: 'select',
      to: 'public',
      using: sql`true`
    }),
    pgPolicy('user_projects_insert_own', {
      for: 'insert',
      to: 'public',
      withCheck: sql`true`
    }),
    pgPolicy('user_projects_update_own', {
      for: 'update',
      to: 'public',
      using: sql`true`
    }),
    pgPolicy('user_projects_delete_own', {
      for: 'delete',
      to: 'public',
      using: sql`true`
    })
  ]
).enableRLS()

export type UserProject = InferSelectModel<typeof userProjects>

// User agents (custom AI personas, like ChatGPT GPTs)
export const userAgents = pgTable(
  'user_agents',
  {
    id: varchar('id', { length: ID_LENGTH })
      .primaryKey()
      .$defaultFn(() => generateId()),
    userId: varchar('user_id', { length: USER_ID_LENGTH }).notNull(),
    name: varchar('name', { length: VARCHAR_LENGTH }).notNull(),
    color: varchar('color', { length: 32 }).notNull().default('zinc'),
    icon: varchar('icon', { length: 64 }).notNull().default('Sparkles'),
    description: text('description'),
    systemPrompt: text('system_prompt'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('user_agents_user_idx').on(table.userId),
    pgPolicy('user_agents_select_own', {
      for: 'select',
      to: 'public',
      using: sql`true`
    }),
    pgPolicy('user_agents_insert_own', {
      for: 'insert',
      to: 'public',
      withCheck: sql`true`
    }),
    pgPolicy('user_agents_update_own', {
      for: 'update',
      to: 'public',
      using: sql`true`
    }),
    pgPolicy('user_agents_delete_own', {
      for: 'delete',
      to: 'public',
      using: sql`true`
    })
  ]
).enableRLS()

export type UserAgent = InferSelectModel<typeof userAgents>

// Notes table — free-form notes the user can save and access from the sidebar.
// Optionally linked to a chat (e.g. when saving a message as a note).
export const notes = pgTable(
  'notes',
  {
    id: varchar('id', { length: ID_LENGTH })
      .primaryKey()
      .$defaultFn(() => generateId()),
    userId: varchar('user_id', { length: USER_ID_LENGTH }).notNull(),
    title: varchar('title', { length: VARCHAR_LENGTH }).notNull(),
    content: text('content').notNull().default(''),
    chatId: varchar('chat_id', { length: ID_LENGTH }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('notes_user_idx').on(table.userId),
    index('notes_user_updated_idx').on(table.userId, table.updatedAt.desc()),
    pgPolicy('notes_select_own', {
      for: 'select',
      to: 'public',
      using: sql`true`
    }),
    pgPolicy('notes_insert_own', {
      for: 'insert',
      to: 'public',
      withCheck: sql`true`
    }),
    pgPolicy('notes_update_own', {
      for: 'update',
      to: 'public',
      using: sql`true`
    }),
    pgPolicy('notes_delete_own', {
      for: 'delete',
      to: 'public',
      using: sql`true`
    })
  ]
).enableRLS()

export type Note = InferSelectModel<typeof notes>

// LinkedIn / Unipile inbox — threads (chats) and messages
export const linkedinThreads = pgTable(
  'linkedin_threads',
  {
    id: varchar('id', { length: ID_LENGTH })
      .primaryKey()
      .$defaultFn(() => generateId()),
    userId: varchar('user_id', { length: USER_ID_LENGTH }).notNull(),
    accountId: varchar('account_id', { length: VARCHAR_LENGTH }).notNull(),
    providerChatId: varchar('provider_chat_id', { length: VARCHAR_LENGTH })
      .notNull(),
    provider: varchar('provider', { length: 50 })
      .notNull()
      .default('LINKEDIN'),
    attendeeName: varchar('attendee_name', { length: VARCHAR_LENGTH }),
    attendeeHeadline: text('attendee_headline'),
    attendeeProviderId: varchar('attendee_provider_id', {
      length: VARCHAR_LENGTH
    }),
    attendeeAvatarUrl: text('attendee_avatar_url'),
    lastMessageAt: timestamp('last_message_at'),
    lastMessagePreview: text('last_message_preview'),
    unreadCount: integer('unread_count').notNull().default(0),
    aiTags: jsonb('ai_tags').$type<string[]>().notNull().default([]),
    suggestedReplies: jsonb('suggested_replies')
      .$type<Array<{ tone: string; text: string }>>()
      .notNull()
      .default([]),
    syncedAt: timestamp('synced_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    index('linkedin_threads_user_idx').on(table.userId),
    index('linkedin_threads_account_idx').on(table.accountId),
    index('linkedin_threads_provider_chat_idx').on(table.providerChatId),
    pgPolicy('linkedin_threads_select_own', {
      for: 'select',
      to: 'public',
      using: sql`true`
    }),
    pgPolicy('linkedin_threads_insert_own', {
      for: 'insert',
      to: 'public',
      withCheck: sql`true`
    }),
    pgPolicy('linkedin_threads_update_own', {
      for: 'update',
      to: 'public',
      using: sql`true`
    }),
    pgPolicy('linkedin_threads_delete_own', {
      for: 'delete',
      to: 'public',
      using: sql`true`
    })
  ]
).enableRLS()

export type LinkedinThread = InferSelectModel<typeof linkedinThreads>

export const linkedinMessages = pgTable(
  'linkedin_messages',
  {
    id: varchar('id', { length: ID_LENGTH })
      .primaryKey()
      .$defaultFn(() => generateId()),
    threadId: varchar('thread_id', { length: ID_LENGTH })
      .notNull()
      .references(() => linkedinThreads.id, { onDelete: 'cascade' }),
    providerMessageId: varchar('provider_message_id', {
      length: VARCHAR_LENGTH
    }).notNull(),
    senderProviderId: varchar('sender_provider_id', {
      length: VARCHAR_LENGTH
    }),
    isFromMe: boolean('is_from_me').notNull().default(false),
    body: text('body'),
    attachments: jsonb('attachments').$type<unknown[]>().notNull().default([]),
    sentAt: timestamp('sent_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    index('linkedin_messages_thread_idx').on(table.threadId),
    index('linkedin_messages_provider_msg_idx').on(table.providerMessageId),
    pgPolicy('linkedin_messages_select_own', {
      for: 'select',
      to: 'public',
      using: sql`true`
    }),
    pgPolicy('linkedin_messages_insert_own', {
      for: 'insert',
      to: 'public',
      withCheck: sql`true`
    }),
    pgPolicy('linkedin_messages_update_own', {
      for: 'update',
      to: 'public',
      using: sql`true`
    }),
    pgPolicy('linkedin_messages_delete_own', {
      for: 'delete',
      to: 'public',
      using: sql`true`
    })
  ]
).enableRLS()

export type LinkedinMessage = InferSelectModel<typeof linkedinMessages>

// Cached LinkedIn profile pictures, downloaded once and served from our own
// origin to bypass LinkedIn CDN's signed-URL restrictions. Keyed by provider id
// (the LinkedIn member URN-ish string) so the same person reuses one row across
// threads.
export const linkedinAvatars = pgTable(
  'linkedin_avatars',
  {
    providerId: varchar('provider_id', { length: VARCHAR_LENGTH }).primaryKey(),
    accountId: varchar('account_id', { length: VARCHAR_LENGTH }).notNull(),
    mime: varchar('mime', { length: 64 }).notNull(),
    bytes: bytea('bytes').notNull(),
    sourceUrl: text('source_url'),
    fetchedAt: timestamp('fetched_at').notNull().defaultNow()
  },
  table => [
    index('linkedin_avatars_account_idx').on(table.accountId),
    pgPolicy('linkedin_avatars_select_own', {
      for: 'select',
      to: 'public',
      using: sql`true`
    }),
    pgPolicy('linkedin_avatars_insert_own', {
      for: 'insert',
      to: 'public',
      withCheck: sql`true`
    }),
    pgPolicy('linkedin_avatars_update_own', {
      for: 'update',
      to: 'public',
      using: sql`true`
    }),
    pgPolicy('linkedin_avatars_delete_own', {
      for: 'delete',
      to: 'public',
      using: sql`true`
    })
  ]
).enableRLS()

export type LinkedinAvatar = InferSelectModel<typeof linkedinAvatars>

// Cached LinkedIn profile (response from Unipile /users/{provider_id}).
// One row per LinkedIn member; rehydrated on demand by the profile panel.
export const linkedinProfiles = pgTable(
  'linkedin_profiles',
  {
    providerId: varchar('provider_id', { length: VARCHAR_LENGTH }).primaryKey(),
    accountId: varchar('account_id', { length: VARCHAR_LENGTH }).notNull(),
    raw: jsonb('raw').$type<Record<string, unknown>>().notNull(),
    fetchedAt: timestamp('fetched_at').notNull().defaultNow()
  },
  table => [
    index('linkedin_profiles_account_idx').on(table.accountId),
    pgPolicy('linkedin_profiles_select_own', {
      for: 'select',
      to: 'public',
      using: sql`true`
    }),
    pgPolicy('linkedin_profiles_insert_own', {
      for: 'insert',
      to: 'public',
      withCheck: sql`true`
    }),
    pgPolicy('linkedin_profiles_update_own', {
      for: 'update',
      to: 'public',
      using: sql`true`
    }),
    pgPolicy('linkedin_profiles_delete_own', {
      for: 'delete',
      to: 'public',
      using: sql`true`
    })
  ]
).enableRLS()

export type LinkedinProfile = InferSelectModel<typeof linkedinProfiles>

// Per-thread Melron chat history (scoped AI conversation about the person).
export const inboxAiMessages = pgTable(
  'inbox_ai_messages',
  {
    id: varchar('id', { length: ID_LENGTH })
      .primaryKey()
      .$defaultFn(() => generateId()),
    threadId: varchar('thread_id', { length: ID_LENGTH })
      .notNull()
      .references(() => linkedinThreads.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 32, enum: ['user', 'assistant'] }).notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    index('inbox_ai_messages_thread_idx').on(table.threadId, table.createdAt),
    pgPolicy('inbox_ai_messages_select_own', {
      for: 'select',
      to: 'public',
      using: sql`true`
    }),
    pgPolicy('inbox_ai_messages_insert_own', {
      for: 'insert',
      to: 'public',
      withCheck: sql`true`
    }),
    pgPolicy('inbox_ai_messages_delete_own', {
      for: 'delete',
      to: 'public',
      using: sql`true`
    })
  ]
).enableRLS()

export type InboxAiMessage = InferSelectModel<typeof inboxAiMessages>

// Per-chat-request performance traces. Captured by the chat route to compare
// before/after optimisations.
export const chatPerfTraces = pgTable(
  'chat_perf_traces',
  {
    id: varchar('id', { length: ID_LENGTH })
      .primaryKey()
      .$defaultFn(() => generateId()),
    chatId: varchar('chat_id', { length: ID_LENGTH }),
    messageId: varchar('message_id', { length: ID_LENGTH }),
    userId: varchar('user_id', { length: USER_ID_LENGTH }).notNull(),
    model: varchar('model', { length: VARCHAR_LENGTH }),
    searchMode: varchar('search_mode', { length: 32 }),
    queryLength: integer('query_length').notNull().default(0),
    thinkingEnabled: boolean('thinking_enabled').notNull().default(false),
    thinkingBudgetTokens: integer('thinking_budget_tokens'),
    // Stage timings in milliseconds
    preflightMs: integer('preflight_ms'),
    mcpSetupMs: integer('mcp_setup_ms'),
    ttftMs: integer('ttft_ms'),
    streamingMs: integer('streaming_ms'),
    totalMs: integer('total_ms').notNull(),
    // Tool calls
    toolCallCount: integer('tool_call_count').notNull().default(0),
    toolCalls: jsonb('tool_calls')
      .$type<Array<{ name: string; durationMs: number }>>()
      .notNull()
      .default([]),
    mcpToolNames: jsonb('mcp_tool_names')
      .$type<string[]>()
      .notNull()
      .default([]),
    // Anthropic usage
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    cacheReadTokens: integer('cache_read_tokens'),
    cacheCreationTokens: integer('cache_creation_tokens'),
    // Free-form notes (e.g. "before-mcp-cache", "after-mcp-cache") for A/B
    label: varchar('label', { length: 64 }),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    index('chat_perf_user_idx').on(table.userId),
    index('chat_perf_created_idx').on(table.createdAt),
    index('chat_perf_label_idx').on(table.label),
    pgPolicy('chat_perf_select_own', {
      for: 'select',
      to: 'public',
      using: sql`true`
    }),
    pgPolicy('chat_perf_insert_own', {
      for: 'insert',
      to: 'public',
      withCheck: sql`true`
    })
  ]
).enableRLS()

export type ChatPerfTrace = InferSelectModel<typeof chatPerfTraces>
