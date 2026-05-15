'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import {
  Activity,
  Heart,
  MoreHorizontal,
  PencilLine,
  Share2,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'

import { deleteChat, renameChat, shareChat } from '@/lib/actions/chat'
import { Chat as DBChat } from '@/lib/db/schema'
import {
  createHeartbeat,
  hasHeartbeat as checkHasHeartbeat
} from '@/lib/heartbeat/store'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'

import { Button } from '../ui/button'
import { Spinner } from '../ui/spinner'

interface ChatMenuItemProps {
  chat: DBChat
}

const formatDateWithTime = (date: Date | string) => {
  const parsedDate = new Date(date)
  const now = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  if (
    parsedDate.getDate() === now.getDate() &&
    parsedDate.getMonth() === now.getMonth() &&
    parsedDate.getFullYear() === now.getFullYear()
  ) {
    return `Today, ${formatTime(parsedDate)}`
  } else if (
    parsedDate.getDate() === yesterday.getDate() &&
    parsedDate.getMonth() === yesterday.getMonth() &&
    parsedDate.getFullYear() === yesterday.getFullYear()
  ) {
    return `Yesterday, ${formatTime(parsedDate)}`
  } else {
    return parsedDate.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }
}

export function ChatMenuItem({ chat }: ChatMenuItemProps) {
  const pathname = usePathname()
  const path = `/search/${chat.id}`
  const isActive = pathname === path
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState(chat.title ?? '')
  const [isRenaming, startRenaming] = useTransition()
  const [isSharing, startSharing] = useTransition()
  const [hasHb, setHasHb] = useState(false)

  useEffect(() => {
    checkHasHeartbeat(chat.id).then(setHasHb)
    const handler = () => {
      checkHasHeartbeat(chat.id).then(setHasHb)
    }
    window.addEventListener('heartbeat-updated', handler)
    return () => window.removeEventListener('heartbeat-updated', handler)
  }, [chat.id])

  const handleDeleteChat = useCallback(() => {
    setIsAlertOpen(false)
    setIsMenuOpen(false)

    startTransition(async () => {
      const result = await deleteChat(chat.id)

      if (result?.success) {
        toast.success('Conversation supprimée')
        if (isActive) {
          router.push('/')
        }
        window.dispatchEvent(new CustomEvent('chat-history-updated'))
      } else if (result?.error) {
        toast.error(result.error)
      } else {
        toast.error('Une erreur est survenue lors de la suppression.')
      }
    })
  }, [chat.id, isActive, router, startTransition])

  const handleRename = useCallback(() => {
    const next = renameValue.trim()
    if (!next || next === chat.title) {
      setIsRenameOpen(false)
      return
    }
    startRenaming(async () => {
      const result = await renameChat(chat.id, next)
      if (result.success) {
        toast.success('Conversation renommée')
        setIsRenameOpen(false)
        window.dispatchEvent(new CustomEvent('chat-history-updated'))
      } else {
        toast.error(result.error)
      }
    })
  }, [chat.id, chat.title, renameValue, startRenaming])

  const handleShare = useCallback(() => {
    setIsMenuOpen(false)
    startSharing(async () => {
      const shared = await shareChat(chat.id)
      if (!shared) {
        toast.error('Impossible de partager cette conversation')
        return
      }
      const url = `${window.location.origin}/share/${chat.id}`
      try {
        await navigator.clipboard.writeText(url)
        toast.success('Lien de partage copié', { description: url })
      } catch {
        toast.success('Conversation partagée', { description: url })
      }
    })
  }, [chat.id, startSharing])

  const handleCreateHeartbeat = useCallback(async () => {
    setIsMenuOpen(false)
    await createHeartbeat({
      chatId: chat.id,
      chatTitle: chat.title ?? 'Sans titre',
      query: chat.title ?? '',
      frequency: 'daily',
      channel: 'whatsapp'
    })
    toast.success('Heartbeat créé', {
      description: 'Cette conversation sera relancée quotidiennement.'
    })
  }, [chat.id, chat.title])

  const handleMenuOpenChange = useCallback((open: boolean) => {
    setIsMenuOpen(open)
  }, [])

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className="h-auto flex-col gap-0.5 items-start p-2 pr-8"
      >
        <Link href={path}>
          <div className="flex items-center gap-1.5 text-xs font-medium truncate select-none w-full">
            {hasHb && (
              <Activity className="size-3 text-green-500 shrink-0 animate-pulse" />
            )}
            <span className="truncate">{chat.title}</span>
          </div>
          <div className="text-xs text-muted-foreground w-full">
            {formatDateWithTime(chat.createdAt)}
          </div>
        </Link>
      </SidebarMenuButton>

      <DropdownMenu open={isMenuOpen} onOpenChange={handleMenuOpenChange}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction className="size-7 p-1 mr-1">
            <MoreHorizontal size={16} />
            <span className="sr-only">Chat Actions</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="min-w-52">
          <DropdownMenuItem
            className="gap-2"
            disabled={isSharing}
            onSelect={event => {
              event.preventDefault()
              handleShare()
            }}
          >
            <Share2 size={14} />
            Partager
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2"
            onSelect={event => {
              event.preventDefault()
              setIsMenuOpen(false)
              setRenameValue(chat.title ?? '')
              setIsRenameOpen(true)
            }}
          >
            <PencilLine size={14} />
            Renommer
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {!hasHb && (
            <DropdownMenuItem
              className="gap-2"
              onSelect={event => {
                event.preventDefault()
                handleCreateHeartbeat()
              }}
            >
              <Heart size={14} />
              Créer un Heartbeat
            </DropdownMenuItem>
          )}
          {hasHb && (
            <DropdownMenuItem
              className="gap-2 text-green-600"
              onSelect={event => {
                event.preventDefault()
                setIsMenuOpen(false)
                router.push('/heartbeat')
              }}
            >
              <Activity size={14} />
              Voir le Heartbeat
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 text-destructive focus:text-destructive"
            onSelect={event => {
              event.preventDefault()
              setIsMenuOpen(false)
              setIsAlertOpen(true)
            }}
          >
            <Trash2 size={14} />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renommer la conversation</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleRename()
              }
            }}
            placeholder="Nouveau titre"
            autoFocus
            maxLength={200}
            disabled={isRenaming}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRenameOpen(false)}
              disabled={isRenaming}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleRename}
              disabled={isRenaming || !renameValue.trim()}
            >
              {isRenaming ? <Spinner /> : 'Renommer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette conversation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive. L'historique de cette conversation
              sera supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={event => {
                event.preventDefault()
                handleDeleteChat()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <div className="flex items-center justify-center">
                  <Spinner />
                </div>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarMenuItem>
  )
}
