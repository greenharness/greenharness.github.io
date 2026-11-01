import {test, before, after} from 'node:test'
import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {readFile} from 'node:fs/promises'
import {extname} from 'node:path'
import {chromium} from 'playwright'

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
}
let server
let browser
let base

before(async () => {
  server = createServer(async (req, res) => {
    const path = new URL(req.url, 'http://x').pathname.replace(/^\/$/, '/index.html')
    try {
      const body = await readFile(new URL(`..${path}`, import.meta.url))
      res
        .writeHead(200, {'content-type': TYPES[extname(path)] ?? 'application/octet-stream'})
        .end(body)
    } catch {
      res.writeHead(404).end()
    }
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${server.address().port}/`
  browser = await chromium.launch()
})

after(async () => {
  await browser?.close()
  await new Promise((resolve) => server?.close(resolve))
})

async function open(width, height) {
  const context = await browser.newContext({viewport: {width, height}})
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('404')) errors.push(m.text())
  })
  await page.goto(base)
  await page.click('#themeLoad')
  await page.waitForSelector('[role="dialog"]')
  return {page, errors, context}
}

test('the panel opens as a side pane on a desktop and its presets drive the theme', async () => {
  const {page, errors, context} = await open(1120, 760)
  const dialog = page.locator('[role="dialog"]')
  assert.equal(await dialog.getAttribute('aria-modal'), null, 'a pane is not modal')
  await page.getByRole('button', {name: 'Amber', pressed: false}).click()
  assert.equal(await page.evaluate(() => window.ghTheme.get().preset), 'amber')
  await page.getByRole('button', {name: 'Reset'}).click()
  assert.equal(await page.evaluate(() => window.ghTheme.get().preset), 'phosphor')
  const box = await dialog.boundingBox()
  assert.ok(box.width <= 640 && box.x + box.width <= 1120, `pane fits: ${JSON.stringify(box)}`)
  assert.deepEqual(errors, [])
  await context.close()
})

test('the panel is a bottom sheet on a phone and never wider than the window', async () => {
  const {page, errors, context} = await open(390, 800)
  const box = await page.locator('[role="dialog"]').boundingBox()
  assert.ok(box.y > 200, `a sheet rests low, not full height: ${JSON.stringify(box)}`)
  assert.ok(box.x >= 0 && box.x + box.width <= 390)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= 390), true)
  assert.deepEqual(errors, [])
  await context.close()
})

test('an entry that is not a colour is refused with a reason and the colour stays', async () => {
  const {page, context} = await open(1120, 760)
  const accent = page.getByRole('textbox', {name: 'Accent', exact: true})
  await accent.fill('#12')
  await accent.blur()
  assert.equal(await accent.getAttribute('aria-invalid'), 'true')
  await page.getByText('Enter a colour as #rrggbb or #rgb').waitFor()
  assert.equal(await page.evaluate(() => window.ghTheme.get().core.accent), '#39ff7a')
  await context.close()
})

test('Reset gives back the export of the untouched theme', async () => {
  const {page, context} = await open(1120, 760)
  const exported = () => page.evaluate(() => window.ghTheme.exportTheme(window.ghTheme.get()))
  const untouched = await exported()
  await page.getByRole('button', {name: 'Amber', pressed: false}).click()
  assert.notDeepEqual(await exported(), untouched)
  await page.getByRole('button', {name: 'Reset'}).click()
  assert.deepEqual(await exported(), untouched)
  await context.close()
})

test('at 320 px the sheet fits and the page does not scroll sideways', async () => {
  const {page, context} = await open(320, 640)
  const box = await page.locator('[role="dialog"]').boundingBox()
  assert.ok(box.x >= 0 && box.x + box.width <= 320, JSON.stringify(box))
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= 320), true)
  await context.close()
})

test('Escape closes the pane and gives focus back to its trigger', async () => {
  const {page, context} = await open(1120, 760)
  const dialog = page.locator('[role="dialog"]')
  await page.waitForFunction(() =>
    document.querySelector('[role="dialog"]')?.contains(document.activeElement),
  )
  await page.keyboard.press('Escape')
  await dialog.waitFor({state: 'detached'})
  await page.waitForFunction(
    () => document.activeElement?.textContent?.trim() === 'Open the theme panel',
  )
  await context.close()
})

test('tabbing through a hex field without editing it changes nothing', async () => {
  const {page, context} = await open(1120, 760)
  await page.getByRole('button', {name: 'Advanced', exact: false}).click()
  const before = await page.evaluate(() => JSON.stringify(window.ghTheme.get()))
  const field = page.getByRole('textbox', {name: 'accentHover', exact: true})
  await field.focus()
  await field.blur()
  assert.equal(await page.evaluate(() => JSON.stringify(window.ghTheme.get())), before)
  assert.equal(await page.evaluate(() => window.ghTheme.current().custom), false)
  await context.close()
})

test('the nav link and the card link open the pane again after it was closed', async () => {
  const {page, context} = await open(1120, 760)
  const dialog = page.locator('[role="dialog"]')
  await page.getByRole('button', {name: 'Close'}).click()
  await dialog.waitFor({state: 'detached'})
  await page.locator('#themeLink').click()
  await dialog.waitFor()
  await page.getByRole('button', {name: 'Close'}).click()
  await dialog.waitFor({state: 'detached'})
  await page.locator('#themeInline').click()
  await dialog.waitFor()
  await context.close()
})
