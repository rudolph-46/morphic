// Thin Unipile messaging client.
// All endpoints documented at https://developer.unipile.com — auth via X-API-KEY.

const UNIPILE_URL = process.env.UNIPILE_URL!
const UNIPILE_TOKEN = process.env.UNIPILE_TOKEN!

const headers = {
  'X-API-KEY': UNIPILE_TOKEN,
  Accept: 'application/json'
}

export interface UnipileAttendee {
  id?: string
  provider_id?: string
  name?: string
  display_name?: string
  picture_url?: string
  headline?: string
  occupation?: string
}

export interface UnipileChat {
  id: string
  provider_id?: string
  account_id: string
  account_type?: string
  type?: number
  name?: string
  unread?: number
  unread_count?: number
  archived?: number
  read_only?: number
  timestamp?: string
  last_message_at?: string
  attendees?: UnipileAttendee[]
  attendee_provider_id?: string
  attendee_name?: string
  last_message?: {
    id?: string
    text?: string
    body?: string
    sender_id?: string
    timestamp?: string
  }
}

export interface UnipileChatList {
  object: 'ChatList' | string
  items: UnipileChat[]
  cursor?: string | null
}

export interface UnipileMessage {
  id: string
  provider_id?: string
  chat_id?: string
  account_id?: string
  sender_id?: string
  sender_attendee_id?: string
  is_sender?: boolean | number
  text?: string
  body?: string
  message?: string
  timestamp?: string
  sent_at?: string
  attachments?: unknown[]
}

export interface UnipileMessageList {
  object: 'MessageList' | string
  items: UnipileMessage[]
  cursor?: string | null
}

export interface UnipileChatAttendee {
  id: string
  account_id?: string
  provider_id?: string
  name?: string
  picture_url?: string
  is_self?: number
  hidden?: number
  specifics?: {
    occupation?: string
    headline?: string
    is_company?: boolean
    member_urn?: string
    provider?: string
  }
}

export interface UnipileAttendeeList {
  object: 'ChatAttendeeList' | string
  items: UnipileChatAttendee[]
}

async function uni<T>(path: string): Promise<T> {
  const res = await fetch(`${UNIPILE_URL}${path}`, { headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Unipile ${res.status} ${path}: ${text.slice(0, 300)}`)
  }
  return (await res.json()) as T
}

async function uniPost<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${UNIPILE_URL}${path}`, {
    method: 'POST',
    headers: { 'X-API-KEY': UNIPILE_TOKEN, Accept: 'application/json' },
    body: form
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Unipile ${res.status} ${path}: ${text.slice(0, 300)}`)
  }
  return (await res.json()) as T
}

export interface UnipileSendResponse {
  object?: string
  message_id?: string
  id?: string
  provider_id?: string
  chat_id?: string
}

/**
 * Send a text message in an existing chat.
 * Unipile expects multipart/form-data with a `text` field.
 */
export async function sendMessage(
  chatId: string,
  text: string
): Promise<UnipileSendResponse> {
  const form = new FormData()
  form.set('text', text)
  return uniPost<UnipileSendResponse>(
    `/chats/${encodeURIComponent(chatId)}/messages`,
    form
  )
}

/**
 * List chats for an account. Returns up to `limit` chats sorted by most recent.
 */
export async function listChats(
  accountId: string,
  options: { limit?: number; cursor?: string } = {}
): Promise<UnipileChatList> {
  const params = new URLSearchParams()
  params.set('account_id', accountId)
  if (options.limit) params.set('limit', String(options.limit))
  if (options.cursor) params.set('cursor', options.cursor)
  return uni<UnipileChatList>(`/chats?${params.toString()}`)
}

/**
 * List messages for a chat. Paginated via cursor; "most recent first" per docs.
 * Returns the page; iterate via cursor to get full history.
 */
export async function listMessages(
  chatId: string,
  options: { limit?: number; cursor?: string } = {}
): Promise<UnipileMessageList> {
  const params = new URLSearchParams()
  if (options.limit) params.set('limit', String(options.limit))
  if (options.cursor) params.set('cursor', options.cursor)
  const qs = params.toString()
  return uni<UnipileMessageList>(
    `/chats/${encodeURIComponent(chatId)}/messages${qs ? `?${qs}` : ''}`
  )
}

export interface UnipileUserProfile {
  object?: string
  provider_id?: string
  first_name?: string
  last_name?: string
  headline?: string
  profile_picture_url?: string
  profile_picture_url_large?: string
}

/**
 * Fetch the user profile (richer than chat attendees — and the profile picture
 * URL returned here is publicly fetchable, unlike the one from /chats/.../attendees).
 */
export async function getUser(
  providerId: string,
  accountId: string
): Promise<UnipileUserProfile> {
  const params = new URLSearchParams({ account_id: accountId })
  return uni<UnipileUserProfile>(
    `/users/${encodeURIComponent(providerId)}?${params.toString()}`
  )
}

/**
 * List participants of a chat.
 */
export async function listChatAttendees(
  chatId: string
): Promise<UnipileAttendeeList> {
  return uni<UnipileAttendeeList>(
    `/chats/${encodeURIComponent(chatId)}/attendees`
  )
}

/**
 * Walk all messages of a chat across all pages.
 * Caps at `maxPages` to avoid runaway calls on very long threads.
 */
export async function listAllMessages(
  chatId: string,
  maxPages = 30,
  perPage = 100
): Promise<UnipileMessage[]> {
  const all: UnipileMessage[] = []
  let cursor: string | undefined
  for (let i = 0; i < maxPages; i++) {
    const page = await listMessages(chatId, { limit: perPage, cursor })
    if (Array.isArray(page.items)) all.push(...page.items)
    if (!page.cursor) break
    cursor = page.cursor
  }
  return all
}
