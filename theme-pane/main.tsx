import {useEffect, useRef, useState, useSyncExternalStore} from 'react'
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

const ghTheme = window.ghTheme as GhTheme
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
function createThemeStore(theme: GhTheme) {
  let version = 0
  const listeners = new Set<() => void>()
  theme.onChange(() => {
    version += 1
    listeners.forEach((listener) => listener())
  })
  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => void listeners.delete(listener)
    },
    version: () => version,
  }
}
const themeStore = createThemeStore(ghTheme)

function useTheme() {
  useSyncExternalStore(themeStore.subscribe, themeStore.version)
  const state = ghTheme.get()
  const resolved = ghTheme.current()
  return {state, resolved, report: ghTheme.report(resolved.tokens)}
}

const ratioText = (ratio: number) => `${ratio.toFixed(1)}:1`

function Presets({
  state,
  custom,
  size,
  onPick,
}: {
  state: ThemeState
  custom: boolean
  size: 'default' | 'small'
  onPick: (name: string) => void
}) {
  return (
    <div role="group" aria-label="Presets">
      <Cluster gap="sm">
        {ghTheme.PRESET_ORDER.map((name) => (
          <Toggle
            key={name}
            size={size}
            pressed={!custom && state.preset === name}
            onPressedChange={() => onPick(name)}
          >
            {ghTheme.PRESETS[name].label}
          </Toggle>
        ))}
        {(custom || Boolean(state.lastCustom)) && (
          <Toggle size={size} pressed={custom} onPressedChange={() => onPick('custom')}>
            Custom
          </Toggle>
        )}
      </Cluster>
    </div>
  )
}

function ThemePanel() {
  const {state, resolved, report} = useTheme()
  // Touch targets: the small controls are for a pointer, the default ones for a phone.
  const controlSize = useNarrow() ? 'default' : 'small'
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
    ghTheme.set(next)
    setNote(message)
  }
  const low = report.filter((row) => !row.ok)
  const warnings = ghTheme.warnings(resolved.tokens)
  if (low.length) {
    // The ratios are in each row's description; the status line only says how many and what to do.
    warnings.push(
      `${low.length} ${low.length === 1 ? 'pair is' : 'pairs are'} below the contrast they need. Lighten the text or darken the background, or press Reset`,
    )
  }
  const message = note ?? (warnings.length ? `${warnings.join('. ')}.` : HELP)
  const warn = note === null && warnings.length > 0

  const pick = (name: string) => {
    if (name === 'custom') {
      if (!resolved.custom && state.lastCustom) commit(ghTheme.restoreCustom(state), null)
      return
    }
    commit(ghTheme.selectPreset(state, name), `Preset: ${ghTheme.PRESETS[name].label}.`)
  }
  const copy = () => {
    const text = `${JSON.stringify(ghTheme.exportTheme(state), null, 2)}\n`
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

  return (
    <>
      <Pane.Body>
        <Stack gap="md">
          <Presets state={state} custom={resolved.custom} size={controlSize} onPick={pick} />
          <Stack gap="sm">
            {ghTheme.CORE_KEYS.map((key) => {
              const coreHex = state.core[key]
              const broken = report.filter(
                (row) => !row.ok && (CAUSE[row.fg] ?? 'bg') === key,
              ).length
              const bar = BAR[key]
              const own = bar
                ? ratioText(ghTheme.contrast(resolved.tokens[bar[0]], resolved.tokens[bar[1]]))
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
                  value={coreHex}
                  badge={badge}
                  bad={broken > 0}
                  refuse={
                    key === 'bg' ? (hex) => (ghTheme.darkOnly(hex) ? null : TOO_LIGHT) : undefined
                  }
                  norm={ghTheme.norm}
                  onApply={(hex) => commit(ghTheme.setCore(state, key, hex), null)}
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
            size={controlSize}
            variant="secondary"
            aria-expanded={advanced}
            onClick={() => setAdvanced(!advanced)}
          >
            {`Advanced: ${ghTheme.TOKENS.length} colour tokens`}
          </Button>
          {advanced && (
            <Stack gap="sm">
              {ghTheme.TOKENS.map((token) => {
                const bad = report.find((row) => !row.ok && (row.fg === token || row.bg === token))
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
                      token === 'bg'
                        ? (hex) => (ghTheme.darkOnly(hex) ? null : TOO_LIGHT)
                        : undefined
                    }
                    norm={ghTheme.norm}
                    onApply={(hex) => commit(ghTheme.setToken(state, token, hex), null)}
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
      </Pane.Body>
      <Pane.Footer>
        <Inline gap="sm">
          <Button
            variant="secondary"
            onClick={() => commit(ghTheme.reset(state), 'Back to Phosphor.')}
          >
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
  const trigger = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)

  // Opened from the page's own button, which is gone by now: focus the trigger first, then open, so
  // closing the pane gives focus back to a button that is there.
  useEffect(() => {
    trigger.current?.focus()
    const frame = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  // The page's links ask for the panel once it is loaded.
  useEffect(() => {
    const ask = () => setOpen(true)
    window.addEventListener('gh-theme-open', ask)
    return () => window.removeEventListener('gh-theme-open', ask)
  }, [])
  // Working in the panel keeps the road in its green look, so a change to the accent is always visible.
  useEffect(() => {
    ghTheme.hold(open)
    return () => ghTheme.hold(false)
  }, [open])

  return (
    <ThemeProvider overrides={resolved.tokens}>
      <Pane.Root
        open={open}
        onOpenChange={setOpen}
        {...(narrow ? {anchor: 'bottom'} : {anchor: 'right'})}
      >
        <Pane.Trigger>
          <Button ref={trigger} variant="primary">
            Open the theme panel
          </Button>
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
if (host && ghTheme) {
  host.replaceChildren()
  createRoot(host).render(<App />)
}
