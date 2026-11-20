---
status: active
next: Phase 3 — preview, PR, merge; then Phase 4 live check and the decisions PR
branch: chore/greenrack
repos: [gh-site-import, decisions]
adrs: [ADR-0075, ADR-0076]
plan-id: p-01M7W3FJ5P8RSY5H4TJS22E4D2
---

# Sweep gh-site-import onto greenrack

## Review panel

👉 **Decide:** none. Approve if a rename-only sweep to greenrack 7.1.2 is enough, measured per commit, with merge as the Pages deploy.
📍 gh-site-import, decisions · 2 commits then merge = deploy · 1 step for you · next: Phase 0 baseline. Panel: backend, lang:typescript, react, ui-design, ux-research, game-ux (opus-5-5), codex.
**Changed by review:** the browser script now measures Pane boxes and rows, LiveRegion states, focus and a returning visitor; bundle bytes are recorded; a rollback is added; the 6.3.0 token check is added; a content test pins the greenrack names.
📄 Full reviews: [2026-11-20-sweep-gh-site-import-onto-greenrack.reviews.md](2026-11-20-sweep-gh-site-import-onto-greenrack.reviews.md)
**Verdicts:** 6 approve / approve-with-changes, codex approve-with-changes; 8 carried; words 975 → 1212 (×1.24); remove 0, merge 0.

## Picture

```
 index.html
  ├─ unpkg ui@5.37 index.css      ─► greenrack-ui@7.1.2 index.css
  ├─ unpkg tokens@5.37 vars.css   ─► greenrack-tokens@7.1.2 vars.css
  ├─ 64× var(--duro-*), theme.js  ─► --gr-*
  └─ lazy theme-pane.js + .css    ─► rebuilt (esbuild) on greenrack-ui
       ▲ built from theme-pane/*.tsx, pinned @duro-app/ui 5.43.0
 GitHub Pages serves main as is: merge = deploy
```

The page reaches the DS two ways, a CDN link plus token names and a
committed bundle; both move to greenrack 7.1.2, and merging deploys.

## Context

gh-site-import is the checkout of `greenharness/greenharness.github.io` (GitHub),
the Green Harness site: one static `index.html` served by GitHub Pages from
`main`. It is the next app in t08's order (decisions
`docs/programmes/greenrack-rename/t08-fleet-sweep.md`). It uses the DS twice:

- the page links the 5.37.0 `index.css` and tokens `vars.css` from unpkg and
  reads 30 distinct `--duro-*` tokens (64 uses) in its CSS; `theme.js` writes
  `--duro-color-*` inline from the theme presets;
- the theme panel is `@duro-app/ui` 5.43.0's `Pane`, bundled by esbuild into the
  committed `theme-pane.js`/`.css`; CI rebuilds and fails on a diff.

Checked before planning (scratch `/private/tmp/ghsi-probe.xLv9`): the 30 tokens
exist as `--gr-*` in 7.1.2 with their hashed vars defined; the 74 colour names
are unchanged; every import is exported, new peers optional; both 7.1.2 unpkg
URLs answer 200; Pages serves `main`, so nothing is unreleased; dry run
`npm-name` 7, `css-var` 64, others 0. No `.claude/` or AGENTS.md block: hook,
skill and agents-md steps do not apply (said in the PR).

## Goal

The site and its theme panel run on greenrack 7.1.2, with the copy naming
greenrack's real commands and MCP tools, and no visible change beyond what DS
5.44–7.1.2 itself changes in the Pane (touch-size buttons on a coarse pointer).

## Non-goals

- Regenerating `tests/fixtures/shipped.json` (it would add `greenrack-mockup`
  and change site content): follow-up, together with `scripts/shipped-names.mjs`'
  `../duro-design-system` default, which breaks once the symlink goes.
- Rewriting mockups and plans (history, allowlisted).
- Adding greenrack hooks or skills to this repo.

## Code review

- gh-site-import: backend, lang:typescript, react, ui-design
- decisions: none — markdown only

