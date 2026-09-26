import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";

import Link from "../src/link/Link.vue";
import LinkExternalIcon from "../src/link/LinkExternalIcon.vue";
import LinkProvider from "../src/link/LinkProvider.vue";

const RouterLink = defineComponent({
  props: { href: String },
  setup: (props, { slots }) => () => h("a", { href: props.href, "data-router-link": "" }, slots.default?.()),
});

describe("Link", () => {
  it("renders an inline anchor by default", () => {
    const wrapper = mount(Link, { attrs: { href: "/docs" }, slots: { default: "Docs" } });
    expect(wrapper.element.tagName).toBe("A");
    expect(wrapper.attributes("href")).toBe("/docs");
    expect(wrapper.attributes("data-kumo-component")).toBe("Link");
    expect(wrapper.classes()).toEqual(expect.arrayContaining(["kv-link", "kv-link--inline"]));
  });

  it("applies the variant and falls back to inline for unknown ones", () => {
    expect(mount(Link, { props: { variant: "plain" } }).classes()).toContain("kv-link--plain");
    expect(mount(Link, { props: { variant: "nope" } }).classes()).toContain("kv-link--inline");
  });

  it("renders as the component passed through as", () => {
    const wrapper = mount(Link, { props: { as: RouterLink }, attrs: { href: "/dashboard" }, slots: { default: "Dashboard" } });
    expect(wrapper.attributes("data-router-link")).toBe("");
    expect(wrapper.attributes("href")).toBe("/dashboard");
    expect(wrapper.classes()).toContain("kv-link");
  });

  it("renders as the LinkProvider component", () => {
    const wrapper = mount(LinkProvider, {
      props: { component: RouterLink },
      slots: { default: () => h(Link, { href: "/a" }, () => "A") },
    });
    expect(wrapper.find("[data-router-link]").attributes("href")).toBe("/a");
  });

  it("maps a deprecated to onto href on a plain anchor", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const wrapper = mount(Link, { attrs: { to: "/page" } });
    expect(wrapper.attributes("href")).toBe("/page");
    expect(wrapper.attributes("to")).toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("passes target and rel through", () => {
    const wrapper = mount(Link, { attrs: { href: "https://cloudflare.com", target: "_blank", rel: "noopener noreferrer" } });
    expect(wrapper.attributes("target")).toBe("_blank");
    expect(wrapper.attributes("rel")).toBe("noopener noreferrer");
  });
});

describe("LinkExternalIcon", () => {
  it("renders a decorative 1em icon", () => {
    const wrapper = mount(LinkExternalIcon);
    expect(wrapper.attributes("aria-hidden")).toBe("true");
    expect(wrapper.attributes("width")).toBe("1em");
    expect(wrapper.classes()).toContain("kv-link__external-icon");
  });
});
