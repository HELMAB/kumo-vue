/**
 * Behavioural contract for Breadcrumbs, mirroring Kumo's own cases where the
 * behaviour carries over - and pinning the places it deliberately does not.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, markRaw } from "vue";

import Breadcrumbs from "../src/breadcrumbs/Breadcrumbs.vue";

const TRAIL = [
  { label: "Home", href: "/" },
  { label: "Docs", href: "/docs" },
  { label: "Breadcrumbs" },
];

const mountBreadcrumbs = (props = {}, options = {}) =>
  mount(Breadcrumbs, { props: { items: TRAIL, ...props }, ...options });

describe("structure", () => {
  it("renders a labelled navigation landmark around an ordered list", () => {
    const wrapper = mountBreadcrumbs();
    expect(wrapper.element.tagName).toBe("NAV");
    expect(wrapper.attributes("aria-label")).toBe("Breadcrumb");
    expect(wrapper.attributes("data-kumo-component")).toBe("Breadcrumbs");
    expect(wrapper.find("ol.kv-breadcrumbs__list").exists()).toBe(true);
  });

  it("takes a translated landmark name", () => {
    expect(mountBreadcrumbs({ label: "Fil d'Ariane" }).attributes("aria-label")).toBe(
      "Fil d'Ariane",
    );
  });

  it("renders one crumb per item, in order", () => {
    const labels = mountBreadcrumbs()
      .findAll(".kv-breadcrumbs__label")
      .map((node) => node.text());
    expect(labels).toEqual(["Home", "Docs", "Breadcrumbs"]);
  });

  it("accepts plain strings alongside objects", () => {
    const wrapper = mountBreadcrumbs({ items: ["Home", "Settings"] });
    expect(wrapper.findAll(".kv-breadcrumbs__label").map((n) => n.text())).toEqual([
      "Home",
      "Settings",
    ]);
  });

  it("renders a separator between crumbs but not after the last", () => {
    const wrapper = mountBreadcrumbs();
    /* Three crumbs, plus the collapsed-view ellipsis which carries its own. */
    const separators = wrapper.findAll(".kv-breadcrumbs__crumb:not(.kv-breadcrumbs__crumb--ellipsis) .kv-breadcrumbs__separator");
    expect(separators).toHaveLength(2);
  });

  it("hides separators from assistive technology", () => {
    expect(
      mountBreadcrumbs()
        .findAll(".kv-breadcrumbs__separator")
        .every((node) => node.attributes("aria-hidden") === "true"),
    ).toBe(true);
  });

  it("applies the size class, defaulting to base as Kumo does", () => {
    expect(mountBreadcrumbs().classes()).toContain("kv-breadcrumbs--size-base");
    expect(mountBreadcrumbs({ size: "sm" }).classes()).toContain("kv-breadcrumbs--size-sm");
  });

  it("renders nothing but the list when given no items", () => {
    const wrapper = mountBreadcrumbs({ items: [] });
    expect(wrapper.findAll(".kv-breadcrumbs__crumb")).toHaveLength(0);
  });
});

describe("the current page", () => {
  it("treats the last crumb as the current page", () => {
    const current = mountBreadcrumbs().find('[data-kumo-part="current"]');
    expect(current.attributes("aria-current")).toBe("page");
    expect(current.text()).toBe("Breadcrumbs");
  });

  it("marks only one crumb current", () => {
    expect(mountBreadcrumbs().findAll('[aria-current="page"]')).toHaveLength(1);
  });

  it("honours an explicitly marked current crumb", () => {
    const wrapper = mountBreadcrumbs({
      items: [
        { label: "Home", href: "/" },
        { label: "Docs", href: "/docs", current: true },
        { label: "Breadcrumbs", href: "/docs/breadcrumbs" },
      ],
    });
    expect(wrapper.find('[aria-current="page"]').text()).toBe("Docs");
    /* An href on the current crumb is not a link - you are already there. */
    expect(wrapper.findAll("a").map((a) => a.text())).toEqual(["Home", "Breadcrumbs"]);
  });

  it("renders the current crumb as text even when it has an href", () => {
    const wrapper = mountBreadcrumbs({
      items: [{ label: "Home", href: "/" }, { label: "Here", href: "/here" }],
    });
    expect(wrapper.findAll("a")).toHaveLength(1);
  });
});

describe("links", () => {
  it("renders ancestors as anchors carrying their href", () => {
    const links = mountBreadcrumbs().findAll('a[data-kumo-part="link"]');
    expect(links.map((link) => link.attributes("href"))).toEqual(["/", "/docs"]);
  });

  it("renders a crumb with no href as text", () => {
    const wrapper = mountBreadcrumbs({ items: ["Home", { label: "Docs" }, "Here"] });
    expect(wrapper.findAll("a")).toHaveLength(0);
  });

  it("hands a router link `to` rather than `href`", () => {
    const RouterLink = defineComponent({
      props: { to: { type: String, default: "" } },
      setup: (props, { slots }) => () => h("a", { "data-to": props.to }, slots.default?.()),
    });

    const wrapper = mountBreadcrumbs({ linkAs: markRaw(RouterLink) });
    const links = wrapper.findAll("a");
    expect(links.map((link) => link.attributes("data-to"))).toEqual(["/", "/docs"]);
    expect(links.every((link) => link.attributes("href") === undefined)).toBe(true);
  });
});

