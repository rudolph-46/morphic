'use client'

// import Link from 'next/link' // No longer needed directly here for Sign In button
import React, { useState } from 'react'
import { usePathname } from 'next/navigation'

import { User } from '@supabase/supabase-js'

import { cn } from '@/lib/utils'

import { useSidebar } from '@/components/ui/sidebar'

import { Button } from './ui/button'
import { DevAuthToggle } from './dev-auth-toggle'
import { FeedbackModal } from './feedback-modal'
import GuestMenu from './guest-menu' // Import the new GuestMenu component

interface HeaderProps {
  user: User | null
  showDevToggle?: boolean
  devBypassActive?: boolean
  devUserEmail?: string
}

export const Header: React.FC<HeaderProps> = ({
  user,
  showDevToggle = false,
  devBypassActive = false,
  devUserEmail
}) => {
  const { open } = useSidebar()
  const pathname = usePathname()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const isRootPage = pathname === '/'

  if (!user && isRootPage) return null

  return (
    <>
      <header
        className={cn(
          'absolute top-0 right-0 p-2 md:p-3 flex justify-between items-center z-10 backdrop-blur-sm lg:backdrop-blur-none bg-background/80 lg:bg-transparent transition-[width] duration-200 ease-linear',
          open ? 'md:w-[calc(100%-var(--sidebar-width))]' : 'md:w-full',
          'w-full'
        )}
      >
        {/* This div can be used for a logo or title on the left if needed */}
        <div></div>

        <div className="flex items-center gap-2">
          {showDevToggle && (
            <DevAuthToggle
              initialEnabled={devBypassActive}
              devUserEmail={devUserEmail}
            />
          )}
          {isRootPage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFeedbackOpen(true)}
            >
              Feedback
            </Button>
          )}
          {!user && <GuestMenu />}
        </div>
      </header>

      {isRootPage && (
        <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      )}
    </>
  )
}

export default Header
