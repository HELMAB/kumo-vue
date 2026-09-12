/**
 * Behavioural contract for CommandPalette.
 *
 * The palette is portalled, so most assertions look at `document.body` rather
 * than the wrapper. Reka owns the filtering, the arrow keys and the ARIA
 * wiring; what is pinned here is everything around them - how a command is
 * shaped, what a selection reports, where the marks go, and the keyboard split
 * between Enter and Cmd/Ctrl+Enter.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { h, nextTick } from "vue";

import CommandPalette from "../src/command-palette/CommandPalette.vue";
import {
  mergeRanges,
  toCommand,
  toCommandGroups,
  toFlatCommands,
  toMatchRanges,
  toSegments,
} from "../src/command-palette/items.js";

const flush = async () => {
  for (let i = 0; i < 8; i += 1) await nextTick();
};

const mountPalette = (props = {}, options = {}) =>
  mount(CommandPalette, {
    props: { defaultOpen: true, items: ["Create Project", "Open Settings"], ...props },
    attachTo: document.body,
    ...options,
  });

const panel = () => document.querySelector(".kv-command-palette");
const input = () => document.querySelector(".kv-command-palette__input");
const items = () => [...document.querySelectorAll('[data-kumo-part="item"]')];
const labelsOf = (nodes) => nodes.map((node) => node.textContent.trim());
const highlightedItem = () => document.querySelector('[data-kumo-part="item"][data-highlighted]');

/** Type into the search field the way Reka listens for it. */
const type = async (value) => {
  const field = input();
  field.value = value;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  await flush();
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("normalising commands", () => {
  it("reads a bare string as a command", () => {
    expect(toCommand("Rename", 0)).toMatchObject({ index: 0, label: "Rename", value: "Rename" });
  });

  /* Kumo's ResultItem calls it `title`; everything else in this library calls
     it `label`. An item written for either works. */
  it("accepts Kumo's title as a spelling of label", () => {
    expect(toCommand({ title: "Deploy" }, 0).label).toBe("Deploy");
    expect(toCommand({ label: "Deploy", title: "Ignored" }, 0).label).toBe("Deploy");
  });

  it("carries the rich fields a search result needs", () => {
    const command = toCommand(
      {
        label: "Billing",
        breadcrumbs: ["Account", "Settings"],
        description: "Payment methods",
        external: true,
        disabled: true,
      },
      3,
    );

    expect(command).toMatchObject({
      label: "Billing",
      breadcrumbs: ["Account", "Settings"],
      description: "Payment methods",
      external: true,
      disabled: true,
    });
  });

  /* A palette is searched by where a thing is as much as by what it is called. */
  it("matches on the trail and the description, not just the label", () => {
    const command = toCommand(
      { label: "Billing", breadcrumbs: ["Account"], description: "Payment methods" },
      0,
    );

    expect(command.search).toBe("Account Billing Payment methods");
  });

  /* Reka refuses an empty item value, and a command with nothing to say is
     still a command. */
  it("never leaves a command with an empty search value", () => {
    expect(toCommand({ value: 7, label: "" }, 2).search).not.toBe("");
  });

  it("reads nested items as groups, and a flat list as one unlabelled group", () => {
    const grouped = toCommandGroups([
      { label: "Actions", items: ["New"] },
      { label: "Navigate", items: ["Home", "Docs"] },
    ]);

    expect(grouped.map((group) => group.label)).toEqual(["Actions", "Navigate"]);
    expect(toCommandGroups(["One"])).toEqual([
      { label: "", commands: [expect.objectContaining({ label: "One" })] },
    ]);
  });

  /* The index is what a keyboard selection finds its way back by, so it has to
     count across groups rather than restart inside each one. */
  it("numbers commands in the order the arrow keys walk them", () => {
    const groups = toCommandGroups([
      { label: "Actions", items: ["New", "Rename"] },
      { label: "Navigate", items: ["Home"] },
    ]);

    expect(toFlatCommands(groups).map((command) => [command.index, command.label])).toEqual([
      [0, "New"],
      [1, "Rename"],
      [2, "Home"],
    ]);
  });

  it("drops loose commands once any group is present", () => {
    const groups = toCommandGroups(["Loose", { label: "Actions", items: ["New"] }]);

    expect(groups).toHaveLength(1);
    expect(groups[0].commands.map((c) => c.label)).toEqual(["New"]);
  });
});

describe("match highlighting", () => {
  it("finds every occurrence, whatever the case", () => {
    expect(toMatchRanges("Deploy a deployment", "deploy")).toEqual([
      [0, 5],
      [9, 14],
    ]);
  });

  it("finds nothing for an empty query", () => {
    expect(toMatchRanges("Deploy", "   ")).toEqual([]);
  });

  /* Two marks a character apart would render as a sliver between them. */
  it("folds overlapping and touching ranges together", () => {
    expect(mergeRanges([[5, 8], [0, 3], [4, 6]])).toEqual([[0, 8]]);
    expect(mergeRanges([[0, 1], [4, 5]])).toEqual([[0, 1], [4, 5]]);
  });

  it("cuts text into marked and unmarked runs", () => {
    expect(toSegments("Deploy Worker", [[7, 12]])).toEqual([
      { text: "Deploy ", match: false },
      { text: "Worker", match: true },
    ]);
  });

  it("marks nothing when there are no ranges, and survives a range past the end", () => {
    expect(toSegments("Deploy", [])).toEqual([{ text: "Deploy", match: false }]);
    expect(toSegments("Deploy", [[3, 99]])).toEqual([
      { text: "Dep", match: false },
      { text: "loy", match: true },
    ]);
  });
});

describe("rendering", () => {
  it("renders nothing until it is opened", () => {
    mountPalette({ defaultOpen: false });
    expect(panel()).toBeNull();
  });

  it("draws a named dialog over a backdrop", async () => {
    mountPalette({ label: "Palette de commandes" });
    await flush();

    expect(panel().getAttribute("role")).toBe("dialog");
    expect(document.querySelector('[data-kumo-part="backdrop"]')).not.toBeNull();
    expect(document.getElementById(panel().getAttribute("aria-labelledby")).textContent).toBe(
      "Palette de commandes",
    );
  });

  it("renders a row per command, in order", async () => {
    mountPalette({ items: ["Create Project", "Open Settings", "Deploy"] });
    await flush();

    expect(labelsOf(items())).toEqual(["Create Project", "Open Settings", "Deploy"]);
  });

  it("renders group headings above their commands", async () => {
    mountPalette({
      items: [
        { label: "Actions", items: ["New"] },
        { label: "Navigate", items: ["Home"] },
      ],
    });
    await flush();

    const headings = [...document.querySelectorAll(".kv-command-palette__group-label")];
    expect(labelsOf(headings)).toEqual(["Actions", "Navigate"]);
  });

  it("renders the trail, the description and the external marker", async () => {
    mountPalette({
      items: [
        {
          label: "Billing",
          breadcrumbs: ["Account", "Settings"],
          description: "Payment methods",
          external: true,
        },
      ],
    });
    await flush();

    const row = items()[0];
    expect(labelsOf([...row.querySelectorAll(".kv-command-palette__crumb")])).toEqual([
      "Account",
      "Settings",
    ]);
    expect(row.querySelector(".kv-command-palette__description").textContent).toContain(
      "Payment methods",
    );
    expect(row.querySelector(".kv-command-palette__external")).not.toBeNull();
  });

  /*
   * Kumo's basic `Item` carries no arrow and its `ResultItem` does. The choice
   * is the palette's here, and a command can still override it - except on an
   * external link, which has a marker of its own instead.
   */
  it("leaves the arrow off until it is asked for", async () => {
    mountPalette({ items: ["Deploy"] });
    await flush();
    expect(items()[0].querySelector(".kv-command-palette__arrow")).toBeNull();

    document.body.innerHTML = "";
    mountPalette({ arrows: true, items: ["Deploy", { label: "Docs", external: true }] });
    await flush();
    expect(items()[0].querySelector(".kv-command-palette__arrow")).not.toBeNull();
    expect(items()[1].querySelector(".kv-command-palette__arrow")).toBeNull();

    document.body.innerHTML = "";
    mountPalette({ arrows: true, items: [{ label: "Deploy", arrow: false }] });
    await flush();
    expect(items()[0].querySelector(".kv-command-palette__arrow")).toBeNull();
  });

  /*
   * An icon reaches the palette through a reactive list, so it arrives as a
   * proxy - which Vue renders and then warns about on every render.
   */
  it("renders an icon component without Vue complaining about it", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const Star = { name: "Star", render: () => h("svg", { class: "star" }) };

    mountPalette({ items: [{ label: "Starred", icon: Star }] });
    await flush();

    expect(document.querySelector(".kv-command-palette__icon .star")).not.toBeNull();
    expect(warn.mock.calls.flat().join(" ")).not.toContain("made a reactive object");
    warn.mockRestore();
  });

  it("renders an item slot in place of the row's body", async () => {
    mountPalette(
      { items: [{ label: "Worker", region: "apac" }] },
      { slots: { item: ({ item }) => h("span", { class: "custom" }, item.region) } },
    );
    await flush();

    expect(document.querySelector(".custom").textContent).toBe("apac");
  });

  it("swaps the list for a spinner while loading, and the footer only when given one", async () => {
    const wrapper = mountPalette(
      { loading: true },
      { slots: { footer: () => h("span", "hints") } },
    );
    await flush();

    expect(document.querySelector('[data-kumo-part="loading"]')).not.toBeNull();
    expect(document.querySelector('[data-kumo-part="list"]')).toBeNull();
    expect(document.querySelector('[data-kumo-part="footer"]').textContent).toBe("hints");

    await wrapper.setProps({ loading: false });
    await flush();
    expect(document.querySelector('[data-kumo-part="list"]')).not.toBeNull();
  });

  it("passes attributes through to the panel", async () => {
    mountPalette({}, { attrs: { "data-testid": "palette" } });
    await flush();

    expect(panel().getAttribute("data-testid")).toBe("palette");
  });
});

