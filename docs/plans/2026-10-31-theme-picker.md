---
status: done
branch: feat/theme-picker
repos: [greenharness.github.io]
adrs: [ui.mockup-handoff (ADR-0016)]
---
# Theme picker on the Green Harness site, and the sweep card made true

## Review panel

👉 **Decide:** the panel's shape: a modal Drawer opened from a "Theme" button (recommended, departs from the mockup), or docked below the page as drawn.
📍 gh-site-import · plan reviewed, nothing built · next: Phase 1, `theme.js` and its tests. Panel: backend, game-ux, react, ui-design, ux-research (all opus-5-5), codex (gpt-6-astra).
**Changed by review:**
1. Reset and the export are checked against real constants and keys, not pixels.
2. The contrast bars cover every derived pair, and every shipped preset must pass them.
3. The sweep card no longer promises to protect every session tool.
**Verdicts:** round 1: 5 approve-with-changes; round 2: 4 approve, react approve-with-changes (1 high applied); Codex approve-with-changes, both highs applied; final delta: 5 approve; 23 findings carried into implementation.
📄 Full reviews: `docs/plans/2026-10-31-theme-picker.reviews.md`.

## Context

The person asked for a colour picker over the site's theme tokens. Three
directions were built and reviewed (`docs/mockups/theme-picker/`, merged in
greenharness.github.io#5); they picked **C, Presets**: presets first, four
core colours, the other 23 of the 27 colour tokens derived, all 27 editable
under "Advanced", Copy `theme.json`. This plan builds it on
https://greenharness.github.io/. The mockup's layout, hierarchy, states, token
names and component map are the contract; positions are not.

Second ask: close the `worktree-sweep` gap so the site can talk about it. **The
tool already does it.** `greenharness/skills` v0.1.1 and v0.2.0 (#2) stop what
still runs from a deleted worktree: language servers, test browsers (headless
Chrome), dev servers, shells and orphaned `chrome-devtools-mcp` servers, with
`--procs`, protecting live Claude processes and what is above them, and the
live `chrome-devtools-mcp` chains with their wrappers and Chrome. Test runners
and `fleet-lsp` are not protected just because a session is live. What is left is the
site card, which still says only "language servers", and one machine finding
(below).

What the site does today (measured on `origin/main`, `index.html`):

- It reads no `theme.json` and uses no `localStorage`.
- Page colours: 8 CSS custom properties in `:root` (`--void --ink --dim --glow
  --line --bug --slop --boost`) plus a second `:root` (line 79: `--s1 --s2 --s3 --you --panel --faint`),
  34 colour literals in CSS (lines 29-164, counted with `rg -o`), the `SEC`
  colours (line 838) and the road SVG strokes. Phase 2 adds a mapping table
  that covers every one, and a grep for hex literals outside `theme.js` and the
  presets must find none.
- The game canvas: `tc(f)` (line 351) builds the green and the red world from
  hardcoded RGB endpoints (40,255,110) and (255,60,70), cached in `cache`;
  palette `C` (line 361) holds 7 colours; about 12 more literals sit in the
  draw code (lines 490-543, 643) and the road SVG (lines 979-1005).
- `theme.json` has 27 colour tokens, 2 type tokens and 4 radii. It sets no
  `active*` tokens, so a pressed Duro toggle would render in the stock blue.

## Decisions taken (recommendation each; say so at approval to change one)

1. **One source of truth: the 27 colour tokens.** The page's 8 variables, the
   hardcoded CSS colours and the canvas palette are all derived from the token
   set, never edited on their own. The 27 are written to their `--duro-color-*` names, the 8 page variables alias them, and the panel CSS uses `--duro-*` space tokens with no raw px; the plan carries a table mapping each panel part to Drawer/ToggleGroup/Field/ColorInput/Input/Callout/Button. Mapping: `--void`=bg, `--ink`=text,
   `--dim`=textSubtle, `--glow`=accent, `--line`=border, `--bug`=error,
   `--slop`=warning, `--boost`=info. Also mapped: `--s1 --s2 --s3 --you --panel --faint` (line 79), `#e6ffec`, `#4a3d1c`, the `.swatch` ramp (line 72) and the canvas literals, each to a token or rule whose Phosphor value equals today's.
2. **Core four and derivation.** Core: accent, background, text, danger. The
   other 23 are derived by fixed rules (mixes of the core colours in sRGB:
   cards = bg toward accent 4-7 %, borders 10-22 %, muted and subtle text =
   text toward bg 30 % and 55 %, hover = accent toward white, contrast text =
   black or white by contrast, status backgrounds = bg toward the status
   colour). `warning` and `info` come from the preset, not from the core four.
   The exact percentages are fixed by a unit test that must reproduce
   `theme.json` within 16/255 per channel from the Phosphor core; Phosphor
   itself ships with the exact `theme.json` values.
3. **Presets:** Phosphor (today's), Amber, Cyan, Mono, each tested to keep the accent at least 15° of OKLCH hue from warning, info and `--you`. Each is a set of core
   four plus warning and info. Dark only: the site is "one dark world on
   purpose", so a background lighter than 15 % luminance is refused with a
   line saying why.
4. **Contrast guard, warn not block:** text on bg needs 4.5:1, accent and
   danger need 3:1; the same bars run over every derived pair (muted and
   subtle text on bg and card 4.5:1, contrast text on accent 4.5:1, warning
   and info on bg 3:1), with a badge on each failing row in Advanced and a
   count on the core row that caused it. The hex fields' border needs 3:1
   (today's `--line` is 1.3:1) or the field is filled. Accent and danger
   closer than 150 RGB distance warn too; the traffic-light lamps and the
   GREEN message stay on the fixed colours #39ff7a and #ff3030. The badge turns warning below the bar (as in the artboard)
   and Copy still works. The numbers are computed, never typed. A hex field is checked when
   complete (blur, Enter or 6 digits), never mid-typing; the last valid colour
   stays applied until then.
5. **State and persistence:** keep the selected preset, the core inputs and the
   explicit Advanced overrides separately. Resolve the preset values and the
   core derivation first, then apply the overrides. An Advanced edit to a core
   token updates that core input; other overrides survive later core edits and
   are visibly marked. Selecting a preset or Reset clears the overrides, and a
   manual edit shows Custom. Persist this versioned state under `gh-theme`,
   every access in try/catch; validate its shape, allowed keys and colours
   before applying it, and fall back to Phosphor on invalid or unsupported
   data. Export the resolved colours, overrides included. The page works
   without storage. No server, no URL sharing (not asked).
6. **Placement (departs from the artboard's docked panel; the person picks):** (a, recommended) a drawer, drawn first as a new state on the artboard; (b) docked below the page as drawn. Under (a): a "Theme" button in the top bar opens the panel as a right
   side Drawer built as `<dialog>` + `showModal()` (inert background, focus inside on open, `aria-labelledby` its title, transparent `::backdrop`), closed by default; Escape and a named "Close theme" button inside the dialog
   close it (the top-bar button is inert while the modal is open, and touch has
   no Escape), focus
   returns to the button. The game canvas keeps its keys while the panel is
   closed and while it is open the game is paused by the canvas `blur` handler that
   already exists (index.html:583), with no new pause call and no window-level
   Escape handler, and the road shows its green look (tint 1) so accent
   changes are visible; the real state comes back on close. The panel's content follows the artboard exactly: header, preset
   toggles (buttons with `aria-pressed` in a group named "Presets"), four core colour rows, each a `fieldset`/`legend` holding a swatch named "<token> swatch", a hex field (validated on change or blur, `aria-invalid` plus `aria-describedby` error) and a
   contrast badge (text, not colour alone, tied to the field by `aria-describedby`), the "other 23 are derived" callout, and Reset, Advanced and
   Copy theme.json.
7. **Code layout:** a new `theme.js` (pure: parse, mix, contrast, derive,
   presets, export), served beside `index.html` as a UMD classic script in `<head>` that applies the stored theme before first paint; the game script exposes `window.ghTheme.onChange` (reset `cache`, redraw road SVG); with `tests/theme.test.mjs`
   run by `node --test`. The wiring and the panel stay inline in `index.html`,
   as the rest of the page is.
8. **Export:** Copy theme.json writes the 27 colours plus the current
   `typography` and `radii` from `theme.json`, so the output drops in as is.
   The clipboard failing selects the text instead, as the install command does.
9. **The `active*` tokens** are derived from the accent in the export and in
   Advanced, closing the finding from the mockup review.

## Phases (one worktree, one PR, commits per phase)

1. **`theme.js` and its tests.** Parse and validate hex, mix, contrast, derive,
   presets, export. Tests: derive(Phosphor) within tolerance of `theme.json`;
   every shipped preset passes the contrast bars on the pairs Decision 4 names
   (text, muted and subtle text on bg and card, contrast text on accent,
   accent, danger, warning and info on bg); the border is exempt, since a
   field below 3:1 is filled instead (Phosphor's exact border is 1.3:1). No
   preset ships flagged; only visitor input may fall below and warn; export has the 27 keys plus the derived `active*` keys and
   round-trips through JSON without re-deriving the exported colours; tests
   cover an Advanced override, then a core edit, then a reload of the persisted
   state, then an export with the override unchanged; a preset or Reset clears
   overrides; malformed or unsupported stored state falls back safely; every
   game colour (car, tail, brake light,
   white, glitch, slop shade) maps to a named token; bug, slop and boost each
   differ from the accent in every preset; a light background is refused.
2. **Wire the page.** Replace the 34 colour literals in the CSS (lines 29-164, counted with `rg -o`) with the derived
   variables (`color-mix()` where a translucent tint is needed); make the
   canvas read the token set: `tc()` endpoints and `C` from the tokens (Phosphor carries today's tint endpoints (40,255,110) and (255,60,70) as game colours, so Reset is exact), `cache`
   reset on a change, and `say()` given a brightness, not an `rgb()` string
   (index.html:564); the road SVG strokes from the same set. A theme change
   repaints without a reload. Then the panel from the artboard (its body scrolls; header and footer
   actions stay fixed; on a narrow screen a row wraps, name above swatch, hex
   and badge), with Advanced listing the 27 rows. The design card's "change them" sentence links to the Theme button; the button shows the preset name when it is not Phosphor.
3. **The sweep card.** Rewrite the Sweep stop from the tool's own SKILL.md:
   removes merged and released worktrees, keeps unfinished ones, and stops what
   still runs in a deleted one (language servers, test browsers, dev servers,
   shells, orphaned `chrome-devtools-mcp` servers), protecting the sweep and
   what is above it, live Claude processes and what is above them, and the
   `chrome-devtools-mcp` chains of a live session with their wrappers and
   Chrome. The card does not promise protection for every session tool: test
   runners and `fleet-lsp` are explicitly not protected. The terminal line
   comes from a real run, not typed.

## Not in this plan

- Type and radius pickers (the README of the mockup says so).
- Sharing a theme by URL, per-user accounts, a light mode.
- Porting `--procs` into the private overlay copy of `worktree-sweep`.
- Any change to `greenharness/skills`: the tool already ships what the card
  will say.

## Finding for the person (not done by this plan)

`~/.claude/tools/worktree-sweep/sweep.py` is the Forgejo-aware private overlay.
It predates `--procs` (installed 10-29; the public skill is installed at
`~/.claude/skills/worktree-sweep/`). The SessionStart hook in `settings.json`
(line 130) and the `forgejo-recipes` skill still call the old path, so on this
laptop the sweep that runs by hand or from the hook does not stop dev servers
or Chrome. Porting the new code into the overlay template in chezmoi is a
separate change in your dotfiles; I will not touch it without you.

## Verification

- `node --test tests/theme.test.mjs`: green, output pasted in the PR (no CI here). Input: the three cases above.
- Local server, real browser (the agent's, headless is fine for the check):
  1. Open the page: console has no errors beyond the missing favicon.
  2. Open Theme, pick Amber: `getComputedStyle(documentElement)
     .getPropertyValue('--glow')` equals Amber's accent, the road and car on
     the canvas are amber (screenshot before and after), the poster and touch
     pads follow.
  3. Type a bad hex, a light background, a low-contrast text: each is refused
     or flagged with the line the artboard shows.
  4. Reload: the theme persists. Reset: Phosphor; `tc(0..1)` strings and `C` equal the `origin/main` constants (Phosphor carries the canvas endpoints (40,255,110)/(255,60,70) and `C` as preset values).
  5. Copy theme.json: the text parses and equals `theme.json` plus the derived `active*` keys for Phosphor.
  6. Narrow width (390 px and 320 px, Advanced open: no row clipped, Copy visible), keyboard only (Tab through the panel, Escape,
     focus back on the button; at 320 px with touch, "Close theme" closes the
     panel), game keys still steer with the panel closed.
- The PR carries `## Mockup`: the canvas URL and direction C, the path
  `docs/mockups/theme-picker/`, and the artboard beside the live screenshot.
- Sweep card: every capability it names is checked against the tool's
  SKILL.md and its landed tests; the terminal block is pasted from a real audit run (no `--apply`; the process scan is machine-wide).
- After merge: the Pages build of the merge commit, then the live URL checked
  the same way.

## Decision log

- 2026-10-31, the person: "I don't want presets in a split panel but in a section". Option (b) of Decision 6: the picker is a `#theme` section in the page flow, docked as the mockup drew it. Everything that belonged to the drawer fell away with it: the modal `<dialog>`, its inert background, the in-dialog "Close theme" button, the transparent backdrop. The drawer-state artboard commit was reverted before the push, so the artboard stays the one that was picked.
- The green-road hold stays, hung on focus: working anywhere in the section holds the road in its green look, and leaving it releases it (`focusin` and `focusout` on `#theme`).
- Carried notes settled in implementation: `active*` are derived and exported but not Advanced rows (the 27 rows only); a preset click keeps the last custom state behind a "Custom" button; a hex field is applied at six digits and checked on blur or Enter; the hue test skips Mono, whose accent has no hue.
- The sweep card's earlier terminal block was typed, not a real run. It is replaced by the tool's real audit output, with the names shortened.
- Phosphor's CSS tints (`color-mix()` of the card and inset tokens in place of the old `rgba()` values) differ by at most 3/255 from today's; every token, the game's colours and its two tint worlds are exact.
- Accent, danger and warning on bg are held to 4.5:1, not the 3:1 of Decision 4: all three are used as small text (a pressed preset, the error and warning lines, the bug sprite). Every shipped preset passes.
- The panel CSS keeps raw px, as the rest of this page does: the site is not a duro-stack repository. The component map Decision 1 asked for is the artboard's `data-duro` attributes, shown beside the screenshot in the PR's `## Mockup` section, so a separate table would only repeat it.
- The section and its nav link stay hidden until the panel script runs. The design card's "change them" link then points at a hidden section without JS; the page has no colours without JS anyway, since every colour comes from `theme.js`.
- Each core row counts the derived pairs it breaks. A pair with text on it is blamed on the text colour; a pair whose foreground comes from no core colour (warning, info) is blamed on the background.
- A refused hex entry keeps its text and its reason when the field loses focus, until a valid colour is applied or a preset or Reset replaces it.

## Verification (observed 2026-10-31, tree df2d059, Chrome via the agent's browser on a local server)

| Check | Input | Expected | Actual |
|---|---|---|---|
| unit tests | `node --test tests/theme.test.mjs` | all pass | 24 pass |
| no colour literal | the same file's grep test | 0 hex in `index.html`, one `rgb(` builder | 0 and 1 |
| first load | open the page | Phosphor, no console error | `--glow` #39ff7a, only the favicon 404 |
| preset | click Amber | `--glow` #ff9f1a, whole canvas amber, nav "Theme · Amber", stored | all of it; screenshot checked |
| reload | reload with Amber | still Amber | Amber, nav label, pressed button |
| Reset | click Reset | the 27 tokens equal `theme.json`; tint endpoints and car colour exact | 0 mismatches; (40,255,110), (255,60,70), #dcffe6 |
| bad hex | `zzz`, change | invalid, last valid colour kept, says why | `aria-invalid`, accent unchanged |
| light background | `#ffffff` | refused with a line | refused, background unchanged |
| low contrast | text `#3a3a3a` | applied, flagged on the row that caused it | Text badge "1.8:1 · 6 pairs too low", Background "all pairs pass", the warning line names each pair and the fix |
| background pair | background `#666666` | counted on the Background row | "1 pair too low" (warning on bg 4.04:1) |
| refusal kept | `zzz`, then Tab out | the text and its reason stay | `zzz`, `aria-invalid`, error kept, accent unchanged; cleared by a valid colour or Reset |
| blocked storage | `localStorage` getter throws (node vm test) | the page still themes | `ghTheme` loads, variables set |
| refusal kept, Advanced | `zzz` in textMuted, then Tab out | the text and its reason stay | `zzz`, `aria-invalid`, error kept; Reset puts back #7fbf92 |
| close colours | danger `#3fff7f` | warning that names the fix | "Accent and danger look too alike: pick a danger colour further from the accent" |
| Custom | custom, then Amber, then Custom | the custom state comes back | danger #3fff7f restored |
| Advanced | open, edit `textMuted`, then accent | 27 rows; override survives a core edit | 27 rows, `over` class, override kept, accent mirrored |
| override and reload | reload | override still there and marked | kept, row marked "edited" |
| export | Copy theme.json | parses, 27 colours plus 4 `active*`, override kept | 31 keys, override kept, "Copied theme.json." |
| hold | focus inside the section, then out | holding true, then false | true, false |
| corrupt storage | `{"v":1,"preset":"neon",...}`, reload | Phosphor, no error | Phosphor, no new console error |
| narrow, touch | 320 px, touch, Advanced open | no horizontal scroll, nothing clipped, 44 px targets, Copy reachable | all true |
| sweep card | every capability named | present in the tool's SKILL.md | lines 19-43 of `worktree-sweep/SKILL.md` (kinds lsp, browser, mcp, process; never-touched list; test runners and fleet-lsp unprotected) |

Not observed: the road held green while the game is in its game-over state (the hold is read inside `tc()` and checked through `isHolding()` only); a keyboard-only pass in a real keyboard session (every control is native); 390 px (the window floor is 500 px, so 500 and 320 were measured).

## Outcome

The picker is a section of the page, the page and the game follow it, and the sweep card says what the tool does. One PR, five commits after the plan.

## Implementation review

- approve-with-changes, then three Delta rounds to approve-with-changes on tree df2d059 with every finding resolved; about 115k tokens and 6 min in all.
- Fixed: blocked storage broke the page; one override re-derived Phosphor; tests that could not fail; per-row counts, the Background badge, `aria-describedby`; the road rebuilt on focus; a refusal erased on blur (core and Advanced rows); the sweep card overstating what it stops.
- deliberate: raw px in the panel, with the artboard's `data-duro` map as the component table (Decision log).

## Interface review

- 15 findings (1 high, 10 medium, 4 low), advisory. Fixed: a non-colour cue on the pressed preset; the error live region kept in the tree; the status line written only on change; a refusal kept with its reason; 4.5:1 for colours used as small text; the section hidden without JS; 16 px fields on touch; labels on their own row below 640 px; plainer sweep card; warnings that name the fix; one name per colour control; room for the focus ring; one vocabulary for danger and error.
- deliberate: the picker's chrome uses the colours it edits, as Decision 4 says ("flagged, never blocked"), and the presets keep fixed swatches with Reset one click away.
- deliberate: the sweep card's terminal block stays the tool's real audit output, as the plan requires a real run.
- deliberate: no info icon on the callout; the page has no icon set.

<!-- panel: repos=gh-site-import adds=ui reviewers=backend,game-ux,react,ui-design,ux-research,codex body-sha=0613a7e8692d -->
