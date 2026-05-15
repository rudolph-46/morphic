'use client'

import { type FormEvent, useState } from 'react'

import {
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  Code,
  Coffee,
  Compass,
  Dumbbell,
  Folder,
  Globe,
  GraduationCap,
  Heart,
  Lightbulb,
  Loader2,
  Music,
  Palette,
  PenLine,
  Plane,
  Rocket,
  Sparkles,
  Target,
  Wrench,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type CollectionType = 'project' | 'agent'

const COLORS = [
  { id: 'zinc', value: 'bg-zinc-700' },
  { id: 'red', value: 'bg-red-500' },
  { id: 'orange', value: 'bg-orange-500' },
  { id: 'amber', value: 'bg-amber-500' },
  { id: 'green', value: 'bg-emerald-500' },
  { id: 'blue', value: 'bg-blue-500' },
  { id: 'violet', value: 'bg-violet-500' },
  { id: 'pink', value: 'bg-pink-500' }
] as const

export const ICONS: Record<string, typeof Folder> = {
  Folder,
  Briefcase,
  BookOpen,
  GraduationCap,
  PenLine,
  Palette,
  Code,
  Music,
  Coffee,
  Wrench,
  Heart,
  Sparkles,
  Rocket,
  Lightbulb,
  Target,
  Compass,
  Globe,
  Plane,
  Dumbbell,
  Brain,
  Bot,
  Zap
}

const ICON_KEYS = Object.keys(ICONS)

interface CreateCollectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: CollectionType
  onCreated?: () => void
}

export function CreateCollectionModal({
  open,
  onOpenChange,
  type,
  onCreated
}: CreateCollectionModalProps) {
  const labels =
    type === 'project'
      ? {
          title: 'Créer un projet',
          description:
            'Les projets regroupent tes chats, fichiers et notes en un seul endroit.',
          submit: 'Créer un projet',
          placeholder: 'Nom du projet'
        }
      : {
          title: 'Créer un agent',
          description:
            'Un agent personnalisé avec son propre style et ses propres connaissances.',
          submit: 'Créer un agent',
          placeholder: 'Nom de l’agent'
        }

  const defaultIcon = type === 'project' ? 'Folder' : 'Sparkles'

  const [name, setName] = useState('')
  const [color, setColor] = useState<string>('zinc')
  const [icon, setIcon] = useState<string>(defaultIcon)
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setName('')
    setColor('zinc')
    setIcon(defaultIcon)
  }

  const close = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const endpoint = type === 'project' ? '/api/projects' : '/api/agents'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), color, icon })
      })
      if (!res.ok) {
        throw new Error(await res.text())
      }
      toast.success(
        type === 'project' ? 'Projet créé' : 'Agent créé'
      )
      onCreated?.()
      close(false)
    } catch (err) {
      console.error(err)
      toast.error('Échec de la création')
    } finally {
      setSubmitting(false)
    }
  }

  const PreviewIcon = ICONS[icon] ?? Folder
  const selectedColor = COLORS.find(c => c.id === color)?.value ?? 'bg-zinc-700'

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="collection-name">Nom</Label>
            <div className="relative">
              <div
                className={cn(
                  'absolute left-2 top-1/2 -translate-y-1/2 size-6 rounded-md flex items-center justify-center text-white',
                  selectedColor
                )}
              >
                <PreviewIcon className="size-3.5" />
              </div>
              <Input
                id="collection-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={labels.placeholder}
                className="pl-10"
                autoFocus
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Couleur</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className={cn(
                    'size-7 rounded-full transition-all',
                    c.value,
                    color === c.id
                      ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground'
                      : 'hover:scale-110'
                  )}
                  aria-label={c.id}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Icône</Label>
            <div className="grid grid-cols-8 gap-1.5">
              {ICON_KEYS.map(key => {
                const Icon = ICONS[key]
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setIcon(key)}
                    className={cn(
                      'size-9 rounded-md flex items-center justify-center transition-colors',
                      icon === key
                        ? 'bg-accent text-accent-foreground ring-1 ring-foreground/20'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                    aria-label={key}
                  >
                    <Icon className="size-4" />
                  </button>
                )
              })}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={!name.trim() || submitting}
              className="ml-auto"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {labels.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
