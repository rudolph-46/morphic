import { Sparkles, UserRound } from 'lucide-react'

export function EmptyPersonState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="relative mb-6">
        {/* Orbits */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-48 rounded-full border border-dashed border-border/60 animate-[spin_30s_linear_infinite]" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-32 rounded-full border border-dashed border-border/40 animate-[spin_18s_linear_infinite_reverse]" />
        </div>

        {/* Orbiting nodes (small avatars / dots) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative size-48">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 size-3 rounded-full bg-sky-500/70 ring-4 ring-background" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 size-2.5 rounded-full bg-violet-500/70 ring-4 ring-background" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 size-3.5 rounded-full bg-emerald-500/70 ring-4 ring-background" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 size-2 rounded-full bg-amber-500/70 ring-4 ring-background" />
          </div>
        </div>

        {/* Center avatar */}
        <div className="relative size-48 flex items-center justify-center">
          <div className="size-20 rounded-full bg-gradient-to-br from-sky-500/20 to-violet-500/20 flex items-center justify-center ring-8 ring-background">
            <UserRound className="size-9 text-foreground/60" strokeWidth={1.5} />
          </div>
          {/* Sparkles */}
          <Sparkles className="absolute top-4 right-8 size-4 text-amber-400" />
          <Sparkles className="absolute bottom-6 left-6 size-3 text-sky-400" />
        </div>
      </div>

      <h3 className="text-base font-semibold mb-1.5">
        Sélectionne une personne
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        Clique sur quelqu’un à gauche et Melron t’aide à comprendre{' '}
        <span className="text-foreground font-medium">qui matters</span>,{' '}
        <span className="text-foreground font-medium">why now</span>, et{' '}
        <span className="text-foreground font-medium">what to do next</span>.
      </p>
    </div>
  )
}
