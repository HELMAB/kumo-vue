/**
 * Generates `dist/tokens.css` and `dist/index.js` from `src/tokens.config.js`.
 *
 * Both outputs come from one pass over one source, which is the point: a light
 * value cannot drift from its dark counterpart, and the CSS cannot disagree
 * with the JavaScript. The build refuses to emit anything if a semantic token
 * is missing a mode, or if a contrast pair regresses that is neither exempt
 * nor an accepted Kumo-parity divergence.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve as resolvePath_ } from "node:path";
import { fileURLToPath } from "node:url";

import {
  primitives,
  space,
  radius,
  fontSize,
  lineHeight,
  fontFamily,
} from "../src/tokens.config.js";
import { oklchToHex } from "./color.js";
import { camel, cssName, eachToken, orderedEntries, resolve } from "./resolve.js";
import { audit, formatReport } from "./check-contrast.js";

const dist = resolvePath_(dirname(fileURLToPath(import.meta.url)), "../dist");

const CREDIT = `Semantic token names and their light/dark role assignments are adapted from
 * Cloudflare Kumo (https://github.com/cloudflare/kumo), MIT licensed.
 * See /NOTICE and /LICENSES/kumo-MIT.txt at the repository root.`;

const banner = (what) => `/**
 * ${what}
 *
 * GENERATED FILE - DO NOT EDIT.
 * Source: packages/tokens/src/tokens.config.js
 * Regenerate: pnpm --filter @kumo-vue/tokens build
 *
 * ${CREDIT}
 */`;

/** CSS custom property name for a primitive, e.g. `--kv-color-neutral-900`. */
const primitiveName = (hue, step) => `--kv-color-${hue}-${step}`;

/** Every semantic token must resolve in both modes; nothing ships half-themed. */
function assertComplete() {
  const missing = [];
  for (const [group, name, token] of eachToken()) {
    for (const mode of ["light", "dark"]) {
      const entry = token[mode];
      if (!entry || (!entry.ref && !entry.value)) {
        missing.push(`${group}.${name} (${mode})`);
      }
    }
  }
  if (missing.length) {
    throw new Error(
      `Semantic tokens missing a mode:\n  ${missing.join("\n  ")}`,
    );
  }
}

/** Emit the light or dark declarations for every semantic token. */
function modeBlock(mode, indent) {
  return eachToken()
    .map(([group, name, token]) => {
      const entry = token[mode];
      const value = entry.ref
        ? `var(${primitiveName(...entry.ref.split("."))})`
        : entry.value;
      return `${indent}${cssName(group, name)}: ${value};`;
    })
    .join("\n");
}

function buildCss() {
  const primitiveDecls = Object.entries(primitives)
    .map(([hue, steps]) =>
      Object.entries(steps)
        .map(([step, value]) => `    ${primitiveName(hue, step)}: ${value};`)
        .join("\n"),
    )
    .join("\n\n");

  const scale = (prefix, entries) =>
    orderedEntries(entries)
      .map(([key, value]) => `    --kv-${prefix}-${key}: ${value};`)
      .join("\n");

  return `${banner("Kumo Vue design tokens.")}

/*
 * Layer order. Token declarations live inside a cascade layer so that an
 * unlayered override in a consuming app always wins - including over the
 * higher-specificity [data-theme="dark"] selectors below. Redefine any
 * --kv-* property on :root in your own stylesheet and it takes effect in
 * both modes without !important.
 */
@layer kumo-vue.primitives, kumo-vue.tokens;

/*
 * Tier 1 - primitives. INTERNAL. Present because semantic tokens reference
 * them, not as public API. Names and steps may change in any release.
 */
@layer kumo-vue.primitives {
  :root {
${primitiveDecls}
  }
}

/*
 * Tier 2 - semantic tokens. The public API.
 *
 * Theming resolves in this order:
 *   1. :root                            - light, the default
 *   2. prefers-color-scheme: dark       - dark, when no theme is set explicitly
 *   3. [data-theme="dark"|"light"]      - explicit, wins over the media query
 *
 * The attribute selectors are not anchored to :root, so a subtree can opt into
 * the opposite mode - a light-on-dark panel inside a dark page, for instance.
 */
@layer kumo-vue.tokens {
  :root,
  [data-theme="light"] {
    color-scheme: light;

${modeBlock("light", "    ")}
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]),
    [data-theme="dark"] {
      color-scheme: dark;

${modeBlock("dark", "      ")}
    }
  }

  [data-theme="dark"] {
    color-scheme: dark;

${modeBlock("dark", "    ")}
  }

  /*
   * Dimension, type and font tokens. Mode-independent, declared once.
   *
   * There is not a single directional property in this file - no left, right,
   * top or bottom - so nothing here needs a mirrored stylesheet for RTL.
   * Components consuming these tokens should stay logical too:
   * margin-inline-start over margin-left, inset-inline-end over right.
   */
  :root {
${scale("space", space)}

${scale("radius", radius)}

${scale("text", fontSize)}

${scale("leading", lineHeight)}

    --kv-font-sans: ${fontFamily.sans};
    --kv-font-mono: ${fontFamily.mono};
  }
}
`;
}

function buildJs() {
  const entries = eachToken().map(([group, name, token]) => ({
    key: camel(group, name),
    cssVar: cssName(group, name),
    light: resolve(token.light),
    dark: resolve(token.dark),
  }));

  const object = (pairs, indent = "  ") =>
    pairs.map(([k, v]) => `${indent}${JSON.stringify(k)}: ${v},`).join("\n");

  const colorEntries = entries.map((e) => [
    e.key,
    `{ light: ${JSON.stringify(e.light)}, dark: ${JSON.stringify(e.dark)} }`,
  ]);
  const hexEntries = entries.map((e) => [
    e.key,
    `{ light: ${JSON.stringify(oklchToHex(e.light))}, dark: ${JSON.stringify(oklchToHex(e.dark))} }`,
  ]);
  const varEntries = entries.map((e) => [e.key, JSON.stringify(e.cssVar)]);

  const scale = (entries_) =>
    object(orderedEntries(entries_).map(([k, v]) => [k, JSON.stringify(v)]));

  return `${banner("Kumo Vue design tokens, as JavaScript.")}

