// What theme.js puts on window.ghTheme, as much of it as the pane uses.
export interface Report {
  id: string
  ok: boolean
  ratio: number
  bar: number
  fg: string
  bg: string
}

export interface ThemeState {
  preset: string
  core: Record<string, string>
  overrides: Record<string, string>
  lastCustom?: unknown
}

export interface GhTheme {
  PRESET_ORDER: string[]
  PRESETS: Record<string, {label: string; core: Record<string, string>}>
  CORE_KEYS: string[]
  TOKENS: string[]
  get(): ThemeState
  set(next: ThemeState): void
  current(): {custom: boolean; tokens: Record<string, string>}
  report(tokens: Record<string, string>): Report[]
  warnings(tokens: Record<string, string>): string[]
  contrast(a: string, b: string): number
  norm(value: string): string | null
  darkOnly(hex: string): boolean
  setCore(state: ThemeState, key: string, hex: string): ThemeState
  setToken(state: ThemeState, token: string, hex: string): ThemeState
  selectPreset(state: ThemeState, name: string): ThemeState
  restoreCustom(state: ThemeState): ThemeState
  reset(state: ThemeState): ThemeState
  exportTheme(state: ThemeState): unknown
  hold(on: boolean): void
  onChange(listener: () => void): void
}

declare global {
  interface Window {
    ghTheme?: GhTheme
  }
}
