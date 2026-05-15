'use client'

import {
  type ComponentProps,
  createContext,
  memo,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import {
  BrainIcon,
  Check,
  ChevronDownIcon,
  ChevronRight,
  Loader2,
  type LucideIcon,
  X
} from 'lucide-react'

import { cn } from '@/lib/utils'

import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'

// ── Tiny controllable-state helper (avoids extra Radix sub-package dep) ──

function useControllable<T>({
  value,
  defaultValue,
  onChange
}: {
  value?: T
  defaultValue: T
  onChange?: (v: T) => void
}): [T, (v: T) => void] {
  const [internal, setInternal] = useState(defaultValue)
  const isControlled = value !== undefined
  const current = isControlled ? value : internal
  const set = (next: T) => {
    if (!isControlled) setInternal(next)
    onChange?.(next)
  }
  return [current, set]
}

// ── Context ──────────────────────────────────────────

interface CoTContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const CoTContext = createContext<CoTContextValue | null>(null)

const useCoT = () => {
  const ctx = useContext(CoTContext)
  if (!ctx) {
    throw new Error(
      'ChainOfThought sub-components must be used inside <ChainOfThought>'
    )
  }
  return ctx
}

// ── Top-level wrapper ────────────────────────────────

export type ChainOfThoughtProps = ComponentProps<'div'> & {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export const ChainOfThought = memo(function ChainOfThought({
  className,
  open,
  defaultOpen = false,
  onOpenChange,
  children,
  ...props
}: ChainOfThoughtProps) {
  const [isOpen, setIsOpen] = useControllable({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange
  })

  const value = useMemo(() => ({ isOpen, setIsOpen }), [isOpen, setIsOpen])

  return (
    <CoTContext.Provider value={value}>
      <div className={cn('not-prose space-y-2', className)} {...props}>
        {children}
      </div>
    </CoTContext.Provider>
  )
})

// ── Header (global toggle) ───────────────────────────

export type ChainOfThoughtHeaderProps = ComponentProps<typeof CollapsibleTrigger>

export const ChainOfThoughtHeader = memo(function ChainOfThoughtHeader({
  className,
  children,
  ...props
}: ChainOfThoughtHeaderProps) {
  const { isOpen, setIsOpen } = useCoT()
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground',
          className
        )}
        {...props}
      >
        <BrainIcon className="size-4" />
        <span className="flex-1 text-left">
          {children ?? 'Chaîne de raisonnement'}
        </span>
        <ChevronDownIcon
          className={cn(
            'size-4 transition-transform',
            isOpen ? 'rotate-180' : 'rotate-0'
          )}
        />
      </CollapsibleTrigger>
    </Collapsible>
  )
})

// ── Content wrapper (animated open/close) ────────────

export type ChainOfThoughtContentProps = ComponentProps<typeof CollapsibleContent>

