# greenharness.github.io

The Green Harness site: one static page, `index.html`, served by GitHub Pages from `main`.

## The theme panel

The page's colours come from `theme.js` (presets, contrast checks, `theme.json` export). The panel
that edits them is Duro's `Pane` (`@duro-app/ui`, pinned exactly in `package.json`), built with
React into `theme-pane.js` and `theme-pane.css`. The page loads them on the first press of
"Open the theme panel", not with the page (about 185 KB gzipped).

```sh
pnpm install --frozen-lockfile
pnpm build        # esbuild: theme-pane/ -> theme-pane.js + theme-pane.css
pnpm typecheck
pnpm test         # theme.js, the bundle budget, and the panel in headless Chromium
```

The built files are committed, because Pages serves the branch as it is. CI rebuilds them and
fails when the committed ones differ. To move to a newer Duro: change the version in
`package.json`, `pnpm install`, `pnpm build`, and commit all three.
