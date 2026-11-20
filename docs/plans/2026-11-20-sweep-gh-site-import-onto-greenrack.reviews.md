# Sweep gh-site-import onto greenrack: full reviews

Round 1 (opus-5-5): backend approve-with-changes (37k, 66 s), 5 findings, all accepted. ux-research approve-with-changes (31k, 59 s), 2 accepted. game-ux approve-with-changes (35k, 62 s), 3 accepted (the throttled press-to-open timing dropped as host-load noise). react approve-with-changes (63k, 89 s), 3 accepted, 1 no edit. ui-design approve-with-changes (37k, 91 s), 3 accepted, 1 no edit. lang:typescript approve-with-changes (39k, 102 s), 4 accepted. The overlapping Phase 0 script edits were merged into one patch.

Round 2: backend approve-with-changes (46k, 19 s). ui-design approve (41k, 12 s). ux-research approve (35k, 10 s). react approve (69k, 16 s). game-ux approve-with-changes (41k, 19 s). lang:typescript approve (41k, 12 s). Carried into implementation, all low:

- say implementation review runs at F4b on the pushed tree (backend, typescript, ui-design);
- a Picture note that commit 1 is an intermediate state on 6.3.0;
- the 10% growth line is a report, the budget is the stop;
- re-run the returning-visitor case on a revert sha;
- an exact threshold for "row lost from view": the Background row must stay in view;
- spell the eight pathspec excludes out in full.

Codex (gpt, high effort): approve-with-changes.

1. [high] New HTML with a cached old `theme.js` or panel. **Rejected:** Pages serves `max-age=600` (checked with curl). The mismatch lasts at most 10 minutes, and its worst case is a saved custom theme showing the default colours; nothing breaks.
2. [medium] Review the whole base-to-head diff (sources, lockfile, tests), not five files. **Carried into implementation.**
