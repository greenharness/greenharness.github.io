# Theme picker: full reviews (reference)

Round 1, on body 730cf7d4e66c:
- **backend:** approve-with-changes (31k, 63 s). 6 findings, all accepted.
  1. The export check contradicted itself once `active*` joined it.
  2. "Pixel for pixel" cannot hold: the canvas endpoints differ from the CSS colours.
  3. The colour list was under-counted (second `:root`, `SEC`, SVG strokes).
  4. Load order: a classic UMD script in `<head>`, with `window.ghTheme.onChange`.
  5. The sweep terminal block comes from an audit run, no `--apply`.
  6. No CI: paste the `node --test` output in the PR.
- **ux-research:** approve-with-changes (31k, 94 s). 3 accepted, 1 rejected as an edit.
  1. Every shipped preset must pass the bars.
  2. The bars run over every derived text pair.
  3. A hex field is checked when complete, never mid-typing.
  4. A five-person hallway test: kept as a measure for the person, not an edit.
- **game-ux:** approve-with-changes (36k, 110 s). 6 findings, all accepted.
  1. The Phosphor reset check cannot pass (blocking, same as backend 2).
  2. Amber weakens red and green: lamps and the GREEN message stay fixed, and a 150 RGB-distance warning.
  3. The road shows its green look while the panel is open.
  4. A named token for every game colour, and bug, slop, boost differ from the accent.
  5. Link the design card to the Theme button.
  6. Show the preset name on the button when it is not Phosphor.
- **react:** approve-with-changes (38k, 134 s). 5 accepted, 1 rejected.
  1. An ES module plus an inline head script: rejected, backend's classic script is simpler.
  2. A modal `<dialog>` for the panel.
  3. Form semantics: fieldset and legend, `aria-invalid`, badge as text.
  4. Write the `--duro-color-*` names, with the 8 page variables as aliases.
  5. Pause through the existing canvas `blur` handler.
  6. `say()` takes a brightness, not an `rgb()` string.
- **ui-design:** approve-with-changes (46k, 262 s). 4 accepted, 1 left to the person.
  1. The Drawer departs from the artboard's docked layout: the 👉 decision above.
  2. The mapping misses most colours: 34 CSS literals, a second `:root`.
  3. `textSubtle` is body copy and the hex-field border is 1.3:1.
  4. Presets keep the accent 15° of OKLCH hue from warning, info and `--you`.
  5. 27 rows at narrow widths: the body scrolls, rows wrap.

Round 2, on body 122a17dba0ba and 0880d6238a1d:
- **backend:** approve-with-changes (47k, 88 s), then approve (48k, 128 s). All six round-1 findings resolved. 4 new:
  1. The border bar contradicted "no preset ships flagged" (high): applied.
  2. A hook to hold the tint at 1 while the panel is open (medium): carried.
  3. The hue test is undefined for Mono (medium): carried.
  4. Fixed colours against `say()` and the hex grep, and "real run" against "audit run" (low): carried.

Codex (gpt-6-astra), on body 0880d6238a1d: approve-with-changes.
1. Advanced edits had no precedence over derivation (high): applied, Decision 5 and a Phase 1 test.
2. A named "Close theme" button inside the dialog, touch dismissal at 320 px (medium): carried.
3. "Never a live Claude session or its tools" overstated the sweep's protection (high): applied, checked against SKILL.md lines 33-36 and `protected()`.

Backend on the final body b77ba00de486: approve (53k, 20 s). Two lows carried:
- One table in `theme.js` maps each core input to its token (accent, bg, text, error).
- Verification 4 gains "override one Advanced row, reload, the row is still marked".

Second round 2, fresh launches on the final body b77ba00de486 (the hook needs all five on it):
- **backend:** approve (34k, 25 s). All six round-1 findings resolved. 5 new, none high, carried:
  1. Decision 1 promises a part-to-component table the plan does not hold: write it in the PR's `## Mockup` section.
  2. "The button" closing the dialog: read as the in-dialog Close button (then applied from react).
  3. "The three cases above" in Verification is stale: the PR names each test case beside the pasted output.
  4. `active*` rows in Advanced: shown read-only or overridable, decided in implementation.
  5. Under option (b), docked, the dialog checks (Escape, focus return, blur pause) drop out.
- **ux-research:** approve (35k, 38 s). 4 resolved. Carried: the hex-field triggers differ between Decision 4 and Decision 6 (use blur, Enter or 6 digits); a modal with a transparent backdrop (test closing it); the 150 RGB-distance warning is unbacked (also compute OKLab); the 15° hue gap, the forced green road and surviving overrides are unbacked (hallway test).
- **ui-design:** approve (36k, 84 s). 5 resolved. Carried: write the part-to-component table; the filled-field fallback has no measured bar (measure fill against panel); a transparent backdrop gives no sign that outside clicks do nothing.
- **game-ux:** approve (40k, 167 s). 6 resolved. Carried: holding the road green must cover `over`, a pause during the countdown and `ready`, as `hold ? 1 : tint` inside `tc()` and its cache key; keep the last Custom state as a button so a preset click does not wipe it.
- **react:** approve-with-changes (39k, 93 s). Findings 1-6 resolved (1 no longer matters: the theme is inline on `documentElement`). 1 new high, applied: the top-bar button is inert while the modal is open and touch has no Escape, so Decision 6 names a "Close theme" button inside the dialog and Verification 6 tests it by touch at 320 px.

Final delta, fresh launches on the final body 0613a7e8692d (one edit, the in-dialog Close button): all approve.
- **backend:** approve (20k, 14 s). The edit fits Decisions 6 and 7; no findings.
- **react:** approve (27k, 14 s). Resolved; the edit matches its patch and the platform's `showModal()` behaviour.
- **ux-research:** approve (19k, 14 s). Backed by the WAI-ARIA dialog pattern. Low, carried: the Close button needs at least 24×24 px (WCAG 2.5.8), checked in the touch pass.
- **ui-design:** approve (21k, 21 s). Medium, carried: put "Close theme" in the fixed header at the end of the title row, drawn there in option (a)'s artboard state, not in the scrolling body or the footer.
- **game-ux:** approve (29k, 94 s). Low, carried: the green-road hold is released on the dialog's `close` event, whichever way it was closed; focus returns to the Theme button, so the race stays paused until a deliberate key or tap.

Carried into implementation (23, the three above added to the 20 below): backend round 2 findings 2, 3 and 4; Codex 2; the two final lows of the earlier backend pass; the hallway test as a measure; and the 5 + 4 + 3 + 2 notes above from the second round 2 (backend, ux-research, ui-design, game-ux), minus the Close-button one now applied.

Measured by the coordinator on the real `theme.json`: Phosphor passes every pair Decision 4 names (textSubtle on bgCard 4.69:1, on bgElevated 4.58:1); the border on bg is 1.31:1 and is exempt.
