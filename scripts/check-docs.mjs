#!/usr/bin/env node
// Docs taxonomy audit / CI backstop. Validates docs/*.md placement + frontmatter
// per docs/README.md.
//
//   node scripts/check-docs.mjs                 # full-repo REPORT (exit 0 always)
//   node scripts/check-docs.mjs <file>...        # validate only these files (exit 1 on violation)
//
// CI wiring (after the legacy migration stamps frontmatter): pass the PR's
// changed files, e.g.  git diff --name-only origin/main... -- 'docs/**/*.md' | xargs node scripts/check-docs.mjs
// This ratchet enforces NEW/changed docs without failing on un-migrated legacy.
import fs from "node:fs";
import path from "node:path";

const REFERENCE = new Set(["domain", "product", "technical", "business", "training"]);
const STAGES = new Set(["pending", "in-progress", "complete", "abandoned"]);

function frontmatter(text) {
  const m = text.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^\s*([A-Za-z_-]+):\s*(.+?)\s*$/);
    if (kv) fm[kv[1]] = kv[2];
  }
  return fm;
}

function violationsFor(file) {
  const norm = file.replace(/\\/g, "/");
  const m = norm.match(/(?:^|\/)docs\/(.+\.md)$/i);
  if (!m) return []; // not a docs/*.md
  const rel = m[1];
  const out = [];
  const base = path.basename(rel).toLowerCase();
  if (base === "readme.md") return []; // index + stage markers exempt

  // Rule 1: not at docs/ root.
  if (!rel.includes("/")) out.push("at docs/ root — move to a category or delivery/<stage>/ folder");

  // Rule 2: frontmatter present with type + status.
  let fm = null;
  try {
    fm = frontmatter(fs.readFileSync(file, "utf8"));
  } catch {
    return out; // unreadable; nothing more to check
  }
  if (!fm) {
    out.push("missing frontmatter (need type + status)");
    return out;
  }
  if (!fm.type) out.push("frontmatter missing `type`");
  if (!fm.status) out.push("frontmatter missing `status`");

  // Rule 3: delivery docs live under delivery/<stage>/ and status matches.
  const topDir = rel.split("/")[0];
  if (topDir === "delivery") {
    const stage = rel.split("/")[1];
    if (!STAGES.has(stage)) out.push(`under delivery/ but '${stage}' is not a valid stage`);
    else if (fm.status && fm.status !== "stable" && fm.status !== stage)
      out.push(`status '${fm.status}' does not match delivery stage '${stage}'`);
  } else if (fm.type === "delivery") {
    out.push("type: delivery but not under delivery/<stage>/");
  } else if (REFERENCE.has(topDir) && fm.type && fm.type !== topDir && !(topDir === "technical")) {
    // soft: a reference doc whose type disagrees with its folder (technical absorbs design/ux)
    out.push(`type '${fm.type}' disagrees with folder '${topDir}/' (reclassify or fix type)`);
  }
  return out;
}

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith(".md")) acc.push(p);
  }
  return acc;
}

const args = process.argv.slice(2);
const ciMode = args.length > 0;
const files = ciMode ? args : walk(path.join(process.cwd(), "docs"));

let total = 0;
for (const f of files) {
  const v = violationsFor(f);
  if (v.length) {
    total += v.length;
    const rel = f.replace(/\\/g, "/").replace(/.*?(docs\/.+)$/, "$1");
    console.log(`✗ ${rel}`);
    for (const msg of v) console.log(`    - ${msg}`);
  }
}

if (total === 0) {
  console.log(ciMode ? "✓ docs check passed" : "✓ no docs taxonomy violations");
  process.exit(0);
}
console.log(`\n${total} violation(s) across ${files.length} file(s).`);
// Report-only on a full scan (legacy not migrated yet); fail only when given explicit files (CI ratchet).
process.exit(ciMode ? 1 : 0);
