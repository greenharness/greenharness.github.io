---
status: active
branch: feat/workflow-copy
repos: [greenharness.github.io]
adrs:
  [
    design-system.every-measure-is-a-token (ADR-0027),
    ADR-0045 holdout acceptance,
    ADR-0048 design extension,
    ADR-0051 board and programme map,
    ADR-0052 code-review profiles,
  ]
---

# Explain the workflow on the homepage

## Review panel

👉 **Decide:** none — approve if three new sections (design, router, how agents work), road and table fixes are the right scope.
📍 greenharness.github.io · plan reviewed, worktree `gh-site-import-wt-workflow-copy` ready · next: land plan, build Phase 1. Panel: backend, lang:typescript, react, ui-design, ux-research, game-ux (opus-5-5), codex.
**Changed by review:** badge neutral `.chip.exp` (warning = "you"); sections after `#pit`, in-context links to `#agents`; chip test reads shipped trees incl. the router installer's agents.
**Verdicts:** round 1: 6 approve-with-changes; round 2 and Codex re-runs: backend approve. 5 findings carried into implementation (listed in full reviews).
📄 Full reviews: [2026-11-02-explain-workflow-on-homepage.reviews.md](2026-11-02-explain-workflow-on-homepage.reviews.md)

## Goal

greenharness.github.io says too little about three things a visitor needs before installing.
First, what the `design` part gives an agent: today it is one card and two lines on the road.
Second, what the router is, and that it is experimental: today it is one line, with no status.
Third, how the agents coordinate: today the page says nothing about it.
This plan adds that copy to `index.html`, in the page's existing style. It also adds four workflow
pieces the page leaves out: the board, code-review profiles, programme maps and holdout checks.
Finally, it corrects the skills and agents table against what each part really ships.

## Non-goals

