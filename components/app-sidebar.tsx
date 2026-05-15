import { Suspense } from 'react'
import Link from 'next/link'

import { User } from '@supabase/supabase-js'
import {
  Activity,
  Inbox,
  LogIn,
  Plus,
  StickyNote
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger
} from '@/components/ui/sidebar'

import { ChatHistorySection } from './sidebar/chat-history-section'
import { ChatHistorySkeleton } from './sidebar/chat-history-skeleton'
import { RecentsCollapsible } from './sidebar/recents-collapsible'
import { SidebarNavItem } from './sidebar/sidebar-nav-item'
import { SidebarSearchBar } from './sidebar/sidebar-search-bar'
import { SidebarUserProfile } from './sidebar/sidebar-user-profile'

interface AppSidebarProps {
  user?: User | null
}

export default function AppSidebar({ user }: AppSidebarProps) {
  return (
    <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
      <SidebarHeader>
        <div className="flex items-center justify-between px-2 pt-3 pb-2">
          <Link href="/">
            <span className="font-semibold text-xl tracking-tight">Melron</span>
          </Link>
          <SidebarTrigger />
        </div>
        <SidebarSearchBar />
      </SidebarHeader>
      <SidebarContent className="flex flex-col px-2 py-2 h-full">
        <SidebarMenu>
          <SidebarNavItem
            href="/"
            icon={<Plus className="size-4" />}
            label="Nouveau chat"
            match="exact"
          />

          <SidebarNavItem
            href="/inbox"
            icon={<Inbox className="size-4" />}
            label="Inbox"
          />
          <SidebarNavItem
            href="/heartbeat"
            icon={<Activity className="size-4" />}
            label="Heartbeat"
          />
          <SidebarNavItem
            href="/notes"
            icon={<StickyNote className="size-4" />}
            label="Notes"
          />
        </SidebarMenu>

        <div className="mt-3 flex-1 min-h-0 flex flex-col">
          <RecentsCollapsible>
            <div className="overflow-y-auto">
              <Suspense fallback={<ChatHistorySkeleton />}>
                <ChatHistorySection />
              </Suspense>
            </div>
          </RecentsCollapsible>
        </div>
      </SidebarContent>
      <SidebarFooter>
        {user ? (
          <SidebarUserProfile user={user} />
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link
                  href="/auth/login"
                  className="flex items-center gap-2"
                >
                  <LogIn className="size-4" />
                  <span>Se connecter</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
