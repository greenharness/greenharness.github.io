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

function stopChips() {
  const stops = html.match(/var STOPS = \[([\s\S]*?)\n {2}\];/);
  assert.ok(stops, "the road data is found");
  return [...stops[1].matchAll(/(?:skills|agents): \[([^\]]*)\]/g)].flatMap(
    (m) => [...m[1].matchAll(/"([^"]+)"/g)].map((q) => q[1]),
  );
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