export const ChainOfThoughtContent = memo(function ChainOfThoughtContent({
  className,
  children,
  ...props
}: ChainOfThoughtContentProps) {
  const { isOpen } = useCoT()
  return (
    <Collapsible open={isOpen}>
      <CollapsibleContent
        className={cn(
          'mt-2 space-y-3 outline-none text-popover-foreground',
          'data-[state=closed]:animate-out data-[state=open]:animate-in',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2',
          className
        )}
        {...props}
      >
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
})

// ── Step status ──────────────────────────────────────

export type StepStatus = 'pending' | 'loading' | 'complete' | 'error'

const STATUS_DOT: Record<StepStatus, string> = {
  pending: 'border-border bg-background text-muted-foreground/50',
  loading: 'border-primary bg-background text-primary',
  complete: 'border-green-500 bg-green-500 text-white',
  error: 'border-destructive bg-destructive text-white'
}

const STATUS_TEXT: Record<StepStatus, string> = {
  pending: 'text-muted-foreground/60',
  loading: 'text-foreground',
  complete: 'text-foreground/85',
  error: 'text-foreground'
}

// ── Step ─────────────────────────────────────────────

export type ChainOfThoughtStepProps = ComponentProps<'div'> & {
  /** Custom icon (used for `complete`/`pending` states; overrides the default check). */
  icon?: LucideIcon
  label: ReactNode
  description?: ReactNode
  status?: StepStatus
  /** Hide the connector line below this step (for the last item). */
  isLast?: boolean
}

export const ChainOfThoughtStep = memo(function ChainOfThoughtStep({
  className,
  icon: Icon,
  label,
  description,
  status = 'complete',
  isLast = false,
  children,
  ...props
}: ChainOfThoughtStepProps) {
  return (
    <div
      className={cn(
        'flex gap-2.5 text-sm',
        'fade-in-0 slide-in-from-top-1 animate-in',
        STATUS_TEXT[status],
        className
      )}
      {...props}
    >
      {/* Status dot + connector */}
      <div className="relative shrink-0">
        <div
          className={cn(
            'relative z-10 flex items-center justify-center size-[22px] rounded-full border-2 transition-colors',
            STATUS_DOT[status]
          )}
        >
          {status === 'loading' ? (
            <Loader2 className="size-3 animate-spin" />
          ) : status === 'error' ? (
            <X className="size-3" />
          ) : Icon ? (
            <Icon className="size-3" />
          ) : status === 'complete' ? (
            <Check className="size-3" />
          ) : (
            <span className="size-1.5 rounded-full bg-muted-foreground/40" />
          )}
        </div>
        {!isLast && (
          <div className="absolute left-1/2 -ml-px top-[26px] -bottom-2 w-px bg-border" />
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 space-y-1.5 pb-1">
        <div className="font-medium leading-snug">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
        {children}
      </div>
    </div>
  )
})

// ── Sources / search results (Perplexity-style chips) ────

export type ChainOfThoughtSearchResultsProps = ComponentProps<'div'>

export const ChainOfThoughtSearchResults = memo(
  function ChainOfThoughtSearchResults({
    className,
    ...props
  }: ChainOfThoughtSearchResultsProps) {
    return (
      <div
        className={cn('flex flex-wrap items-center gap-1.5', className)}
        {...props}
      />
    )
  }
)

export type ChainOfThoughtSearchResultProps = ComponentProps<typeof Badge>

export const ChainOfThoughtSearchResult = memo(
  function ChainOfThoughtSearchResult({
    className,
    children,
    ...props
  }: ChainOfThoughtSearchResultProps) {
    return (
      <Badge
        className={cn('gap-1 px-2 py-0.5 font-normal text-xs', className)}
        variant="secondary"
        {...props}
      >
        {children}
      </Badge>
    )
  }
)

// ── Per-step reasoning ("Thinking…" with timer + optional content) ────

const AUTO_CLOSE_DELAY = 1000

export type ChainOfThoughtStepReasoningProps = {
  /** True while the model is actively thinking on this step. */
  isStreaming?: boolean
  /** Optional thought text (markdown). If absent, only the label shows. */
  children?: string
  /** Override the streaming label. */
  thinkingLabel?: ReactNode
  /** Override the done label. Receives the elapsed seconds (or undefined). */
  doneLabel?: (seconds: number | undefined) => ReactNode
  className?: string
}

function defaultDoneLabel(seconds: number | undefined): ReactNode {
  if (seconds === undefined) return 'Réflexion terminée'
  if (seconds < 1) return 'Réfléchi en moins d\'1 s'
  return `Réfléchi en ${seconds} s`
}

/**
 * Mini "Thinking…" block to embed inside a <ChainOfThoughtStep>. Tracks
 * duration automatically: starts a timer when isStreaming flips to true,
 * stops + records the elapsed seconds when it flips back to false.
 *
 * Auto-collapses 1 s after streaming ends so the trace stays compact.
 */
export const ChainOfThoughtStepReasoning = memo(
  function ChainOfThoughtStepReasoning({
    isStreaming = false,
    children,
    thinkingLabel,
    doneLabel = defaultDoneLabel,
    className
  }: ChainOfThoughtStepReasoningProps) {
    const startRef = useRef<number | null>(null)
    const [duration, setDuration] = useState<number | undefined>(undefined)
    const [isOpen, setIsOpen] = useState(true)
    const hasAutoClosedRef = useRef(false)

    // Track elapsed time across the streaming window.
    useEffect(() => {
      if (isStreaming) {
        if (startRef.current === null) {
          startRef.current = Date.now()
          setIsOpen(true)
          hasAutoClosedRef.current = false
        }
      } else if (startRef.current !== null) {
        setDuration(Math.max(0, Math.round((Date.now() - startRef.current) / 1000)))
        startRef.current = null
      }
    }, [isStreaming])

    // Auto-collapse after streaming ends (once).
    useEffect(() => {
      if (isStreaming || hasAutoClosedRef.current) return
      if (!children) return // Nothing to collapse if no body content.
      const timer = setTimeout(() => {
        setIsOpen(false)
        hasAutoClosedRef.current = true
      }, AUTO_CLOSE_DELAY)
      return () => clearTimeout(timer)
    }, [isStreaming, children])

    const hasBody = !!children?.trim()

    const label = isStreaming ? (
      <span className="animate-pulse">{thinkingLabel ?? 'Réflexion en cours…'}</span>
    ) : (
      <span>{doneLabel(duration)}</span>
    )

    if (!hasBody) {
      // Compact mode: label only, no toggle.
      return (
        <div
          className={cn(
            'flex items-center gap-1.5 text-xs text-muted-foreground',
            className
          )}
        >
          {label}
        </div>
      )
    }

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger
          className={cn(
            'flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors',
            className
          )}
        >
          <ChevronRight
            className={cn(
              'size-3 transition-transform',
              isOpen && 'rotate-90'
            )}
          />
          {label}
        </CollapsibleTrigger>
        <CollapsibleContent
          className={cn(
            'mt-1.5 ml-4 pl-2 border-l border-border/50 text-xs text-muted-foreground/90 leading-relaxed',
            'data-[state=closed]:animate-out data-[state=open]:animate-in',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        >
          <div className="whitespace-pre-wrap py-1">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    )
  }
)

// ── Image attachment with caption ────────────────────

export type ChainOfThoughtImageProps = ComponentProps<'div'> & {
  caption?: string
}

export const ChainOfThoughtImage = memo(function ChainOfThoughtImage({
  className,
  children,
  caption,
  ...props
}: ChainOfThoughtImageProps) {
  return (
    <div className={cn('mt-1 space-y-1.5', className)} {...props}>
      <div className="relative flex max-h-[22rem] items-center justify-center overflow-hidden rounded-lg bg-muted p-3">
        {children}
      </div>
      {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
    </div>
  )
})
