import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { chromium } from "playwright";

const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
};
let server;
let browser;
let base;

before(async () => {
  server = createServer(async (req, res) => {
    const path = new URL(req.url, "http://x").pathname.replace(
      /^\/$/,
      "/index.html",
    );
    try {
      const body = await readFile(new URL(`..${path}`, import.meta.url));
      res
        .writeHead(200, {
          "content-type": TYPES[extname(path)] ?? "application/octet-stream",
        })
        .end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await new Promise((resolve) => server?.close(resolve));
});

async function open({ clock = false } = {}) {
  const context = await browser.newContext({
    viewport: { width: 640, height: 700 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  if (clock) await page.clock.install({ time: 0 });
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  if (clock) await page.clock.runFor(100);
  return { page, errors, context };
}

test("ghFeatureAfter ships at need, takes next as need, and a bug adds one up to 5", async () => {
  const { page, context } = await open();
  const after = (f, ev, next) =>
    page.evaluate(([a, b, c]) => window.ghFeatureAfter(a, b, c), [f, ev, next]);
  assert.deepEqual(await after({ shipped: 0, done: 0, need: 3 }, "arch", 4), {
    shipped: 0,
    done: 1,
    need: 3,
  });
  assert.deepEqual(await after({ shipped: 0, done: 2, need: 3 }, "arch", 5), {
    shipped: 1,
    done: 0,
    need: 5,
  });
  const bug = await after({ shipped: 0, done: 1, need: 3 }, "bug", 4);
  assert.equal(bug.need, 4);
  assert.equal(bug.grew, true);
  const capped = await after({ shipped: 0, done: 1, need: 5 }, "bug", 4);
  assert.equal(capped.need, 5);
  assert.equal(capped.grew, false);
  await context.close();
});

test("ghFeatureSizes(7, 300) draws only 3, 4 and 5, each about a third of the time", async () => {
  const { page, context } = await open();
  const sizes = await page.evaluate(() => window.ghFeatureSizes(7, 300));
  assert.equal(sizes.length, 300);
  for (const n of [3, 4, 5]) {
    const c = sizes.filter((x) => x === n).length;
    assert.ok(c >= 76 && c <= 124, `${n} drawn ${c} times`);
  }
  assert.equal(sizes.filter((x) => ![3, 4, 5].includes(x)).length, 0);
  await context.close();
});

test("ghFrameEvents orders bug hits and arch passes by where they trigger", async () => {
  const { page, context } = await open();
  const ev = (ents, p0, p1, x) =>
    page.evaluate(
      ([a, b, c, d]) => window.ghFrameEvents(a, b, c, d).map((e) => e.type),
      [ents, p0, p1, x],
    );
  const gate = { type: "gate", s: 520, x: 0, hit: false, done: false };
  const bug = (s, x = 0) => ({ type: "bug", s, x, hit: false, done: false });
  assert.deepEqual(await ev([gate, bug(521)], 513.4, 514.8, 0), [
    "bug",
    "arch",
  ]);
  assert.deepEqual(await ev([bug(521), gate], 513.4, 514.8, 0), [
    "bug",
    "arch",
  ]);
  assert.deepEqual(await ev([gate, bug(522)], 514.5, 515.2, 0), [
    "arch",
    "bug",
  ]);
  assert.deepEqual(await ev([bug(522), gate], 514.5, 515.2, 0), [
    "arch",
    "bug",
  ]);
  assert.deepEqual(await ev([gate, bug(521, 0.9)], 513.4, 514.8, 0), ["arch"]);
  await context.close();
});

test("seed 7 puts arches at 520 and 1101.003 m, each with a commit or push kind", async () => {
  const { page, errors, context } = await open({ clock: true });
  await page.evaluate(() => window.ghGameSeed(7));
  await page.locator("#game").click();
  await page.clock.runFor(2600);
  await page.keyboard.down("ArrowUp");
  const seen = [];
  for (let i = 0; i < 200; i++) {
    const s = await page.evaluate(() => window.ghGameSnapshot());
    if (s.state !== "race") break;
    for (const v of s.visible.filter((v) => v.type === "gate")) {
      const at = Math.round((s.pos + v.d) * 1000) / 1000;
      if (!seen.some((g) => g.at === at)) seen.push({ at, kind: v.kind });
    }
    if (seen.length >= 2) break;
    await page.clock.runFor(250);
  }
  assert.equal(seen[0].at, 520);
  assert.equal(seen[1].at, 1101.003);
  assert.ok(["commit", "push"].includes(seen[0].kind));
  const end = await page.evaluate(() => window.ghGameSnapshot());
  assert.ok(end.need >= 3 && end.need <= 5);
  assert.equal(end.rider, "car");
  assert.deepEqual(errors, []);
  await context.close();
});

test("a run ends with data-features and, with gate off, none shipped", async () => {
  const off = await open({ clock: true });
  await off.page
    .getByRole("switch", { name: "gate", exact: true })
    .click({ force: true });
  await off.page.evaluate(() => window.ghGameSeed(7));
  await off.page.locator("#game").click();
  await off.page.clock.runFor(45000);
  assert.equal(
    await off.page.locator("#stage").getAttribute("data-features"),
    "0",
  );
  await off.context.close();

  const on = await open({ clock: true });
  await on.page.evaluate(() => window.ghGameSeed(7));
  await on.page.locator("#game").click();
  await on.page.clock.runFor(45000);
  const s = await on.page.evaluate(() => window.ghGameSnapshot());
  assert.ok(s.commits >= 1);
  assert.equal(s.commits, s.gates);
  assert.deepEqual(on.errors, []);
  await on.context.close();
});
