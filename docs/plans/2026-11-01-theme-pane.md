---
status: done
branch: feat/theme-pane
repos: [greenharness.github.io]
canonical: fredericrous/duro-design-system docs/plans/2026-11-01-non-modal-panes.md
phases: [4]
adrs:
  [
    ui.mockup-handoff (ADR-0016),
    design-system.every-measure-is-a-token (ADR-0027),
  ]
---

# The theme panel on Duro's Pane (this repo's slice of the non-modal panes plan)

Phase 4 of the canonical plan: the site's theme section is rebuilt on Duro's `Pane`
(`@duro-app/ui@5.41.0`), bundled with React and loaded on the first press.

## What changed from the plan, and why

- **No switch of the Pages source.** The plan deployed the bundle from GitHub Actions, which needs the
  person's go-ahead. The built bundle is committed instead and Pages keeps deploying `main`; CI
  rebuilds it and fails on a difference. The switch stays open for the person to ask for.
- **Loaded on a press.** The bundle is about 185 KB gzipped, so the page stays as light as before and
  the panel downloads on the first press (a hover or focus prefetches it).
- **The pane wears the theme it edits** (`ThemeProvider overrides`), and is a bottom sheet under
  640 px, a side pane above.

## Verification (observed 2026-11-01)

| Check    | Input                             | Expected                                                           | Actual         |
| -------- | --------------------------------- | ------------------------------------------------------------------ | -------------- |
| theme.js | `node --test`                     | 24 tests                                                           | pass           |
| budget   | `pane.bundle.test.mjs`            | js + css gzipped under 200 KB                                      | 187 KB, passes |
| lazy     | the page's HTML                   | no `theme-pane.js` script tag                                      | passes         |
| desktop  | `pane.render.test.mjs` at 1120 px | a non-modal pane, presets drive `ghTheme`, Reset restores Phosphor | passes         |
| phone    | at 390 px                         | a bottom sheet inside the window, no horizontal scroll             | passes         |
| refusal  | `#12` in the accent field         | `aria-invalid`, the reason shown, the colour kept                  | passes         |
| by hand  | Chromium at 1120 and 390 px       | the pane in the site's green, Amber changes its own buttons        | seen           |
