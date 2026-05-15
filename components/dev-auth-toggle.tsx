'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { FlaskConical } from 'lucide-react'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

import { setDevAuthBypass } from '@/app/actions/dev-auth'

interface DevAuthToggleProps {
  initialEnabled: boolean
  devUserEmail?: string
}

export function DevAuthToggle({
  initialEnabled,
  devUserEmail
}: DevAuthToggleProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleToggle = (checked: boolean) => {
    startTransition(async () => {
      await setDevAuthBypass(checked)
      router.refresh()
    })
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 rounded-md border border-dashed border-amber-500/40 bg-amber-500/5 px-2 py-1 text-xs">
            <FlaskConical className="size-3.5 text-amber-600 dark:text-amber-400" />
            <Label
              htmlFor="dev-auth-toggle"
              className="cursor-pointer text-amber-700 dark:text-amber-300"
            >
              Dev
            </Label>
            <Switch
              id="dev-auth-toggle"
              checked={initialEnabled}
              disabled={isPending}
              onCheckedChange={handleToggle}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">
            {initialEnabled
              ? `Auth bypassée — connecté en tant que ${devUserEmail ?? 'dev'}`
              : 'Auth Supabase réelle activée'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
