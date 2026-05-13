'use client'

import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

export function AnimatedLogo({
  animate = true,
  className,
  ...props
}: React.ComponentProps<'svg'> & {
  animate?: boolean
}) {
  const [isBlinking, setIsBlinking] = useState(false)

  useEffect(() => {
    if (animate) {
      return
    }

    let blinkTimeoutId: ReturnType<typeof setTimeout> | undefined
    let nextBlinkTimeoutId: ReturnType<typeof setTimeout>

    const scheduleBlink = () => {
      const nextDelay = Math.random() * 5000 + 2000

      nextBlinkTimeoutId = setTimeout(() => {
        setIsBlinking(true)

        blinkTimeoutId = setTimeout(() => {
          setIsBlinking(false)
          scheduleBlink()
        }, 200)
      }, nextDelay)
    }

    scheduleBlink()

    return () => {
      if (blinkTimeoutId) {
        clearTimeout(blinkTimeoutId)
      }
      clearTimeout(nextBlinkTimeoutId)
    }
  }, [animate])

  const glassR = 24
  const lx = 102
  const rx = 154
  const cy = 128

  return (
    <svg
      fill="currentColor"
      viewBox="0 0 256 256"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-8', className)}
      {...props}
    >
      <circle cx="128" cy="128" r="128" fill="black" />
      {/* Glasses frame */}
      <g opacity={0.35}>
        <circle
          cx={lx}
          cy={cy}
          r={glassR}
          fill="none"
          stroke="white"
          strokeWidth={3}
        />
        <circle
          cx={rx}
          cy={cy}
          r={glassR}
          fill="none"
          stroke="white"
          strokeWidth={3}
        />
        <path
          d={`M${lx + glassR - 2} ${cy - 4} Q128 ${cy - 12} ${rx - glassR + 2} ${cy - 4}`}
          fill="none"
          stroke="white"
          strokeWidth={3}
        />
        <line
          x1={lx - glassR}
          y1={cy - 4}
          x2={lx - glassR - 16}
          y2={cy - 8}
          stroke="white"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <line
          x1={rx + glassR}
          y1={cy - 4}
          x2={rx + glassR + 16}
          y2={cy - 8}
          stroke="white"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </g>
      {/* Eyes */}
      <g
        className={cn(
          'origin-center',
          animate && 'animate-[lookAround_2s_ease-in-out_infinite]'
        )}
      >
        <ellipse
          cx="102"
          cy="128"
          rx="18"
          ry="18"
          fill="white"
          className={cn(!animate && isBlinking && 'animate-blink')}
        />
        <ellipse
          cx="154"
          cy="128"
          rx="18"
          ry="18"
          fill="white"
          className={cn(!animate && isBlinking && 'animate-blink')}
        />
      </g>
    </svg>
  )
}
