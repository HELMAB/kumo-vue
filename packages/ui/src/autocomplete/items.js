/**
 * Item normalisation for Autocomplete.
 *
 * Kept out of the component because it is pure: it can be tested directly,
 * rather than through a popup that has to be opened first, and it is the part
 * you are most likely to want to change - to accept a different item shape
 * from your API, say.
 */

/**
 * Normalise one item into `{ label, value, disabled, raw }`.
 *
 * Accepts a plain string or number, or an object with `label` and/or `value`.
 * `raw` is the original, so the `item` slot can render whatever it likes.
 *
 * @param {string | number | { label?: unknown, value?: unknown, disabled?: boolean }} item
 * @returns {{ label: string, value: unknown, disabled: boolean, raw: unknown }}
 */
export function toOption(item) {
  if (typeof item === "object" && item !== null) {
    const label = item.label ?? item.value;
    return {
      label: String(label ?? ""),
      value: item.value ?? item.label,
      disabled: Boolean(item.disabled),
      raw: item,
    };
  }
  return { label: String(item), value: item, disabled: false, raw: item };
}

/** A `{ label, items }` group rather than a leaf item. */
export function isGroup(item) {
  return typeof item === "object" && item !== null && Array.isArray(item.items);
}

/**
 * Normalise the `items` prop into groups, so the template never has to branch:
 * a flat list becomes one unlabelled group.
 *
 * Mixing groups and loose items is not meaningful - a loose item has nowhere
 * to sit once headings exist - so if any group is present the loose entries
 * are dropped rather than rendered under a heading they do not belong to.
 *
 * @param {unknown[]} items
 * @returns {{ label: string, options: ReturnType<typeof toOption>[] }[]}
 */
export function toGroups(items) {
  if (items.some(isGroup)) {
    return items.filter(isGroup).map((group) => ({
      label: group.label ?? "",
      options: group.items.map(toOption),
    }));
  }
  return [{ label: "", options: items.map(toOption) }];
}