describe("accessibility wiring", () => {
  /* Reka's own `aria-controls` is an empty IDREF, which is invalid rather than
     merely unhelpful. */
  it("points the search field at the list it drives", async () => {
    mountPalette();
    await flush();

    const list = document.querySelector('[data-kumo-part="list"]');
    expect(list.id).toBeTruthy();
    expect(input().getAttribute("aria-controls")).toBe(list.id);
    expect(input().getAttribute("role")).toBe("combobox");
    expect(list.getAttribute("role")).toBe("listbox");
  });

  /*
   * Reka hides everything outside the combobox from assistive tech. The
   * dialog's name is inside it for that reason, and would otherwise be a name
   * nothing can read.
   */
  it("keeps the dialog's name out of the hidden region", async () => {
    mountPalette();
    await flush();

    const title = document.querySelector(".kv-command-palette__title");
    expect(title.getAttribute("aria-hidden")).toBeNull();
  });

  it("highlights the first row so Enter always has somewhere to go", async () => {
    mountPalette({ items: ["Create Project", "Open Settings"] });
    await flush();

    expect(highlightedItem().textContent.trim()).toBe("Create Project");
    expect(input().getAttribute("aria-activedescendant")).toBe(highlightedItem().id);
  });
});

describe("searching", () => {
  it("filters the list down as you type", async () => {
    mountPalette({ items: ["Create Project", "Open Settings", "Create Worker"] });
    await flush();

    await type("create");
    expect(labelsOf(items())).toEqual(["Create Project", "Create Worker"]);
  });

  it("matches the trail as well as the label", async () => {
    mountPalette({
      items: [{ label: "Billing", breadcrumbs: ["Account"] }, { label: "Deploy" }],
    });
    await flush();

    await type("account");
    expect(items()).toHaveLength(1);
  });

  it("marks what matched", async () => {
    mountPalette({ items: ["Create Project"] });
    await flush();

    await type("project");
    const marks = [...document.querySelectorAll(".kv-command-palette__mark")];
    expect(labelsOf(marks)).toEqual(["Project"]);
  });

  /* The hook for a fuzzy or server-side match, and Kumo's only mode. */
  it("prefers ranges the command supplies over the ones it would find", async () => {
    mountPalette({
      ignoreFilter: true,
      items: [{ label: "Create Project", highlights: [[0, 5]] }],
    });
    await flush();

    expect(document.querySelector(".kv-command-palette__mark").textContent).toBe("Create");
  });

  it("renders everything as given when told not to filter", async () => {
    mountPalette({ ignoreFilter: true, items: ["Create Project", "Open Settings"] });
    await flush();

    await type("nothing matches this");
    expect(items()).toHaveLength(2);
  });

  it("shows the empty state when nothing matches", async () => {
    mountPalette({ items: ["Create Project"], emptyMessage: "No commands found" });
    await flush();

    await type("zzzz");
    expect(items()).toHaveLength(0);
    expect(document.querySelector(".kv-command-palette__empty").textContent.trim()).toBe(
      "No commands found",
    );
  });

  it("reports the query, and takes a controlled one", async () => {
    const wrapper = mountPalette({ search: "" });
    await flush();

    await type("deploy");
    expect(wrapper.emitted("update:search")).toEqual([["deploy"]]);
  });
});

