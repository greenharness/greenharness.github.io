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
const PARTS = [
  "guardrails",
  "gate",
  "decisions",
  "router",
  "conform",
  "attest",
];
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

// A tall desktop window (no poster), optionally with the clock under the test's control.
async function open({ clock = false, context: existing } = {}) {
  const context =
    existing ??
    (await browser.newContext({ viewport: { width: 640, height: 700 } }));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().includes("404"))
      errors.push(m.text());
  });
  if (clock) await page.clock.install({ time: 0 });
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  if (clock) await page.clock.runFor(100);
  return { page, errors, context };
}

const sw = (page, name) => page.getByRole("switch", { name, exact: true });
// The card-wide hit area sits over the switch, so Playwright's own hit test refuses a plain click on it.
const flip = async (page, name) => {
  const el = sw(page, name);
  await el.scrollIntoViewIfNeeded();
  await el.click({ force: true });
};
async function expectChecked(locator, want) {
  assert.equal(await locator.isChecked(), want);
}
const snap = (page) => page.evaluate(() => window.ghGameSnapshot());
const stageState = (page) => page.locator("#stage").getAttribute("data-state");

// Click the canvas (starts the run), then run the clock through the 2.4 s red light.
async function drive(page) {
  await page.evaluate(() => window.ghGameSeed(7));
  await page.locator("#game").click();
  await page.clock.runFor(2600);
  assert.equal(await stageState(page), "race");
}

test("the switches start on, and a part switched off stays off after a reload", async () => {
  const { page, errors, context } = await open();
  for (const name of PARTS) await expectChecked(sw(page, name), true);
  await flip(page, "gate");
  await expectChecked(sw(page, "gate"), false);
  await page.reload();
  await expectChecked(sw(page, "gate"), false);
  await expectChecked(sw(page, "router"), true);
  assert.deepEqual(errors, []);
  await context.close();
});

test("with gate off, attest is disabled, shown off, and says it needs gate", async () => {
  const { page, context } = await open();
  await flip(page, "gate");
  const attest = sw(page, "attest");
  assert.equal(await attest.isDisabled(), true);
  assert.equal(await attest.isChecked(), false);
  const description = await attest.evaluate((el) =>
    el
      .getAttribute("aria-describedby")
      .split(" ")
      .map((id) => document.getElementById(id).innerText)
      .join(" "),
  );
  assert.match(description, /needs gate/);
  await flip(page, "gate");
  assert.equal(await attest.isDisabled(), false);
  assert.equal(await attest.isChecked(), true);
  await context.close();
});

test("a click on the card body toggles the switch, a click on the router's link does not", async () => {
  const { page, context } = await open();
  const card = page.locator(".part", { has: sw(page, "gate") });
  await card.scrollIntoViewIfNeeded();
  const box = await card.locator("> span").boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expectChecked(sw(page, "gate"), false);
  await page.getByRole("link", { name: "How it works" }).click();
  await expectChecked(sw(page, "router"), true);
  assert.equal(new URL(page.url()).hash, "#router");
  await context.close();
});

test("ghGameRules gives each part its cost", async () => {
  const { page, context } = await open();
  const rules = (list) => page.evaluate((l) => window.ghGameRules(l), list);
  assert.equal((await rules(["gate"])).gates, false);
  assert.equal((await rules([])).gates, true);
  assert.equal((await rules(["attest"])).gateBonus, 5);
  assert.equal((await rules([])).gateBonus, 12);
  // attest counts as off whenever gate is
  assert.equal((await rules(["gate"])).gateBonus, 5);
  assert.equal((await rules(["decisions"])).signs, false);
  assert.ok((await rules(["decisions"])).fog > 0);
  assert.equal((await rules(["router"])).boosts, false);
  assert.equal((await rules(["conform"])).centre, false);
  assert.ok((await rules(["conform"])).slopTime > 0);
  assert.equal((await rules(["guardrails"])).rails, false);
  await context.close();
});

