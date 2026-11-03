---
status: active
branch: feat/feature-push
repos: [greenharness.github.io]
adrs: [design-system.every-measure-is-a-token (ADR-0027)]
---

# Ship features: commit arches, push, unicorn

## Review panel

👉 **Decide:** none. Approve if you're happy with a random 3 to 5 arches per feature, a bug adding a fix commit, nothing shipping with gate off, and a 0.6 s wipe into the unicorn.
📍 greenharness.github.io · plan reviewed; branch `feat/unicorn` stays the source until Phase 3 merges · next: worktree `feat/feature-push`. Panel: backend, game-ux, lang:typescript, react, ui-design, ux-research (all opus-5-5), codex.
**Changed by you:** today's car with tinted glass (option B, not the coupe); a push after a random 3 to 5 arches. **Changed by review:** white push arch + `FEATURE n` pips on every width; events in the order the car reaches them; feature sizes on their own seeded stream, so arches never move.
📄 Full reviews: [2026-11-03-ship-features-commit-arches-push.reviews.md](2026-11-03-ship-features-commit-arches-push.reviews.md)
**Verdicts:** round 1: 6 approve-with-changes; round 2 and codex: 1 high each, fixed; your delta: 1 high fixed (own random stream), backend then approve-with-changes; 11 findings carried into implementation.

## Goal

The harness has Claude Code commit often and push a whole feature once, and the homepage
and its driving game should say so. The car keeps today's line drawing, with a tinted rear
window and colours from the theme. Its plate reads `FEATURE-1`, and the plate counts up each
time the player ships a feature. Every arch on the road is a **commit** gate. After a random
3 to 5 arches comes the **push** that ships the feature. A
player who ships three features in one run turns the car into the slim galloping unicorn for
the rest of that run. At the start, the car rolls in from close to the camera during the red
lights.

The person chose this on 2026-11-03, after first trying the unicorn as the car. The rejected
attempt is the local, never-pushed branch `feat/unicorn`; its sprite and start-shot code is
reused here.

## Non-goals

- No change to the theme pane, `theme.json` or the bundle. `theme.js` only gains the
  unicorn's fixed colours, which sit beside `LAMP`.
- The six part switches, their costs and the `#skills` table are unchanged. The one exception
  is gate's cost note, which gains "nothing ships" (Behaviour).
- The lifecycle road's SVG car (the `car` group at index.html:1369) stays as it is.
- No new sound, scoring, leaderboard or persistence. `best` km stays per set of parts.

## Code review

- gh-site-import: ui-design, lang:typescript (backend and react left out: no server code and no React code changes; the diff is inline JS in `index.html`, two constants in `theme.js`, and Playwright/node tests)

## Behaviour

### The car (today's car, option B)

- The `CAR` sprite (index.html:713) keeps today's 5-row × 22 line drawing. The rear window
  `____________` becomes tinted glass `▓▓▓▓▓▓▓▓▓▓▓▓`, the tail lights `##` become solid `██`,
  and `GH-1` becomes the plate. This is option B on `/tmp/uni/cars.html`:
  ```
     .--------------.
    /  ▓▓▓▓▓▓▓▓▓▓▓▓  \
   |__/ FEATURE-1  \__|
   [██]============[██]
    (__)          (__)
  ```
- Every colour comes from the theme, with no hex in `index.html`. The test at
  `tests/theme.test.mjs:224` enforces this.
  - The outline uses `C.shade = TH.mix(C.car, C.inset, 0.35)`, which `refreshPalette()`
    computes. The bumper `=` stays `C.car`.
  - The glass is `C.glass = TH.mix(C.inset, PAL.tokens.accent, 0.3)`, computed in `refreshPalette()` beside `C.shade`, not per frame. The tyres are `C.hud`.
  - `CAR` uses the draft's `[glyphs, keys]` rows (as `UNI`), one colour key per cell, instead of today's regex on the glyph.
  - The lights are `C.tail`, and `C.brake` while braking, as today.
  - The plate text is `tc(1)`, like `GH-1` today.
