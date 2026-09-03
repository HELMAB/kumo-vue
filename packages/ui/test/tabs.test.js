/**
 * Behavioural contract for Tabs, mirroring Kumo's own cases where the
 * behaviour carries over - and pinning the places it deliberately does not.
 *
 * jsdom gives nothing a size, so the overflow arithmetic is exercised directly
 * against the two pure helpers rather than through a list that can never
 * overflow. The component tests cover what jsdom does model: roles, selection,
 * keyboard activation and the DOM the controls sit in.
 */

import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, markRaw, nextTick } from "vue";

import Tabs from "../src/tabs/Tabs.vue";
import { getOverflowState, getScrollDistance } from "../src/tabs/useTabsScroll.js";

const ITEMS = [
  { label: "Overview", value: "overview" },
  { label: "Analytics", value: "analytics" },
  { label: "Settings", value: "settings" },
];

const mountTabs = (props = {}, options = {}) =>
  mount(Tabs, { props: { items: ITEMS, defaultValue: "overview", ...props }, ...options });

const tabs = (wrapper) => wrapper.findAll('[data-kumo-part="tab"]');

describe("structure", () => {
  it("renders a tablist of tabs", () => {
    const wrapper = mountTabs();
    expect(wrapper.get('[role="tablist"]').exists()).toBe(true);
    expect(tabs(wrapper).map((tab) => tab.text())).toEqual([
      "Overview",
      "Analytics",
      "Settings",
    ]);
    expect(tabs(wrapper).every((tab) => tab.attributes("role") === "tab")).toBe(true);
    expect(wrapper.attributes("data-kumo-component")).toBe("Tabs");
  });

  it("accepts plain strings, normalised by the shared helper", () => {
    const wrapper = mountTabs({ items: ["One", "Two"], defaultValue: "One" });
    expect(tabs(wrapper).map((tab) => tab.text())).toEqual(["One", "Two"]);
  });

  it("names the tab list when asked to", () => {
    expect(mountTabs({ label: "Sections" }).get('[role="tablist"]').attributes("aria-label")).toBe(
      "Sections",
    );
  });

  it("renders no panels, as Kumo's bar does not", () => {
    const wrapper = mountTabs();
    expect(wrapper.find('[role="tabpanel"]').exists()).toBe(false);
    /* And so no tab is left pointing at a panel that does not exist. */
    expect(tabs(wrapper).every((tab) => tab.attributes("aria-controls") === undefined)).toBe(true);
  });

  it("applies the variant and size classes, defaulting as Kumo does", () => {
    expect(mountTabs().classes()).toEqual(
      expect.arrayContaining(["kv-tabs", "kv-tabs--segmented", "kv-tabs--size-base"]),
    );
    const wrapper = mountTabs({ variant: "underline", size: "sm" });
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(["kv-tabs--underline", "kv-tabs--size-sm"]),
    );
  });

  it("renders an indicator inside the list, where it can slide", async () => {
    const wrapper = mountTabs();
    /* Reka renders it only once it has measured the active tab. */
    await nextTick();
    await nextTick();
    expect(wrapper.get('[role="tablist"] .kv-tabs__indicator').exists()).toBe(true);
  });

  it("renders nothing but the bar when given no items", () => {
    const wrapper = mountTabs({ items: [], defaultValue: undefined });
    expect(tabs(wrapper)).toHaveLength(0);
  });

  it("lets the tab slot render the label", () => {
    const wrapper = mountTabs(
      {},
      { slots: { tab: ({ option }) => option.label.toUpperCase() } },
    );
    expect(tabs(wrapper).map((tab) => tab.text())).toEqual([
      "OVERVIEW",
      "ANALYTICS",
      "SETTINGS",
    ]);
  });
});

describe("writing direction", () => {
  it("takes an explicit direction", () => {
    expect(mountTabs({ dir: "rtl" }).attributes("dir")).toBe("rtl");
  });

  it("follows the direction it inherits, rather than forcing ltr", async () => {
    /*
     * Reka asks for a direction and defaults to `ltr`, which it writes onto
     * the element - flipping the bar back the other way inside an RTL page.
     * The inherited direction is read from the parent instead.
     */
    const host = document.createElement("div");
    host.setAttribute("dir", "rtl");
    document.body.append(host);

    const wrapper = mountTabs({}, { attachTo: host });
    await nextTick();
    expect(wrapper.attributes("dir")).toBe("rtl");

    wrapper.unmount();
    host.remove();
  });
});