test("a run with gate off is over by 42.4 s with no gate passed, one with everything on is still going", async () => {
  const off = await open({ clock: true });
  await flip(off.page, "gate");
  await drive(off.page);
  await off.page.clock.runFor(45000 - 2600);
  assert.equal(await stageState(off.page), "over");
  assert.equal(
    await off.page.locator("#stage").getAttribute("data-gates"),
    "0",
  );
  assert.deepEqual(off.errors, []);
  await off.context.close();

  const on = await open({ clock: true });
  await drive(on.page);
  await on.page.clock.runFor(45000 - 2600);
  assert.ok((await snap(on.page)).gates >= 1);
  assert.deepEqual(on.errors, []);
  await on.context.close();
});

test("data-parts-off is frozen when a run starts, and H puts all six parts back", async () => {
  const { page, errors, context } = await open({ clock: true });
  await flip(page, "conform");
  await flip(page, "gate");
  await drive(page);
  assert.equal(
    await page.locator("#stage").getAttribute("data-parts-off"),
    "gate conform attest",
  );
  await flip(page, "router"); // mid-race: nothing changes until the next run
  assert.equal(
    await page.locator("#stage").getAttribute("data-parts-off"),
    "gate conform attest",
  );
  assert.deepEqual((await snap(page)).partsOff, ["gate", "conform", "attest"]);
  await page.locator("#game").click(); // back on the canvas: resume
  for (let i = 0; i < 12 && (await stageState(page)) !== "over"; i++)
    await page.clock.runFor(5000);
  assert.equal(await stageState(page), "over");
  await page.locator("#game").focus();
  await page.keyboard.press("h");
  for (const name of PARTS) await expectChecked(sw(page, name), true);
  assert.equal(await stageState(page), "over", "H does not start a run");
  assert.deepEqual(errors, []);
  await context.close();
});

test("with gate and decisions off, no gate or sign ever spawns", async () => {
  const { page, errors, context } = await open({ clock: true });
  await flip(page, "gate");
  await flip(page, "decisions");
  await drive(page);
  await page.keyboard.down("ArrowUp");
  let s = await snap(page);
  for (let i = 0; i < 40 && s.pos <= 350 && s.state === "race"; i++) {
    await page.clock.runFor(500);
    s = await snap(page);
    assert.equal(s.ents.gate, 0);
    assert.equal(s.ents.sign, 0);
  }
  assert.ok(s.pos > 350, `drove ${s.pos} m`);
  // the loop is still running: one more step moves the car
  const posBefore = s.pos;
  await page.clock.runFor(500);
  assert.ok((await snap(page)).pos > posBefore, "the game loop still advances");
  assert.deepEqual(errors, []);
  await context.close();
});

test("with guardrails off, a trip off the road costs 6 s once, not once per frame", async () => {
  const { page, errors, context } = await open({ clock: true });
  await flip(page, "guardrails");
  await drive(page);
  await page.keyboard.down("ArrowLeft");
  await page.clock.runFor(3000);
  const s = await snap(page);
  assert.ok(s.offroads >= 1 && s.offroads <= 3, `offroads ${s.offroads}`);
  assert.ok(
    Math.abs(s.time - (40 - s.rt - 6 * s.offroads)) < 0.1,
    `time ${s.time}, rt ${s.rt}, offroads ${s.offroads}`,
  );
  assert.deepEqual(errors, []);
  await context.close();
});

test("an off card keeps its description readable (4.5:1)", async () => {
  const { page, context } = await open();
  await flip(page, "gate");
  const ratio = await page.evaluate(() => {
    const card = document.querySelector(".part.off");
    const rgb = (css) => {
      const c = document.createElement("canvas").getContext("2d");
      c.fillStyle = "#000";
      c.fillStyle = css;
      c.fillRect(0, 0, 1, 1);
      return [...c.getImageData(0, 0, 1, 1).data].slice(0, 3);
    };
    const lum = ([r, g, b]) => {
      const f = (v) =>
        (v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const fg = lum(
      rgb(getComputedStyle(card.querySelector(":scope > span")).color),
    );
    const bg = lum(rgb(getComputedStyle(card).backgroundColor));
    return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
  });
  assert.ok(ratio >= 4.5, `contrast ${ratio.toFixed(2)}`);
  await context.close();
});
