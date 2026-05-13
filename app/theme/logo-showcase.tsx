'use client'

import { useEffect, useRef, useState } from 'react'

function useMouseAngle(ref: React.RefObject<HTMLDivElement | null>) {
  const [angle, setAngle] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const a = Math.atan2(e.clientY - cy, e.clientX - cx)
      const maxOffset = 6
      setAngle({
        x: Math.cos(a) * maxOffset,
        y: Math.sin(a) * maxOffset
      })
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [ref])

  return angle
}

function useBlink() {
  const [blinking, setBlinking] = useState(false)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    const schedule = () => {
      timeout = setTimeout(
        () => {
          setBlinking(true)
          setTimeout(() => {
            setBlinking(false)
            schedule()
          }, 150)
        },
        Math.random() * 4000 + 2000
      )
    }
    schedule()
    return () => clearTimeout(timeout)
  }, [])

  return blinking
}

function Eyes({
  offset,
  blinking,
  size = 18,
  gap = 52
}: {
  offset: { x: number; y: number }
  blinking: boolean
  size?: number
  gap?: number
}) {
  const pupilSize = size * 0.45
  const glassRadius = size + 6
  const leftCx = 128 - gap / 2
  const rightCx = 128 + gap / 2

  return (
    <g>
      {/* Glasses frame */}
      <circle
        cx={leftCx}
        cy={128}
        r={glassRadius}
        fill="none"
        stroke="white"
        strokeWidth={3}
        opacity={0.35}
      />
      <circle
        cx={rightCx}
        cy={128}
        r={glassRadius}
        fill="none"
        stroke="white"
        strokeWidth={3}
        opacity={0.35}
      />
      {/* Bridge */}
      <path
        d={`M${leftCx + glassRadius - 2} ${128 - 4} Q128 ${128 - 12} ${rightCx - glassRadius + 2} ${128 - 4}`}
        fill="none"
        stroke="white"
        strokeWidth={3}
        opacity={0.35}
      />
      {/* Temple arms */}
      <line
        x1={leftCx - glassRadius}
        y1={128 - 4}
        x2={leftCx - glassRadius - 16}
        y2={128 - 8}
        stroke="white"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.35}
      />
      <line
        x1={rightCx + glassRadius}
        y1={128 - 4}
        x2={rightCx + glassRadius + 16}
        y2={128 - 8}
        stroke="white"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.35}
      />

      {/* Eyeballs */}
      {[-gap / 2, gap / 2].map((dx, i) => (
        <g key={i}>
          <ellipse
            cx={128 + dx}
            cy={128}
            rx={size}
            ry={blinking ? 2 : size}
            fill="white"
            style={{ transition: 'ry 0.08s ease' }}
          />
          {!blinking && (
            <circle
              cx={128 + dx + offset.x}
              cy={128 + offset.y}
              r={pupilSize}
              fill="#1a1a1a"
            />
          )}
        </g>
      ))}
    </g>
  )
}

function LogoCircle() {
  const ref = useRef<HTMLDivElement>(null)
  const offset = useMouseAngle(ref)
  const blinking = useBlink()

  return (
    <div ref={ref} className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 256 256" className="size-32">
        <circle cx="128" cy="128" r="128" fill="#1a1a1a" />
        <Eyes offset={offset} blinking={blinking} />
      </svg>
      <div className="text-center">
        <p className="text-lg font-bold text-[#2f2f2f]">Cercle</p>
        <p className="text-xs text-[#a9a9a9]">Actuel</p>
      </div>
    </div>
  )
}

function LogoSquircle() {
  const ref = useRef<HTMLDivElement>(null)
  const offset = useMouseAngle(ref)
  const blinking = useBlink()

  return (
    <div ref={ref} className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 256 256" className="size-32">
        <rect
          x="0"
          y="0"
          width="256"
          height="256"
          rx="64"
          ry="64"
          fill="#1a1a1a"
        />
        <Eyes offset={offset} blinking={blinking} />
      </svg>
      <div className="text-center">
        <p className="text-lg font-bold text-[#2f2f2f]">Squircle</p>
        <p className="text-xs text-[#a9a9a9]">Style iOS / moderne</p>
      </div>
    </div>
  )
}