describe("selection", () => {
  it("selects the default value", () => {
    const states = tabs(mountTabs()).map((tab) => tab.attributes("data-state"));
    expect(states).toEqual(["active", "inactive", "inactive"]);
    expect(tabs(mountTabs())[0].attributes("aria-selected")).toBe("true");
  });

  it("follows the model value", () => {
    const wrapper = mountTabs({ modelValue: "settings" });
    expect(tabs(wrapper)[2].attributes("aria-selected")).toBe("true");
  });

  it("emits the value of a clicked tab", async () => {
    const wrapper = mountTabs({ modelValue: "overview" });
    await tabs(wrapper)[1].trigger("mousedown");
    expect(wrapper.emitted("update:modelValue")).toEqual([["analytics"]]);
  });

  it("does not select a disabled tab", async () => {
    const wrapper = mountTabs({
      items: [
        { label: "Overview", value: "overview" },
        { label: "Billing", value: "billing", disabled: true },
      ],
      modelValue: "overview",
    });
    const billing = tabs(wrapper)[1];
    expect(billing.attributes("disabled")).toBeDefined();
    await billing.trigger("mousedown");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("commits on Enter, since focus alone does not activate", async () => {
    const wrapper = mountTabs({ modelValue: "overview" });
    await tabs(wrapper)[1].trigger("focus");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();

    await tabs(wrapper)[1].trigger("keydown", { key: "Enter" });
    expect(wrapper.emitted("update:modelValue")).toEqual([["analytics"]]);
  });

  it("selects on focus when asked to, as Kumo's activateOnFocus does", async () => {
    const wrapper = mountTabs({ modelValue: "overview", activateOnFocus: true });
    await tabs(wrapper)[1].trigger("focus");
    expect(wrapper.emitted("update:modelValue")).toEqual([["analytics"]]);
  });
});

describe("link tabs", () => {
  it("renders a tab with an href as an anchor", () => {
    const wrapper = mountTabs({
      items: [
        { label: "Overview", value: "overview", href: "/overview" },
        { label: "Settings", value: "settings" },
      ],
    });
    const [first, second] = tabs(wrapper);
    expect(first.element.tagName).toBe("A");
    expect(first.attributes("href")).toBe("/overview");
    expect(first.attributes("role")).toBe("tab");
    expect(second.element.tagName).toBe("BUTTON");
  });

  it("hands a router link `to` rather than `href`", () => {
    const RouterLink = defineComponent({
      props: { to: { type: String, default: "" } },
      setup: (props, { slots }) => () => h("a", { "data-to": props.to }, slots.default?.()),
    });

    const wrapper = mountTabs({
      items: [{ label: "Overview", value: "overview", href: "/overview" }],
      linkAs: markRaw(RouterLink),
    });
    expect(tabs(wrapper)[0].attributes("data-to")).toBe("/overview");
    expect(tabs(wrapper)[0].attributes("href")).toBeUndefined();
  });
});

describe("overflow controls", () => {
  it("renders a control at each edge, for both variants", () => {
    for (const variant of ["segmented", "underline"]) {
      const controls = mountTabs({ variant }).findAll('[data-kumo-part="overflow-control"]');
      expect(controls.map((control) => control.attributes("data-side"))).toEqual(["start", "end"]);
    }
  });

  it("keeps them out of the way while there is nothing to scroll to", () => {
    const controls = mountTabs().findAll('[data-kumo-part="overflow-control"]');
    expect(controls.every((control) => control.classes().includes("kv-tabs__scroll--idle"))).toBe(
      true,
    );
    expect(controls.every((control) => control.attributes("aria-hidden") === "true")).toBe(true);
    expect(controls.every((control) => control.attributes("tabindex") === "-1")).toBe(true);
  });

  it("takes translated names for them", () => {
    const controls = mountTabs({
      scrollStartLabel: "Défiler au début",
      scrollEndLabel: "Défiler à la fin",
    }).findAll('[data-kumo-part="overflow-control"]');
    expect(controls.map((control) => control.attributes("aria-label"))).toEqual([
      "Défiler au début",
      "Défiler à la fin",
    ]);
  });

  it("scrolls the list when one is pressed", async () => {
    const wrapper = mountTabs();
    const list = wrapper.get('[role="tablist"]').element;
    const scrollBy = vi.fn();
    Object.defineProperties(list, {
      scrollBy: { value: scrollBy, configurable: true },
      clientWidth: { value: 200, configurable: true },
    });

    await wrapper.findAll('[data-kumo-part="overflow-control"]')[1].trigger("click");
    expect(scrollBy).toHaveBeenCalledWith(
      expect.objectContaining({ left: expect.any(Number) }),
    );
    expect(scrollBy.mock.calls[0][0].left).toBeGreaterThan(0);

    await wrapper.findAll('[data-kumo-part="overflow-control"]')[0].trigger("click");
    expect(scrollBy.mock.calls[1][0].left).toBeLessThan(0);
  });

  it("scrolls the other way under dir=rtl", async () => {
    const wrapper = mountTabs({}, { attachTo: document.body });
    const list = wrapper.get('[role="tablist"]').element;
    list.style.direction = "rtl";
    const scrollBy = vi.fn();
    Object.defineProperties(list, {
      scrollBy: { value: scrollBy, configurable: true },
      clientWidth: { value: 200, configurable: true },
    });

    await wrapper.findAll('[data-kumo-part="overflow-control"]')[1].trigger("click");
    expect(scrollBy.mock.calls[0][0].left).toBeLessThan(0);
    wrapper.unmount();
  });

  it("brings a clicked tab into view", async () => {
    const wrapper = mountTabs();
    const scrollIntoView = vi.fn();
    tabs(wrapper)[1].element.scrollIntoView = scrollIntoView;

    await tabs(wrapper)[1].trigger("click");
    expect(scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ block: "nearest", inline: "nearest" }),
    );
  });

  it("re-measures when the tabs themselves change", async () => {
    const wrapper = mountTabs();
    const list = wrapper.get('[role="tablist"]').element;
    Object.defineProperties(list, {
      scrollWidth: { value: 600, configurable: true },
      clientWidth: { value: 200, configurable: true },
    });

    await wrapper.setProps({ items: [...ITEMS, { label: "Billing", value: "billing" }] });
    await nextTick();
    expect(list.getAttribute("data-overflowing")).toBe("");
    expect(list.getAttribute("data-overflow-end")).toBe("");
  });
});

