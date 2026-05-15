import { cn } from '@/lib/utils'

interface PageNavbarProps {
  title: string
  /** Optional right-aligned content (buttons, badges…). */
  actions?: React.ReactNode
  className?: string
}

/**
 * Top page navbar : large semibold title + optional actions on the right.
 * Used in pages like Inbox / Heartbeat / Notes for a consistent header.
 */
export function PageNavbar({ title, actions, className }: PageNavbarProps) {
  return (
    <div
      className={cn(
        'shrink-0 rounded-lg border bg-background flex items-center justify-between px-5 py-4 gap-3',
        className
      )}
    >
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

interface SectionHeaderProps {
  /** Color of the round indicator pill (Tailwind bg-* class). */
  indicatorColor?: string
  title: string
  subtitle?: string
  /** Optional right-aligned content (counter, action…). */
  actions?: React.ReactNode
  className?: string
}

/**
 * Section header shown at the top of a content area : colored indicator pill
 * + title + subtitle. Compact, sits below the page navbar.
 */
export function SectionHeader({
  indicatorColor = 'bg-violet-500',
  title,
  subtitle,
  actions,
  className
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 px-5 py-4',
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        <span
          className={cn(
            'mt-1.5 inline-block h-2 w-6 rounded-full shrink-0',
            indicatorColor
          )}
        />
        <div className="min-w-0">
          <h2 className="text-base font-semibold leading-tight">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  )
}
