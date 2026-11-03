import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// PAGE lets the test run against another copy of the page (e.g. main's) to prove it can fail.
const html = readFileSync(
  process.env.PAGE ?? new URL("../index.html", import.meta.url),
  "utf8",
);
const fixture = JSON.parse(
  readFileSync(new URL("./fixtures/shipped.json", import.meta.url), "utf8"),
);
const shipped = new Set([
  ...fixture.sources.flatMap((s) => [...s.skills, ...s.agents]),
  ...fixture.labels,
]);

function tableChips() {
  const table = html.match(
    /<table>\s*<caption[^>]*>Skills and agents each part ships<\/caption>[\s\S]*?<\/table>/,
  );
  assert.ok(table, "the skills table is found by its caption");
  return [...table[0].matchAll(/<span class="chip">([^<]+)<\/span>/g)].map(
    (m) => m[1],
  );
}

// Reads the road's `var STOPS = [ … ];` block by its layout (closing `  ];` on its own line), and
// each `skills: [...]` / `agents: [...]` list; a label holding `]` would need a real parser.
function stopChips() {
  const stops = html.match(/var STOPS = \[([\s\S]*?)\n {2}\];/);
  assert.ok(stops, "the road data is found");
  const names = [
    ...stops[1].matchAll(/(?:skills|agents): \[([^\]]*)\]/g),
  ].flatMap((m) => [...m[1].matchAll(/"([^"]+)"/g)].map((q) => q[1]));
  assert.ok(names.length > 0, "the road names some skills and agents");
  return names;
}

test("the page explains the design part, the router and how the agents work together", () => {
  for (const id of ["design", "router", "agents"]) {
    assert.ok(html.includes(`<section id="${id}">`), `section #${id}`);
  }
  assert.ok(
    html.includes('href="#agents"'),
    "something on the page links to #agents",
  );
  assert.ok(
    html.includes('href="#router"'),
    "the router card links to #router",
  );
  assert.ok(
    html.includes('href="#design"'),
    "the design card links to #design",
  );
});

test("the page says the agent commits often and pushes a whole feature once", () => {
  const gate = html.match(/<b>gate<\/b><span>([^<]*)<\/span>/);
  assert.ok(gate, "the gate card is found");
  assert.ok(gate[1].includes("pushes a whole feature"), gate[1]);
  const push = html.match(/\{ name: "Push",[\s\S]*?what: "([^"]*)/);
  assert.ok(push, "the Push stop is found");
  assert.ok(push[1].includes("not every commit"), push[1]);
});

test("every skill and agent the table names is one a part ships", () => {
  const missing = tableChips().filter((name) => !shipped.has(name));
  assert.deepEqual(
    missing,
    [],
    `not shipped (${fixture.regenerate} refreshes the list)`,
  );
});

test("every skill and agent the road names is one a part ships", () => {
  const missing = stopChips().filter((name) => !shipped.has(name));
  assert.deepEqual(
    missing,
    [],
    `not shipped (${fixture.regenerate} refreshes the list)`,
  );
});

test("each fixture source records the commit it was read at", () => {
  for (const s of fixture.sources)
    assert.match(s.sha, /^[0-9a-f]{40}$/, `${s.repo} ${s.path}`);
});

test("the six part cards each hold one switch, the design card holds none", () => {
  const region =
    html.match(/<div class="parts">([\s\S]*?)<\/section>/)?.[1] ?? "";
  const cards = region.split('<div class="part').slice(1);
  assert.equal(cards.length, 7, "six parts and the design card");
  const switches = (card) =>
    [...card.matchAll(/<input\b[^>]*>/g)].filter(
      (m) =>
        /type="checkbox"/.test(m[0]) &&
        /role="switch"/.test(m[0]) &&
        /data-part="[a-z]+"/.test(m[0]),
    ).length;
  const byName = Object.fromEntries(
    cards.map((card) => [card.match(/<b>([a-z]+)/)?.[1], switches(card)]),
  );
  for (const name of [
    "guardrails",
    "gate",
    "decisions",
    "router",
    "conform",
    "attest",
  ])
    assert.equal(byName[name], 1, name);
  assert.equal(byName.design, 0);
});
