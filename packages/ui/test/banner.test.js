/** Behavioural contract for Banner. */

import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";

import Banner from "../src/banner/Banner.vue";

const mountBanner = (props = {}, options = {}) => mount(Banner, { props, ...options });

describe("rendering", () => {
  it("renders title and description", () => {
    const wrapper = mountBanner({
      title: "Update available",
      description: "A new version is ready.",
    });
    expect(wrapper.find(".kv-banner__title").text()).toBe("Update available");
    expect(wrapper.find(".kv-banner__description").text()).toBe("A new version is ready.");
  });

  it("renders a title without a description", () => {
    const wrapper = mountBanner({ title: "Heads up" });
    expect(wrapper.find(".kv-banner__title").exists()).toBe(true);
    expect(wrapper.find(".kv-banner__description").exists()).toBe(false);
  });

  it("falls back to the default slot when unstructured", () => {
    const wrapper = mountBanner({}, { slots: { default: "Plain message" } });
    expect(wrapper.text()).toBe("Plain message");
    expect(wrapper.find(".kv-banner__title").exists()).toBe(false);
  });

  it("defaults to the default variant at base size", () => {
    const wrapper = mountBanner({ title: "x" });
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(["kv-banner", "kv-banner--default", "kv-banner--size-base"]),
    );
  });

  it.each(["default", "alert", "error", "secondary"])("applies the %s variant", (variant) => {
    expect(mountBanner({ variant, title: "x" }).classes()).toContain(`kv-banner--${variant}`);
  });

  it("carries the component data attribute", () => {
    expect(mountBanner({ title: "x" }).attributes("data-kumo-component")).toBe("Banner");
  });
});

describe("slots", () => {
  it("renders the icon slot", () => {
    const wrapper = mountBanner(
      { title: "x" },
      { slots: { icon: () => h("svg", { "data-test": "icon" }) } },
    );
    expect(wrapper.find(".kv-banner__icon").exists()).toBe(true);
    expect(wrapper.find('[data-test="icon"]').exists()).toBe(true);
  });

  it("renders the action slot", () => {
    const wrapper = mountBanner(
      { title: "x" },
      { slots: { action: () => h("button", "Retry") } },
    );
    expect(wrapper.find(".kv-banner__action").text()).toBe("Retry");
  });

  it("omits the icon and action wrappers when unused", () => {
    const wrapper = mountBanner({ title: "x" });
    expect(wrapper.find(".kv-banner__icon").exists()).toBe(false);
    expect(wrapper.find(".kv-banner__action").exists()).toBe(false);
  });
});

describe("announcements", () => {
  it("is silent by default, so a banner in the page does not announce itself", () => {
    const wrapper = mountBanner({ title: "x" });
    expect(wrapper.attributes("role")).toBeUndefined();
    expect(wrapper.attributes("aria-live")).toBeUndefined();
  });

  it("announces politely when live", () => {
    const wrapper = mountBanner({ title: "x", live: true });
    expect(wrapper.attributes("role")).toBe("status");
    expect(wrapper.attributes("aria-live")).toBe("polite");
  });

  it("interrupts for a live error", () => {
    const wrapper = mountBanner({ title: "x", variant: "error", live: true });
    expect(wrapper.attributes("role")).toBe("alert");
    expect(wrapper.attributes("aria-live")).toBe("assertive");
  });
});