## Behaviour

- At 1280, touch 390 and touch 1024 the page renders as on main: the 30 tokens'
  computed values on `:root` are identical (or each difference is listed and
  traced to a DS value change); hero height, poster threshold, part toggles,
  stops, `.yous` grid, skip link unchanged.
- The theme panel opens on the first press, every preset applies (the page and the Pane's own primary button both take the preset's accent), Copy still
  matches `theme.json`, the contrast flags behave the same. A custom theme saved in `localStorage["gh-theme"]` on main still applies on the branch. Pane differences are
  DS 5.44+'s (44px touch buttons) and are shown in the preview; a panel row lost
  from view at coarse 390 is raised before merge. Tablet sizing (`useNarrow`
  vs coarse pointer): follow-up.
- The copy says greenrack: `greenrack_list`/`greenrack_lookup`/
  `greenrack_manifest`/`greenrack_mockup_canvas`/`greenrack_mockup_check`,
  `greenrack doctor`, `greenrack hook install --check`, "greenrack is the first
  one", "greenrack's command line", and the game's `design:` line.

## Phases

Worktree `gh-site-import-wt-greenrack` from `origin/main`, branch
`chore/greenrack`, plan landed as commit 0 (`docs/plans/2026-11-20-sweep-onto-greenrack.md`).
Heavy steps through `greengate slot run --max-wait 540`.

### Phase 0 — Baseline on main

- `pnpm install --frozen-lockfile && pnpm typecheck && pnpm build && git diff --exit-code -- theme-pane.js theme-pane.css && pnpm test`.
- Serve the tree (`python3 -m http.server`) and run the browser-check agent with
  one fixed script, run at 1280, coarse 390 and coarse 1024, saved under the
  scratch dir:
  - the 30 token computed values on `:root`, default preset and a returning
    visitor (`localStorage["gh-theme"]` seeded with a custom state saved on main);
  - the layout boxes above, document scrollWidth, screenshots;
  - the panel: smallest Button/Toggle box, preset row count (Custom shown), Pane
    height and scrollHeight/clientHeight, whether the Background row is in view
    at 390 (WCAG 2.5.5/2.5.8);
  - the LiveRegion (`role="status"`, `aria-live`) text after a preset pick, a
    Copy, a forced clipboard failure and a low-contrast colour, still mounted
    after each (WCAG 4.1.3); each preset Toggle's `aria-pressed`; focus on the
    trigger after Close and after Escape inside the Pane; Escape outside leaves
    it open.
- Record gzipped `theme-pane.js` + `theme-pane.css` bytes (budget 204,800).

### Phase 1 — Commit 1: DS → @duro-app 6.3.0 (last old-scope)

- `package.json` `@duro-app/ui` 5.43.0 → 6.3.0; `pnpm install`; the two unpkg
  links 5.37.0 → 6.3.0 (check both URLs 200 first); `pnpm build`; typecheck,
  test (bundle budget included), browser check with the same script, plus the
  30-token and 74-colour check on the 6.3.0 `vars.css`/`index.css`. Bundle
  growth over 10% is reported in the PR.
