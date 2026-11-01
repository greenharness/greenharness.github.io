import {useEffect, useRef, useState, useSyncExternalStore, type FocusEvent} from 'react'
import {createRoot} from 'react-dom/client'
import '@duro-app/ui/dist/index.css'
import {
  Button,
  Cluster,
  Inline,
  LiveRegion,
  Pane,
  Stack,
  Text,
  Textarea,
  ThemeProvider,
  Toggle,
} from '@duro-app/ui'
import {ThemeColorRow} from './ThemeColorRow'
import type {GhTheme, ThemeState} from './ghTheme'

const G = window.ghTheme as GhTheme
const HELP =
  'Each colour is checked against the contrast it needs: a low one is flagged, never blocked.'
const LABEL: Record<string, string> = {
  accent: 'Accent',
  bg: 'Background',
  text: 'Text',
  danger: 'Danger',
}
// The pair each core colour is checked against: its own contrast, shown beside it.
const BAR: Record<string, [string, string]> = {
  accent: ['accent', 'bg'],
  text: ['text', 'bg'],
  danger: ['error', 'bg'],
}
// Which core colour each token comes from, for the per-row count. A pair with text on it is blamed
// on the text colour, so a dark text does not also flag the background.
const CAUSE: Record<string, string> = {
  accent: 'accent',
  accentContrast: 'accent',
  text: 'text',
  textMuted: 'text',
  textSubtle: 'text',
  error: 'danger',
  errorText: 'danger',
}
const TOO_LIGHT = 'Too light: this page is dark on purpose. Pick a darker background.'

// A phone gets a bottom sheet with two heights, a desktop a side pane with two widths.
const NARROW = '(max-width: 640px)'
const narrowSubscribe = (listener: () => void) => {
  const query = window.matchMedia(NARROW)
  query.addEventListener('change', listener)
  return () => query.removeEventListener('change', listener)
}
const useNarrow = () =>
  useSyncExternalStore(narrowSubscribe, () => window.matchMedia(NARROW).matches)

// The theme lives in theme.js; the pane re-reads it whenever it changes.
let version = 0
const listeners = new Set<() => void>()
G.onChange(() => {
  version += 1
  listeners.forEach((listener) => listener())
})
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

function useTheme() {
  useSyncExternalStore(subscribe, () => version)
  const state = G.get()
  const resolved = G.current()
  return {state, resolved, report: G.report(resolved.tokens)}
}

const ratioText = (ratio: number) => `${ratio.toFixed(1)}:1`

function Presets({
  state,
  custom,
  onPick,
}: {
  state: ThemeState
  custom: boolean
  onPick: (name: string) => void
}) {
  return (
    <div role="group" aria-label="Presets">
      <Cluster gap="sm">
        {G.PRESET_ORDER.map((name) => (
          <Toggle
            key={name}
            size="small"
            pressed={!custom && state.preset === name}
            onPressedChange={() => onPick(name)}
          >
            {G.PRESETS[name].label}
          </Toggle>
        ))}
        {(custom || Boolean(state.lastCustom)) && (
          <Toggle size="small" pressed={custom} onPressedChange={() => onPick('custom')}>
            Custom
          </Toggle>
        )}
      </Cluster>
    </div>
  )
}

