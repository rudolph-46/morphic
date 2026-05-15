'use client'

import { useRouter } from 'next/navigation'

import { Linkedin, Mail, MessageCircle } from 'lucide-react'

import { cn } from '@/lib/utils'

import { type Conversation } from './inbox-data'

const CHANNEL_ICON = {
  linkedin: Linkedin,
  email: Mail,
  whatsapp: MessageCircle
} as const

const CHANNEL_COLOR = {
  linkedin: 'text-[#0A66C2]',
  email: 'text-muted-foreground',
  whatsapp: 'text-emerald-500'
} as const

interface ConversationCardProps {
  conversation: Conversation
}

export function ConversationCard({ conversation: c }: ConversationCardProps) {
  const router = useRouter()
  const ChannelIcon = CHANNEL_ICON[c.channel]

  return (
    <button
      type="button"
      onClick={() => router.push(`/inbox/${c.id}`)}
      className={cn(
        'group relative flex flex-col text-left rounded-xl border bg-card p-4 transition-all min-h-[180px]',
        'hover:border-foreground/30 hover:shadow-md hover:-translate-y-0.5',
        c.unread && 'border-rose-500/30 ring-1 ring-rose-500/10'
      )}
    >
      {/* Unread dot top-right */}
      {c.unread && (
        <span className="absolute top-3 right-3 size-2 rounded-full bg-rose-500" />
      )}

      {/* Header : avatar + name + role */}
      <div className="flex items-start gap-3 mb-3">
        <span
          className={cn(
            'shrink-0 size-11 rounded-full flex items-center justify-center bg-gradient-to-br text-white text-sm font-semibold',
            c.avatarBg
          )}
        >
          {c.avatar}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3
              className={cn(
                'text-sm leading-tight truncate',
                c.unread ? 'font-semibold' : 'font-medium'
              )}
            >
              {c.name}
            </h3>
            <ChannelIcon
              className={cn('size-3 shrink-0', CHANNEL_COLOR[c.channel])}
            />
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {c.role}
          </p>
        </div>
      </div>

      {/* Preview */}
      <p
        className={cn(
          'text-sm leading-relaxed line-clamp-3 flex-1 mb-3',
          c.unread ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {c.preview}
      </p>

      {/* Optional signal */}
      {c.signal && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-snug mb-2 flex items-start gap-1">
          <span>💡</span>
          <span className="line-clamp-1">{c.signal}</span>
        </p>
      )}

      {/* Footer : time + deal stage */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50 text-[11px]">
        <span className="text-muted-foreground">{c.time}</span>
        {c.dealStage && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full border text-foreground/80 truncate max-w-[60%]">
            {c.dealStage}
          </span>
        )}
      </div>
    </button>
  )
}
