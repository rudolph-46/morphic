import { cookies } from 'next/headers'

export const DEV_BYPASS_COOKIE = 'dev_bypass_auth'

/**
 * Whether the dev-only auth bypass toggle is permitted in this environment.
 * Requires NODE_ENV=development and DEV_USER_ID configured.
 */
export function devBypassAllowed(): boolean {
  return (
    process.env.NODE_ENV === 'development' && !!process.env.DEV_USER_ID
  )
}

/**
 * Resolve bypass state from an explicit cookie value (string | undefined).
 * Use this in middleware where `next/headers` is not available.
 */
export function resolveBypassFromCookie(cookieValue: string | undefined): boolean {
  if (process.env.ENABLE_AUTH === 'false') return true
  if (!devBypassAllowed()) return false
  // Default ON in dev when DEV_USER_ID is set; user can opt out with '0'.
  return cookieValue !== '0'
}

/**
 * Async version for server components / route handlers / server actions.
 */
export async function isAuthBypassed(): Promise<boolean> {
  if (process.env.ENABLE_AUTH === 'false') return true
  if (!devBypassAllowed()) return false
  const store = await cookies()
  return store.get(DEV_BYPASS_COOKIE)?.value !== '0'
}
