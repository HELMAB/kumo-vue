/**
 * Minimal prompts over `node:readline`. The CLI has no dependencies, so that
 * `npx kumo-vue@latest add button` is a single small download.
 *
 * Every prompt falls back to its default when stdin is not a TTY, which is
 * what makes the CLI usable in CI without a `--yes` flag on every call.
 */

import { createInterface } from "node:readline/promises";
import { bold, dim } from "./log.js";

const interactive = () => Boolean(process.stdin.isTTY && process.stdout.isTTY);

export async function ask(question, fallback) {
  if (!interactive()) return fallback;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(`  ${bold(question)} ${dim(`(${fallback})`)} `);
    return answer.trim() || fallback;
  } finally {
    rl.close();
  }
}

export async function confirm(question, fallback = true) {
  if (!interactive()) return fallback;
  const hint = fallback ? "Y/n" : "y/N";
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await rl.question(`  ${bold(question)} ${dim(`(${hint})`)} `))
      .trim()
      .toLowerCase();
    if (!answer) return fallback;
    return answer.startsWith("y");
  } finally {
    rl.close();
  }
}
