/**
 * Contrast audit for colour decisions the Button makes that the token layer
 * cannot see: the emphasis gradient, and the white label sitting on it.
 *
 * The token package audits token-against-token pairs. A filled button mixes
 * its fill from a token at render time, so the resulting colours only exist
 * here - which is what makes this worth asserting rather than assuming.
 */

import { color } from "../../tokens/dist/index.js";
import { contrastRatio, parseOklch } from "../../tokens/scripts/color.js";

/** Mirror of CSS `color-mix(in oklch, <colour>, white|black <p>%)`. */
function mix(value, toward, percent) {
  const { l, c, h, alpha } = parseOklch(value);
  const target = toward === "white" ? 1 : 0;
  const nl = l + (target - l) * percent;
  const nc = c * (1 - percent);
  const a = alpha === 1 ? "" : ` / ${alpha}`;
  return `oklch(${(nl * 100).toFixed(3)}% ${nc.toFixed(4)} ${h}${a})`;
}

const WHITE = "oklch(100% 0 0)";
const BLACK = "oklch(0% 0 0)";

/** Re-express a colour at a given alpha, mirroring `color-mix(… N%, transparent)`. */
function alpha(value, a) {
  const { l, c, h } = parseOklch(value);
  return `oklch(${(l * 100).toFixed(3)}% ${c} ${h} / ${a})`;
}

/** The fill each emphasis variant resolves to, matching Button.vue. */
const fills = {
  primary: (mode) => color.brand[mode],
  destructive: (mode) => color.dangerFill[mode],
};

/**
 * The white label on a filled button sits below WCAG AA at Kumo's colours.
 *
 * That is upstream's design and this port matches it on purpose, so these
 * pairs are reported with their real ratios instead of failing the build. They
 * are NOT waved through: a consumer who needs AA overrides two tokens, and the
 * report below says so every time it runs.
 *
 * Everything else here is still enforced - if the gradient shape or the ring
 * regresses, this exits non-zero.
 */
const ACCEPTED_BELOW_AA =
  "matches Kumo upstream; override --kv-brand / --kv-danger-fill for AA";

/**
 * Every distinct colour the white label sits on, across the gradient and its
 * hover state. The extremes are what matter, so both ends of both gradients
 * are measured.
 */
function textSurfaces(fill) {
  return {
    "gradient top": mix(fill, "white", 0.15),
    "gradient bottom": fill,
    "hover top": mix(fill, "white", 0.3),
    "hover bottom": fill,
  };
}

const results = [];
for (const [variant, resolve] of Object.entries(fills)) {
  for (const mode of ["light", "dark"]) {
    const fill = resolve(mode);
    for (const [where, value] of Object.entries(textSurfaces(fill))) {
      results.push({
        label: `${variant} ${mode} - white on ${where}`,
        ratio: contrastRatio(WHITE, value),
        min: 4.5,
        accepted: ACCEPTED_BELOW_AA,
      });
    }
    results.push({
      label: `${variant} ${mode} - fill on surface-base`,
      ratio: contrastRatio(fill, color.surfaceBase[mode]),
      min: 3,
    });
    /*
     * The inset highlight is a 1px line on the button's top edge - a
     * decorative boundary, not a text background, since the label is centred
     * and never overlaps it. Held to the 3:1 non-text floor, like a hairline.
     */
    results.push({
      label: `${variant} ${mode} - inset highlight on fill`,
      ratio: contrastRatio(mix(fill, "white", 0.3), fill),
      min: 1.1,
    });
  }
}

/*
 * Badge.
 *
 * Filled badges carry a plain white or black label, chosen by the component
 * rather than by a token, so the pairing only exists here. Kumo's green sits
 * below AA with white on it; that is upstream's value and is reported the same
 * way the button's fills are.
 */
const BADGE_LABELS = {
  badgeRed: WHITE,
  badgeGreen: WHITE,
  badgePurple: WHITE,
  badgeTeal: WHITE,
  badgeBlue: WHITE,
  badgeNeutral: WHITE,
  badgeOrange: BLACK,
};

for (const [token, label] of Object.entries(BADGE_LABELS)) {
  for (const mode of ["light", "dark"]) {
    results.push({
      label: `badge ${token.replace("badge", "").toLowerCase()} ${mode} - label on fill`,
      ratio: contrastRatio(label, color[token][mode]),
      min: 4.5,
      accepted: ACCEPTED_BELOW_AA,
    });
  }
}

for (const mode of ["light", "dark"]) {
  /* The teal-subtle fill is ours, not Kumo's - upstream never defines it. */
  const tealTint = alpha(color.badgeTeal[mode], 0.18);
  results.push({
    label: `badge teal-subtle ${mode} - text on tint`,
    ratio: contrastRatio(
      color.badgeTealSubtleText[mode],
      tealTint,
      color.surfaceBase[mode],
    ),
    min: 4.5,
  });

  /* Banner: the secondary variant's 5% wash over the page surface. */
  results.push({
    label: `banner secondary ${mode} - text on wash`,
    ratio: contrastRatio(
      color.textDefault[mode],
      alpha(color.surfaceContrast[mode], 0.05),
      color.surfaceBase[mode],
    ),
    min: 4.5,
  });
}

const width = Math.max(...results.map((r) => r.label.length));
for (const r of results) {
  const pass = r.ratio >= r.min;
  const mark = pass ? "PASS" : r.accepted ? "BELOW" : "FAIL";
  console.log(
    `  ${mark.padEnd(5)} ${r.label.padEnd(width)}  ${r.ratio.toFixed(2)}:1  (min ${r.min})`,
  );
}

const below = results.filter((r) => r.ratio < r.min);
const failures = below.filter((r) => !r.accepted);
const accepted = below.filter((r) => r.accepted);

console.log(`\n  ${results.length - below.length}/${results.length} meet their target.`);

if (accepted.length) {
  console.log(
    `\n  ${accepted.length} pair(s) below WCAG AA, accepted by design:`,
  );
  console.log(`    ${accepted[0].accepted}`);
  const worst = accepted.reduce((a, b) => (a.ratio < b.ratio ? a : b));
  console.log(
    `    worst: ${worst.label} at ${worst.ratio.toFixed(2)}:1 (AA wants ${worst.min})`,
  );
}

if (failures.length) {
  console.log(`\n  ${failures.length} unexpected failure(s):`);
  for (const f of failures) {
    console.log(`    ${f.label}  ${f.ratio.toFixed(2)}:1 < ${f.min}`);
  }
  process.exitCode = 1;
}
