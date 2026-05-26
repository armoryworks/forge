#!/usr/bin/env node
// PreToolUse hook — blocks a NEW, misplaced, or frontmatter-less docs/*.md at
// authoring time. Reads the Claude Code hook payload (tool_input) from stdin.
// Exit 0 = allow; exit 2 = block (stderr is shown to the agent to self-correct).
//
// Scoped to docs/*.md only, so it never interferes with writes elsewhere
// (e.g. the analysis/ journey outputs). Edits/overwrites of EXISTING files are
// always allowed — only brand-new files are gated. See docs/README.md.
import fs from "node:fs";

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (d) => (raw += d));
process.stdin.on("end", () => {
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    process.exit(0); // can't parse → don't block
  }
  const ti = payload.tool_input ?? payload.toolInput ?? {};
  const fp = ti.file_path ?? ti.filePath;
  if (typeof fp !== "string") process.exit(0);

  const norm = fp.replace(/\\/g, "/");
  const m = norm.match(/(?:^|\/)docs\/(.+\.md)$/i);
  if (!m) process.exit(0); // not a docs/*.md → out of scope

  const rel = m[1]; // path under docs/
  if (fs.existsSync(fp)) process.exit(0); // editing/overwriting existing → allow
  if (/(^|\/)README\.md$/i.test(rel)) process.exit(0); // index + stage markers

  // Rule 1: no new .md directly at docs/ root.
  if (!rel.includes("/")) {
    return block(
      `Blocked: new doc at docs/ root is not allowed → docs/${rel}\n` +
        `Place it in a category folder (domain/ product/ technical/ business/ training/)\n` +
        `or under delivery/<stage>/. If unsure, use docs/delivery/in-progress/. See docs/README.md §5.`
    );
  }

  // Rule 2: required frontmatter (type + status) on new docs.
  const content = typeof ti.content === "string" ? ti.content : "";
  const fm = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fm || !/^\s*type:\s*\S/m.test(fm[1]) || !/^\s*status:\s*\S/m.test(fm[1])) {
    return block(
      `Blocked: new doc docs/${rel} is missing required frontmatter.\n` +
        `Start the file with:\n---\ntitle: ...\ntype: domain|product|technical|business|training|delivery\nstatus: stable|pending|in-progress|complete|abandoned\nid: kebab-slug\n---\nSee docs/README.md §4.`
    );
  }

  process.exit(0);

  function block(msg) {
    process.stderr.write(msg + "\n");
    process.exit(2);
  }
});
