'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'

interface SidebarNavItemProps {
  href: string
  icon: ReactNode
  label: string
  /**
   * Match strategy:
   * - 'exact' (default): only the exact path is active. Use for /.
   * - 'startsWith': active if pathname starts with href. Use for sections
   *   like /board, /board/foo, /search/<id> (when href is the parent).
   */
  match?: 'exact' | 'startsWith'
}

export function SidebarNavItem({
  href,
  icon,
  label,
  match = 'startsWith'
}: SidebarNavItemProps) {
  const pathname = usePathname()
  const isActive =
    match === 'exact' ? pathname === href : pathname.startsWith(href)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={href} className="flex items-center gap-2">
          {icon}
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
