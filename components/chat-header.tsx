'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import {
  Activity,
  Heart,
  Linkedin,
  Link as LinkIcon,
  MoreHorizontal,
  PencilLine,
  Share2,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'

import { deleteChat, renameChat, shareChat } from '@/lib/actions/chat'
import {
  createHeartbeat,
  hasHeartbeat as checkHasHeartbeat
} from '@/lib/heartbeat/store'
import { cn } from '@/lib/utils'

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
import { Button } from '@/components/ui/button'
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

import { Spinner } from './ui/spinner'

interface ChatHeaderProps {
  chatId: string
  /** Best-effort initial title (fetched lazily client-side). */
  initialTitle?: string
}

export function ChatHeader({ chatId, initialTitle }: ChatHeaderProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle ?? 'Conversation')
  const [hasHb, setHasHb] = useState(false)

  const [shareOpen, setShareOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState(title)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [isSharing, startSharing] = useTransition()
  const [isRenaming, startRenaming] = useTransition()
  const [isDeleting, startDeleting] = useTransition()

  // Lazy fetch chat title + heartbeat status.
  useEffect(() => {
    let cancelled = false
    fetch(`/api/chats?limit=50`)
      .then(r => (r.ok ? r.json() : { chats: [] }))
      .then(({ chats }) => {
        if (cancelled) return
        const found = (chats as Array<{ id: string; title: string }>).find(
          c => c.id === chatId
        )
        if (found?.title) {
          setTitle(found.title)
          setRenameValue(found.title)
        }
      })
      .catch(() => {})
    checkHasHeartbeat(chatId).then(v => {
      if (!cancelled) setHasHb(v)
    })
    return () => {
      cancelled = true
    }
  }, [chatId])

  const shareUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/share/${chatId}` : ''

  const handleShare = () => {
    setShareOpen(true)
    startSharing(async () => {
      // Fire and forget — just makes the chat public if not already.
      await shareChat(chatId).catch(() => null)
    })
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Lien copié')
    } catch {
      toast.error('Impossible de copier')
    }
  }

  const openSocialShare = (
    network: 'x' | 'linkedin' | 'email'
  ) => {
    const text = encodeURIComponent(`Une conversation Melron : ${title}`)
    const url = encodeURIComponent(shareUrl)
    const links: Record<typeof network, string> = {
      x: `https://x.com/intent/tweet?text=${text}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      email: `mailto:?subject=${text}&body=${text}%0A%0A${url}`
    }
    window.open(links[network], '_blank', 'noopener,noreferrer')
  }

  const handleRename = useCallback(() => {
    const next = renameValue.trim()
    if (!next || next === title) {
      setRenameOpen(false)
      return
    }
    startRenaming(async () => {
      const result = await renameChat(chatId, next)
      if (result.success) {
        setTitle(next)
        setRenameOpen(false)
        toast.success('Conversation renommée')
        window.dispatchEvent(new CustomEvent('chat-history-updated'))
      } else {
        toast.error(result.error)
      }
    })
  }, [chatId, renameValue, title])

  const handleDelete = useCallback(() => {
    startDeleting(async () => {
      const result = await deleteChat(chatId)
      if (result?.success) {
        toast.success('Conversation supprimée')
        window.dispatchEvent(new CustomEvent('chat-history-updated'))
        router.push('/')
      } else {
        toast.error(result?.error ?? 'Suppression impossible')
      }
    })
  }, [chatId, router])

  const handleCreateHeartbeat = useCallback(async () => {
    await createHeartbeat({
      chatId,
      chatTitle: title,
      query: title,
      frequency: 'daily',
      channel: 'whatsapp'
    })
    setHasHb(true)
    toast.success('Heartbeat créé')
    window.dispatchEvent(new CustomEvent('heartbeat-updated'))
  }, [chatId, title])

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between gap-2 px-4 py-2 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-semibold truncate">{title}</h2>
          {hasHb && (
            <span
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              title="Heartbeat actif"
            >
              <Activity className="size-3" />
              Heartbeat
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={isSharing}
            className="gap-1.5 h-8"
          >
            <Share2 className="size-3.5" />
            Partager
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-52">
              <DropdownMenuItem
                className="gap-2"
                onSelect={e => {
                  e.preventDefault()
                  setRenameValue(title)
                  setRenameOpen(true)
                }}
              >
                <PencilLine className="size-4" />
                Renommer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {hasHb ? (
                <DropdownMenuItem
                  className="gap-2 text-emerald-600 dark:text-emerald-400"
                  onSelect={e => {
                    e.preventDefault()
                    router.push('/heartbeat')
                  }}
                >
                  <Activity className="size-4" />
                  Voir le Heartbeat
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="gap-2"
                  onSelect={e => {
                    e.preventDefault()
                    handleCreateHeartbeat()
                  }}
                >
                  <Heart className="size-4" />
                  Créer un Heartbeat
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-destructive focus:text-destructive"
                onSelect={e => {
                  e.preventDefault()
                  setDeleteOpen(true)
                }}
              >
                <Trash2 className="size-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Share modal — ChatGPT-style */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md bg-background text-foreground border">
          <DialogHeader>
            <DialogTitle className="text-lg text-foreground">
              {title}
            </DialogTitle>
          </DialogHeader>

          <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            Le lien sera{' '}
            <span className="font-medium text-foreground">public</span> — toute
            personne disposant du lien pourra lire la conversation.
          </div>

          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
            <LinkIcon className="size-4 text-muted-foreground shrink-0" />
            <span className="text-xs truncate flex-1 font-mono text-foreground/80">
              {shareUrl}
            </span>
            <Button size="sm" variant="secondary" onClick={copyLink}>
              Copier
            </Button>
          </div>

          <div className="flex items-center justify-around pt-2">
            <ShareCircle
              label="Copier"
              onClick={copyLink}
              icon={<LinkIcon className="size-5" />}
            />
            <ShareCircle
              label="X"
              onClick={() => openSocialShare('x')}
              icon={<XLogo />}
            />
            <ShareCircle
              label="LinkedIn"
              onClick={() => openSocialShare('linkedin')}
              icon={<Linkedin className="size-5 text-[#0A66C2]" />}
            />
            <ShareCircle
              label="Email"
              onClick={() => openSocialShare('email')}
              icon={
                <span className="text-base font-semibold tracking-tight">
                  @
                </span>
              }
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
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
              onClick={() => setRenameOpen(false)}
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

      {/* Delete alert */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette conversation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive. L&apos;historique de cette
              conversation sera supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={e => {
                e.preventDefault()
                handleDelete()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Spinner /> : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function ShareCircle({
  label,
  icon,
  onClick
}: {
  label: string
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 group"
    >
      <span
        className={cn(
          'size-12 rounded-full flex items-center justify-center bg-muted',
          'group-hover:bg-foreground group-hover:text-background transition-colors'
        )}
      >
        {icon}
      </span>
      <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
        {label}
      </span>
    </button>
  )
}

function XLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4 fill-current"
      aria-hidden="true"
    >
      <path d="M18.244 2H21.5l-7.51 8.585L22.5 22h-6.875l-5.39-7.04L4.04 22H.78l8.05-9.197L1.5 2h7.05l4.873 6.443L18.244 2zm-1.21 18.06h1.86L7.06 3.83H5.07l11.964 16.23z" />
    </svg>
  )
}
