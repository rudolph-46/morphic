import { type User } from '@supabase/supabase-js'

import { isAuthBypassed } from '@/lib/auth/dev-bypass'
import { createClient } from '@/lib/supabase/server'
import { perfLog } from '@/lib/utils/perf-logging'
import { incrementAuthCallCount } from '@/lib/utils/perf-tracking'

function getDevUserId() {
  return (
    process.env.DEV_USER_ID ||
    process.env.ANONYMOUS_USER_ID ||
    'anonymous-user'
  )
}

function buildDevUser(): User {
  return {
    id: getDevUserId(),
    email: process.env.DEV_USER_EMAIL || 'dev@local',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date(0).toISOString()
  } as unknown as User
}

export async function getCurrentUser() {
  if (await isAuthBypassed()) {
    return buildDevUser()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  return data.user ?? null
}

export async function getCurrentUserId() {
  const count = incrementAuthCallCount()
  perfLog(`getCurrentUserId called - count: ${count}`)

  if (await isAuthBypassed()) {
    if (process.env.MORPHIC_CLOUD_DEPLOYMENT === 'true') {
      throw new Error(
        'Auth bypass is not allowed in MORPHIC_CLOUD_DEPLOYMENT'
      )
    }

    if (process.env.NODE_ENV !== 'test') {
      console.warn(
        `⚠️  Auth bypass active. Using user ${getDevUserId()}.`
      )
    }

    return getDevUserId()
  }

  const user = await getCurrentUser()
  return user?.id
}
