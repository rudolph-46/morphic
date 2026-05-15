'use client'

import { useEffect, useRef, useState } from 'react'

import {
  ArrowRight,
  Check,
  Pencil,
  SkipForward,
  X
} from 'lucide-react'

import type { ToolPart } from '@/lib/types/ai'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'

interface QuestionConfirmationProps {
  toolInvocation: ToolPart<'askQuestion'>
  onConfirm: (toolCallId: string, approved: boolean, response?: any) => void
  isCompleted?: boolean
}

interface QuestionOption {
  value: string
  label: string
}

interface QuestionInput {
  question: string
  options: QuestionOption[]
  selectMode?: 'single' | 'multiple'
  allowsInput?: boolean
  inputLabel?: string
  inputPlaceholder?: string
}

interface QuestionOutput {
  selectedOptions?: string[]
  inputText?: string
  skipped?: boolean
}

export function QuestionConfirmation({
  toolInvocation,
  onConfirm,
  isCompleted = false
}: QuestionConfirmationProps) {
  const rawInput = (toolInvocation.input || {}) as Record<string, unknown>
  const rawOptions = rawInput.options
  const normalizedOptions: QuestionOption[] = Array.isArray(rawOptions)
    ? rawOptions.map((opt: unknown) => {
        if (typeof opt === 'string') return { value: opt, label: opt }
        if (opt && typeof opt === 'object' && 'label' in opt) {
          const o = opt as Record<string, unknown>
          return {
            value: String(o.value ?? o.label ?? ''),
            label: String(o.label ?? o.value ?? '')
          }
        }
        return { value: String(opt), label: String(opt) }
      })
    : []
  const input: QuestionInput = {
    question: String(rawInput.question ?? ''),
    options: normalizedOptions,
    selectMode:
      rawInput.selectMode === 'multiple' ? 'multiple' : 'single',
    allowsInput: rawInput.allowsInput !== false,
    inputLabel: rawInput.inputLabel as string | undefined,
    inputPlaceholder: rawInput.inputPlaceholder as string | undefined
  }
  const {
    question,
    options,
    selectMode = 'single',
    allowsInput = true,
    inputPlaceholder = 'Something else…'
  } = input

  const resultData =
    toolInvocation.state === 'output-available' && toolInvocation.output
      ? (toolInvocation.output as QuestionOutput)
      : null

  const [selected, setSelected] = useState<string[]>([])
  const [focusIndex, setFocusIndex] = useState(0)
  const [inputMode, setInputMode] = useState(false)
  const [inputText, setInputText] = useState('')
  const [completed, setCompleted] = useState(isCompleted)
  const [skipped, setSkipped] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const total = options.length + (allowsInput ? 1 : 0)
  const somethingElseIndex = options.length

  const submit = (values: string[], text = '') => {
    onConfirm(toolInvocation.toolCallId, true, {
      selectedOptions: values,
      inputText: text.trim(),
      question
    })
    setCompleted(true)
  }

  const handleSkip = () => {
    setSkipped(true)
    setCompleted(true)
    onConfirm(toolInvocation.toolCallId, false, { skipped: true })
  }

  const handlePick = (option: QuestionOption) => {
    if (selectMode === 'single') {
      submit([option.label])
    } else {
      setSelected(prev =>
        prev.includes(option.label)
          ? prev.filter(x => x !== option.label)
          : [...prev, option.label]
      )
    }
  }

  const handleSomethingElse = () => {
    setInputMode(true)
    setFocusIndex(somethingElseIndex)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleInputSubmit = () => {
    if (!inputText.trim()) return
    submit([], inputText)
  }

  const confirmMultiple = () => {
    if (selected.length === 0) return
    submit(selected, inputText)
  }

  useEffect(() => {
    if (completed) return
    const handler = (e: KeyboardEvent) => {
      if (inputMode && document.activeElement === inputRef.current) {
        if (e.key === 'Escape') {
          e.preventDefault()
          setInputMode(false)
          setInputText('')
          setFocusIndex(0)
        } else if (e.key === 'Enter') {
          e.preventDefault()
          handleInputSubmit()
        }
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusIndex(i => Math.min(total - 1, i + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusIndex(i => Math.max(0, i - 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (focusIndex === somethingElseIndex && allowsInput) {
          handleSomethingElse()
        } else if (options[focusIndex]) {
          handlePick(options[focusIndex])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleSkip()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    focusIndex,
    inputMode,
    inputText,
    options,
    total,
    completed,
    selectMode,
    selected,
    allowsInput,
    somethingElseIndex
  ])

  if (completed || resultData) {
    const isSkipped = resultData?.skipped ?? skipped
    const displayOptions = resultData?.selectedOptions ?? selected
    const displayInput = resultData?.inputText ?? inputText

    return (
      <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
        <div className="text-sm font-medium text-muted-foreground mb-2">
          {question}
        </div>
        <div className="flex items-center gap-2 text-xs">
          {isSkipped ? (
            <>
              <SkipForward className="size-3.5 text-amber-500" />
              <span className="text-muted-foreground">Question ignorée</span>
            </>
          ) : (
            <>
              <Check className="size-3.5 text-emerald-500" />
              <span className="font-medium">
                {displayOptions.length > 0 && displayOptions.join(', ')}
                {displayOptions.length > 0 && displayInput && ' · '}
                {displayInput}
              </span>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-lg overflow-hidden">
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <h3 className="text-base font-semibold leading-snug">{question}</h3>
        <button
          onClick={handleSkip}
          className="size-7 -mr-1 -mt-1 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
          aria-label="Skip"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="divide-y divide-border/40">
        {options.map((option, idx) => {
          const num = idx + 1
          const isFocused = focusIndex === idx
          const isSelected =
            selectMode === 'multiple' && selected.includes(option.label)
          return (
            <button
              key={option.value || idx}
              onMouseEnter={() => setFocusIndex(idx)}
              onClick={() => handlePick(option)}
              className={cn(
                'w-full flex items-center gap-3 px-5 py-3 text-left transition-colors group',
                isFocused ? 'bg-muted' : 'hover:bg-muted/60',
                isSelected && 'bg-emerald-500/5'
              )}
            >
              <span
                className={cn(
                  'size-7 rounded-lg flex items-center justify-center text-sm font-medium shrink-0 transition-colors',
                  isFocused
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {isSelected ? <Check className="size-3.5" /> : num}
              </span>
              <span className="flex-1 text-sm">{option.label}</span>
              {isFocused && (
                <ArrowRight className="size-3.5 text-muted-foreground" />
              )}
            </button>
          )
        })}

        {allowsInput && (
          <div
            className={cn(
              'transition-colors',
              focusIndex === somethingElseIndex && !inputMode && 'bg-muted'
            )}
          >
            {!inputMode ? (
              <button
                onMouseEnter={() => setFocusIndex(somethingElseIndex)}
                onClick={handleSomethingElse}
                className="w-full flex items-center gap-3 px-5 py-3 text-left text-muted-foreground hover:text-foreground"
              >
                <span className="size-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Pencil className="size-3.5" />
                </span>
                <span className="flex-1 text-sm">{inputPlaceholder}</span>
              </button>
            ) : (
              <div className="px-5 py-3 flex items-center gap-2">
                <span className="size-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Pencil className="size-3.5 text-muted-foreground" />
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder={inputPlaceholder}
                  className="flex-1 bg-transparent outline-none text-sm"
                />
                <Button
                  size="sm"
                  disabled={!inputText.trim()}
                  onClick={handleInputSubmit}
                >
                  Envoyer
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {selectMode === 'multiple' && (
        <div className="px-5 py-3 border-t border-border/40 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {selected.length} sélectionné{selected.length > 1 ? 's' : ''}
          </span>
          <Button
            size="sm"
            disabled={selected.length === 0}
            onClick={confirmMultiple}
            className="gap-1"
          >
            Valider
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      )}

      <div className="px-5 py-2 border-t border-border/40 bg-muted/30 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          naviguer
        </span>
        <span className="text-muted-foreground/40">·</span>
        <span className="inline-flex items-center gap-1">
          <Kbd>Enter</Kbd>
          sélectionner
        </span>
        <span className="text-muted-foreground/40">·</span>
        <span className="inline-flex items-center gap-1">
          <Kbd>Esc</Kbd>
          ignorer
        </span>
      </div>
    </div>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded border border-border bg-background text-[9px] font-mono text-foreground">
      {children}
    </kbd>
  )
}
