'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

import { DEV_BYPASS_COOKIE, devBypassAllowed } from '@/lib/auth/dev-bypass'

export async function setDevAuthBypass(enabled: boolean) {
  if (!devBypassAllowed()) {
    throw new Error('Dev auth bypass is not allowed in this environment')
  }

  const store = await cookies()
  store.set(DEV_BYPASS_COOKIE, enabled ? '1' : '0', {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: false,
    sameSite: 'lax'
  })

  revalidatePath('/', 'layout')
}
