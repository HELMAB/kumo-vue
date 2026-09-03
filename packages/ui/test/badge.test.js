/**
 * Behavioural contract for Badge, mirroring Kumo's own cases where the
 * behaviour carries over.
 */

import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";

import Badge from "../src/badge/Badge.vue";

const mountBadge = (props = {}, options = {}) =>
  mount(Badge, { props, slots: { default: "Label" }, ...options });

describe("rendering", () => {
  it("renders a span with the variant class", () => {
    const wrapper = mountBadge({ variant: "green" });
    expect(wrapper.element.tagName).toBe("SPAN");
    expect(wrapper.classes()).toContain("kv-badge");
    expect(wrapper.classes()).toContain("kv-badge--green");
    expect(wrapper.text()).toBe("Label");
  });

  it("defaults to the primary variant, as Kumo does", () => {
    expect(mountBadge().classes()).toContain("kv-badge--primary");
  });

  it("carries the component data attribute", () => {
    expect(mountBadge().attributes("data-kumo-component")).toBe("Badge");
  });

  it("treats destructive as a deprecated alias for red", () => {
    const wrapper = mountBadge({ variant: "destructive" });
    expect(wrapper.classes()).toContain("kv-badge--red");
    expect(wrapper.classes()).not.toContain("kv-badge--destructive");
  });
});

describe("icons", () => {
  it("renders the icon slot and tightens the leading padding", () => {
    const wrapper = mountBadge(
      {},
      { slots: { default: "Label", icon: () => h("svg", { "data-test": "icon" }) } },
    );
    expect(wrapper.find('[data-test="icon"]').exists()).toBe(true);
    expect(wrapper.classes()).toContain("kv-badge--with-icon");
  });

  it("adds no icon padding when there is no icon", () => {
    expect(mountBadge().classes()).not.toContain("kv-badge--with-icon");
  });
});

describe("dot appearance", () => {
  it("replaces the variant fill with the outlined dot style", () => {
    const wrapper = mountBadge({ variant: "success", appearance: "dot" });
    expect(wrapper.classes()).toContain("kv-badge--dot");
    /* Kumo drops the variant classes in dot mode rather than layering them. */
    expect(wrapper.classes()).not.toContain("kv-badge--success");
  });

  it.each(["success", "warning", "error", "neutral"])(
    "renders a %s dot",
    (variant) => {
      const wrapper = mountBadge({ variant, appearance: "dot" });
      const dot = wrapper.find(".kv-badge__dot");
      expect(dot.exists()).toBe(true);
      expect(dot.classes()).toContain(`kv-badge__dot--${variant}`);
      expect(dot.attributes("aria-hidden")).toBe("true");
    },
  );

  it("renders no dot for a variant that has no dot colour", () => {
    const wrapper = mountBadge({ variant: "purple", appearance: "dot" });
    expect(wrapper.classes()).toContain("kv-badge--dot");
    expect(wrapper.find(".kv-badge__dot").exists()).toBe(false);
  });

  it("ignores the icon slot in dot mode, as Kumo's types require", () => {
    const wrapper = mountBadge(
      { variant: "success", appearance: "dot" },
      { slots: { default: "Label", icon: () => h("svg", { "data-test": "icon" }) } },
    );
    expect(wrapper.find('[data-test="icon"]').exists()).toBe(false);
    expect(wrapper.classes()).not.toContain("kv-badge--with-icon");
  });
});