/**
 * Semantic colours in OKLCH, keyed by camelCase role name. Each entry carries
 * both modes, because JavaScript has no cascade to resolve them for you.
 *
 * @type {Record<string, { light: string, dark: string }>}
 */
export const color = {
${object(colorEntries)}
};

/**
 * The same colours as sRGB hex. Provided for consumers that cannot take an
 * OKLCH string - some charting libraries parse colours themselves rather than
 * handing them to the browser. Out-of-gamut values are clamped, so these are
 * approximations of the OKLCH originals, which remain canonical.
 *
 * Entries with alpha are eight-digit (#rrggbbaa).
 *
 * @type {Record<string, { light: string, dark: string }>}
 */
export const colorHex = {
${object(hexEntries)}
};

/**
 * CSS custom property name for each semantic colour, for the cases where you
 * want the live cascading value rather than a snapshot - inline styles that
 * should follow the theme, for example.
 *
 * @type {Record<string, string>}
 */
export const colorVar = {
${object(varEntries)}
};

/** Spacing scale. Keys use \`-\` for the decimal point: \`"1-5"\` is 0.375rem. */
export const space = {
${scale(space)}
};

/** Corner radii. */
export const radius = {
${scale(radius)}
};

/** Type sizes. */
export const fontSize = {
${scale(fontSize)}
};

/** Line heights, floored at 1.4 for non-Latin script support. */
export const lineHeight = {
${scale(lineHeight)}
};

/** Font stacks. */
export const fontFamily = {
${scale(fontFamily)}
};

/**
 * Flatten the colour set to a single mode.
 *
 * Useful where a value has to be a literal rather than a \`var()\` - canvas
 * fills, chart series colours, generated images.
 *
 * @param {"light" | "dark"} mode
 * @param {{ format?: "oklch" | "hex" }} [options]
 * @returns {Record<string, string>}
 *
 * @example
 * const c = getColors("dark", { format: "hex" });
 * ctx.fillStyle = c.statusDanger;
 */
export function getColors(mode, options = {}) {
  if (mode !== "light" && mode !== "dark") {
    throw new TypeError(\`getColors: mode must be "light" or "dark", got \${mode}\`);
  }
  const source = options.format === "hex" ? colorHex : color;
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [key, value[mode]]),
  );
}

/**
 * Read a token's live value from the document, resolving whatever the cascade
 * currently says. Returns \`null\` outside a browser.
 *
 * @param {string} key - camelCase role name, e.g. \`"surfaceBase"\`
 * @param {Element} [element] - element to resolve against; defaults to :root
 * @returns {string | null}
 */
export function readColor(key, element) {
  if (typeof globalThis.document === "undefined") return null;
  const name = colorVar[key];
  if (!name) throw new Error(\`Unknown token: \${key}\`);
  const target = element ?? globalThis.document.documentElement;
  return globalThis.getComputedStyle(target).getPropertyValue(name).trim() || null;
}
`;
}

function buildPrimitivesJs() {
  const body = Object.entries(primitives)
    .map(([hue, steps]) => {
      const inner = Object.entries(steps)
        .map(([step, value]) => `    ${JSON.stringify(step)}: ${JSON.stringify(value)},`)
        .join("\n");
      return `  ${JSON.stringify(hue)}: {\n${inner}\n  },`;
    })
    .join("\n");

  return `${banner("Kumo Vue primitive scales.")}

/**
 * INTERNAL. Raw scale values with no semantic meaning attached.
 *
 * Not covered by semver - steps may be added, retuned or removed in any
 * release. Build against the semantic tokens in the main entry point instead.
 *
 * @type {Record<string, Record<string, string>>}
 */
export const primitives = {
${body}
};
`;
}

assertComplete();

const results = audit();
const failures = results.filter((r) => !r.passes && !r.exempt && !r.accepted);
if (failures.length) {
  console.error(formatReport(results));
  console.error(
    `\n  Refusing to build: ${failures.length} colour pair(s) below WCAG AA.\n`,
  );
  process.exit(1);
}

await mkdir(dist, { recursive: true });
await writeFile(`${dist}/tokens.css`, buildCss());
await writeFile(`${dist}/index.js`, buildJs());
await writeFile(`${dist}/primitives.js`, buildPrimitivesJs());

const belowTarget = results.filter((r) => !r.passes).length;
console.log(
  `  Built ${eachToken().length} semantic tokens -> dist/tokens.css, dist/index.js`,
);
console.log(
  `  Contrast: ${results.length - belowTarget}/${results.length} pairs pass; ` +
    `${belowTarget} below target (exempt or accepted - run \`pnpm contrast\` for the list).`,
);
