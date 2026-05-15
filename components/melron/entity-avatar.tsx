'use client'

import { useState } from 'react'

import { Briefcase, Building2, User } from 'lucide-react'

import { cn } from '@/lib/utils'

type EntityKind = 'person' | 'company' | 'job'

interface EntityAvatarProps {
  /** Display name (used for fallback initials and alt text). */
  name: string
  /** Image URL (profile picture for person, logo for company/job). */
  src?: string | null
  kind?: EntityKind
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Round (person) vs slightly rounded square (company/job). */
  shape?: 'circle' | 'rounded'
}

const SIZES: Record<NonNullable<EntityAvatarProps['size']>, string> = {
  sm: 'size-7 text-[10px]',
  md: 'size-9 text-xs',
  lg: 'size-12 text-sm'
}

const ICON_SIZES: Record<NonNullable<EntityAvatarProps['size']>, string> = {
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-5'
}

function getInitials(name: string, kind: EntityKind): string {
  const clean = name.trim()
  if (!clean) return ''
  if (kind === 'person') {
    return clean
      .split(/\s+/)
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase()
  }
  // Company/job: first letter only — logos visually need to be simple.
  return clean[0].toUpperCase()
}

function defaultShape(kind: EntityKind): 'circle' | 'rounded' {
  return kind === 'person' ? 'circle' : 'rounded'
}

/**
 * Reusable avatar for people, companies and jobs returned by Melron MCP tools.
 *
 * Expected field names in tool responses (convention) :
 * - Person  → `profile_picture_url` (LinkedIn profile photo)
 * - Company → `logo_url`            (company logo on LinkedIn)
 * - Job     → `company_logo_url`    (logo of the hiring company)
 *
 * If `src` is missing or fails to load, falls back to initials on a muted
 * background with the appropriate entity icon as a secondary fallback.
 */
export function EntityAvatar({
  name,
  src,
  kind = 'person',
  size = 'md',
  shape,
  className
}: EntityAvatarProps) {
  const [errored, setErrored] = useState(false)
  const initials = getInitials(name, kind)
  const finalShape = shape ?? defaultShape(kind)
  const Icon = kind === 'person' ? User : kind === 'company' ? Building2 : Briefcase

  const base = cn(
    SIZES[size],
    'shrink-0 overflow-hidden bg-muted text-muted-foreground flex items-center justify-center font-semibold',
    finalShape === 'circle' ? 'rounded-full' : 'rounded-md',
    className
  )

  if (src && !errored) {
    return (
      <div className={base}>
        {/* Plain <img> on purpose: LinkedIn/job boards use many hosts we can't
            all whitelist in next.config.images.remotePatterns. Avatars are
            small so optimization wouldn't help much. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="size-full object-cover"
          onError={() => setErrored(true)}
        />
      </div>
    )
  }

  if (initials) {
    return <div className={base}>{initials}</div>
  }

  return (
    <div className={base}>
      <Icon className={ICON_SIZES[size]} />
    </div>
  )
}