- Isolates DS behaviour changes from the rename. If the budget test trips,
  stop and report the measured size (raise the budget only on the person's ok).

### Phase 2 — Commit 2: rename onto greenrack 7.1.2

- `sweep-app.sh --allow allow.txt --expect npm-name --expect css-var .`
  (allowlist: `docs/plans/**`, `docs/mockups/**`, `*mockups*.html`,
  `circuit-options.html`, `theme-pane.js`, `theme-pane.css`,
  `tests/fixtures/shipped.json`, `scripts/shipped-names.mjs`).
- Hand edits: pin `@greenharness/greenrack-ui` `7.1.2`; unpkg links to
  `@greenharness/greenrack-ui@7.1.2/dist/index.css` and
  `@greenharness/greenrack-tokens@7.1.2/dist/vars.css`; the prose and comments
  (index.html lines ~9, 33, 388, 392, 394, 417, 440, 984, 1355; README 8, 23;
  `tests/pane.bundle.test.mjs` comment; the theme.test title).
- `pnpm install` (lockfile re-resolved), `pnpm build`, typecheck, test, browser
  check. Then `git grep -n -i -w duro` and `git grep '@duro-app/'` with the
  allowlist as pathspec excludes (`':!docs/plans' ':!docs/mockups' ...`): nothing.
- A `tests/content.test.mjs` case (fails on main): `index.html` and `theme.js`
  hold no `--duro-` or `@duro-app/`, and `index.html` names the five
  `greenrack_*` tools and `greenrack doctor`.

### Phase 3 — Preview, review, PR, merge

- Localhost preview of the branch beside main, opened with `greenbelay open`,
  for the person's look (Pane on a phone width).
- implementation-review + the code-review profiles on the diff of `index.html`,
  `theme.js`, `package.json`, `theme-pane.js`, `theme-pane.css`; PR on GitHub with the
  measurements, the allowlist and the hooks/skills/AGENTS.md note;
  merge-when-green.

### Phase 4 — Live and record

- Wait for the Pages build of the merge sha
  (`gh api repos/greenharness/greenharness.github.io/pages/builds/latest`: `commit` equals the merge sha and `status` is `built`, polled up to 10 min), then
  browser-check https://greenharness.github.io with the same script: page links
  greenrack 7.1.2, 0 `--duro-`, tokens resolve, panel opens.
- decisions PR: t08 Progress for gh-site-import in
  `docs/programmes/greenrack-rename/t08-fleet-sweep.md`, the follow-up
  (shipped.json + script default), handoff in
  `docs/programmes/greenrack-rename/map.md`.

### Rollback

- If the live check fails (token unresolved, panel does not open, unpkg 7.1.2 error): revert PR on GitHub, merged on green; Pages rebuilds main; re-run the live check against the revert sha. Visitor theme state is in token keys, not var names, so it survives both ways.

### 🧑 Your steps

- Look at the preview (Phase 3) and say if the Pane changes are fine.

## Verification

Per commit: `pnpm typecheck`, `pnpm build` + `git diff --exit-code` on the
bundle after commit, `pnpm test` (theme, content, bundle budget, headless panel),
the browser-check script against Phase 0's numbers. After merge: the live check
of Phase 4.

- Bundle: gzipped size per commit → ≤ 204,800, change from Phase 0 in the PR.
- Tokens: 30 computed values, main vs branch at each width → 0 differences, or
  each listed with its DS cause.
- Residue: `git grep -i -w duro` outside the allowlist → 0 lines; rebuilt
  `theme-pane.css` → 0 `--duro-`.

## Outcome

Measured before the push (`attestations/6ccc61d`: `m0` main, `m1` commit 1,
`m2b` commit 2, with `measure.mjs`, `cmp.py` and the visitor seed).

| Check                                                                           | Expected                                                | Actual                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| typecheck, build, bundle current                                                | pass at each commit                                     | pass at main, 8cfe383, 6ccc61d                                                                                                                                                                                                                            |
| `pnpm test`                                                                     | pass                                                    | main 63/63, 8cfe383 63/63, 6ccc61d 64/64, e94f0b2 65/65 (bundle current)                                                                                                                                                                                  |
| bundle gzipped (js + css)                                                       | ≤ 204,800                                               | main 194,314; 6.3.0 196,079 (+0.9%); 7.1.2 196,067 (+0.9%)                                                                                                                                                                                                |
| 6.3.0 and 7.1.2 CDN files                                                       | 200; 30 tokens and hashed vars defined; 74 colour names | both 200; all defined; 74 unchanged                                                                                                                                                                                                                       |
| 30 `:root` tokens, default and returning visitor                                | 0 differences                                           | 0 at 1280, touch 390 and touch 1024, both commits; the seeded accent `#12d47a` applies                                                                                                                                                                    |
| layout boxes, scrollWidth                                                       | 0 differences                                           | 0, except the design section at touch 1024: 646 → 668px, because the longer `greenrack_*` names wrap one more line (copy change)                                                                                                                          |
| panel: control boxes, preset rows, Pane size and scroll, Background row in view | 0 differences                                           | 0 (at 390 the Background row is below the sheet's first height on main too)                                                                                                                                                                               |
| LiveRegion after preset, Copy, forced failure, low contrast                     | the same text, still mounted                            | the same at every width; `role=status`, `aria-live=polite`                                                                                                                                                                                                |
| `aria-pressed`, focus after Close and after Escape inside, Escape outside       | as on main                                              | as on main; one run at commit 2 lost focus after Close at 390, so Close at 390 was repeated 10 times: main 10/10, branch 10/10                                                                                                                            |
| new content tests                                                               | fail on main or on a broken page, pass on the branch    | the names test: `PAGE=<main index.html>` fails 1; the tokens test (e94f0b2): a copy using `--gr-spacing-smm` fails, a link to tokens 7.1.1 fails; the branch passes                                                                                       |
| residue outside the allowlist                                                   | 0, the guard test aside                                 | `git grep -i -w duro`, `duro_ds_`, `@duro-app/`, `--duro-`: 4 lines, all in the guard test (`tests/content.test.mjs` 119, 125, 128, 129), re-run at e94f0b2; `ci.yml`'s comment fixed; rebuilt `theme-pane.css` and `.js`: 0 `--duro-`; lockfile 0 `duro` |

DS 5.44+ changed nothing measurable here: `useNarrow` already gave the phone
panel 44px controls on 5.43, and every desktop control is unchanged.

## Implementation review

- implementation-review: approve-with-changes → Delta approve-with-changes. Fixed: the residue row (4 guard lines), the size notes, Close-focus re-run 10×. Deliberate: "about 195 KB" for 196,067 bytes, as the note is a round figure (49k + 35k).
- backend: approve-with-changes → Delta approve. Fixed: a tokens-exist test and the `hook install --check` copy pin. Deliberate: the stale-cache window, at most 10 min under `max-age=600`, is stated in the PR (49k + 25k).
- ui-design: approve-with-changes → Delta approve. Its two findings were about the brief (scope block, aval note); both were supplied in the Delta (61k + 27k).
- react: approve, no findings (45k, 35 s). lang:typescript: approve, no findings (49k, 38 s).
- CI image (ec8b839, then afcb691), implementation-review: approve-with-changes → approve. Fixed: the pin's ceiling (later replaced by the 26.04 pin and Playwright 1.65.1) and the Decision log line below (34k, 20 s; deltas 34k, 50 s).

## Decision log

- Two steps, 6.3.0 then 7.1.2: bisectable.
- `shipped.json`/`shipped-names.mjs` left as history; follow-up filed.
- By hand, not relais: sed, prose and rebuilds.
- The fixed browser check is a Playwright script, `measure.mjs`, run per
  commit; its JSON is the report, so no screenshots enter the session. The
  cold-load preview check and the live check go through `browser-check`.
- The landed file is named `2026-11-20-sweep-gh-site-import-onto-greenrack.md`,
  not the shorter name in Phases, which stays as reviewed.
- `ci.yml` `runs-on` is pinned to `ubuntu-26.04`, with Playwright 1.58.2 →
  1.65.1 (afcb691, the person's call). PR #15's first run failed at
  `playwright install`: `ubuntu-latest` is now 26.04, and 1.58.2 installs
  no chromium there. Main last passed on 2026-11-06, on the older image.
  1.65.1 lists ubuntu26.04 as a host; the suite passes 65/65 on it locally.
  The image is pinned so the next change is a reviewed edit. An interim
  ubuntu-24.04 pin (ec8b839) was replaced. The step was not in the phases.

<!-- panel: repos=gh-site-import,decisions reviewers=backend,lang:typescript,react,ui-design,ux-research,game-ux,codex body-sha=7bcb3f69d868 -->