function LogoBlob() {
  const ref = useRef<HTMLDivElement>(null)
  const offset = useMouseAngle(ref)
  const blinking = useBlink()

  return (
    <div ref={ref} className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 256 256" className="size-32">
        <path
          d="M128 16 C190 8, 248 50, 244 128 C248 200, 196 248, 128 244 C56 248, 8 196, 12 128 C8 56, 60 8, 128 16Z"
          fill="#1a1a1a"
        >
          <animate
            attributeName="d"
            dur="6s"
            repeatCount="indefinite"
            values="
              M128 16 C190 8, 248 50, 244 128 C248 200, 196 248, 128 244 C56 248, 8 196, 12 128 C8 56, 60 8, 128 16Z;
              M128 12 C196 16, 244 60, 240 128 C244 196, 190 244, 128 248 C60 244, 12 196, 16 128 C12 60, 56 12, 128 12Z;
              M128 16 C190 8, 248 50, 244 128 C248 200, 196 248, 128 244 C56 248, 8 196, 12 128 C8 56, 60 8, 128 16Z
            "
          />
        </path>
        <Eyes offset={offset} blinking={blinking} />
      </svg>
      <div className="text-center">
        <p className="text-lg font-bold text-[#2f2f2f]">Blob</p>
        <p className="text-xs text-[#a9a9a9]">Organique / animé</p>
      </div>
    </div>
  )
}

function LogoLetterM() {
  const ref = useRef<HTMLDivElement>(null)
  const offset = useMouseAngle(ref)
  const blinking = useBlink()

  return (
    <div ref={ref} className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 256 256" className="size-32">
        <path
          d="M24 240 L24 60 L80 60 L128 130 L176 60 L232 60 L232 240 L192 240 L192 120 L148 186 L108 186 L64 120 L64 240Z"
          fill="#1a1a1a"
        />
        <g transform="translate(0, -20)">
          <Eyes
            offset={offset}
            blinking={blinking}
            size={14}
            gap={84}
          />
        </g>
      </svg>
      <div className="text-center">
        <p className="text-lg font-bold text-[#2f2f2f]">Lettre M</p>
        <p className="text-xs text-[#a9a9a9]">Yeux dans le M</p>
      </div>
    </div>
  )
}

function LogoShield() {
  const ref = useRef<HTMLDivElement>(null)
  const offset = useMouseAngle(ref)
  const blinking = useBlink()

  return (
    <div ref={ref} className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 256 280" className="size-32">
        <path
          d="M128 16 L240 56 L240 148 C240 204, 192 252, 128 272 C64 252, 16 204, 16 148 L16 56Z"
          fill="#1a1a1a"
        />
        <g transform="translate(0, 8)">
          <Eyes offset={offset} blinking={blinking} />
        </g>
      </svg>
      <div className="text-center">
        <p className="text-lg font-bold text-[#2f2f2f]">Bouclier</p>
        <p className="text-xs text-[#a9a9a9]">Protecteur / copilote</p>
      </div>
    </div>
  )
}

export function LogoShowcase() {
  return (
    <div className="flex flex-col gap-8 rounded-[48px] bg-[#f6f6f6] p-12">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold tracking-tight text-[#2f2f2f]">
          Logo Variants
        </h2>
        <span className="text-sm text-[#a9a9a9]">
          Bouge ta souris pour voir les yeux suivre
        </span>
      </div>
      <div className="grid grid-cols-5 gap-8">
        <LogoCircle />
        <LogoSquircle />
        <LogoBlob />
        <LogoLetterM />
        <LogoShield />
      </div>
    </div>
  )
}
