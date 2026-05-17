import { NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { linkedinAvatars } from '@/lib/db/schema'

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ providerId: string }> }
) {
  const { providerId } = await ctx.params

  const [row] = await db
    .select({
      bytes: linkedinAvatars.bytes,
      mime: linkedinAvatars.mime
    })
    .from(linkedinAvatars)
    .where(eq(linkedinAvatars.providerId, providerId))
    .limit(1)

  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = new Uint8Array(row.bytes)
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': row.mime,
      'Content-Length': String(body.byteLength),
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800'
    }
  })
}