- The plate shows `FEATURE-<n>`: n is the feature in progress, starting at 1. It is centred
  between `/` and `\` (12 cells), so `FEATURE-10` still fits.
- The car leans into turns as today: the roof and window rows shift by
  `round(steerVis × 1.6)`.

### The start shot (kept from the unicorn work, now for the car)

_Removed at preview: see the Decision log entry "at preview (decided by the person)". The car keeps its size, as on main._

- In the ready state, the car stands close to the camera. It is drawn scaled by
  `s0 = clamp((rows − HZ − 7) / spriteRows, 1, 2.2)` (the ready box gains two lines, so its border moves to HZ+4; one row stays free), so its top stays below the title box
  and the log.
- At Start, during the 2.4 s red light, it rolls to its chase spot in 2.1 s and then stands
  still until green.
  - The distance is eased with smootherstep, and the size follows 1 / distance.
  - A pause resumes the roll where it stopped. The roll plays at every Start, including after
    "drive again".
  - The roll is `S.launch`, advanced by `dt / 2.1` in update()'s count branch. It is never derived from `S.ct` (resume() resets it to 0) or `S.clock` (it runs while paused).
- At green the camera does not move: the road starts to run.
- With reduced motion, the car is at chase size from the start.
- At scale 1 the rider is drawn on the character grid, as today. While larger, `render()`
  draws it on the canvas after the grid. This is the same code as `feat/unicorn`'s
  `drawUnicornClose`, generalised to the current rider.

### Commits, then a push

- A feature takes a random 3 to 5 arches: commits, then the push at its last arch. Each
  feature's `need` is `3 + (rng() * 3 | 0)` from its own seeded stream `S.rng.feat = makeRng(gameSeed ^ 0x4444)`, created in start() beside `obs`, `sign` and `gate`, so the gate gaps (index.html:679) draw exactly as today and a part switched off never moves an arch. The first one is drawn in start() right after `S.rng` is built, the next each time a feature ships. The logic is a pure function, `featureAfter(f, ev, next)`,
  with `f = { shipped, done, need }`, `ev` being `"arch"` or `"bug"`, and `next` the drawn size
  of the following feature. It is exposed as `window.ghFeatureAfter` for the tests, like
  `ghGameRules`.
  - **arch:** `done + 1 === need` ships the feature: `shipped + 1`, `done = 0`, `need = next`.
    Otherwise it is one more commit.
  - **bug** (a bug hit while racing): `need = min(5, need + 1)`. That is one fix commit before
    the push, never past 5, so a feature always takes between 3 and 5 arches.
  - Slop does not add a fix commit: it already scrambles output.
  - Within one update, bug hits and arch passes are applied in the order the car reaches them, not in entity insertion order. A bug triggers at `e.s − Z × 1.15` and an arch at `e.s − Z × 0.9`; on an exact tie the bug goes first. Collision eligibility, penalties and RNG use are unchanged. A regression places a pending push at 520 m, a bug at 521 m, and one frame moving from 513.4 to 514.8 m. With either insertion order, the fix commit is added before the arch, so the feature does not ship.
- The arch ahead shows its kind as it approaches, re-read every frame:
  - A commit arch is labelled `COMMIT · 39 CHECKS` (big) or `COMMIT` (medium). It is drawn
    as today.
  - The push arch is labelled `PUSH · FEATURE-<n>` (big) or `PUSH` (medium). Its pillars and top bar are drawn in `C.white`; commit arches keep `tc(0.95)`. So it stands out from a commit arch before its label can be read.
  - A bug hit while the push is visible turns that arch back into a commit, and the log says so. (Unbacked: a five-person hallway test in Phase 2 checks that players read this as the bug's cost, not as a glitch.)
- The log lines:
  - Commit: `✓ commit 1/3 · 39 checks passed · signed · +12 s`. The denominator is the current `need`, so after a bug it reads `commit 2/4`. The unsigned variant keeps
    today's wording ("unsigned · CI runs them again").
  - Push: `✓ push · FEATURE-1 shipped · +12 s`. The plate's new number is drawn in `C.white` for 0.5 s, then returns to `tc(1)`. This is a colour hold, not a flash.
  - Bug: the existing line gains ` · fix commit before the push`.
  - The time bonus and slow-down per arch are unchanged (`S.rules.gateBonus/gateSlow`).
- **Gate switched off:** there are no arches, so nothing is committed and nothing ships. The
  plate stays at `FEATURE-1`. The absent arch's line becomes
  `✗ no gate · nothing checked · nothing ships · +0 s`. The cost note `#gate-note .cost` and
  `NOW.gate` read "no time back, nothing ships".
