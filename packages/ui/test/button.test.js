/**
 * Behavioural contract for Button. The cases mirror Kumo's own button tests
 * where the behaviour carries over, plus the ones specific to this port:
 * the anchor/button swap, and the icon-only accessible-name warning that
 * replaces Kumo's type-level enforcement.
 */

import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";

import Button from "../src/button/Button.vue";

const mountButton = (props = {}, options = {}) =>
  mount(Button, { props, ...options });

describe("rendering", () => {
  it("renders a <button> with type='button' by default", () => {
    const wrapper = mountButton({}, { slots: { default: "Save" } });
    expect(wrapper.element.tagName).toBe("BUTTON");
    expect(wrapper.attributes("type")).toBe("button");
    expect(wrapper.text()).toBe("Save");
  });

  it("allows the type attribute to be overridden", () => {
    const wrapper = mountButton({}, { attrs: { type: "submit" } });
    expect(wrapper.attributes("type")).toBe("submit");
  });

  it("carries the component data attribute", () => {
    expect(mountButton().attributes("data-kumo-component")).toBe("Button");
  });

  it("applies variant, size and shape classes", () => {
    const wrapper = mountButton({ variant: "ghost", size: "lg", shape: "circle" });
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining([
        "kv-button",
        "kv-button--ghost",
        "kv-button--size-lg",
        "kv-button--shape-circle",
      ]),
    );
  });

  it("defaults to the secondary variant at base size, as Kumo does", () => {
    const wrapper = mountButton();
    expect(wrapper.classes()).toContain("kv-button--secondary");
    expect(wrapper.classes()).toContain("kv-button--size-base");
  });
});

describe("emphasis variants", () => {
  it("marks primary and destructive as emphasis", () => {
    for (const variant of ["primary", "destructive"]) {
      expect(mountButton({ variant }).classes()).toContain("kv-button--emphasis");
    }
  });

  it("leaves quiet variants unmarked and sets no inline style", () => {
    /*
     * The fill is chosen by the variant class, not by an inline custom
     * property: an inline value would outrank the stylesheet and silently
     * undo the destructive variant's contrast correction.
     */
    const wrapper = mountButton({ variant: "secondary" });
    expect(wrapper.classes()).not.toContain("kv-button--emphasis");
    expect(wrapper.attributes("style")).toBeUndefined();
  });
});

describe("loading and disabled", () => {
  it("loading disables the button and marks it busy", () => {
    const wrapper = mountButton({ loading: true });
    expect(wrapper.attributes("disabled")).toBeDefined();
    expect(wrapper.attributes("aria-busy")).toBe("true");
  });

  it("loading replaces the icon slot with a spinner", () => {
    const slots = { icon: () => h("svg", { "data-test": "icon" }) };
    expect(mountButton({}, { slots }).find('[data-test="icon"]').exists()).toBe(true);

    const loading = mountButton({ loading: true }, { slots });
    expect(loading.find('[data-test="icon"]').exists()).toBe(false);
    expect(loading.find(".kv-button__spinner").exists()).toBe(true);
  });

  it("transitions from non-loading to loading and back", async () => {
    const wrapper = mountButton({ loading: false });
    expect(wrapper.find(".kv-button__spinner").exists()).toBe(false);

    await wrapper.setProps({ loading: true });
    expect(wrapper.find(".kv-button__spinner").exists()).toBe(true);
    expect(wrapper.attributes("disabled")).toBeDefined();

    await wrapper.setProps({ loading: false });
    expect(wrapper.find(".kv-button__spinner").exists()).toBe(false);
    expect(wrapper.attributes("disabled")).toBeUndefined();
  });

  it("disabled sets the attribute and blocks clicks", async () => {
    const onClick = vi.fn();
    const wrapper = mountButton({ disabled: true }, { attrs: { onClick } });
    expect(wrapper.attributes("disabled")).toBeDefined();
    await wrapper.trigger("click");
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("as an anchor", () => {
  it("renders an <a> and keeps anchor attributes", () => {
    const wrapper = mountButton({ as: "a" }, { attrs: { href: "/docs" } });
    expect(wrapper.element.tagName).toBe("A");
    expect(wrapper.attributes("href")).toBe("/docs");
    expect(wrapper.attributes("type")).toBeUndefined();
  });

  it("external opens in a new tab with a safe rel", () => {
    const wrapper = mountButton({ as: "a", external: true }, { attrs: { href: "https://x.test" } });
    expect(wrapper.attributes("target")).toBe("_blank");
    expect(wrapper.attributes("rel")).toBe("noopener noreferrer");
  });

  it("a disabled anchor renders a <button> instead, dropping anchor attributes", () => {
    const wrapper = mountButton(
      { as: "a", disabled: true },
      { attrs: { href: "/docs", target: "_blank" } },
    );
    expect(wrapper.element.tagName).toBe("BUTTON");
    expect(wrapper.attributes("href")).toBeUndefined();
    expect(wrapper.attributes("target")).toBeUndefined();
    expect(wrapper.attributes("disabled")).toBeDefined();
  });

  it("a loading anchor is marked disabled and swallows activation", async () => {
    const onClick = vi.fn();
    const wrapper = mountButton(
      { as: "a", loading: true },
      { attrs: { href: "/docs", onClick } },
    );
    expect(wrapper.attributes("aria-disabled")).toBe("true");
    await wrapper.trigger("click");
    expect(onClick).not.toHaveBeenCalled();
  });

  it("as-child hands styling to the child element", () => {
    const Link = defineComponent({
      template: '<a href="/x" data-test="child">go</a>',
    });
    const wrapper = mount(Button, {
      props: { asChild: true },
      slots: { default: () => h(Link) },
    });
    const child = wrapper.find('[data-test="child"]');
    expect(child.exists()).toBe(true);
    expect(child.classes()).toContain("kv-button");
  });
});

describe("icon-only accessible name", () => {
  const warn = () => vi.spyOn(console, "warn").mockImplementation(() => {});

  it("warns when a square button has no accessible name", () => {
    const spy = warn();
    mountButton({ shape: "square" });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("accessible name"));
    spy.mockRestore();
  });

  it.each(["aria-label", "aria-labelledby", "title"])(
    "accepts %s as the accessible name",
    (attr) => {
      const spy = warn();
      mountButton({ shape: "circle" }, { attrs: { [attr]: "Refresh" } });
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    },
  );

  it("does not warn for a button with a text label", () => {
    const spy = warn();
    mountButton({ shape: "base" }, { slots: { default: "Save" } });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("events", () => {
  it("forwards clicks when enabled", async () => {
    const onClick = vi.fn();
    const wrapper = mountButton({}, { attrs: { onClick } });
    await wrapper.trigger("click");
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
