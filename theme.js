/* Green Harness theme: the 27 colour tokens, four core colours that derive the rest,
 * presets, the contrast guard, persisted state and export. A classic UMD script:
 * loaded in <head> it applies the stored theme before first paint; under node it is
 * a plain module (tests/theme.test.mjs). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(root);
  else root.ghTheme = factory(root);
})(typeof self !== "undefined" ? self : this, function (root) {
  "use strict";

  /* ---------- colour maths ---------- */
  function parseHex(s) {
    if (typeof s !== "string") return null;
    var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s.trim());
    if (!m) return null;
    var h = m[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }
  function toHex(c) {
    function p(n) { n = Math.max(0, Math.min(255, Math.round(n))); return (n < 16 ? "0" : "") + n.toString(16); }
    return "#" + p(c.r) + p(c.g) + p(c.b);
  }
  function norm(hex) { var c = parseHex(hex); return c ? toHex(c) : null; }
  function mix(a, b, t) { // a toward b by t (0..1), in sRGB
    var x = parseHex(a), y = parseHex(b);
    return toHex({ r: x.r + (y.r - x.r) * t, g: x.g + (y.g - x.g) * t, b: x.b + (y.b - x.b) * t });
  }
  function lin(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function luminance(hex) { var c = parseHex(hex); return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b); }
  function contrast(a, b) {
    var x = luminance(a), y = luminance(b), hi = Math.max(x, y), lo = Math.min(x, y);
    return (hi + 0.05) / (lo + 0.05);
  }
  function rgbDistance(a, b) {
    var x = parseHex(a), y = parseHex(b);
    return Math.sqrt(Math.pow(x.r - y.r, 2) + Math.pow(x.g - y.g, 2) + Math.pow(x.b - y.b, 2));
  }
  function oklab(hex) {
    var c = parseHex(hex), r = lin(c.r), g = lin(c.g), b = lin(c.b);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return {
      L: 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
      a: 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
      b: 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    };
  }
  function chroma(hex) { var o = oklab(hex); return Math.sqrt(o.a * o.a + o.b * o.b); }
  function hue(hex) { var o = oklab(hex), h = Math.atan2(o.b, o.a) * 180 / Math.PI; return h < 0 ? h + 360 : h; }
  function hueGap(a, b) { var d = Math.abs(hue(a) - hue(b)) % 360; return d > 180 ? 360 - d : d; }
  function oklabDistance(a, b) {
    var x = oklab(a), y = oklab(b);
    return Math.sqrt(Math.pow(x.L - y.L, 2) + Math.pow(x.a - y.a, 2) + Math.pow(x.b - y.b, 2));
  }

  /* ---------- the tokens ---------- */
  var TOKENS = [
    "bg", "bgCard", "bgCardHover", "bgElevated", "bgInset", "bgSectionTint",
    "text", "textMuted", "textSubtle", "border", "borderSubtle", "borderStrong",
    "accent", "accentHover", "accentContrast",
    "success", "successText", "successBorder", "successBg",
    "warning", "warningText", "warningBorder", "warningBg",
    "error", "errorText", "info", "infoText"
  ];
  var ACTIVE = ["active", "activeBg", "activeBorder", "activeText"]; // not in theme.json: derived from the accent
  var CORE = { accent: "accent", bg: "bg", text: "text", danger: "error" }; // core input -> token
  var CORE_KEYS = ["accent", "bg", "text", "danger"];
  var GAME_COLORS = ["car", "tail", "white", "glitch", "slop", "slopShade", "bug", "boost", "brake", "hud"];
  var BLACK = "#000000", WHITE = "#ffffff";

  /* The rules that derive the other tokens from the core four plus the preset's warning and info.
   * The percentages are pinned by tests/theme.test.mjs: derive(Phosphor core) must stay within
   * 16/255 per channel of theme.json. */
  function derive(core, extra) {
    var B = core.bg, A = core.accent, T = core.text, D = core.danger, W = extra.warning, I = extra.info;
    return {
      bg: B,
      bgCard: mix(B, A, 0.04),
      bgCardHover: mix(B, A, 0.07),
      bgElevated: mix(B, A, 0.055),
      bgInset: BLACK,
      bgSectionTint: mix(B, A, 0.04),
      text: T,
      textMuted: mix(T, B, 0.26),
      textSubtle: mix(T, B, 0.5),
      border: mix(B, A, 0.14),
      borderSubtle: mix(B, A, 0.14),
      borderStrong: mix(B, T, 0.26),
      accent: A,
      accentHover: mix(A, WHITE, 0.3),
      accentContrast: contrast(BLACK, A) >= contrast(WHITE, A) ? BLACK : WHITE,
      success: A,
      successText: T,
      successBorder: mix(B, A, 0.4),
      successBg: mix(B, A, 0.08),
      warning: W,
      warningText: W,
      warningBorder: mix(B, W, 0.28),
      warningBg: mix(B, W, 0.07),
      error: D,
      errorText: mix(D, WHITE, 0.29),
      info: I,
      infoText: I
    };
  }
  function deriveActive(tokens) {
    return {
      active: tokens.accent,
      activeBg: mix(tokens.bg, tokens.accent, 0.1),
      activeBorder: mix(tokens.bg, tokens.accent, 0.3),
      activeText: tokens.accentHover
    };
  }
  function deriveGame(tokens) {
    return {
      car: mix(tokens.text, WHITE, 0.45),
      tail: mix(tokens.error, BLACK, 0.08),
      white: mix(tokens.text, WHITE, 0.55),
      glitch: mix(tokens.error, tokens.info, 0.5),
      slop: tokens.warning,
      slopShade: mix(tokens.warning, BLACK, 0.35),
      bug: tokens.error,
      boost: tokens.info,
      brake: tokens.errorText,
      hud: tokens.textSubtle
    };
  }

  function derivePage(tokens, game) {
    return {
      head: mix(tokens.text, WHITE, 0.55),
      cmdBg: mix(tokens.bg, tokens.accent, 0.05),
      partOpt: mix(tokens.bg, tokens.accent, 0.02),
      g1: tokens.accent,
      g2: mix(tokens.accent, tokens.bg, 0.42),
      g3: tokens.text,
      r1: mix(tokens.error, "#ff0000", 0.35),
      r2: mix(tokens.error, BLACK, 0.45),
      r3: mix(tokens.error, WHITE, 0.57),
      white: game.white,
      slop: game.slop
    };
  }

  /* ---------- presets ---------- */
  /* Phosphor is today's site, exactly: the 27 values of theme.json, the game colours and the two
   * tint endpoints of the game's green and red worlds. The others are a core four plus warning and
   * info, and derive everything else. */
  var PHOSPHOR_TOKENS = {
    bg: "#020803", bgCard: "#03120a", bgCardHover: "#06180d", bgElevated: "#06150c", bgInset: "#000000",
    bgSectionTint: "#03120a", text: "#b9f5c8", textMuted: "#7fbf92", textSubtle: "#4f8a5e",
    border: "#0f2a17", borderSubtle: "#0f2a17", borderStrong: "#2c5238",
    accent: "#39ff7a", accentHover: "#7dffa6", accentContrast: "#000000",
    success: "#39ff7a", successText: "#b9f5c8", successBorder: "#1d6b3a", successBg: "#06200f",
    warning: "#ffd27f", warningText: "#ffd27f", warningBorder: "#4a3d1c", warningBg: "#1a1406",
    error: "#ff4d4d", errorText: "#ff8080", info: "#7ff7ff", infoText: "#7ff7ff"
  };
  var PHOSPHOR_GAME = {
    car: "#dcffe6", tail: "#ff3b3b", white: "#eafff0", glitch: "#ff4dff", slop: "#ffb020", slopShade: "#a8721a",
    bug: "#ff4d4d", boost: "#7ff7ff", brake: "#ff8080", hud: "#5d6b62"
  };
  var PHOSPHOR_TINT = { green: [40, 255, 110], red: [255, 60, 70] };
  /* Colours only the page uses, each with a rule; Phosphor keeps today's exact value. */
  var PHOSPHOR_PAGE = {
    head: "#e6ffec", cmdBg: "#03140a", partOpt: "#030d07", g1: "#39ff7a", g2: "#1d8f45", g3: "#b9f5c8",
    r1: "#ff3030", r2: "#8f1d1d", r3: "#ffb3b3", white: "#eafff0", slop: "#ffb020"
  };
  var PAGE_KEYS = ["head", "cmdBg", "partOpt", "g1", "g2", "g3", "r1", "r2", "r3", "white", "slop"];
  /* The traffic-light lamps and the GREEN message never follow the theme: red and green keep their meaning. */
  var LAMP = { green: "#39ff7a", red: "#ff3030", off: "#3a1414" };

  var PRESETS = {
    phosphor: {
      label: "Phosphor", exact: PHOSPHOR_TOKENS, game: PHOSPHOR_GAME, tint: PHOSPHOR_TINT,
      core: { accent: "#39ff7a", bg: "#020803", text: "#b9f5c8", danger: "#ff4d4d" },
      extra: { warning: "#ffd27f", info: "#7ff7ff" }
    },
    amber: {
      label: "Amber",
      core: { accent: "#ff9f1a", bg: "#0a0600", text: "#fff1d4", danger: "#ff2a7f" },
      extra: { warning: "#ffe566", info: "#7ff7ff" }
    },
    cyan: {
      label: "Cyan",
      core: { accent: "#3ee8ff", bg: "#02080a", text: "#e0fafd", danger: "#ff5c6c" },
      extra: { warning: "#ffd27f", info: "#b79cff" }
    },
    mono: {
      label: "Mono",
      core: { accent: "#e8e8e8", bg: "#070707", text: "#f5f5f5", danger: "#ff5555" },
      extra: { warning: "#ffd27f", info: "#7ff7ff" }
    }
  };
  var PRESET_ORDER = ["phosphor", "amber", "cyan", "mono"];

  function copy(o) { var r = {}; for (var k in o) r[k] = o[k]; return r; }

  /* ---------- state ---------- */
  /* state = { v: 1, preset, core, overrides, lastCustom }
   * The preset supplies warning and info and the starting core; the core derives 23 tokens; the
   * overrides come last and win. Phosphor with no edits is theme.json exactly. */
  function presetState(name) {
    var p = PRESETS[name] || PRESETS.phosphor;
    return { v: 1, preset: PRESETS[name] ? name : "phosphor", core: copy(p.core), overrides: {}, lastCustom: null };
  }
  function isCustom(state) {
    var p = PRESETS[state.preset];
    if (!p) return true;
    for (var i = 0; i < CORE_KEYS.length; i++) if (state.core[CORE_KEYS[i]] !== p.core[CORE_KEYS[i]]) return true;
    return Object.keys(state.overrides).length > 0;
  }
  function coreIsPreset(state, p) {
    for (var i = 0; i < CORE_KEYS.length; i++) if (state.core[CORE_KEYS[i]] !== p.core[CORE_KEYS[i]]) return false;
    return true;
  }
  /* Preset values first (exact for Phosphor while its core is untouched), the core derivation for a
   * changed core, then the overrides on top: one Advanced edit never re-derives the other tokens. */
  function resolve(state) {
    var p = PRESETS[state.preset] || PRESETS.phosphor;
    var exact = coreIsPreset(state, p) && p.exact;
    var tokens = exact ? copy(p.exact) : derive(state.core, p.extra);
    var base = copy(tokens);
    Object.keys(state.overrides).forEach(function (k) { tokens[k] = state.overrides[k]; });
    var same = function (keys) { return keys.every(function (k) { return tokens[k] === base[k]; }); };
    var game = exact && p.game && same(["text", "error", "errorText", "warning", "info", "textSubtle"]) ? copy(p.game) : deriveGame(tokens);
    var tint = exact && p.tint && same(["accent", "error"]) ? { green: p.tint.green.slice(), red: p.tint.red.slice() } : {
      green: [parseHex(tokens.accent).r, parseHex(tokens.accent).g, parseHex(tokens.accent).b],
      red: [parseHex(tokens.error).r, parseHex(tokens.error).g, parseHex(tokens.error).b]
    };
    var page = exact && same(["text", "bg", "accent", "error", "warning"]) ? copy(PHOSPHOR_PAGE) : derivePage(tokens, game);
    return { tokens: tokens, active: deriveActive(tokens), game: game, tint: tint, page: page, custom: isCustom(state) };
  }
  function setCore(state, key, hex) {
    var n = norm(hex), s = clone(state);
    if (!n || CORE_KEYS.indexOf(key) < 0) return s;
    s.core[key] = n;
    delete s.overrides[CORE[key]];
    return s;
  }
  function setToken(state, token, hex) { // an Advanced edit: a core token updates its core input
    var n = norm(hex), s = clone(state);
    if (!n || TOKENS.indexOf(token) < 0) return s;
    for (var i = 0; i < CORE_KEYS.length; i++) if (CORE[CORE_KEYS[i]] === token) return setCore(s, CORE_KEYS[i], n);
    s.overrides[token] = n;
    return s;
  }
  function selectPreset(state, name) { // keeps the last custom state so a preset click never wipes it
    var s = presetState(name);
    s.lastCustom = isCustom(state) ? { preset: state.preset, core: copy(state.core), overrides: copy(state.overrides) } : state.lastCustom;
    return s;
  }
  function restoreCustom(state) {
    if (!state.lastCustom) return state;
    var s = clone(state), c = state.lastCustom;
    s.preset = c.preset; s.core = copy(c.core); s.overrides = copy(c.overrides);
    s.lastCustom = null;
    return s;
  }
  function reset(state) { var s = presetState("phosphor"); s.lastCustom = state.lastCustom; return s; }
  function clone(state) {
    return { v: 1, preset: state.preset, core: copy(state.core), overrides: copy(state.overrides),
      lastCustom: state.lastCustom ? { preset: state.lastCustom.preset, core: copy(state.lastCustom.core), overrides: copy(state.lastCustom.overrides) } : null };
  }

  /* Persisted state is data from outside: validate its shape, its keys and its colours; anything
   * unsupported falls back to Phosphor. */
  function validColors(obj, keys) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;
    var out = {};
    for (var k in obj) {
      if (keys.indexOf(k) < 0) return null;
      var n = norm(obj[k]);
      if (!n) return null;
      out[k] = n;
    }
    return out;
  }
  function validateState(raw) {
    try {
      if (!raw || typeof raw !== "object" || raw.v !== 1 || !PRESETS[raw.preset]) return null;
      var core = validColors(raw.core, CORE_KEYS);
      if (!core || Object.keys(core).length !== CORE_KEYS.length) return null;
      var overrides = validColors(raw.overrides || {}, TOKENS);
      if (!overrides) return null;
      for (var i = 0; i < CORE_KEYS.length; i++) if (overrides[CORE[CORE_KEYS[i]]]) return null;
      var last = null;
      if (raw.lastCustom) {
        var lc = raw.lastCustom, lcCore = validColors(lc.core, CORE_KEYS), lcOv = validColors(lc.overrides || {}, TOKENS);
        if (!PRESETS[lc.preset] || !lcCore || Object.keys(lcCore).length !== CORE_KEYS.length || !lcOv) return null;
        last = { preset: lc.preset, core: lcCore, overrides: lcOv };
      }
      if (parseHex(core.bg) && luminance(core.bg) > 0.15) return null;
      return { v: 1, preset: raw.preset, core: core, overrides: overrides, lastCustom: last };
    } catch (e) { return null; }
  }

  /* ---------- the guard ---------- */
  var BARS = [ // [id, foreground token, background token, bar]
    ["text on bg", "text", "bg", 4.5], ["text on card", "text", "bgCard", 4.5],
    ["muted text on bg", "textMuted", "bg", 4.5], ["muted text on card", "textMuted", "bgCard", 4.5],
    ["subtle text on bg", "textSubtle", "bg", 4.5], ["subtle text on card", "textSubtle", "bgCard", 4.5],
    ["contrast text on accent", "accentContrast", "accent", 4.5],
    ["accent on bg", "accent", "bg", 4.5], ["danger on bg", "error", "bg", 4.5],
    ["warning on bg", "warning", "bg", 4.5], ["info on bg", "info", "bg", 3]
  ];
  function report(tokens) {
    return BARS.map(function (b) {
      var ratio = contrast(tokens[b[1]], tokens[b[2]]);
      return { id: b[0], fg: b[1], bg: b[2], bar: b[3], ratio: ratio, ok: ratio >= b[3] };
    });
  }
  function warnings(tokens) {
    var w = [];
    if (rgbDistance(tokens.accent, tokens.error) < 150) w.push("Accent and danger look too alike: pick a danger colour further from the accent");
    return w;
  }
  function darkOnly(bg) { var n = norm(bg); return !!n && luminance(n) <= 0.15; }

  /* ---------- export ---------- */
  /* The non-colour tokens of theme.json: exported with the colours so the file drops in as is. */
  var BASE = {
    typography: { fontFamily: "'JetBrains Mono', ui-monospace, Menlo, monospace", fontFamilyMono: "'JetBrains Mono', ui-monospace, Menlo, monospace" },
    radii: { xs: "2px", sm: "4px", md: "6px", lg: "8px" }
  };
  function exportTheme(state, base) {
    base = base || BASE;
    var r = resolve(state), colors = {};
    TOKENS.forEach(function (k) { colors[k] = r.tokens[k]; });
    ACTIVE.forEach(function (k) { colors[k] = r.active[k]; });
    var out = { colors: colors };
    if (base && base.typography) out.typography = base.typography;
    if (base && base.radii) out.radii = base.radii;
    return out;
  }

  /* ---------- the browser side ---------- */
  var STORAGE_KEY = "gh-theme";
  var listeners = [], current = presetState("phosphor"), holding = false;
  function kebab(k) { return k.replace(/[A-Z]/g, function (c) { return "-" + c.toLowerCase(); }); }
  function cssVars(r) {
    var vars = {};
    TOKENS.forEach(function (k) { vars["--duro-color-" + kebab(k)] = r.tokens[k]; });
    ACTIVE.forEach(function (k) { vars["--duro-color-" + kebab(k)] = r.active[k]; });
    PAGE_KEYS.forEach(function (k) { vars["--gh-" + kebab(k)] = r.page[k]; });
    return vars;
  }
  function load() {
    try { return validateState(JSON.parse(root.localStorage.getItem(STORAGE_KEY))); } catch (e) { return null; }
  }
  function save(state) { try { root.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* storage is optional */ } }
  function paint() {
    if (!root.document) return;
    var vars = cssVars(resolve(current)), style = root.document.documentElement.style;
    Object.keys(vars).forEach(function (k) { style.setProperty(k, vars[k]); });
  }
  function set(state, opts) {
    current = state;
    paint();
    if (!opts || opts.save !== false) save(state);
    listeners.slice().forEach(function (fn) { try { fn(resolve(current)); } catch (e) { /* a listener must not break the theme */ } });
  }
  function get() { return current; }
  function onChange(fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (f) { return f !== fn; }); }; }
  // Holding only changes how the game reads its tint, which it does every frame: nothing to notify,
  // so a focus move inside the picker never rebuilds the road.
  function hold(on) { holding = !!on; }
  function isHolding() { return holding; }
  function current_() { return resolve(current); }

  var api = {
    TOKENS: TOKENS, ACTIVE: ACTIVE, CORE: CORE, CORE_KEYS: CORE_KEYS, GAME_COLORS: GAME_COLORS, PRESETS: PRESETS,
    PAGE_KEYS: PAGE_KEYS, LAMP: LAMP, BASE: BASE, derivePage: derivePage,
    PRESET_ORDER: PRESET_ORDER, BARS: BARS,
    parseHex: parseHex, toHex: toHex, norm: norm, mix: mix, luminance: luminance, contrast: contrast,
    rgbDistance: rgbDistance, oklabDistance: oklabDistance, hue: hue, hueGap: hueGap, chroma: chroma,
    derive: derive, deriveActive: deriveActive, deriveGame: deriveGame,
    presetState: presetState, isCustom: isCustom, resolve: resolve, setCore: setCore, setToken: setToken,
    selectPreset: selectPreset, restoreCustom: restoreCustom, reset: reset, validateState: validateState,
    report: report, warnings: warnings, darkOnly: darkOnly, exportTheme: exportTheme, cssVars: cssVars,
    load: load, save: save, set: set, get: get, onChange: onChange, hold: hold, isHolding: isHolding, current: current_
  };

  // Before first paint: apply the stored theme, or Phosphor. The page reads only these variables,
  // so they are always set, even with nothing stored.
  if (root.document) {
    var stored = load(); // load() catches: reading localStorage itself throws when site data is blocked
    if (stored) current = stored;
    paint();
  }
  return api;
});