describe("choosing a command", () => {
  it("reports the command that was clicked, and closes", async () => {
    const wrapper = mountPalette({ items: ["Create Project", "Open Settings"] });
    await flush();

    items()[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flush();

    const [command, options] = wrapper.emitted("select")[0];
    expect(command.label).toBe("Open Settings");
    expect(options).toEqual({ newTab: false });
    expect(wrapper.emitted("update:open")).toEqual([[false]]);
  });

  it("stays open when told to", async () => {
    const wrapper = mountPalette({ closeOnSelect: false });
    await flush();

    items()[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flush();

    expect(wrapper.emitted("select")).toHaveLength(1);
    expect(wrapper.emitted("update:open")).toBeUndefined();
  });

  it("reads a modifier held over a click as a new tab", async () => {
    const wrapper = mountPalette();
    await flush();

    items()[0].dispatchEvent(new MouseEvent("click", { bubbles: true, metaKey: true }));
    await flush();

    expect(wrapper.emitted("select")[0][1]).toEqual({ newTab: true });
  });

  /* Reka turns Enter on the highlighted row into a click, so the two paths
     meet in one handler. */
  it("chooses the highlighted command on Enter", async () => {
    const wrapper = mountPalette({ items: ["Create Project", "Open Settings"] });
    await flush();

    input().dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await flush();

    expect(wrapper.emitted("select")[0][0].label).toBe("Create Project");
    expect(wrapper.emitted("select")[0][1]).toEqual({ newTab: false });
  });

  /*
   * Reka deliberately ignores Enter with a modifier held, which is what leaves
   * the combination free for this.
   */
  it("chooses with newTab on Cmd or Ctrl+Enter", async () => {
    const wrapper = mountPalette({ items: ["Create Project"], closeOnSelect: false });
    await flush();

    input().dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", metaKey: true, bubbles: true }),
    );
    await flush();

    expect(wrapper.emitted("select")[0][1]).toEqual({ newTab: true });

    input().dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, bubbles: true }),
    );
    await flush();
    expect(wrapper.emitted("select")).toHaveLength(2);
  });

  it("refuses a disabled command", async () => {
    const wrapper = mountPalette({ items: [{ label: "Not yet", disabled: true }] });
    await flush();

    items()[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flush();

    expect(wrapper.emitted("select")).toBeUndefined();
  });

  it("says which command is highlighted as the highlight moves", async () => {
    const wrapper = mountPalette({ items: ["Create Project", "Open Settings"] });
    await flush();

    expect(wrapper.emitted("highlight").at(-1)[0].label).toBe("Create Project");

    input().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await flush();

    expect(wrapper.emitted("highlight").at(-1)[0].label).toBe("Open Settings");
  });
});

