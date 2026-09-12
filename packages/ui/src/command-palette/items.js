/**
 * Command normalisation and match highlighting for CommandPalette.
 *
 * Kept out of the component because it is pure: it can be tested directly
 * rather than through a dialog that has to be opened first, and it is the part
 * you are most likely to want to change - to accept whatever shape your search
 * API already returns, say.
 *
 * Derived from Cloudflare Kumo's CommandPalette (MIT). See /NOTICE.
 */

import { toRaw } from "vue";

import { isGroup } from "../shared/items.js";

/**
 * Normalise one command.
 *
 * Accepts a plain string, or an object. `label` and Kumo's `title` are both
 * read, in that order, so an item written for Kumo's `ResultItem` works here.
 *
 * `index` is the command's position in the flattened list, which is the order
 * the arrow keys walk. It is written onto the element so a keyboard selection
 * can find its way back to the command without matching on text.
 *
 * @param {string | number | object} item
 * @param {number} index
 */
export function toCommand(item, index) {
  const source = typeof item === "object" && item !== null ? item : { label: item };
  const label = String(source.label ?? source.title ?? source.value ?? "");
  const breadcrumbs = Array.isArray(source.breadcrumbs) ? source.breadcrumbs.map(String) : [];
  const description = source.description ? String(source.description) : "";

  /*
   * What the filter matches against. The trail and the description are in it
   * because a palette is searched by where a thing is as much as by what it is
   * called - "billing" should find Settings > Billing.
   */
  const search = [...breadcrumbs, label, description].filter(Boolean).join(" ");

  return {
    index,
    label,
    value: source.value ?? source.label ?? source.title ?? item,
    breadcrumbs,
    description,
    /*
     * A component held in a reactive list - a `ref([...])`, or anything a page
     * mutates - is handed over as a proxy, which Vue renders but warns about
     * every time. Unwrapping it here means a consumer can put an icon in
     * `items` without knowing that.
     */
    icon: source.icon ? toRaw(source.icon) : undefined,
    external: Boolean(source.external),
    disabled: Boolean(source.disabled),
    /* An explicit set of `[start, end]` ranges, for consumers matching with
       something cleverer than a substring - a fuzzy search, or a server. */
    highlights: source.highlights,
    breadcrumbHighlights: source.breadcrumbHighlights,
    /*
     * Whether the highlighted row gets an arrow. Left undefined unless the
     * command says, so the palette's own `arrows` decides - which is the
     * choice Kumo makes by reaching for `Item` or for `ResultItem`.
     */
    arrow: source.arrow,
    raw: item,
    /*
     * Reka refuses an empty item value, and uses it as the filter's haystack.
     * A command with nothing to match on still has to be selectable, so it
     * falls back to something unique and unsearchable-looking.
     */
    search: search || `⁣${index}`,
  };
}

/**
 * Normalise the `items` prop into groups of commands, so the template never
 * has to branch: a flat list becomes one unlabelled group.
 *
 * Mixing groups and loose commands is not meaningful - a loose command has
 * nowhere to sit once headings exist - so if any group is present the loose
 * entries are dropped, as they are in Autocomplete and Select.
 *
 * @param {unknown[]} items
 * @returns {{ label: string, commands: ReturnType<typeof toCommand>[] }[]}
 */
export function toCommandGroups(items) {
  let index = 0;
  const next = (item) => toCommand(item, index++);

  if (items.some(isGroup)) {
    return items.filter(isGroup).map((group) => ({
      label: group.label ? String(group.label) : "",
      commands: group.items.map(next),
    }));
  }

  return [{ label: "", commands: items.map(next) }];
}

/** Every command, in the order the arrow keys walk them. */
export function toFlatCommands(groups) {
  return groups.flatMap((group) => group.commands);
}

/* Match highlighting */

/**
 * Sort `[start, end]` ranges and fold overlapping or touching ones together,
 * so two matches a character apart do not render as two separate marks with a
 * sliver between them. Kumo's rule, including treating adjacent as touching.
 *
 * @param {[number, number][]} ranges - inclusive at both ends, as in Kumo
 */
export function mergeRanges(ranges) {
  const merged = [];

  for (const range of [...ranges].sort((a, b) => a[0] - b[0])) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1] + 1) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }

  return merged;
}

/**
 * Every place `query` appears in `text`, case-insensitively.
 *
 * This is what the palette highlights when the consumer has not said where the
 * match is, and it is the same substring test the filter runs - so what is
 * marked is what matched.
 *
 * @returns {[number, number][]} inclusive ranges
 */
export function toMatchRanges(text, query) {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [];

  const haystack = text.toLocaleLowerCase();
  const ranges = [];

  let from = 0;
  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) break;
    ranges.push([at, at + needle.length - 1]);
    from = at + needle.length;
  }

  return ranges;
}

/**
 * Cut `text` into marked and unmarked runs, so the template can render them
 * without any index arithmetic of its own.
 *
 * @returns {{ text: string, match: boolean }[]}
 */
export function toSegments(text, ranges) {
  if (!ranges?.length) return [{ text, match: false }];

  const segments = [];
  let at = 0;

  for (const [start, end] of mergeRanges(ranges)) {
    /* A range past the end of the text, or crossed over, is not worth
       throwing about - it just marks nothing. */
    const from = Math.max(start, at);
    const to = Math.min(end, text.length - 1);
    if (to < from) continue;

    if (from > at) segments.push({ text: text.slice(at, from), match: false });
    segments.push({ text: text.slice(from, to + 1), match: true });
    at = to + 1;
  }

  if (at < text.length) segments.push({ text: text.slice(at), match: false });

  return segments;
}