describe("icons", () => {
  it("renders an item's icon component", () => {
    const Icon = defineComponent({ setup: () => () => h("svg", { "data-icon": "home" }) });
    const wrapper = mountBreadcrumbs({
      items: [{ label: "Home", href: "/", icon: markRaw(Icon) }, "Here"],
    });
    expect(wrapper.find('[data-icon="home"]').exists()).toBe(true);
  });

  it("passes the crumb and its index to the icon slot", () => {
    const wrapper = mountBreadcrumbs(
      {},
      { slots: { icon: ({ index }) => h("i", { "data-index": index }) } },
    );
    expect(wrapper.findAll("i").map((node) => node.attributes("data-index"))).toEqual([
      "0",
      "1",
      "2",
    ]);
  });

  it("lets the item slot replace the label", () => {
    const wrapper = mountBreadcrumbs(
      {},
      { slots: { item: ({ crumb }) => crumb.label.toUpperCase() } },
    );
    expect(wrapper.findAll(".kv-breadcrumbs__label").map((n) => n.text())).toEqual([
      "HOME",
      "DOCS",
      "BREADCRUMBS",
    ]);
  });

  it("lets the separator slot replace the chevron", () => {
    const wrapper = mountBreadcrumbs({}, { slots: { separator: () => "/" } });
    expect(wrapper.find(".kv-breadcrumbs__separator").text()).toBe("/");
    expect(wrapper.find(".kv-breadcrumbs__separator svg").exists()).toBe(false);
  });
});

describe("loading", () => {
  it("swaps the current crumb's label for a shimmer", () => {
    const wrapper = mountBreadcrumbs({ loading: true });
    expect(wrapper.find(".kv-breadcrumbs__skeleton").exists()).toBe(true);
    expect(wrapper.find('[data-kumo-part="current"]').attributes("aria-busy")).toBe("true");
    expect(wrapper.text()).not.toContain("Breadcrumbs");
  });

  it("leaves the ancestors alone", () => {
    const wrapper = mountBreadcrumbs({ loading: true });
    expect(wrapper.findAll("a").map((a) => a.text())).toEqual(["Home", "Docs"]);
    expect(wrapper.findAll(".kv-breadcrumbs__skeleton")).toHaveLength(1);
  });

  it("hides the shimmer from assistive technology", () => {
    expect(
      mountBreadcrumbs({ loading: true })
        .find(".kv-breadcrumbs__skeleton")
        .attributes("aria-hidden"),
    ).toBe("true");
  });
});

describe("collapsing on narrow viewports", () => {
  /*
   * The collapse itself is a media query, so what is asserted here is that the
   * ellipsis - the only part of it that needs to be in the DOM - appears
   * exactly when there is something for it to stand in for.
   */
  it("renders an ellipsis once there are more than two crumbs", () => {
    expect(mountBreadcrumbs().find(".kv-breadcrumbs__crumb--ellipsis").exists()).toBe(true);
  });

  it("omits it when the whole trail fits", () => {
    const wrapper = mountBreadcrumbs({ items: ["Home", "Here"] });
    expect(wrapper.find(".kv-breadcrumbs__crumb--ellipsis").exists()).toBe(false);
  });

  it("keeps the ellipsis out of the accessible name", () => {
    expect(
      mountBreadcrumbs().find(".kv-breadcrumbs__ellipsis").attributes("aria-hidden"),
    ).toBe("true");
  });
});

describe("clipboard", () => {
  let writeText;

  beforeEach(() => {
    vi.useFakeTimers();
    writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...globalThis.navigator, clipboard: { writeText } });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders no copy button without a deeplink", () => {
    expect(mountBreadcrumbs().find("button").exists()).toBe(false);
  });

  it("copies the deeplink and emits it", async () => {
    const wrapper = mountBreadcrumbs({ clipboard: "https://example.com/here" });
    await wrapper.find("button").trigger("click");

    expect(writeText).toHaveBeenCalledWith("https://example.com/here");
    expect(wrapper.emitted("copy")).toEqual([["https://example.com/here"]]);
  });

  it("confirms the copy for two seconds, then goes back", async () => {
    const wrapper = mountBreadcrumbs({ clipboard: "/here" });
    const button = wrapper.find("button");
    expect(button.attributes("aria-label")).toBe("Copy link");

    await button.trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".kv-breadcrumbs__copied").exists()).toBe(true);
    expect(wrapper.find("button").attributes("aria-label")).toBe("Copied");

    vi.advanceTimersByTime(2000);
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".kv-breadcrumbs__copied").exists()).toBe(false);
  });

  it("takes translated button labels", () => {
    const wrapper = mountBreadcrumbs({ clipboard: "/here", copyLabel: "Copier" });
    expect(wrapper.find("button").attributes("aria-label")).toBe("Copier");
  });

  it("reports a rejected write rather than claiming success", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const wrapper = mountBreadcrumbs({ clipboard: "/here" });
    await wrapper.find("button").trigger("click");
    await wrapper.vm.$nextTick();

    expect(error).toHaveBeenCalled();
    expect(wrapper.emitted("copy")).toBeUndefined();
    expect(wrapper.find(".kv-breadcrumbs__copied").exists()).toBe(false);
    error.mockRestore();
  });
});
