import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const T = require("../theme.js");
const theme = JSON.parse(readFileSync(new URL("../theme.json", import.meta.url), "utf8"));

const fresh = (name = "phosphor") => T.presetState(name);
const channels = (hex) => { const c = T.parseHex(hex); return [c.r, c.g, c.b]; };

test("hex parsing accepts 3 and 6 digits, any case, and refuses the rest", () => {
  assert.deepEqual(T.parseHex("#0f8"), { r: 0, g: 255, b: 136 });
  assert.deepEqual(T.parseHex("#39FF7A"), { r: 57, g: 255, b: 122 });
  for (const bad of ["#12", "red", "#12345", "#gggggg", "", null, undefined, 7, "39ff7a"]) assert.equal(T.parseHex(bad), null, String(bad));
});

test("contrast matches the known ratios of Phosphor", () => {
  const r = Object.fromEntries(T.report(T.resolve(fresh()).tokens).map((x) => [x.id, x.ratio]));
  assert.ok(Math.abs(r["text on bg"] - 16.33) < 0.05);
  assert.ok(Math.abs(r["subtle text on card"] - 4.69) < 0.05);
  assert.ok(Math.abs(r["accent on bg"] - 15.17) < 0.05);
});

test("the tokens are exactly the 27 colours of theme.json", () => {
  assert.deepEqual([...T.TOKENS].sort(), Object.keys(theme.colors).sort());
  assert.equal(T.TOKENS.length, 27);
});

test("Phosphor with no edits is theme.json, byte for byte", () => {
  assert.deepEqual(T.resolve(fresh()).tokens, theme.colors);
});

test("derive(Phosphor core) stays within 16/255 per channel of theme.json", () => {
  const p = T.PRESETS.phosphor, d = T.derive(p.core, p.extra);
  for (const k of T.TOKENS) {
    const want = channels(theme.colors[k]), got = channels(d[k]);
    for (let i = 0; i < 3; i++) assert.ok(Math.abs(want[i] - got[i]) <= 16, `${k} channel ${i}: ${d[k]} vs ${theme.colors[k]}`);
  }
});

test("every shipped preset passes the contrast bars on the pairs the guard names", () => {
  for (const name of T.PRESET_ORDER) {
    const rows = T.report(T.resolve(fresh(name)).tokens);
    for (const row of rows) assert.ok(row.ok, `${name}: ${row.id} ${row.ratio.toFixed(2)} < ${row.bar}`);
  }
});

test("no preset ships flagged: accent and danger stay 150 RGB apart", () => {
  for (const name of T.PRESET_ORDER) assert.deepEqual(T.warnings(T.resolve(fresh(name)).tokens), [], name);
});

test("a preset's accent keeps 15 degrees of OKLCH hue from warning and info (not Mono: no hue)", () => {
  for (const name of T.PRESET_ORDER) {
    if (name === "mono") { assert.ok(T.chroma(T.PRESETS.mono.core.accent) < 0.04, "mono accent has no hue"); continue; }
    const t = T.resolve(fresh(name)).tokens;
    assert.ok(T.hueGap(t.accent, t.warning) >= 15, `${name} accent vs warning ${T.hueGap(t.accent, t.warning).toFixed(1)}`);
    assert.ok(T.hueGap(t.accent, t.info) >= 15, `${name} accent vs info ${T.hueGap(t.accent, t.info).toFixed(1)}`);
  }
});

