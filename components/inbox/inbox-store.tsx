'use client'

import { Inbox } from 'lucide-react'

import { LinkedinInbox } from './linkedin-inbox'

export function InboxStore() {
  return (
    <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
      <div className="px-8 pt-8 pb-4 shrink-0">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3 mb-2">
          <Inbox className="size-7 text-sky-500" />
          Inbox
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          Tes conversations LinkedIn synchronisées depuis ton compte connecté.
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <LinkedinInbox />
      </div>
    </div>
  )
}