- No rename. The part stays **router** everywhere (the person's choice, 2026-11-02). "relais"
  appears only in the existing "was relais" note and where a command or skill name must be literal
  (`relais`, `relais-implementation`, …).
- No change to the driving game, the theme pane, `theme.js`, `theme.json` or the bundle.
- No new page or route. Everything goes on the homepage.
- No badge anywhere except on the router's experimental pieces (router, session routing, holdouts).
- No claim about Claude Code's own SendMessage or ListAgents as a harness feature.

## Code review

- gh-site-import: ui-design, lang:typescript (backend and react left out: no server code and no React code changes; the rest of the diff is static HTML copy and inline CSS)

## Behaviour

New and changed content, in page order. Copy is plain and second-person, like the current page. No
claim goes in unless one of the sources listed under each item backs it.

1. **Parts grid, router card.** A small `experimental` badge sits next to the name. The card's line
   links to `#router`. The badge is `.chip.exp`, a modifier of the existing `.chip` (index.html:104)
   that changes colour only, so it adds no new measure: border `--faint`, text `--dim`, tokens only.
   It is not warning-coloured, because warning is the page's colour for "you" (index.html:79); the
   word carries the meaning. Duro's Badge ships as hashed CSS modules and cannot be used from static
   HTML.
2. **Parts grid, design card.** The line stays short and gains a link "what it gives your agent"
   to `#design`.
3. **New section `#design`** ("The paint, up close"), after `#pit` and before `#skills`, so `#parts` still leads straight into the lap road; the design card's link reaches it. Its sec-head says that `design`
   is an optional extension and that Duro is its first pack (ADR-0048): the harness owns the
   mechanism, the pack supplies the content. Four blocks follow, in the `.notes` grid style:
   - _Tokens and theme_: one theme file of tokens (colours, fonts, radii, sizes) that themes every
     component. This page is themed that way, as the theme panel shows.
   - _A catalog the agent queries (MCP)_: `duro_ds_list`, `duro_ds_lookup` and `duro_ds_manifest`
     answer "which component, which props". `duro_ds_mockup_canvas` and `duro_ds_mockup_check`
     build and check a mockup before any code. A SessionStart hook puts the catalog in the session,
     and a prompt hook nudges toward plan mode for a new screen.
   - _Lint rules_: the 8 rules of `@duro-app/eslint-plugin`, each a `.chip` with its rule name
     (`no-raw-design-values`, `no-raw-html-element`, …), after one sentence: no raw colours or
     sizes, no raw HTML, design-system components instead. They run at the commit through gate.
   - _Skills and checks_: the skills the pack ships (`ui`, `colors`, `typography`, checked against
     `packages/cli/skills`), `duro doctor`, and `duro hook install --check`, which keeps every
     repository's hook identical.
4. **New section `#router`** ("The router"), right after `#design`, with the `experimental` badge in the heading. The
   sec-head carries the status line: the router is in development, and its commands and formats
   can still change. Blocks:
   - _What it does_: a bounded task (one objective, a write scope, a check command) goes to the
     cheapest model and effort that passes it. It runs in its own worktree, the repository's own
     checks verify it, and it escalates when it falls short. It records the outcome, so the next
     task starts cheaper.
   - _What a worker cannot do_: commit, merge, push, tag, or start another agent. Model choice
     belongs to the route.
   - _You, once per repository_: the first task asks which checks to use and whether the router may
     run them.
   - _Experimental pieces_ (each badged): _session routing_, which can switch the model of your own
     session: installing the router with its Claude plugin turns it on, without that setting it runs
     in shadow (decides and records, switches nothing), and `/relais-routing off` turns it off; and
     _holdout checks_, scenarios the worker never sees that the result must also pass (ADR-0045).
     Sources: `relais/README.md` (status line, Using it, Session routing), the `relais` skill and
     the holdout plan.
5. **New section `#agents`** ("How the agents work together"), after `#you`. The sec-head line says
   the agents hand work over through files that hooks check, not through chat; the one message is an overlap, settled with the session that holds the work or by you (ADR-0051). A
   small ASCII figure in the site's style shows session → plan → panel → you →
   worker(s) → reviewers → push. It is drawn top to bottom so it fits at 320 px with no scroll
   box, and its segments take the road's sector tokens (`--s1` plan side, `--s2` worker, `--s3`
   push). It is a `<figure>` whose `<pre>` is `aria-hidden="true"`, with a `<figcaption>` naming
   the same steps in words (WCAG H86). Five blocks follow; the fifth spans both columns
   (`grid-column: 1 / -1`), so the two-column `.notes` grid leaves no empty cell:
   - _The plan is the contract_: one agent writes it, and each reviewer on the panel reads it from
     its own angle and only reports. The reviews are kept beside the plan, and the hook refuses a
     plan whose panel did not run on that exact text.
   - _Handing out a task_: the session agent (the orchestrator) gives the router a contract. The
     worker returns a result, and the orchestrator accepts or rejects it, a decision the router
     records.
   - _Reviewers before the push_: implementation-review reads the committed diff against the plan.
     The plan also names its **code-review profiles** (architect, backend, language, platform,
     React, TUI, Unix, and interface-review for an interface), and each one declared reads the same tree. The push is refused if any of
     them did not review that exact tree (ADR-0052).
   - _Sessions side by side_: each session leaves an activity record. `amont-agent board` shows
     which session edits which worktree and branch, and what landed, and the agent checks it before starting. When two
     sessions touch the same work, its `work-overlap` rule advises the second one, which settles it with the first or with you (ADR-0051).
   - _Bigger than one session_: work that needs several sessions becomes a **programme map**. Each
     decision ticket is a file, and `relais programme frontier` lists what can start now (ADR-0051).
6. **Lifecycle road (`STOPS` data).** No stop is added or removed. Strings change:
   - _Plan_: names the `## Code review` declaration, and says that bigger work becomes a programme
     map (skill chip `programme`).
   - _Open a worktree_: the board check comes first.
   - _Hand out the task_: a note that the router is experimental, and holdout checks in one clause.
   - _Push_: the `code-review-*` agents beside implementation-review.