- **HUD**, right column (more than 60 columns): the `GATES` row is renamed `COMMITS`, and a `SHIPPED` row goes under it.
- **HUD**, left column (every width, so phones see it too): row 6 shows `FEATURE n  ●●○` (row 4 is the router boost and row 5 the `HARNESS n/6` warning when a part is off, index.html:1074-1075). There is one pip per arch of `need` (up to 5): the filled ones are done, and the last one is the push. It stays while she is the unicorn, who has no plate.
- **End screen:** `gates passed N` becomes `features shipped F · commits C`, where C counts every arch passed, pushes included (= `S.gates`).
- **Snapshot and stage:** `ghGameSnapshot()` gains `features`, `commits`, `need` and `rider`, and each gate in `visible` carries `kind` (`"commit"` or `"push"`).
  `#stage` gets `data-features` when a run ends, like `data-gates`.
- **Test hook:** `window.ghGameShipped(n)` sets `shipped` during a race, so a test can reach
  the third push without driving 9 to 15 arches. It is used only by tests and verification, like
  `ghGameSeed`. It never turns the car into the unicorn itself: only an arch whose `featureAfter` takes `shipped` from 2 to 3 does.

### The unicorn bonus

- The third push (shipped = 3) turns the car into the unicorn from `feat/unicorn`. She
  is 8 rows × 15, with a gold horn, a rainbow mane and tail rippling down, gallop frames paced
  by the speed, and the hoof on the ground in `C.brake` while braking.
  - Her horn and rainbow are `TH.UNICORN` in `theme.js`, and stay the same in every theme.
- **The transformation:** over 0.6 s, a wipe moves from top to bottom. Its progress is `S.morph`, advanced by `dt / 0.6` in the race branch of update(), so a pause freezes it. Rows above the seam
  draw the unicorn and rows below it draw the car, with rainbow `✦` sparkles on the seam row.
  - It is a wipe, not a flicker: nothing flashes (WCAG 2.3.1).
  - With reduced motion she replaces the car at once.
- The log says `★ 3 features shipped · bonus: the unicorn`. She runs until the time is up.
  Further pushes still count, but she has no plate. The next race starts with the car.
- The end screen adds `★ unicorn earned` when it happened. Otherwise, after a run that shipped 1 or 2 features, it shows `ship 3 features in a run: ★`.

### Saying it on the site

- **The ready box** (index.html:1040) gains a line under "Dodge the bugs. Dodge the AI slop.":
  `Commit at each arch.` and, on the next line, `Every 3–5 arches, push a feature.` (two lines, each within 37 characters, so the box fits the 390 px grid; `box()` does not wrap).
- **The gate card** (index.html:269) becomes: "The arches. Your agent commits often and
  pushes a whole feature once. Every commit and every push goes through 39 built-in checks,
  and each one buys you time."
- **The "Push" stop** of the lifecycle road (`STOPS`, index.html:1290): its `what` starts
  with "The agent pushes a finished feature, not every commit."

## Preview

The person previews the commit as usual, with a guide, before the push.

## Phases

- [x] Phase 0: new worktree `gh-site-import-wt-feature-push` (branch `feat/feature-push`)
      from `origin/main`; this plan is its first commit. Keep the `feat/unicorn` worktree and its
      local branch (never pushed) as the source for Phases 1–3; remove them only after Phase 3 is merged.
- [x] Phase 1: today's car with tinted glass, the themed colours, the `FEATURE-n` plate, and the car's start
      shot (shared rider drawing); the start shot was removed at preview (Decision log).
- [x] Phase 2: commits and push. This covers `featureAfter`, the arch kinds and labels, the
      log lines, gate-off behaviour and its cost note, the HUD row, the end screen, the snapshot
      and `ghGameShipped`.
- [x] Phase 3: the unicorn bonus. This covers the sprite, `TH.UNICORN`, the wipe, the log
      line and the end-screen line.
- [x] Phase 4: the site copy (ready box, gate card, Push stop) and the tests below.

## Decision log

