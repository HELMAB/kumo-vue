/** Shared helpers for turning the token config into concrete values. */

import { primitives, color } from "../src/tokens.config.js";

/** Look up a `hue.step` primitive reference. */
export function primitive(ref) {
  const [hue, step] = ref.split(".");
  const value = primitives[hue]?.[step];
  if (!value) throw new Error(`Unknown primitive reference: ${ref}`);
  return value;
}

/** Resolve one semantic token entry for a mode to a literal OKLCH string. */
export function resolve(entry) {
  return entry.ref ? primitive(entry.ref) : entry.value;
}

/** Resolve a `group.name` semantic path for a mode. */
export function resolvePath(path, mode) {
  const [group, name] = path.split(".");
  const token = color[group]?.[name];
  if (!token) throw new Error(`Unknown semantic token: ${path}`);
  return resolve(token[mode]);
}

/** Every semantic token as `[group, name, token]`, in declaration order. */
export function eachToken() {
  return Object.entries(color).flatMap(([group, tokens]) =>
    Object.entries(tokens).map(([name, token]) => [group, name, token]),
  );
}

/**
 * Groups whose name stays in the custom property. Everything else reads better
 * without it - `--kv-fill-hover`, not `--kv-interact-fill-hover` - but these
 * three would collide or lose their meaning if flattened (`--kv-red` says
 * nothing about being a badge colour).
 */
const PREFIXED_GROUPS = new Set(["text", "surface", "badge"]);

/** CSS custom property name for a semantic token. */
export function cssName(group, name) {
  return PREFIXED_GROUPS.has(group) ? `--kv-${group}-${name}` : `--kv-${name}`;
}

/**
 * JavaScript key for a semantic token, derived from its CSS custom property so
 * the two stay in lockstep: `--kv-fill-hover` <-> `fillHover`,
 * `--kv-text-default` <-> `textDefault`.
 */
export function camel(group, name) {
  const parts = cssName(group, name).replace("--kv-", "").split("-");
  return parts
    .map((part, i) => (i === 0 ? part : part[0].toUpperCase() + part.slice(1)))
    .join("");
}

/**
 * Scale entries in numeric order.
 *
 * Object literals put integer-like keys first regardless of how they were
 * written, which would scatter the half-steps ("1-5") after "20". Named scales
 * (radius, type) have no numeric keys and keep their declared order, since
 * Array.prototype.sort is stable.
 */
export function orderedEntries(scale) {
  return Object.entries(scale).sort(([a], [b]) => {
    const na = Number(a.replace("-", "."));
    const nb = Number(b.replace("-", "."));
    return Number.isNaN(na) || Number.isNaN(nb) ? 0 : na - nb;
  });
}