test("every game colour maps to a named token, and bug, slop and boost differ from the accent", () => {
  for (const name of T.PRESET_ORDER) {
    const r = T.resolve(fresh(name));
    for (const k of T.GAME_COLORS) assert.match(r.game[k], /^#[0-9a-f]{6}$/, `${name}.${k}`);
    for (const k of ["bug", "slop", "boost"]) assert.ok(T.rgbDistance(r.game[k], r.tokens.accent) > 80, `${name}.${k} too close to the accent`);
    assert.equal(r.tint.green.length, 3);
    assert.equal(r.tint.red.length, 3);
  }
});

test("Phosphor carries today's game colours and tint endpoints, so Reset is exact", () => {
  const r = T.resolve(fresh());
  assert.deepEqual(r.tint, { green: [40, 255, 110], red: [255, 60, 70] });
  assert.deepEqual(r.game, { car: "#dcffe6", tail: "#ff3b3b", white: "#eafff0", glitch: "#ff4dff", slop: "#ffb020", slopShade: "#a8721a", bug: "#ff4d4d", boost: "#7ff7ff", brake: "#ff8080", hud: "#5d6b62" });
});

test("export has the 27 keys plus the derived active* keys, and passes typography and radii through", () => {
  const out = T.exportTheme(fresh(), theme);
  assert.deepEqual(Object.keys(out.colors), [...T.TOKENS, ...T.ACTIVE]);
  for (const k of T.TOKENS) assert.equal(out.colors[k], theme.colors[k], k);
  assert.equal(out.colors.active, theme.colors.accent);
  assert.deepEqual(out.typography, theme.typography);
  assert.deepEqual(out.radii, theme.radii);
  assert.deepEqual(T.BASE, { typography: theme.typography, radii: theme.radii }); // the built-in copy tracks theme.json
  assert.deepEqual(T.exportTheme(fresh()), out);
});

test("an Advanced override, then a core edit, then a reload, then an export: the override is unchanged", () => {
  let s = T.setToken(fresh("amber"), "textMuted", "#123456");
  s = T.setCore(s, "accent", "#ff8800");
  assert.equal(s.overrides.textMuted, "#123456");
  const reloaded = T.validateState(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(reloaded, s);
  const out = T.exportTheme(reloaded, theme);
  assert.equal(out.colors.textMuted, "#123456");
  assert.equal(out.colors.accent, "#ff8800");
  assert.deepEqual(JSON.parse(JSON.stringify(out)), out); // JSON round trip, no re-derivation
});

test("an Advanced edit to a core token updates the core input, not an override", () => {
  const s = T.setToken(fresh(), "accent", "#ff0088");
  assert.equal(s.core.accent, "#ff0088");
  assert.equal(s.overrides.accent, undefined);
  const e = T.setToken(fresh(), "error", "#ee2222");
  assert.equal(e.core.danger, "#ee2222");
});

test("a preset or Reset clears the overrides, and the last custom state comes back", () => {
  let s = T.setToken(fresh(), "textMuted", "#123456");
  assert.equal(T.isCustom(s), true);
  const p = T.selectPreset(s, "cyan");
  assert.deepEqual(p.overrides, {});
  assert.equal(p.preset, "cyan");
  assert.equal(T.isCustom(p), false);
  assert.equal(p.lastCustom.overrides.textMuted, "#123456");
  const back = T.restoreCustom(p);
  assert.equal(back.overrides.textMuted, "#123456");
  assert.equal(T.reset(s).preset, "phosphor");
  assert.deepEqual(T.reset(s).overrides, {});
});

test("malformed or unsupported stored state is refused, never half-applied", () => {
  const good = fresh();
  assert.ok(T.validateState(JSON.parse(JSON.stringify(good))));
  const bad = [
    null, "x", 7, [], {}, { v: 2 }, { ...good, v: 2 }, { ...good, preset: "neon" },
    { ...good, core: { ...good.core, accent: "red" } }, { ...good, core: { accent: "#39ff7a" } },
    { ...good, core: { ...good.core, extra: "#000000" } },
    { ...good, overrides: { nope: "#000000" } }, { ...good, overrides: { text: "#zzz" } },
    { ...good, overrides: { accent: "#000000" } }, // a core token is never an override
    { ...good, core: { ...good.core, bg: "#ffffff" } }, // light background
    { ...good, lastCustom: { preset: "x", core: good.core, overrides: {} } }
  ];
  for (const b of bad) assert.equal(T.validateState(b), null, JSON.stringify(b));
});

test("a light background is refused", () => {
  assert.equal(T.darkOnly("#ffffff"), false);
  assert.equal(T.darkOnly("#e0e0e0"), false);
  assert.equal(T.darkOnly("#020803"), true);
  assert.equal(T.darkOnly("not a colour"), false);
});

test("visitor input may fall below the bars, and the guard says which row", () => {
  const s = T.setCore(fresh(), "text", "#3a3a3a");
  const rows = T.report(T.resolve(s).tokens);
  assert.ok(rows.some((r) => !r.ok && r.id === "text on bg"));
  const close = T.setCore(fresh(), "danger", "#3fff7f");
  assert.equal(T.warnings(T.resolve(close).tokens).length, 1);
});

test("the CSS variables carry the --duro-color-* names, with active* derived from the accent", () => {
  const vars = T.cssVars(T.resolve(fresh()));
  assert.equal(vars["--duro-color-bg-card"], theme.colors.bgCard);
  assert.equal(vars["--duro-color-accent-contrast"], theme.colors.accentContrast);
  assert.equal(vars["--duro-color-active"], theme.colors.accent);
  assert.equal(vars["--gh-head"], "#e6ffec");
  assert.equal(Object.keys(vars).length, 31 + T.PAGE_KEYS.length);
});

test("the page-only colours derive within 16/255 of Phosphor's exact ones, and Phosphor ships them exactly", () => {
  const r = T.resolve(fresh()), d = T.derivePage(r.tokens, r.game);
  for (const k of T.PAGE_KEYS) {
    const want = channels(r.page[k]), got = channels(d[k]);
    for (let i = 0; i < 3; i++) assert.ok(Math.abs(want[i] - got[i]) <= 16, `page.${k} channel ${i}: ${d[k]} vs ${r.page[k]}`);
  }
  assert.deepEqual(r.page, { head: "#e6ffec", cmdBg: "#03140a", partOpt: "#030d07", g1: "#39ff7a", g2: "#1d8f45", g3: "#b9f5c8", r1: "#ff3030", r2: "#8f1d1d", r3: "#ffb3b3", white: "#eafff0", slop: "#ffb020" });
});

test("index.html carries no colour literal: every colour comes from theme.js", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.deepEqual(html.match(/#[0-9a-fA-F]{3,8}\b/g) || [], [], "hex literals in index.html");
  assert.deepEqual((html.match(/rgba?\(/g) || []).length, 1, "only the tc() string builder may build an rgb() colour");
  assert.match(html, /<script src="theme\.js"><\/script>/);
});

test("a custom accent moves the page colours; the traffic-light lamps never move", () => {
  const r = T.resolve(T.setCore(fresh(), "accent", "#ff8800"));
  assert.equal(r.page.g1, "#ff8800");
  assert.notEqual(r.page.g2, "#1d8f45");
  assert.deepEqual(T.LAMP, { green: "#39ff7a", red: "#ff3030", off: "#3a1414" });
});