- 2026-11-03: the person kept the car over the unicorn, and picked the "commits, then a push"
  rule, the unicorn for the rest of the run after 3 features, and the car rolling in at the
  start (`/tmp/uni/cars.html`, AskUserQuestion).
- 2026-11-03, at plan review: the person kept today's car, changing only its rear window and
  colours (option B, not the coupe they first picked). A push comes after a random 3 to 5
  arches, not every third.
- 2026-11-03: the person asked the site to say it too: Claude Code pushes features, not every
  commit.
- 2026-11-03: the size is drawn from its own seeded stream `S.rng.feat`, not `S.rng.gate`, so arch spacing is unchanged and runs stay reproducible under
  `ghGameSeed`. At about 10 s of driving per arch at top speed, the first feature ships in
  30–50 s and three take 9–15 arches. That keeps the unicorn for good runs; the balance
  measure below checks it is still reachable.
- 2026-11-03: a bug hit adds a fix commit, never past 5 arches, because a defect costs
  rework; the cap keeps a buggy run able to ship. Slop adds none, because it already scrambles
  output.
- 2026-11-03: with gate off nothing ships, because the gate is what checks a commit; the
  card's cost note says so.
- 2026-11-03: the transformation is a top-to-bottom wipe, not a flicker, because a flicker
  above 3 Hz breaks WCAG 2.3.1.
- 2026-11-03: the car's start shot keeps the unicorn's choreography (2.1 s roll during the
  2.4 s red light, smootherstep on distance, still camera at green). This follows the
  research: a racing game's intro camera hands over to the chase camera before control, and
  moving from a cinematic shot back to gameplay uses an S-curve.
- 2026-11-03, implementation: `window.ghGameShipped(n, done)` takes an optional `done`, so a
  test reaches a push at the next arch; an idle test car runs out of time before 3 to 5 arches.
- 2026-11-03, implementation: the car's close-up before Start is also capped at 55% of the
  width, because at 390 px the ◀ ▶ pads covered its tail lights at the planned 2.2×.
- 2026-11-03, balance (scope change, decided by the person): 20 seeded bot runs with all parts
  on, as planned, shipped 1 feature in 19 runs and 2 in one; none reached 3. Two variants did
  no better (no fix commits: 0/20 reach 3, 10/20 reach 2; push +8 s: 0/20 reach 3, 4/20
  reach 2). The person chose: the unicorn comes at the **2nd** push, and a push gives 8 s more
  than a commit (`PUSH_EXTRA`, `UNICORN_AT` in index.html). The sections above still say 3;
  this entry supersedes them.
- 2026-11-03, implementation review: `frameEvents` is `frameEvents(ents, pos, x)`, not
  `(ents, pos0, pos1, x)`. Eligibility is read at the frame's end, as the old loop did, and
  two reviewers found `pos0` unused. A swept test would make bugs hit at boost speed, where
  they pass through today, which is a gameplay change this plan does not make.
- 2026-11-03, implementation review: the bug-flip test hits a bug while the push is _next_
  (seed 7: first bug at 125 m, first arch at 520 m), before the arch is in view, and then
  checks the arch shows as a commit. The seeded test makes the second arch the push with
  `ghGameShipped(0, need − 1)`, because an idle test car runs out of time before 3 real
  commits.

- 2026-11-03, at preview (decided by the person): "I don't like the zoom out of the car. I
  prefer the old behavior with the car keeping the same size." The start shot is removed: the
  car is drawn at chase size from the first frame, as on main. This supersedes the start-shot
  section, its Phase 1 rows and the 55% width cap. The person also dropped the idea of adding
  the mockup's game-explanation sections.

## Verification

Playwright, with the clock installed and paused so only `runFor` moves game time.
Screenshots are in `/tmp/uni/shots/` (copied to the attestation for the preview).
Format: input → expected → observed.

- Phase 1:
  - 1100×760, ready → red lights → race → the car at chase size the whole time, below the
    ready box → as expected (`z-ab.png`). (The start-shot rows checked before the preview are
    superseded: that code is removed.)
  - Hold ↓ → tail lights in `C.brake` → as expected (`p1-brake.png`).
  - 390×844, ready → the car at chase size, clear of the ◀ ▶ pads and below the ready box →
    as expected (`z-m.png`).
  - Amber preset → outline, glass and plate follow the theme → as expected (`l-amber-c.png`).