function ThemePanel() {
  const {state, resolved, report} = useTheme()
  const [note, setNote] = useState<string | null>(null)
  const [advanced, setAdvanced] = useState(false)
  const [copyText, setCopyText] = useState<string | null>(null)
  const copyRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (copyText !== null) {
      copyRef.current?.focus()
      copyRef.current?.select()
    }
  }, [copyText])

  const commit = (next: ThemeState, message: string | null) => {
    G.set(next)
    setNote(message)
  }
  const low = report.filter((row) => !row.ok)
  const warnings = G.warnings(resolved.tokens)
  if (low.length) {
    warnings.push(
      `${low.map((row) => `${row.id} is ${ratioText(row.ratio)}, below ${row.bar}:1`).join('; ')}. Lighten the text or darken the background, or press Reset`,
    )
  }
  const message = note ?? (warnings.length ? `${warnings.join('. ')}.` : HELP)
  const warn = note === null && warnings.length > 0

  const pick = (name: string) => {
    if (name === 'custom') {
      if (!resolved.custom && state.lastCustom) commit(G.restoreCustom(state), null)
      return
    }
    commit(G.selectPreset(state, name), `Preset: ${G.PRESETS[name].label}.`)
  }
  const copy = () => {
    const text = `${JSON.stringify(G.exportTheme(state), null, 2)}\n`
    const fallback = () => {
      setCopyText(text)
      setNote('Copy failed: the text is selected, press Ctrl or Cmd + C.')
    }
    try {
      navigator.clipboard.writeText(text).then(() => {
        setCopyText(null)
        setNote('Copied theme.json.')
      }, fallback)
    } catch {
      fallback()
    }
  }

  // Working in the picker keeps the road in its green look, so a change to the accent is always visible.
  const hold = (event: FocusEvent<HTMLDivElement>) => G.hold(event.type === 'focus')
  const release = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) G.hold(false)
  }

  return (
    <>
      <Pane.Body>
        <div onFocus={hold} onBlur={release}>
          <Stack gap="md">
            <Presets state={state} custom={resolved.custom} onPick={pick} />
            <Stack gap="sm">
              {G.CORE_KEYS.map((key) => {
                const value = state.core[key]
                const broken = report.filter(
                  (row) => !row.ok && (CAUSE[row.fg] ?? 'bg') === key,
                ).length
                const bar = BAR[key]
                const own = bar
                  ? ratioText(G.contrast(resolved.tokens[bar[0]], resolved.tokens[bar[1]]))
                  : ''
                const badge =
                  (own || '') +
                  (broken
                    ? `${own ? ' · ' : ''}${broken} ${broken === 1 ? 'pair' : 'pairs'} too low`
                    : own
                      ? ''
                      : 'all pairs pass')
                return (
                  <ThemeColorRow
                    key={key}
                    id={`core-${key}`}
                    label={LABEL[key]}
                    value={value}
                    badge={badge}
                    bad={broken > 0}
                    refuse={
                      key === 'bg' ? (hex) => (G.darkOnly(hex) ? null : TOO_LIGHT) : undefined
                    }
                    norm={G.norm}
                    onApply={(hex) => commit(G.setCore(state, key, hex), null)}
                  />
                )
              })}
            </Stack>
            <LiveRegion politeness="polite">
              <Text variant="caption" color={warn ? 'warning' : 'muted'}>
                {message}
              </Text>
            </LiveRegion>
            <Button
              size="small"
              variant="secondary"
              aria-expanded={advanced}
              onClick={() => setAdvanced(!advanced)}
            >
              {`Advanced: ${G.TOKENS.length} colour tokens`}
            </Button>
            {advanced && (
              <Stack gap="sm">
                {G.TOKENS.map((token) => {
                  const bad = report.find(
                    (row) => !row.ok && (row.fg === token || row.bg === token),
                  )
                  return (
                    <ThemeColorRow
                      key={token}
                      id={`adv-${token}`}
                      label={token === 'error' ? 'error (Danger)' : token}
                      value={resolved.tokens[token]}
                      badge={bad ? `${ratioText(bad.ratio)} · below ${bad.bar}:1` : ''}
                      bad={Boolean(bad)}
                      overridden={Boolean(state.overrides[token])}
                      refuse={
                        token === 'bg' ? (hex) => (G.darkOnly(hex) ? null : TOO_LIGHT) : undefined
                      }
                      norm={G.norm}
                      onApply={(hex) => commit(G.setToken(state, token, hex), null)}
                    />
                  )
                })}
              </Stack>
            )}
            {copyText !== null && (
              <Textarea
                ref={copyRef}
                aria-label="theme.json"
                value={copyText}
                onChange={() => undefined}
                rows={10}
              />
            )}
          </Stack>
        </div>
      </Pane.Body>
      <Pane.Footer>
        <Inline gap="sm">
          <Button variant="secondary" onClick={() => commit(G.reset(state), 'Back to Phosphor.')}>
            Reset
          </Button>
          <Button variant="primary" onClick={copy}>
            Copy theme.json
          </Button>
        </Inline>
      </Pane.Footer>
    </>
  )
}

function App() {
  // The pane wears the theme it edits, so a change to the accent shows in its own buttons too.
  const {resolved} = useTheme()
  const narrow = useNarrow()
  return (
    <ThemeProvider overrides={resolved.tokens}>
      <Pane.Root defaultOpen {...(narrow ? {anchor: 'bottom'} : {anchor: 'right'})}>
        <Pane.Trigger>
          <Button variant="primary">Theme</Button>
        </Pane.Trigger>
        <Pane.Portal>
          <Pane.Header>
            <Pane.Title>Theme</Pane.Title>
            <Pane.Expand />
            <Pane.Close />
          </Pane.Header>
          <ThemePanel />
        </Pane.Portal>
      </Pane.Root>
    </ThemeProvider>
  )
}

const host = document.getElementById('themePane')
if (host && G) {
  host.replaceChildren()
  createRoot(host).render(<App />)
}
