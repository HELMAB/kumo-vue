import { afterEach, describe, expect, it } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { h, nextTick } from "vue";

import Toolbar from "../src/toolbar/Toolbar.vue";
import ToolbarButton from "../src/toolbar/ToolbarButton.vue";
import ToolbarInput from "../src/toolbar/ToolbarInput.vue";
import ToolbarInputGroup from "../src/toolbar/ToolbarInputGroup.vue";
import ToolbarLink from "../src/toolbar/ToolbarLink.vue";
import InputGroupInput from "../src/input-group/InputGroupInput.vue";

const mounted = [];
const mountToolbar = (children, props = {}) => {
  const wrapper = mount(Toolbar, { props, slots: { default: children }, attachTo: document.body });
  mounted.push(wrapper);
  return wrapper;
};

afterEach(() => mounted.splice(0).forEach((w) => w.unmount()));

const key = (el, k) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("Toolbar", () => {
  it("renders a horizontal toolbar with the component marker", () => {
    const wrapper = mountToolbar(() => h(ToolbarButton, () => "Apply"));
    expect(wrapper.attributes("role")).toBe("toolbar");
    expect(wrapper.attributes("aria-orientation")).toBe("horizontal");
    expect(wrapper.attributes("data-kumo-component")).toBe("Toolbar");
    expect(wrapper.classes()).toContain("kv-toolbar--size-base");
  });

  it("renders quiet ghost buttons at the toolbar size, square when icon-only", () => {
    const wrapper = mountToolbar(
      () => [
        h(ToolbarButton, { "aria-label": "Filter" }, { icon: () => h("svg") }),
        h(ToolbarButton, null, () => "Apply"),
      ],
      { size: "sm" },
    );
    const [icon, text] = wrapper.findAll("button");
    expect(icon.classes()).toEqual(expect.arrayContaining(["kv-button--ghost", "kv-button--size-sm", "kv-button--shape-square", "kv-toolbar__control"]));
    expect(icon.attributes("data-kumo-component")).toBe("Toolbar.Button");
    expect(text.classes()).toContain("kv-button--shape-base");
  });

  it("keeps one tab stop and moves focus with the arrow keys, Home and End, looping", async () => {
    const wrapper = mountToolbar(() => [
      h(ToolbarButton, null, () => "One"),
      h(ToolbarButton, null, () => "Two"),
      h(ToolbarButton, null, () => "Three"),
    ]);
    await nextTick();
    const [one, two, three] = wrapper.findAll("button").map((w) => w.element);
    expect([one.tabIndex, two.tabIndex, three.tabIndex]).toEqual([0, -1, -1]);

    one.focus();
    key(one, "ArrowRight");
    expect(document.activeElement).toBe(two);
    expect([one.tabIndex, two.tabIndex]).toEqual([-1, 0]);
    key(two, "End");
    expect(document.activeElement).toBe(three);
    key(three, "ArrowRight");
    expect(document.activeElement).toBe(one);
    key(one, "ArrowLeft");
    expect(document.activeElement).toBe(three);
    key(three, "Home");
    expect(document.activeElement).toBe(one);
  });

  it("skips disabled buttons", async () => {
    const wrapper = mountToolbar(() => [
      h(ToolbarButton, null, () => "One"),
      h(ToolbarButton, { disabled: true }, () => "Two"),
      h(ToolbarButton, null, () => "Three"),
    ]);
    await nextTick();
    const [one, , three] = wrapper.findAll("button").map((w) => w.element);
    one.focus();
    key(one, "ArrowRight");
    expect(document.activeElement).toBe(three);
  });

  it("keeps arrow keys on the caret until it reaches the end, then moves focus", async () => {
    const wrapper = mountToolbar(() => [h(ToolbarInput, { "aria-label": "Search" }), h(ToolbarButton, null, () => "Go")]);
    const input = wrapper.find("input").element;
    input.value = "abc";
    input.focus();
    input.setSelectionRange(1, 1);
    key(input, "ArrowRight");
    await nextTick();
    expect(document.activeElement).toBe(input);

    input.setSelectionRange(3, 3);
    key(input, "ArrowRight");
    expect(document.activeElement).toBe(wrapper.find("button").element);
  });

  it("keeps a disabled input focusable but blocks typing", () => {
    const wrapper = mountToolbar(() => h(ToolbarInput, { "aria-label": "Search", disabled: true }));
    const input = wrapper.find("input");
    expect(input.attributes("disabled")).toBeUndefined();
    expect(input.attributes("aria-disabled")).toBe("true");
    const event = new KeyboardEvent("keydown", { key: "a", bubbles: true, cancelable: true });
    input.element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it("renders links as ghost anchors", () => {
    const wrapper = mountToolbar(() => h(ToolbarLink, { href: "/docs" }, () => "Docs"));
    const link = wrapper.find("a");
    expect(link.attributes("href")).toBe("/docs");
    expect(link.attributes("data-kumo-component")).toBe("Toolbar.Link");
    expect(link.classes()).toContain("kv-button--ghost");
  });

  it("names an InputGroup's input from the group and makes it an item", () => {
    const wrapper = mountToolbar(() =>
      h(ToolbarInputGroup, { "aria-label": "Search DNS records" }, () => h(InputGroupInput, { placeholder: "Search" })),
    );
    const input = wrapper.find("input");
    expect(input.attributes("aria-label")).toBe("Search DNS records");
    expect(input.attributes("data-kv-toolbar-item")).toBe("");
    expect(input.attributes("tabindex")).toBe("0");
    expect(wrapper.find(".kv-toolbar__group").attributes("data-kumo-component")).toBe("Toolbar.InputGroup");
  });
});
