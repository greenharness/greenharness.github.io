// Balance check for the part switches (docs/plans/2026-11-02-part-toggles.md, Verification
// "balance"): each configuration drives the same seeds, and the bot acts only on what
// ghGameSnapshot().visible says a player can see (fog respected). Not part of `pnpm test`.
//
//   node scripts/balance.mjs <page url> [seeds=20] ['[[],["gate"]]']
//
// It prints one line per configuration, then every run as JSON.
import { chromium } from "playwright";
const BASE = process.argv[2];
const SEEDS = Number(process.argv[3] || 20);
const CONFIGS = process.argv[4]
  ? JSON.parse(process.argv[4])
  : [
      [],
      ["guardrails"],
      ["gate"],
      ["decisions"],
      ["router"],
      ["conform"],
      ["attest"],
    ];
const isConfigs = (c) =>
  Array.isArray(c) &&
  c.every((o) => Array.isArray(o) && o.every((p) => typeof p === "string"));
if (!BASE || !Number.isInteger(SEEDS) || SEEDS < 1 || !isConfigs(CONFIGS)) {
  console.error(
    "usage: node scripts/balance.mjs <page url> [seeds=20] ['[[],[\"gate\"]]']",
  );
  process.exit(2);
}
const CAP = 150_000,
  STEP = 100;

async function run(browser, off, seed) {
  const ctx = await browser.newContext({
    viewport: { width: 1100, height: 900 },
  });
  await ctx.addInitScript(
    (o) => localStorage.setItem("gh-parts", JSON.stringify(o)),
    off,
  );
  const page = await ctx.newPage();
  await page.clock.install({ time: 0 });
  await page.goto(BASE);
  await page.evaluate(() => document.fonts.ready);
  await page.clock.runFor(100);
  await page.evaluate((s) => window.ghGameSeed(s), seed);
  await page.focus("#game");
  await page.keyboard.press("Enter");
  await page.keyboard.down("ArrowUp");
  await page.clock.runFor(2600);
  let held = null,
    t = 2700,
    s;
  while (t < CAP) {
    s = await page.evaluate(() => window.ghGameSnapshot());
    if (s.state === "over") break;
    // pick the lane whose visible threats are farthest; prefer boosts, stay off the edges
    let best = 0,
      bestCost = Infinity;
    for (const lane of [-0.6, -0.3, 0, 0.3, 0.6]) {
      let cost = Math.abs(lane) * 0.3 + Math.abs(lane - s.x) * 0.2;
      for (const v of s.visible) {
        if (v.d > 80 || Math.abs(v.x - lane) > 0.3) continue;
        if (v.type === "bug" || v.type === "slop") cost += 40 / v.d;
        if (v.type === "boost") cost -= 10 / v.d;
      }
      if (cost < bestCost) {
        bestCost = cost;
        best = lane;
      }
    }
    const want =
      best > s.x + 0.06 ? "ArrowRight" : best < s.x - 0.06 ? "ArrowLeft" : null;
    if (want !== held) {
      if (held) await page.keyboard.up(held);
      if (want) await page.keyboard.down(want);
      held = want;
    }
    await page.clock.runFor(STEP);
    t += STEP;
  }
  s = await page.evaluate(() => window.ghGameSnapshot());
  await ctx.close();
  return { km: s.pos / 1000, capped: s.state !== "over", offroads: s.offroads };
}

const browser = await chromium.launch();
const out = {};
for (const off of CONFIGS) {
  const key = off.join("+") || "all-on";
  out[key] = [];
  for (let i = 0; i < SEEDS; i++)
    out[key].push(await run(browser, off, 1000 + i));
  const mean = out[key].reduce((a, r) => a + r.km, 0) / SEEDS;
  console.log(
    key,
    "mean km",
    mean.toFixed(2),
    "capped",
    out[key].filter((r) => r.capped).length,
  );
}
await browser.close();
console.log(JSON.stringify(out));
