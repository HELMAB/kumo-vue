/**
 * Menu entry normalisation for Dropdown.
 *
 * Kumo builds its menu from a dozen components - `DropdownMenu.Item`,
 * `.LinkItem`, `.CheckboxItem`, `.RadioGroup`, `.Sub`, `.Separator` and the
 * rest. Here a menu is data, the way `items` is data on every other component
 * in this library, so the shape has to say which of those an entry is.
 *
 * Kept out of the component because it is pure, and because it recurses:
 * submenus and groups hold entries of their own, and that is much easier to
 * test directly than through a popup that has to be opened first.
 */

/**
 * Injection key for the context Dropdown shares with DropdownItems.
 *
 * A menu recurses, so the state, the handlers and the portal target have to
 * reach entries at any depth; passing them down as props through every submenu
 * would thread the same four values through every level.
 */
export const DROPDOWN_CONTEXT = Symbol("kv-dropdown");

/** The kinds an entry can normalise to. */
const KINDS = new Set([
  "item",
  "link",
  "checkbox",
  "radio",
  "submenu",
  "group",
  "label",
  "separator",
]);

/** Spellings that read better in a menu than the canonical kind does. */
const ALIASES = {
  divider: "separator",
  heading: "label",
  action: "item",
};

/**
 * Which kind an entry is, from its shape when it does not say.
 *
 * A declared `type` always wins. Otherwise nested `items` make it a submenu -
 * the reading of `{ label, items }` a menu wants, where a list under a label
 * is something you open - and an `href` makes it a link.
 */
function kindOf(item) {
  const declared = item.type && (ALIASES[item.type] ?? item.type);
  if (declared && KINDS.has(declared)) return declared;
  if (Array.isArray(item.items)) return "submenu";
  if (item.href) return "link";
  return "item";
}

/**
 * Normalise one entry.
 *
 * `raw` is the original, so the `item` slot and the `select` event can hand
 * back whatever was passed in.
 *
 * @param {string | number | object} item
 * @returns {object} the entry, with `kind` naming what it renders as
 */
export function toEntry(item) {
  if (typeof item !== "object" || item === null) {
    return {
      kind: "item",
      label: String(item),
      value: item,
      disabled: false,
      raw: item,
    };
  }

  const kind = kindOf(item);
  const label = item.label ?? item.value;

  const entry = {
    kind,
    label: String(label ?? ""),
    /*
     * For a checkbox or a radio group this is the key its state is held under
     * in `modelValue`, not a value to hand back - which is why it falls back
     * to the label, so an entry that never names one still has somewhere to
     * live.
     */
    value: item.value ?? item.label,
    icon: item.icon,
    shortcut: item.shortcut,
    variant: item.variant === "danger" ? "danger" : "default",
    inset: Boolean(item.inset),
    selected: Boolean(item.selected),
    disabled: Boolean(item.disabled),
    /*
     * Kumo closes the menu after an action and leaves it open after a toggle,
     * so the default depends on the kind. `undefined` here means "not asked
     * for"; the component resolves it.
     */
    closeOnClick: item.closeOnClick,
    raw: item,
  };

  if (kind === "link") {
    entry.href = item.href;
    entry.target = item.target;
    /*
     * A `_blank` link without this hands the new tab a handle on the opener.
     * An explicit `rel` still wins.
     */
    entry.rel = item.rel ?? (item.target === "_blank" ? "noreferrer" : undefined);
  }

  if (kind === "submenu" || kind === "group") {
    entry.entries = toEntries(item.items);
  }

  if (kind === "radio") {
    /* A radio group's children are always leaf items - it is a set of choices. */
    entry.options = (item.items ?? []).map(toEntry).map((option) => ({
      ...option,
      kind: "radio-item",
    }));
    entry.selectedValue = item.selected;
  }

  if (kind === "checkbox") {
    entry.checked = Boolean(item.checked);
  }

  return entry;
}

/**
 * Normalise the `items` prop.
 *
 * @param {unknown[]} items
 * @returns {object[]}
 */
export function toEntries(items) {
  if (!Array.isArray(items)) return [];
  return items.map(toEntry);
}

/**
 * The starting state for every entry that carries some - a checkbox's
 * `checked`, a radio group's `selected` - keyed by the entry's `value`.
 *
 * Walks submenus and groups too, so a toggle nested three levels down is
 * seeded like any other.
 *
 * @param {object[]} entries
 * @returns {Record<string, unknown>}
 */
export function toDefaultState(entries) {
  const state = {};

  for (const entry of entries) {
    if (entry.kind === "checkbox") state[entry.value] = entry.checked;
    else if (entry.kind === "radio") state[entry.value] = entry.selectedValue;
    else if (entry.entries) Object.assign(state, toDefaultState(entry.entries));
  }

  return state;
}
