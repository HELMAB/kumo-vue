/**
 * The state an InputGroup shares with its parts, and the rule that decides how
 * the group draws its focus.
 *
 * Kept out of the components because `detectFocusMode` is the only genuinely
 * tricky thing here and it is pure: it takes vnodes and returns a string, so
 * it can be tested without mounting anything.
 */
import { inject, provide } from "vue";

export const INPUT_GROUP_KEY = Symbol("kv-input-group");

export const provideInputGroup = (value) => provide(INPUT_GROUP_KEY, value);

export const useInputGroup = () => inject(INPUT_GROUP_KEY, null);

/** Component names `detectFocusMode` looks for. */
export const ADDON_NAME = "InputGroupAddon";
export const BUTTON_NAME = "InputGroupButton";

/**
 * Flattens the fragments Vue wraps around `v-for` and `v-if` so a part written
 * inside either is still seen as a direct child - which is what a reader means
 * by "direct child", and what React's `Children.forEach` gives upstream for
 * free because JSX has no fragment in those positions.
 */
function flatten(nodes, out = []) {
  for (const node of nodes ?? []) {
    if (Array.isArray(node)) flatten(node, out);
    else if (node && Array.isArray(node.children) && typeof node.type === "symbol") {
      flatten(node.children, out);
    } else if (node) out.push(node);
  }
  return out;
}

/** The registered name of a vnode's component, or "" for anything else. */
function nameOf(vnode) {
  const type = vnode?.type;
  if (!type || typeof type === "string" || typeof type === "symbol") return "";
  return type.name ?? type.__name ?? "";
}

/**
 * How the group draws its focus, from what is inside it.
 *
 * - `container` - the group owns one ring around everything. The default, and
 *   what an input with icons or a suffix wants.
 * - `individual` - a non-ghost Button is present, so this is a toolbar rather
 *   than a field: every element owns its own border, and they butt together.
 * - `hybrid` - both an Addon and a non-ghost Button. The addon and the input
 *   share a ring; the buttons stay separate beside it.
 *
 * A ghost Button does not count: it is the compact one that sits *inside* the
 * field, so it must not break the field into pieces.
 */
export function detectFocusMode(nodes) {
  let hasNonGhostButton = false;
  let hasAddon = false;

  for (const vnode of flatten(nodes)) {
    const name = nameOf(vnode);

    if (name === ADDON_NAME) {
      hasAddon = true;
      continue;
    }
    if (name !== BUTTON_NAME) continue;

    const variant = vnode.props?.variant;
    if (variant !== undefined && variant !== "ghost") hasNonGhostButton = true;
  }

  if (hasNonGhostButton && hasAddon) return "hybrid";
  if (hasNonGhostButton) return "individual";
  return "container";
}

/** Splits children into the ones that share a ring and the ones that do not. */
export function partition(nodes) {
  const container = [];
  const individual = [];

  for (const vnode of flatten(nodes)) {
    const name = nameOf(vnode);
    const variant = vnode.props?.variant;
    const isIndividualButton = name === BUTTON_NAME && variant !== undefined && variant !== "ghost";
    (isIndividualButton ? individual : container).push(vnode);
  }

  return { container, individual };
}
