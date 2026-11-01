import {useRef, useState} from 'react'
import {ColorInput, Field, Inline, Input, Text} from '@duro-app/ui'

interface ThemeColorRowProps {
  id: string
  label: string
  /** The colour in force, as #rrggbb */
  value: string
  /** The contrast the colour has, or how many derived pairs it breaks */
  badge: string
  bad: boolean
  /** Set by the person rather than derived from the core colours */
  overridden?: boolean
  /** A reason to turn a colour down, or null to take it */
  refuse?: (hex: string) => string | null
  /** The colour as #rrggbb, or null when the text is not one */
  norm: (text: string) => string | null
  onApply: (hex: string) => void
}

const NOT_A_COLOUR = 'Enter a colour as #rrggbb or #rgb. The last valid colour stays applied.'
const COMPLETE_HEX = /^#[0-9a-f]{6}$/i
const BARE_HEX = /^[0-9a-f]{3}$|^[0-9a-f]{6}$/i

// One colour: a native swatch, a hex field and its contrast. The field is checked once it is
// complete (six digits, or on blur or Enter), never while it is half typed; a refused entry stays
// in the field with its reason until it is fixed.
export function ThemeColorRow({
  id,
  label,
  value,
  badge,
  bad,
  overridden,
  refuse,
  norm,
  onApply,
}: ThemeColorRowProps) {
  const field = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState<string | null>(null)
  const [error, setError] = useState('')

  const apply = (hex: string) => {
    const reason = refuse?.(hex) ?? null
    if (reason) {
      setError(reason)
      return false
    }
    setError('')
    setDraft(null)
    onApply(hex)
    return true
  }
  // The text is read from the field itself: the last keystroke may not have re-rendered yet.
  const finish = (typed: string) => {
    const text = typed.trim()
    const normalised = norm(BARE_HEX.test(text) ? `#${text}` : text)
    if (!normalised) {
      setError(NOT_A_COLOUR)
      return
    }
    // Leaving a field you did not change is not an edit: it must not mark the token as edited.
    if (normalised.toLowerCase() === value.toLowerCase()) {
      setError('')
      setDraft(null)
      return
    }
    apply(normalised)
  }

  return (
    <Inline gap="sm" align="start">
      <ColorInput
        id={`${id}-c`}
        aria-label={`${label} colour`}
        value={value}
        onChange={(event) => apply(event.target.value)}
      />
      <Field.Root invalid={Boolean(error)}>
        <Field.Label>{overridden ? `${label} · edited` : label}</Field.Label>
        <Input
          ref={field}
          font="mono"
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          value={draft ?? value}
          onChange={(event) => {
            const text = event.target.value
            setDraft(text)
            const typed = text.trim()
            if (COMPLETE_HEX.test(typed) && typed.toLowerCase() !== value.toLowerCase())
              apply(typed)
          }}
          onBlur={() => finish(field.current?.value ?? '')}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              finish(event.currentTarget.value)
            }
          }}
        />
        {badge && (
          <Field.Description>
            <Text variant="caption" color={bad ? 'warning' : 'muted'}>
              {badge}
            </Text>
          </Field.Description>
        )}
        <Field.Error>{error}</Field.Error>
      </Field.Root>
    </Inline>
  )
}