- Phase 2:
  - Bot run, seed 1 → COMMIT arches, then a white PUSH arch, then the plate `FEATURE-2` in white
    → as expected (`p2-push-arch.png`, `p2-shipped.png`). HUD: `COMMITS` and `SHIPPED` on the
    right, `FEATURE 1 ●●●●○` on the left → as expected (`p2-hud.png`).
  - Bug hit while the push is next → `need` one higher, the arch reads COMMIT, the log says
    `· fix commit before the push` in full at 390 px → as expected (test 7, `u-phone-log.png`).
  - Gate off at 390×844 → `features === 0`, row 5 `HARNESS 4/6` (attest goes off with gate),
    row 6 `FEATURE 1  ○○○`, no overlap → as expected (`l-gateoff-c.png`).
  - End screen → `features shipped F · commits C` → as expected (`p2-end.png`).
- Phase 3 (unicorn at the 2nd push, per the Decision log):
  - `ghGameShipped(1, need − 1)` just before an arch, pass it → `+20 s` push, the 0.6 s wipe
    with sparkles, then the galloping unicorn, `rider === "unicorn"`, `★ unicorn earned` on
    the end screen → as expected (`p3-wipe.png`, `p5-log.png`). A run with 1 feature ends
    with `ship 2 features in a run: ★` → as expected (`p5-nend.png`).
- Phase 4: ready box, gate card and Push stop at 1100 and 390 px → new sentences, no sideways
  scroll, no `…` → as expected (`p4-d-ready.png`, `p4-m-ready.png`, `p4-cards.png`,
  `p4-m-push.png`). The content test fails on main's page and passes here.
- Tests (`pnpm test`, the full suite, passed; `game.features.test.mjs` 7/7 five times):
  `ghFeatureAfter`, `ghFeatureSizes(7, 300)` (only 3/4/5, each in 76–124), `ghFrameEvents`
  in both orders and another lane, seed 7 arches at 520 and 1101.003 m (baseline from
  `origin/main` a76ba98) with a commit then a push shipping feature 1, gate off ships none,
  the 2nd push brings the unicorn and the next Start the car, a bug while the push is next
  adds a fix commit (fails on a build without fix commits), `TH.UNICORN`, the copy.
- Not run: the five-person hallway test of the bug-flip rule (Behaviour); raised with the
  person at the preview.
- Known limit: in the Mono preset the white push pillars and the near-white commit pillars
  look alike; the COMMIT/PUSH label and the HUD pips carry the difference, and beyond label
  distance nothing does (`u-mono.png`).

## Outcome

Shipped: today's car with tinted glass, colours from the theme and a `FEATURE-n` plate,
rolling in from close to the camera during the red lights; commit arches and a push after a
random 3 to 5 arches, with fix commits for bugs, pips on every width, white push arches, the
new log and end-screen lines; the unicorn as a bonus; the site copy.

Changed on the way (Decision log): the unicorn comes at the 2nd push, and a push gives 8 s
more than a commit. Balance, 20 seeded bot runs each with all parts on: planned rules 0/20
reach 3 features (1/20 reach 2); no fix commits 0/20 and 10/20; push +8 s 0/20 and 4/20.

Not done: the hallway test; a live region for the race log (pre-existing gap); the lifecycle
road's SVG car is unchanged (non-goal).

Surprised: Playwright's installed clock keeps running in real time unless paused, which
made the first launch captures and the first tests misleading.

## Implementation review

- implementation-review: round 1 approve-with-changes (3 high: phases, results, a test that
  could not fail); delta approve-with-changes, the rest recorded here (51k, 36 s).
- lang:typescript: round 1 approve-with-changes (shared hit window, clamp, `pos0`); delta
  approve (25k, 15 s). deliberate: `featureAfter`'s two shapes; `commits` beside `gates`.
- ui-design: round 1 rework (2 features / +8 s vs the plan body: the person's decision,
  recorded; legs under reduced motion fixed); delta approve-with-changes (33k, 33 s).
  deliberate: no design-system inputs, the repo has no decision corpus.

<!-- panel: repos=gh-site-import reviewers=backend,game-ux,lang:typescript,react,ui-design,ux-research,codex body-sha=f5b291aa1318 -->
