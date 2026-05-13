'use client'

import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

function GlassesFrame({
  eyeSize = 18,
  gap = 52,
  cy = 128
}: {
  eyeSize?: number
  gap?: number
  cy?: number
}) {
  const glassR = eyeSize + 6
  const lx = 128 - gap / 2
  const rx = 128 + gap / 2
  return (
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
  )
}

function IconLogo({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      fill="currentColor"
      viewBox="0 0 256 256"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-4', className)}
      {...props}
    >
      <circle cx="128" cy="128" r="128" fill="black" />
      <GlassesFrame />
      <circle cx="102" cy="128" r="18" fill="white" />
      <circle cx="154" cy="128" r="18" fill="white" />
    </svg>
  )
}

function IconLogoOutline({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      fill="currentColor"
      viewBox="0 0 256 256"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-4', className)}
      {...props}
    >
      <circle
        cx="128"
        cy="128"
        r="108"
        fill="none"
        stroke="currentColor"
        strokeWidth="24"
      />
      <GlassesFrame />
      <circle cx="102" cy="128" r="18" fill="currentColor" />
      <circle cx="154" cy="128" r="18" fill="currentColor" />
    </svg>
  )
}

function IconBlinkingLogo({
  className,
  ...props
}: React.ComponentProps<'svg'>) {
  const svgRef = useRef<SVGSVGElement>(null)
  const leftEyeRef = useRef<SVGEllipseElement>(null)
  const rightEyeRef = useRef<SVGEllipseElement>(null)

  useEffect(() => {
    const leftEye = leftEyeRef.current
    const rightEye = rightEyeRef.current
    if (!leftEye || !rightEye) return

    const eyes = [leftEye, rightEye]
    const initialPositions = [
      { cx: 102, cy: 128 },
      { cx: 154, cy: 128 }
    ]

    const triggerBlink = () => {
      eyes.forEach(el => {
        el.setAttribute('ry', '2')
        setTimeout(() => el.setAttribute('ry', '18'), 200)
      })
    }

    const randomInterval = () => Math.random() * 8000 + 2000
    let timeoutId: ReturnType<typeof setTimeout>
    const startBlinking = () => {
      triggerBlink()
      timeoutId = setTimeout(startBlinking, randomInterval())
    }
    startBlinking()

    const handleMove = (clientX: number, clientY: number) => {
      if (!svgRef.current) return
      const rect = svgRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const angle = Math.atan2(clientY - centerY, clientX - centerX)
      const maxMove = 5

      eyes.forEach((el, i) => {
        const { cx, cy } = initialPositions[i]
        el.setAttribute('cx', (cx + Math.cos(angle) * maxMove).toString())
        el.setAttribute('cy', (cy + Math.sin(angle) * maxMove).toString())
      })
    }

    const handleMouseMove = (e: MouseEvent) =>
      handleMove(e.clientX, e.clientY)
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0)
        handleMove(e.touches[0].clientX, e.touches[0].clientY)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  return (
    <svg
      ref={svgRef}
      fill="currentColor"
      viewBox="0 0 256 256"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-4', className)}
      {...props}
    >
      <circle cx="128" cy="128" r="128" fill="#222" />
      <GlassesFrame />
      <ellipse
        ref={leftEyeRef}
        cx="102"
        cy="128"
        rx="18"
        ry="18"
        fill="white"
      />
      <ellipse
        ref={rightEyeRef}
        cx="154"
        cy="128"
        rx="18"
        ry="18"
        fill="white"
      />
    </svg>
  )
}

export { IconBlinkingLogo, IconLogo, IconLogoOutline }