describe("open state", () => {
  it("follows a controlled open prop", async () => {
    const wrapper = mountPalette({ open: false, defaultOpen: undefined });
    await flush();
    expect(panel()).toBeNull();

    await wrapper.setProps({ open: true });
    await flush();
    expect(panel()).not.toBeNull();
  });

  it("closes on escape", async () => {
    const wrapper = mountPalette();
    await flush();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await flush();

    expect(wrapper.emitted("update:open").at(-1)).toEqual([false]);
  });

  /*
   * A palette that reopens still showing the last search is a palette you have
   * to clear before you can use it - and it has to happen however the palette
   * was closed, including a page setting `open` to false itself.
   */
  it("clears the search when it closes, however it was closed", async () => {
    const wrapper = mountPalette({ open: true, defaultOpen: undefined });
    await flush();

    await type("deploy");
    expect(wrapper.emitted("update:search").at(-1)).toEqual(["deploy"]);

    await wrapper.setProps({ open: false });
    await flush();
    expect(wrapper.emitted("update:search").at(-1)).toEqual([""]);
  });

  it("reopens with an empty field", async () => {
    const wrapper = mountPalette();
    await flush();

    await type("deploy");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await flush();

    await wrapper.setProps({ open: true });
    await flush();
    expect(input().value).toBe("");
  });
});

describe("writing direction", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("dir");
  });

  it("carries the document's direction across the portal", async () => {
    document.documentElement.setAttribute("dir", "rtl");
    mountPalette();
    await flush();

    expect(panel().getAttribute("dir")).toBe("rtl");
  });

  it("lets an explicit dir win", async () => {
    mountPalette({ dir: "rtl" });
    await flush();

    expect(panel().getAttribute("dir")).toBe("rtl");
  });
});
