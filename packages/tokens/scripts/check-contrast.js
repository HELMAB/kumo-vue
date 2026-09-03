/**
 * WCAG AA audit over every declared contrast pair, in both modes.
 *
 * Run standalone (`pnpm contrast`) for the report, or imported by the build,
 * which refuses to emit output while a non-exempt pair is failing.
 */

import { contrastPairs } from "../src/tokens.config.js";
import { contrastRatio } from "./color.js";
import { resolvePath } from "./resolve.js";

export function audit() {
  const results = [];
  for (const pair of contrastPairs) {
    for (const mode of ["light", "dark"]) {
      const backdrop = resolvePath(pair.over ?? pair.on, mode);
      const ratio = contrastRatio(
        resolvePath(pair.fg, mode),
        resolvePath(pair.on, mode),
        backdrop,
      );
      results.push({
        ...pair,
        mode,
        ratio,
        passes: ratio >= pair.min,
      });
    }
  }
  return results;
}

export function formatReport(results) {
  const width = Math.max(
    ...results.map((r) => `${r.fg} on ${r.on}`.length),
  );
  const lines = [];
  for (const mode of ["light", "dark"]) {
    lines.push(`\n  ${mode.toUpperCase()}`);
    for (const r of results.filter((x) => x.mode === mode)) {
      const label = `${r.fg} on ${r.on}`.padEnd(width);
      const mark = r.passes
        ? "PASS"
        : r.exempt
          ? "EXEMPT"
          : r.accepted
            ? "BELOW"
            : "FAIL";
      lines.push(
        `    ${mark.padEnd(7)} ${label}  ${r.ratio.toFixed(2)}:1  (min ${r.min})`,
      );
    }
  }
  return lines.join("\n");
}

const results = audit();
const failures = results.filter((r) => !r.passes && !r.exempt && !r.accepted);
const exemptFailures = results.filter((r) => !r.passes && r.exempt);
const acceptedFailures = results.filter((r) => !r.passes && !r.exempt && r.accepted);

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(formatReport(results));
  console.log(
    `\n  ${results.length - failures.length - exemptFailures.length - acceptedFailures.length}/${results.length} pairs meet their target.`,
  );
  if (acceptedFailures.length) {
    console.log(
      `  ${acceptedFailures.length} pair(s) below target, accepted by design:`,
    );
    console.log(`    ${acceptedFailures[0].accepted}`);
  }
  if (exemptFailures.length) {
    console.log(
      `  ${exemptFailures.length} exempt pair(s) below target (disabled states, not subject to WCAG 1.4.3).`,
    );
  }
  if (failures.length) {
    console.log(`\n  ${failures.length} FAILING pair(s):`);
    for (const f of failures) {
      console.log(
        `    ${f.mode}  ${f.fg} on ${f.on}  ${f.ratio.toFixed(2)}:1 < ${f.min}`,
      );
    }
    process.exitCode = 1;
  }
}
