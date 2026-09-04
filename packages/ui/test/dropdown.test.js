/**
 * Behavioural contract for Dropdown.
 *
 * The menu is portalled, so most assertions look at `document.body` rather
 * than the wrapper. Reka owns the roving focus, the typeahead and the escape
 * key; what is pinned here is the wiring around them - which shape becomes
 * which kind of entry, what closes the menu and what does not, and where the
 * checkbox and radio state lives.
 */

import { afterEach, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { h, nextTick } from "vue";

import Dropdown from "../src/dropdown/Dropdown.vue";
import { toDefaultState, toEntries, toEntry } from "../src/dropdown/items.js";

const flush = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

const mountMenu = (props = {}, options = {}) =>
  mount(Dropdown, {
    props: { defaultOpen: true, ...props },
    slots: { trigger: () => h("button", "Open"), ...options.slots },
    attachTo: document.body,
    ...options,
  });

/** The portalled popup, wherever Reka put it. */
const popup = () => document.querySelector(".kv-dropdown__popup");
const items = () => [...document.querySelectorAll('[data-kumo-part="item"]')];
const labelsOf = (nodes) => nodes.map((node) => node.textContent.trim());

afterEach(() => {
  document.body.innerHTML = "";
});

describe("normalising items", () => {
  it("reads a bare string as an action item", () => {
    expect(toEntry("Worker")).toMatchObject({ kind: "item", label: "Worker", value: "Worker" });
  });

  it("takes an entry at its word when it declares a type", () => {
    expect(toEntry({ type: "divider" }).kind).toBe("separator");
    expect(toEntry({ type: "heading", label: "Display" }).kind).toBe("label");
    expect(toEntry({ type: "group", label: "Display", items: [] }).kind).toBe("group");
  });

  it("reads nested items as a submenu and an href as a link", () => {
    expect(toEntry({ label: "Language", items: ["English"] }).kind).toBe("submenu");
    expect(toEntry({ label: "Docs", href: "/docs" }).kind).toBe("link");
  });

  /* A group is a heading over entries; a submenu is a door. Same shape, so it has to be said. */
  it("still makes a group when one is asked for, nested items and all", () => {
    const entry = toEntry({ type: "group", label: "Display", items: ["One"] });
    expect(entry.entries).toHaveLength(1);
  });

  it("guards a new tab against the opener, unless told otherwise", () => {
    expect(toEntry({ href: "/x", target: "_blank" }).rel).toBe("noreferrer");
    expect(toEntry({ href: "/x", target: "_blank", rel: "opener" }).rel).toBe("opener");
    expect(toEntry({ href: "/x" }).rel).toBeUndefined();
  });

  it("seeds state from checkboxes and radio groups, at any depth", () => {
    const entries = toEntries([
      { type: "checkbox", value: "sidebar", checked: true },
      {
        label: "More",
        items: [{ type: "radio", value: "lang", selected: "en", items: ["en", "km"] }],
      },
    ]);

    expect(toDefaultState(entries)).toEqual({ sidebar: true, lang: "en" });
  });
});

describe("opening", () => {
  it("stays closed until asked", () => {
    mountMenu({ defaultOpen: false });
    expect(popup()).toBeNull();
  });

  it("opens from the trigger", async () => {
    const wrapper = mountMenu({ defaultOpen: false, items: ["Worker"] });

    await wrapper.find("button").trigger("click");
    await flush();

    expect(popup()).not.toBeNull();
  });

  it("follows a controlled open prop", async () => {
    const wrapper = mountMenu({ open: false, items: ["Worker"] });
    expect(popup()).toBeNull();

    await wrapper.setProps({ open: true });
    await flush();
    expect(popup()).not.toBeNull();
  });
});

describe("entries", () => {
  it("renders an item per entry, in order", async () => {
    mountMenu({ items: ["Worker", "Pages", "KV Namespace"] });
    await flush();

    expect(labelsOf(items())).toEqual(["Worker", "Pages", "KV Namespace"]);
  });

  it("gives every item the menuitem role", async () => {
    mountMenu({ items: ["Worker"] });
    await flush();

    expect(items()[0].getAttribute("role")).toBe("menuitem");
  });

  it("renders a link item as an anchor that carries its link attributes", async () => {
    mountMenu({
      items: [{ label: "Developer Docs", href: "https://example.com", target: "_blank" }],
    });
    await flush();

    const link = document.querySelector('[data-kumo-part="link-item"]');
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("https://example.com");
    expect(link.getAttribute("rel")).toBe("noreferrer");
  });

  it("marks a danger entry, and disables a disabled one", async () => {
    mountMenu({
      items: [{ label: "Delete", variant: "danger" }, { label: "Archive", disabled: true }],
    });
    await flush();

    const [remove, archive] = items();
    expect(remove.classList.contains("kv-dropdown__item--danger")).toBe(true);
    expect(archive.getAttribute("data-disabled")).not.toBeNull();
  });

  it("draws a separator and a heading", async () => {
    mountMenu({ items: [{ type: "label", label: "Display" }, "One", { type: "separator" }, "Two"] });
    await flush();

    expect(document.querySelector('[data-kumo-part="label"]').textContent.trim()).toBe("Display");
    expect(document.querySelector('[data-kumo-part="separator"]')).not.toBeNull();
  });

  it("renders a shortcut and a selected tick alongside the label", async () => {
    mountMenu({ items: [{ label: "Copy", shortcut: "⌘C", selected: true }] });
    await flush();

    expect(document.querySelector(".kv-dropdown__shortcut").textContent.trim()).toBe("⌘C");
    expect(document.querySelector(".kv-dropdown__selected")).not.toBeNull();
  });

  it("renders a group's heading above its entries", async () => {
    mountMenu({ items: [{ type: "group", label: "Display", items: ["One", "Two"] }] });
    await flush();

    expect(document.querySelector('[data-kumo-part="label"]').textContent.trim()).toBe("Display");
    expect(labelsOf(items())).toEqual(["One", "Two"]);
  });

  it("renders a submenu as a trigger, not as items of the parent menu", async () => {
    mountMenu({ items: ["Profile", { label: "Language", items: ["English", "Khmer"] }] });
    await flush();

    const trigger = document.querySelector('[data-kumo-part="submenu-trigger"]');
    expect(trigger.textContent.trim().startsWith("Language")).toBe(true);
    expect(labelsOf(items())).toEqual(["Profile"]);
  });

  it("renders an item slot in place of the label", async () => {
    mountMenu(
      { items: [{ label: "Worker", region: "apac" }] },
      { slots: { trigger: () => h("button", "Open"), item: ({ item }) => h("span", item.region) } },
    );
    await flush();

    expect(labelsOf(items())).toEqual(["apac"]);
  });
});

describe("checkboxes and radio groups", () => {
  it("renders a checkbox item with its checked state", async () => {
    mountMenu({
      items: [
        { type: "checkbox", label: "Show sidebar", value: "sidebar", checked: true },
        { type: "checkbox", label: "Word wrap", value: "wrap" },
      ],
    });
    await flush();

    const boxes = [...document.querySelectorAll('[data-kumo-part="checkbox-item"]')];
    expect(boxes.map((box) => box.getAttribute("aria-checked"))).toEqual(["true", "false"]);
  });

  it("renders a radio group with the selected item marked", async () => {
    mountMenu({
      items: [{ type: "radio", value: "lang", selected: "km", items: ["en", "km"] }],
    });
    await flush();

    const radios = [...document.querySelectorAll('[data-kumo-part="radio-item"]')];
    expect(radios.map((radio) => radio.getAttribute("aria-checked"))).toEqual(["false", "true"]);
  });

  it("takes the state from modelValue over the item's own", async () => {
    mountMenu({
      modelValue: { sidebar: false },
      items: [{ type: "checkbox", label: "Show sidebar", value: "sidebar", checked: true }],
    });
    await flush();

    expect(
      document.querySelector('[data-kumo-part="checkbox-item"]').getAttribute("aria-checked"),
    ).toBe("false");
  });

  it("emits the whole state object when a checkbox is toggled", async () => {
    const wrapper = mountMenu({
      items: [
        { type: "checkbox", label: "Show sidebar", value: "sidebar", checked: true },
        { type: "checkbox", label: "Word wrap", value: "wrap" },
      ],
    });
    await flush();

    document.querySelector('[data-kumo-part="checkbox-item"]').click();
    await flush();

    expect(wrapper.emitted("update:modelValue").at(-1)[0]).toEqual({
      sidebar: false,
      wrap: false,
    });
  });

  it("emits the chosen value when a radio item is picked", async () => {
    const wrapper = mountMenu({
      items: [{ type: "radio", value: "lang", selected: "en", items: ["en", "km"] }],
    });
    await flush();

    document.querySelectorAll('[data-kumo-part="radio-item"]')[1].click();
    await flush();

    expect(wrapper.emitted("update:modelValue").at(-1)[0]).toEqual({ lang: "km" });
  });
});

describe("selecting", () => {
  it("emits select with the entry that was activated", async () => {
    const wrapper = mountMenu({ items: [{ label: "Rename", value: "rename" }] });
    await flush();

    items()[0].click();
    await flush();

    const [entry] = wrapper.emitted("select")[0];
    expect(entry).toMatchObject({ kind: "item", label: "Rename", value: "rename" });
  });

  /* `raw` arrives as Vue's reactive proxy of the item, so it is compared by value. */
  it("hands the original item back on the entry, so a page can carry its own fields", async () => {
    const wrapper = mountMenu({ items: [{ label: "Rename", id: 7 }] });
    await flush();

    items()[0].click();
    await flush();

    expect(wrapper.emitted("select")[0][0].raw).toEqual({ label: "Rename", id: 7 });
  });

  it("closes after an action", async () => {
    mountMenu({ items: ["Rename"] });
    await flush();

    items()[0].click();
    await flush();

    expect(popup()).toBeNull();
  });

  /* Kumo's default too: a toggle you have to reopen the menu for is a poor toggle. */
  it("stays open after a checkbox is toggled", async () => {
    mountMenu({ items: [{ type: "checkbox", label: "Word wrap", value: "wrap" }] });
    await flush();

    document.querySelector('[data-kumo-part="checkbox-item"]').click();
    await flush();

    expect(popup()).not.toBeNull();
  });

  it("stays open after an action that asks to", async () => {
    mountMenu({ items: [{ label: "Rename", closeOnClick: false }] });
    await flush();

    items()[0].click();
    await flush();

    expect(popup()).not.toBeNull();
  });

  it("closes after a checkbox that asks to", async () => {
    mountMenu({
      items: [{ type: "checkbox", label: "Word wrap", value: "wrap", closeOnClick: true }],
    });
    await flush();

    document.querySelector('[data-kumo-part="checkbox-item"]').click();
    await flush();

    expect(popup()).toBeNull();
  });

  it("reports the close through update:open", async () => {
    const wrapper = mountMenu({ items: ["Rename"] });
    await flush();

    items()[0].click();
    await flush();

    expect(wrapper.emitted("update:open").at(-1)).toEqual([false]);
  });
});
