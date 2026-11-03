# Reviews: Ship features: commit arches, push, unicorn

**Round 1** (all approve-with-changes)

- game-ux (35k, 57 s): 1 high push arch indistinct → accepted (white pillars + plate colour hold); 2 high no progress on phones → accepted (left HUD pips); 3 ready box cut on phones → dup of react#1; 4 unicorn not discoverable → accepted (near-miss line); 5 commits count → dup of backend#3.
- backend (45k, 77 s): 1 high Phase 0 deleted the draft → accepted; 2 ready box → dup; 3 commits C undefined → accepted; 4 no bug-flip check → accepted; 5 roll/wipe clocks → dup of lang#1; 6 content-test phrases → accepted.
- ui-design (33k, 54 s): 1 ready box → dup; 2 high push arch colour → accepted; 3 GATES vs COMMIT naming → accepted; 4 car top touches the box → accepted as rows − HZ − 7; 5 phone count after unicorn → merged into pips; 6 no artboard for push arch/wipe → rejected (preview covers).
- ux-research (31k, 49 s): 1 high phone progress → merged into pips; 2 denominator = need → accepted; 3 bug-flip unbacked → accepted (hallway test); 4 reachability with attest off → narrowed to all parts on.
- lang:typescript (57k, 101 s): 1 high roll/wipe clocks → accepted; 2 high behaviours untested → accepted (`kind` in snapshot, Playwright tests); 3 coupe colours → accepted (`C.glass`, keyed rows); 4 gate-off test → accepted (folded in); 5 `ghGameShipped` vacuous → accepted.
- react (43k, 116 s): no React change confirmed; 1 ready box → accepted (the wording used); 2, 3 dups of lang#2, #3; 4 screen-reader announcement → rejected (existing gap, out of scope).

**Round 2**

- backend (35k, 38 s), approve-with-changes: round-1 all resolved; 1 high HUD row 5 collides with `HARNESS n/6` → fixed (row 6). Carried: 2 hallway test needs a Verification entry and threshold; 3 plate hold on its own clock (`S.plateHold`); 4 record the balance count in Outcome.
- backend re-check (28k, 26 s), approve-with-changes: row fix resolved. Carried: gate-off check should expect `FEATURE 1  ○○○`.
- codex (high effort), approve-with-changes: 1 high same-frame bug/arch order → fixed. Carried: 2 a capped bug neither flips the push nor claims a fix commit; 3 gate off also turns attest off (`HARNESS 4/6`), so check filled pips in a separate run; 4 the push bonus comes from `S.rules.gateBonus` (+5 s unsigned).
- backend on the codex fix (32k, 47 s), approve-with-changes: ordering resolved. Carried: make it a pure `ghFrameEvents` and test both directions (bug before and after the arch, and a bug in another lane).

**Your delta** ("the car stays the same with the rear window that changes … it's random between 3 and 5")

- backend (48k, 73 s), approve-with-changes: 1 high `need` drawn from `S.rng.gate` would shift every arch gap → fixed (own stream `S.rng.feat`, `gameSeed ^ 0x4444`); 2 `ghFeatureSizes` hook → applied; 3 leftover 3-arch lines → applied; 4 plate gap is 12 cells → applied. Carried: 5 `need` and the pips exist only from Start.
- backend re-check (35k, 39 s), approve-with-changes: 1–4 resolved. Carried: the 3σ range is 76–124; record seed 7's first 4 arch positions from `origin/main` as the baseline before Phase 2.
