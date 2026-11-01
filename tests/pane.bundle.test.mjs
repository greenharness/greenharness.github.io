import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {gzipSync} from 'node:zlib'

// The panel is Duro's Pane with React, loaded on the first press. This is its weight budget:
// raise it on purpose, in a PR that says why.
const BUDGET_GZIP_BYTES = 200 * 1024

const gzipped = (file) => gzipSync(readFileSync(new URL(`../${file}`, import.meta.url))).length

test('the panel bundle stays inside its gzipped budget', () => {
  const total = gzipped('theme-pane.js') + gzipped('theme-pane.css')
  assert.ok(
    total <= BUDGET_GZIP_BYTES,
    `theme-pane is ${total} bytes gzipped, budget ${BUDGET_GZIP_BYTES}`,
  )
})

test('the page loads the bundle only on a press, never with the page', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  assert.equal(
    /<script[^>]+src="theme-pane\.js"/.test(html),
    false,
    'theme-pane.js has a script tag',
  )
  assert.equal(/<link[^>]+rel="stylesheet"[^>]+href="theme-pane\.css"/.test(html), false)
  assert.match(html, /js\.src = "theme-pane\.js"/)
})