describe("overflow arithmetic", () => {
  it("calls a list that fits not overflowing", () => {
    expect(getOverflowState({ scrollWidth: 300, clientWidth: 300, scrollLeft: 0 })).toEqual({
      isOverflowing: false,
      canScrollStart: false,
      canScrollEnd: false,
    });
  });

  it("ignores a sub-pixel overhang", () => {
    expect(
      getOverflowState({ scrollWidth: 300.4, clientWidth: 300, scrollLeft: 0 }).isOverflowing,
    ).toBe(false);
  });

  it("can only scroll towards the end from the start", () => {
    expect(getOverflowState({ scrollWidth: 600, clientWidth: 200, scrollLeft: 0 })).toEqual({
      isOverflowing: true,
      canScrollStart: false,
      canScrollEnd: true,
    });
  });

  it("can scroll both ways from the middle", () => {
    expect(getOverflowState({ scrollWidth: 600, clientWidth: 200, scrollLeft: 200 })).toEqual({
      isOverflowing: true,
      canScrollStart: true,
      canScrollEnd: true,
    });
  });

  it("can only scroll towards the start from the end", () => {
    expect(getOverflowState({ scrollWidth: 600, clientWidth: 200, scrollLeft: 400 })).toEqual({
      isOverflowing: true,
      canScrollStart: true,
      canScrollEnd: false,
    });
  });

  it("reads a negative scroll offset as the same distance, for RTL", () => {
    /* Kumo compares the raw value, which reports the start as reachable the
       moment an RTL list is scrolled at all. */
    expect(getOverflowState({ scrollWidth: 600, clientWidth: 200, scrollLeft: -400 })).toEqual({
      isOverflowing: true,
      canScrollStart: true,
      canScrollEnd: false,
    });
    expect(
      getOverflowState({ scrollWidth: 600, clientWidth: 200, scrollLeft: -0 }).canScrollStart,
    ).toBe(false);
  });

  it("moves by as many whole tabs as fit", () => {
    expect(getScrollDistance(200, [80, 80, 80, 80])).toBe(160);
  });

  it("falls back to most of a screenful when the first tab is wider than the list", () => {
    expect(getScrollDistance(200, [400])).toBe(200);
    expect(getScrollDistance(500, [100, 100])).toBe(400);
  });

  it("never moves less than eighty pixels", () => {
    expect(getScrollDistance(50, [])).toBe(80);
  });
});
