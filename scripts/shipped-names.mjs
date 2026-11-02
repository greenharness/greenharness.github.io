// Regenerates tests/fixtures/shipped.json: the skill and agent names each part really ships, read
// from the default branch of the three source repositories (never their working trees).
//
//   node scripts/shipped-names.mjs [--skills <dir>] [--relais <dir>] [--duro <dir>]
//
// The directories default to sibling clones of this repository: ../greenharness-skills, ../relais
// and ../duro-design-system. Run `git fetch` in each first; the fixture records the sha it read.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return resolve(root, i > 0 ? process.argv[i + 1] : fallback);
};
const dirs = {
  skills: arg("--skills", "../greenharness-skills"),
  relais: arg("--relais", "../relais"),
  duro: arg("--duro", "../duro-design-system"),
};
const git = (dir, ...args) =>
  execFileSync("git", ["-C", dir, ...args], { encoding: "utf8" });
const ref = "origin/main";
const sha = (dir) => git(dir, "rev-parse", ref).trim();
const tree = (dir, path) =>
  git(dir, "ls-tree", "--name-only", `${ref}:${path}`)
    .split("\n")
    .filter(Boolean);

// greenharness/skills: parts/<part>/skills/<name>/ and parts/<part>/agents/<name>.md
const skillsFiles = git(
  dirs.skills,
  "ls-tree",
  "-r",
  "--name-only",
  ref,
  "parts",
)
  .split("\n")
  .filter(Boolean);
const skillsSkills = [
  ...new Set(
    skillsFiles
      .map((f) => f.match(/^parts\/[^/]+\/skills\/([^/]+)\//)?.[1])
      .filter(Boolean),
  ),
];
const skillsAgents = skillsFiles
  .map((f) => f.match(/^parts\/[^/]+\/agents\/([^/]+)\.md$/)?.[1])
  .filter(Boolean);

// relais: the plugin's skills, and the advisory agents its installer writes (`name:` lines).
const installPath = "crates/relais/src/install/mod.rs";
const installAgents = [
  ...git(dirs.relais, "show", `${ref}:${installPath}`).matchAll(
    /^name: (relais-[a-z-]+)$/gm,
  ),
].map((m) => m[1]);

const sources = [
  {
    repo: "greenharness/skills",
    path: "parts/*/skills, parts/*/agents",
    sha: sha(dirs.skills),
    skills: skillsSkills.sort(),
    agents: skillsAgents.sort(),
  },
  {
    repo: "relais",
    path: "claude-plugin/skills",
    sha: sha(dirs.relais),
    skills: tree(dirs.relais, "claude-plugin/skills").sort(),
    agents: [],
  },
  {
    repo: "relais",
    path: installPath,
    sha: sha(dirs.relais),
    skills: [],
    agents: installAgents.sort(),
  },
  {
    repo: "duro-design-system",
    path: "packages/cli/skills",
    sha: sha(dirs.duro),
    skills: tree(dirs.duro, "packages/cli/skills").sort(),
    agents: [],
  },
];

const fixture = {
  regenerate: "node scripts/shipped-names.mjs",
  // Chips that name a group rather than one shipped file: allowed by their exact text.
  labels: [
    "plan-review panel (9)",
    "code-review profiles (7)",
    "plan-review panel: architect, backend, language, platform, product, UX research…",
    "code-review-*",
  ],
  sources,
};
writeFileSync(
  resolve(root, "tests/fixtures/shipped.json"),
  JSON.stringify(fixture, null, 2) + "\n",
);
console.log(
  sources.map((s) => `${s.repo} ${s.path} @ ${s.sha.slice(0, 8)}`).join("\n"),
);
