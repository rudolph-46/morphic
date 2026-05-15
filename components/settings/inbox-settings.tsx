'use client'

import { useCallback, useEffect, useState } from 'react'

import { Check, Inbox, Loader2, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function InboxSettings() {
  const [loading, setLoading] = useState(true)
  const [autoTag, setAutoTag] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/inbox/settings')
      if (!res.ok) return
      const data = await res.json()
      setAutoTag(Boolean(data.inboxAutoTag))
      setLastSyncAt(data.inboxLastSyncAt ?? null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const onToggle = async (next: boolean) => {
    setAutoTag(next)
    setSaving(true)
    try {
      const res = await fetch('/api/inbox/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inboxAutoTag: next })
      })
      if (!res.ok) throw new Error('save failed')
      toast.success(next ? 'Auto-tag activé' : 'Auto-tag désactivé')
    } catch {
      setAutoTag(!next)
      toast.error('Échec de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Inbox className="size-5 text-sky-500" />
          <h2 className="text-2xl font-semibold tracking-tight">Inbox</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Paramètres de synchronisation et de tri intelligent de ta messagerie
          LinkedIn.
        </p>
      </div>

      <div className="space-y-6">
        {/* Auto-tag */}
        <div
          className={cn(
            'rounded-xl border p-5 transition-colors',
            autoTag
              ? 'border-emerald-500/40 bg-emerald-500/5'
              : 'border-border/60'
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="size-4 text-emerald-500" />
                <span className="text-sm font-semibold">
                  Tag automatique par IA
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border',
                    autoTag
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : 'border-border/60 bg-muted text-muted-foreground'
                  )}
                >
                  {autoTag ? (
                    <>
                      <Check className="size-2.5" />
                      Activé
                    </>
                  ) : (
                    <>
                      <X className="size-2.5" />
                      Désactivé
                    </>
                  )}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Classe automatiquement tes conversations en{' '}
                <strong>Urgent</strong>, <strong>Important</strong>,{' '}
                <strong>En cours</strong>, <strong>Nouveau</strong>,{' '}
                <strong>À relancer</strong> ou <strong>Faible valeur</strong>{' '}
                pendant la synchronisation. Tourne avec Claude Haiku 4.5 sur
                les 5 derniers messages de chaque thread.
              </p>
            </div>
            <Button
              size="sm"
              variant={autoTag ? 'outline' : 'default'}
              disabled={saving}
              onClick={() => onToggle(!autoTag)}
              className="shrink-0 min-w-[120px]"
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : autoTag ? (
                'Désactiver'
              ) : (
                'Activer'
              )}
            </Button>
          </div>
        </div>

        {/* Sync info */}
        <div className="rounded-xl border border-border/60 p-5">
          <div className="text-sm font-semibold mb-1">
            Synchronisation périodique
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Toutes les 15 minutes, Melron récupère automatiquement tes
            nouveaux messages et threads via Unipile. Un webhook traite les
            nouveaux messages en temps réel.
          </p>
          {lastSyncAt && (
            <p className="text-xs text-muted-foreground mt-2">
              Dernière sync :{' '}
              <strong className="text-foreground">
                {new Date(lastSyncAt).toLocaleString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </strong>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
