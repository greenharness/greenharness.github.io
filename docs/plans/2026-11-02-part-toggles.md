---
status: active
branch: feat/part-toggles
repos: [greenharness.github.io]
adrs: [design-system.every-measure-is-a-token (ADR-0027)]
---

# Part toggles that change the driving game

## Review panel

👉 **Decide:** none — approve if six whole-card switches (C with B's switch, your pick) and these six game costs are the right scope.
📍 greenharness.github.io · plan reviewed, worktree `gh-site-import-wt-part-toggles` ready, mockup built · next: land plan, build Phase 1. Panel: backend, lang:typescript, react, ui-design, ux-research, game-ux (opus-5-5), codex.
**Changed by you:** placement C + B's switch (stretched-label hit area, links stay links). **Changed by review:** each missing part speaks when it would have acted; conform-off slop keeps a bug's penalty; game ↔ cards links ([P], drive-back) for discoverability.
📄 Full reviews: [2026-11-02-part-toggles.reviews.md](2026-11-02-part-toggles.reviews.md)
**Verdicts:** round 1: 6 approve-with-changes; round 2 backend approve after 2 highs; Codex 4 highs applied, backend approve; your placement delta: backend approve-with-changes (4 applied), then approve. 7 findings carried into implementation.

## Goal

The page says "every part is optional", but the driving game always runs with all six parts on.
The person wants each of the six part cards (guardrails, gate, decisions, router, conform,
attest) to carry a checkbox, and the game to get harder for each part that is unchecked. The
cards and the game keep their look. A visitor can then switch a part off and feel what it was
doing for them.

HTML suggestions were asked for: `docs/mockups/part-toggles/options.html` (already in the
worktree, not committed yet) shows three placements (A checkbox on the name's row, B corner
switch, C whole card is the toggle), the game's text with parts off, and the cost table below.
It loads the page's real CSS and `theme.js`.

## Non-goals

- The `design` card gets no toggle: it is not in the list, and it paints the game rather than
  changing how it plays.
- No change to the install command (`curl … | sh`) or the `#skills` table; the toggles are a game
  setting, not an installer. A "copy `grh install <checked parts>`" line is a possible follow-up.
- No new rows or layout in the parts grid; the 6-column grid and its breakpoints stay.
- No change to the theme pane, `theme.js`, `theme.json` or the bundle.

## Code review

- gh-site-import: ui-design, lang:typescript (backend and react left out: no server code and no React code changes; the diff is inline JS and CSS in `index.html` plus a Playwright test)

## Behaviour

### The control (placement C, the whole card, with B's switch)

- Each of the six cards keeps its `<div class="part">` and gains, as its first row above the
  `pre` (where C's bare "ON" sat), a switch like B's: `<label class="pt"><input type="checkbox"
role="switch" data-part="<id>" checked aria-describedby="<id>-note"><span class="pt-txt">on</span></label>`.
  The visible caption reads "on"/"off"; the switch's accessible name is the part's name
  (`aria-label="<id>"`), so a screen reader says "gate, switch, on". The track and thumb are drawn
  from the checkbox (`appearance: none`) with Duro tokens only (colours `--glow`/`--line`/`--dim`,
  radius and spacing tokens, no raw px), the `:focus-visible` outline like `.cmd button`.
- The whole card is the hit area, by the stretched-label pattern: the card is
  `position: relative`, `.pt::after { content: ""; position: absolute; inset: 0 }`, so a click
  anywhere on the card toggles the switch. Links inside a card (router's "How it works") get
  `position: relative; z-index: 1`, so they stay links and never flip the part. The card shows
  `cursor: pointer` and, on hover, an inset outline in `--glow` (`outline` with a negative `outline-offset` from the border-width token), not a `border`: the grid draws its lines with a 1px gap (index.html:66), so a border would shift the card. A `<label>` never wraps the card itself
  (its `pre` and text are not phrasing content). Under `pointer: coarse` the switch row has
  `min-height: var(--duro-size-touch-target)` (Duro sizes.touchTarget; if the CDN lacks the var,
  it goes upstream, ADR-0006). Card text cannot be selected through the overlay (the `::after` takes the pointer, and a drag that ends on the card still fires `click`); accepted for six short cards, and stated here rather than claimed otherwise. Phase 2 asserts that a click on the card's description text toggles the switch.
- Unchecked: the card gets `.off`; only its decorative `pre` dims to `var(--faint)`; the `span` stays
  `var(--dim)` so text keeps 4.5:1 (WCAG 1.4.3, asserted in Phase 2; merged with ux-research#2), and the `small` line is replaced by
  the cost in `var(--bug)`, e.g. "✗ no arches: no time back". The original `small` text is kept
  in the DOM, swapped with `hidden`, so it is not lost.
- attest needs gate: with gate unchecked, attest's checkbox is `disabled` and shown unchecked (its stored value restored when gate is back on)
  and its note reads "needs gate: nothing to sign" in `var(--you)`, tied to the switch by `aria-describedby`. While disabled, the attest card drops `cursor: pointer` and the hover outline (`.part:has(input:disabled)`).
- A polite live region (reuse the `.sr` class; a static empty `<p class="sr" role="status" aria-live="polite" id="partsMsg">` in `#parts`, present at load) announces "gate off: no time back. Applies to the
  next run." on change.
- The choice persists in `localStorage["gh-parts"]` (JSON list of the parts that are off), every
  access in try/catch; the parsed value is filtered to the six known ids; without storage
  everything starts checked.

### When it applies

- `start()` reads the checkboxes into `S.parts` (a frozen set for the run). Toggling mid-race
  changes nothing until the next start; the live-region text says so.
- A module-level `bests` map (outside `S`, so `reset()` at index.html:716/722 does not touch it) is keyed by the sorted list of parts that are off; `S.best` stays a number, read from `bests` at `start()` and written back at game over (866), so 917's `.toFixed` keeps working and a 6/6 best and a 2/6 best never mix. The key is the set in effect: attest counts as off whenever gate is off, here, in N/6 and in the off: lines.

### What each part costs when it is off

The numbers live in one table, `RULES`, inside the game IIFE, built from `S.parts` at `start()`;
`update()` and `spawnAhead()` read `S.rules`, never the checkboxes.

| part off   | on the road                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | lines today                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| guardrails | Rails not drawn. Past `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | x                              | > 0.86`the car is off-road: speed × 0.25, −4 s, "✗ off-road · no guardrails · −4 s", put back at`x = 0`after 0.6 s of shake. The cost fires once per trip off the road: an`S.offroad`timer (0.6 s) is set on entry, and the` | x   | > 0.86`check is skipped while it runs.`S.x` is clamped at ±1.1 so the road never slides off the canvas. | 587–592, 828–832 |
| gate       | No gate entities spawn, so the clock never refills: the run lasts its 40 s.                                                                                                                                                                                                                                                                                                                                                                                                                            | 636, 844                       |
| attest     | Gates give +5 s, not +12 s, and speed × 0.7 through the arch; message "✓ gate · 39 checks passed · unsigned · CI runs them again · +5 s". No effect when gate is off.                                                                                                                                                                                                                                                                                                                                  | 844                            |
| decisions  | No signs, and fog: road rows whose depth `p < 0.33` draw no kerbs, rails or centre line, and entities at `p < 0.33` are not drawn, so a curve and what is on it show only in the nearest two-thirds of the road.                                                                                                                                                                                                                                                                                       | 581–592 (`rowGeom` p), 630–635 |
| router     | No boost pickups: the 12 % boost roll spawns a bug instead. Top speed stays 68.                                                                                                                                                                                                                                                                                                                                                                                                                        | 626, 814, 857                  |
| conform    | No centre line; slop share rises from 33 % to 48 % (roll < 0.40 bug, then slop up to 0.88), taken from bugs so the 12 % boost share is untouched. With conform off, a slop hit costs −3 s, applies speed × 0.35, and glitches 2.4 s rather than 1.6 s. Thus replacing a bug with slop retains its time/speed penalties. Update the cost text and collision message to disclose these penalties. Verify the actual collision time, speed and glitch changes, then tune against the paired balance runs. | 581, 625, 856                  |

All six off is still playable: 40 s, no refills, more bugs and slop.

A part that removes an entity (gate, decisions) still moves its cursor forward (`S.nextGate`, `S.nextSign`) and skips only the `spawn()` call (index.html:630, 636), so the spawn loops always end and the absence messages keep their schedule. Order of the spawn roll: conform moves the bug/slop split first, then router turns the boost share into bugs.

The moment of absence speaks. Each part that is off prints one `C.bug` line where it would have acted, throttled to one every 3 s: gate keeps its `nextGate` schedule and prints "✗ no gate · nothing checked · +0 s" there; decisions prints "✗ no decisions · curve → unannounced" where a sign would have shown; a bug that replaced a boost says "✗ bug · no router" when hit; a slop hit with conform off adds "· no conform".

### What the game says

- Red light: the start line lists only the checked parts: `$ grh install <checked…> design`; then a
  second line, always: "harness 6/6 · uncheck parts below to make it harder" in the dim colour when
  all are on, "harness N/6 · off: gate, conform" in `C.bug` when any is off. At green, "● GREEN. Harness on." becomes "● GREEN. Harness N/6." when any is off.
- HUD: `HARNESS N/6` in `C.bug` on row 5 when any part is off (row 4 is `▶▶ ROUTER BOOST`, index.html:879).
- End screen: `best` is the best for this configuration, and "best 6/6" is shown beside it when
  this run had parts off; an "off: …" line; and, when the canvas has focus and the last game input was keyboard input, `[ H ]  put the whole harness back on` (otherwise "tick the parts below to put them back ↓", since touch has no H key), which
  re-checks the six boxes (and the storage) and does not start a run; it shows only after a run with parts off. The end screen also gains `[ P ]  switch parts off below: the road gets harder  ↓` (focused after keyboard input; otherwise the same words without `[ P ]`; the cards are below the fold, NN/g: 57 % of viewing time stays on the first screen; merged with game-ux#2), which scrolls to `#parts` and focuses the first checkbox. Provide a native `Change parts` link beside the canvas at game over, using the same scroll-and-focus handler as P, so touch users can reach the controls without tapping the canvas and restarting. Track keyboard versus pointer input explicitly; focus alone does not indicate keyboard use. After any toggle, the `#parts` heading row shows a `drive with harness N/6 ↑` link. Its handler reveals the canvas through the existing poster/open-mode machinery when necessary, scrolls to it, and focuses it without starting or resuming a run. Verify both links with touch emulation and keyboard input, including a short viewport with the poster active. The ready box gains no line.
- The canvas `aria-label` while focused appends "Parts off: gate, conform." when any is off.

### Test seam

`#stage` carries `data-parts-off="gate conform"` (the run's set, written at `start()`) and
`data-state` (ready/count/race/paused/over), written only by one `setState(s)` helper that replaces
every direct `S.state =` assignment (index.html:714, 723, 732, 734, 803, 865). Move the `stage` DOM lookup before the first `reset()` call. In `reset()`, initialize valid all-on `S.parts` and `S.rules` before calling `setState("ready")`; `start()` then replaces them with the selected run snapshot. Verify a fresh load reaches ready and renders without errors before any interaction. `S.best` keying
touches reset (716), start (722) and game over (866). `window.ghGameRules(offList)` returns the `RULES`
object (pure, no state) so a test can check each cost without driving. `window.ghGameSnapshot()` returns a copy of `{ state, time, rt, pos, partsOff, gates, offroads, ents: counts by type }` read from `S` and `S.rules`.

## Phases

- [ ] Phase 1: the six switches, `.off` styling, attest dependency, storage, live region; `S.parts`
      / `S.rules` read at `start()`; the six costs; red light, HUD, end-screen lines and `[ H ]`;
      best per configuration; the test seam. One commit. The mockup file, reduced to the picked
      design (C with B's switch) and checked in the browser, is committed in the plan commit as
      the record, and opened for the person before that commit.
- [ ] Phase 2: Playwright tests in `tests/game.parts.test.mjs` (same server pattern as
      `tests/pane.render.test.mjs`): switches selected by `getByRole('switch', { name })`, plus a click on the card body (not the switch) toggles it and a click on router's "How it works" link navigates without toggling: (1) unchecking gate and reloading keeps it unchecked; (2)
      unchecking gate makes attest `toBeDisabled()` with `toHaveAccessibleDescription(/needs gate/)`; (3) `ghGameRules(["gate"])` spawns no
      gates and `ghGameRules(["attest"])` gives +5; and a driven run under `page.clock` (no input,
      runFor 45 s): gate off reaches `data-state="over"` by 42.4 s (2.4 s count + at most 40 s, less after bug hits) with `data-gates="0"`, all parts on reads `ghGameSnapshot().gates` ≥ 1 at 45 s (each gate adds 12 s, so that run is still going)
      (`#stage` writes `data-gates` when the run ends); (4) starting a run with conform off sets
      `data-parts-off="conform"`; toggling mid-race leaves it unchanged; (5) `H` on the end screen
      re-checks all six; (6) no console errors; (7) gate and decisions off, hold ↑ until `pos > 350`: snapshot `ents.gate === 0`, `ents.sign === 0`, page still responds; (8) guardrails off, under `page.clock`, hold ← for 3 s of race: snapshot `offroads` is 1 to 3 and `time` equals 40 − `rt` − 4 × `offroads` within 0.1 s, so one −4 s per trip, never per frame. Test (4) reads `ghGameSnapshot().partsOff`. A content test: the six cards each hold one
      `input[type=checkbox][role=switch][data-part]`, and `design` holds none.
- [ ] Phase 3: browser check at 1280, 390 and 320 px (agent's Playwright), keyboard only
      (Tab to a checkbox, Space, Tab to the canvas, Enter), then the guided preview for the
      person (F7).

## Decision log

- 2026-11-02: placement C (the whole card is the toggle) with B's switch in place of the bare
  "ON" text, the person's choice after seeing the mockup ("I actually like C · the whole card is
  the toggle with instead of bare ON state a toggle like in B"): `docs/mockups/part-toggles/options.html`
  · direction C + B switch. It replaces the earlier pick of A. C's link problem is solved by the
  stretched-label pattern (links above the hit area), not by a label around the card.
  ux-research had backed a checkbox over a switch because the game changes at the next run, not
  at once (NN/g toggle guidelines); deliberate: the card itself changes at once (dims, shows the
  cost), and the live region says the road changes at the next run.
- 2026-11-02: toggles apply at the next start, never mid-race, because the cards sit below the
  game and a change you cannot see happen would read as a bug.
- 2026-11-02: decisions and conform get mechanical costs (fog, more slop), not only hidden visuals,
  because the person asked for the game to be harder, and a hidden sign alone changes nothing.

## Verification

| Check       | Input                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Expected                                                                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| typecheck   | `pnpm typecheck` (covers `theme-pane/` only, not index.html)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | exit 0                                                                                                                                           |
| suite       | `pnpm test`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | the 8 named tests in `tests/game.parts.test.mjs` and the checkbox content test reported as passing                                               |
| fails first | `PAGE=<main's index.html> node --test tests/content.test.mjs`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | the checkbox test fails on main                                                                                                                  |
| browser     | 1280/390/320 px, uncheck gate + conform, play a run                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | no arches, no centre line, HUD 4/6, end screen best keyed, `H` restores                                                                          |
| keyboard    | Tab/Space on the switches, Tab to canvas, Enter                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | focus visible, live region speaks, game starts                                                                                                   |
| balance     | Drive the real game with `page.clock`, using 20 paired seeds per config. Seed Math.random before page scripts and initialize a separate gameplay PRNG before any visual random calls. Generate complete spawn candidates, including positions, spacing and sign/slop attributes, before applying part rules, so disabled entities and changed types do not shift subsequent candidates. Rendering keeps its separate randomness. The bot must act only on currently visible road/entity information, respecting fog; it must not read hidden entities or future curves. | paired mean distance loss for each part off ≥ 10 %; gate-off loss ≤ 4× the next-largest loss; report per-seed results and retune RULES on a miss |
| prettier    | `pnpm exec prettier --check tests/game.parts.test.mjs` (index.html is in .prettierignore)                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | clean                                                                                                                                            |

## Preview

Guided preview (F7): the person opens the page, unchecks parts, plays a run with them off, and
compares with a full-harness run.

<!-- panel: repos=gh-site-import reviewers=backend,lang:typescript,react,ui-design,ux-research,game-ux,codex body-sha=4fc5ec457750 -->
