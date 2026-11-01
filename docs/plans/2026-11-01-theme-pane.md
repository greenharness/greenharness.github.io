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

| Check           | Input                                    | Expected                                                               | Actual         |
| --------------- | ---------------------------------------- | ---------------------------------------------------------------------- | -------------- |
| theme.js        | `node --test`                            | 24 tests                                                               | pass           |
| budget          | `pane.bundle.test.mjs`                   | js + css gzipped under 200 KB                                          | 187 KB, passes |
| lazy            | the page's HTML                          | no `theme-pane.js` script tag                                          | passes         |
| desktop         | `pane.render.test.mjs` at 1120 px        | a non-modal pane, presets drive `ghTheme`, Reset restores Phosphor     | passes         |
| phone           | at 390 px                                | a bottom sheet inside the window, no horizontal scroll                 | passes         |
| refusal         | `#12` in the accent field                | `aria-invalid`, the reason shown, the colour kept                      | passes         |
| by hand         | Chromium at 1120 and 390 px              | the pane in the site's green, Amber changes its own buttons            | seen           |
| reset           | Amber, then Reset                        | the export of the untouched theme                                      | passes         |
| 320 px          | `pane.render.test.mjs` at 320 px         | the sheet inside the window, no sideways scroll                        | passes         |
| keyboard        | Escape with focus inside the pane        | the pane closes and focus returns to the "Open the theme panel" button | passes         |
| untouched field | focus an Advanced hex field and leave it | the theme state is byte for byte the same                              | passes         |

Not observed, and why: the 500 px render (the pane and sheet geometry is Duro's, covered by its stories at 500 and 1200 px); touch dismissal at 320 px (no touch device here); the game still steering (the pane is non-modal and `ghTheme.hold` is kept, but no one played it).

## Review notes

- deliberate: the copy-fallback textarea has a no-op `onChange` because Duro's `Textarea` has no `readOnly` prop.
- follow-up, not this change: `exportTheme` includes four `active*` tokens that `theme.json` and the "27 colours" tests do not, so Reset gives back the export of the untouched theme, not `theme.json` byte for byte as the canonical plan says.

## Reviews

Implementation review (approve-with-changes, 7 findings): the Reset check is now the export of the untouched theme, 320 px and Escape are tested, the loader removes its elements on failure and clears its message on success, the store is built by a function, names fixed, README says why the dev dependencies exist. Interface review (advisory, 11 findings): fixed a hex field that saved on blur without an edit (it marked tokens as edited and flipped the theme to Custom), focus returning to a real trigger, ratios kept out of the live region, the contrast text read as each field's description, rows that wrap at 320 px, default-size controls on a phone, the road held green while the pane is open, the trigger named "Open the theme panel".

Kept: the swatch's name next to the field's ("Accent colour", "Accent"), and Escape not closing the pane from the expanded Advanced button (Duro skips Escape while a focused control has `aria-expanded`; filed with the Duro follow-ups).