7. **Skills and agents table.** It is corrected against the shipped trees: greenharness/skills
   `parts/*`, the relais plugin `claude-plugin/skills`, and Duro `packages/cli/skills`.
   - router: add `programme`.
   - workflow pack: add `interface`, `accessibility`, `layout`, `writing` and `motion-design`, and
     the code-review profiles (7).
   - design: remove `duro-mockup` (only in duro-design-system/.claude/skills, repo-local), and remove
     `plan-review-ui-design` and `plan-review-react` (in no shipped tree); the design row's Agents cell becomes `—`. The Decision log records this.
8. **Nav**: no new links (it stays four items, so it fits on a phone). Discovery is in context instead: the `#you` sec-head ends with a link "how the agents hand work over" to `#agents`, and the road's _Plan_ and _Push_ stops each link to `#agents`. The content test asserts that at least one `href="#agents"` exists.

Responsive: the new `.notes`-style blocks collapse to one column at the existing 900 px breakpoint.
The ASCII figure fits at 320 px with no scroll box (WCAG 1.4.10).

## Phases

- [ ] Phase 1: sections `#design`, `#router` and `#agents`, the badge, the card links, the road
      strings and the table, in one commit, plus a test that the page carries the three section
      ids and that every chip in `#skills` and in the `STOPS` skills/agents arrays exists in a
      fixture of shipped names; each fixture entry records its source tree path and commit SHA,
      copied from greenharness/skills `parts/*`, relais `claude-plugin/skills` and Duro
      `packages/cli/skills`, and counted labels ("plan-review panel (9)", "code-review profiles (7)")
      are an explicit allow-list, as are the Plan stop's "plan-review panel: …" chip and the Push stop's
      `code-review-*` chip, each named. Agent chips come from the agents sources too: greenharness/skills
      `parts/*/agents`, and the advisory agents `relais install` writes (`relais-implementation`,
      `relais-research`, `relais-review`, from relais `crates/relais/src/install/mod.rs`). The fixture
      file names the one command that regenerates it. The
      table gains a `<caption>`, and the test finds it by that caption, not by class. The test must
      fail on main before the table fix.
- [ ] Phase 2: browser check at 1280, 390 and 320 px (Playwright, the agent's own), then the guided
      preview for the person (F7).

## Decision log

- 2026-11-02: the part is named "router" everywhere and badged experimental, because the person
  chose it (AskUserQuestion). The person also chose to add the board, code-review profiles,
  programme maps and holdouts.
- 2026-11-02: coordination is described as file-and-hook handoffs, not messaging, because that is
  what the harness ships. Claude Code's SendMessage is not ours to advertise.
- 2026-11-02: no in-flight branch touches `index.html` (`fix/theme-export` touches theme.json and
  tests; `feat/theme-panel-mockups` touches docs/mockups), so nothing has to be sequenced.

## Verification

- `pnpm test`: the new content test passes on the branch, and fails when a chip `not-shipped` is
  added to the table (checked once by hand, then reverted). The existing tests pass unchanged.
- `pnpm typecheck` passes (CI runs it). index.html is in .prettierignore, so prettier is not a gate for this change.
- New cases in `tests/pane.render.test.mjs` (run by `pnpm test` in CI): at 390 and 320 px the three ids exist and `scrollWidth <= innerWidth`; `.chip.exp` is visible in the router card and the `#router`
  heading; for every preset, its text measures at least 4.5:1 against its background (WCAG 1.4.3),
  read from computed styles.
- Playwright at 1280 / 390 / 320 px: `#design`, `#router` and `#agents` render; the badge is
  visible next to "router" in the card and in the heading; `document.documentElement.scrollWidth <= innerWidth` at 320 px; no console errors. Screenshots go to
  `~/.claude/amont-agent/attestations/<sha>/`.
- The theme panel still opens, and the badge follows the preset (it uses tokens only).
- Each factual line is backed by a source named in Behaviour. Lines checked against those sources
  at F2 are listed in the Outcome.
- The person approves the preview (F7).

## Outcome

Filled at close.

<!-- panel: repos=gh-site-import reviewers=backend,lang:typescript,react,ui-design,ux-research,game-ux,codex body-sha=dd400cd465c4 -->
