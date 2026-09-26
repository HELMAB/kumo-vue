import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref } from "vue";

import TableOfContents from "../src/table-of-contents/TableOfContents.vue";
import TableOfContentsGroup from "../src/table-of-contents/TableOfContentsGroup.vue";
import TableOfContentsItem from "../src/table-of-contents/TableOfContentsItem.vue";
import TableOfContentsList from "../src/table-of-contents/TableOfContentsList.vue";
import TableOfContentsTitle from "../src/table-of-contents/TableOfContentsTitle.vue";
import { useTableOfContentsActiveId } from "../src/table-of-contents/useTableOfContentsActiveId.js";

describe("TableOfContents", () => {
  it("renders a nav with a default label that can be overridden", () => {
    expect(mount(TableOfContents).attributes("aria-label")).toBe("Table of contents");
    expect(mount(TableOfContents, { attrs: { "aria-label": "Sections" } }).attributes("aria-label")).toBe("Sections");
  });

  it("renders the title as a <p> and the list as a <ul>", () => {
    expect(mount(TableOfContentsTitle, { slots: { default: "On this page" } }).element.tagName).toBe("P");
    expect(mount(TableOfContentsList).element.tagName).toBe("UL");
  });

  it("wraps an item's link in an <li>", () => {
    const wrapper = mount(TableOfContentsItem, { attrs: { href: "#intro" }, slots: { default: "Intro" } });
    const link = wrapper.find("a");
    expect(wrapper.element.tagName).toBe("LI");
    expect(link.attributes("href")).toBe("#intro");
    expect(link.attributes("data-kumo-part")).toBe("item");
    expect(link.attributes("aria-current")).toBeUndefined();
    expect(link.classes()).not.toContain("kv-toc__item--active");
  });

  it("marks the active item with aria-current", () => {
    const link = mount(TableOfContentsItem, { props: { active: true } }).find("a");
    expect(link.attributes("aria-current")).toBe("true");
    expect(link.classes()).toContain("kv-toc__item--active");
  });

  it("renders an item as another element", () => {
    const wrapper = mount(TableOfContentsItem, { props: { as: "button" }, attrs: { type: "button" } });
    expect(wrapper.find("button").classes()).toContain("kv-toc__item");
  });

  it("renders a group without href as a <p> label over a nested list", () => {
    const wrapper = mount(TableOfContentsGroup, { props: { label: "Getting started" } });
    expect(wrapper.element.tagName).toBe("LI");
    expect(wrapper.find("p").text()).toBe("Getting started");
    expect(wrapper.find("ul.kv-toc__nested").exists()).toBe(true);
  });

  it("renders a group with href as an active link and keeps clicks off the <li>", async () => {
    const onClick = vi.fn();
    const wrapper = mount(TableOfContentsGroup, {
      props: { label: "Examples", href: "#examples", active: true },
      attrs: { onClick, "data-test": "group" },
      slots: { default: () => h("li", { class: "child" }, "Child") },
    });
    const link = wrapper.find("a");
    expect(link.attributes("aria-current")).toBe("true");
    expect(link.attributes("data-kumo-part")).toBe("group-link");
    expect(wrapper.attributes("data-test")).toBe("group");

    await wrapper.find(".child").trigger("click");
    expect(onClick).not.toHaveBeenCalled();
    await link.trigger("click");
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("useTableOfContentsActiveId", () => {
  let instances;

  beforeEach(() => {
    instances = [];
    globalThis.IntersectionObserver = class {
      constructor(callback, options) {
        this.callback = callback;
        this.options = options;
        this.targets = [];
        instances.push(this);
      }
      observe(el) {
        this.targets.push(el);
      }
      disconnect() {
        this.disconnected = true;
      }
    };
    document.body.innerHTML = '<h2 id="a">A</h2><h2 id="b">B</h2>';
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
    window.location.hash = "";
  });

  const run = (options) => {
    let result;
    const wrapper = mount(
      defineComponent({
        setup() {
          result = useTableOfContentsActiveId(options);
          return () => h("div");
        },
      }),
    );
    return { result, wrapper };
  };

  const intersect = (observer, id, isIntersecting) =>
    observer.callback([{ target: document.getElementById(id), isIntersecting }]);

  it("activates the topmost intersecting section and keeps it when none are in view", async () => {
    const { result } = run({ ids: ["a", "b"], trackHash: false });
    await nextTick();
    const [observer] = instances;
    expect(observer.targets.map((t) => t.id)).toEqual(["a", "b"]);

    intersect(observer, "b", true);
    expect(result.activeId.value).toBe("b");
    intersect(observer, "a", true);
    expect(result.activeId.value).toBe("a");
    intersect(observer, "a", false);
    expect(result.activeId.value).toBe("b");
    intersect(observer, "b", false);
    expect(result.activeId.value).toBe("b");
  });

  it("applies offset as a negative top rootMargin", async () => {
    run({ ids: ["a"], offset: 56, trackHash: false });
    await nextTick();
    expect(instances[0].options.rootMargin).toBe("-56px 0px 0px 0px");
  });

  it("pins a selected section until scrolling settles", async () => {
    vi.useFakeTimers();
    const { result } = run({ ids: ["a", "b"], trackHash: false });
    await nextTick();
    const [observer] = instances;

    result.selectSection("b");
    intersect(observer, "a", true);
    expect(result.activeId.value).toBe("b");

    vi.advanceTimersByTime(150);
    intersect(observer, "a", true);
    expect(result.activeId.value).toBe("a");
  });

  it("selects the section from location.hash, ignoring untracked ones", async () => {
    window.location.hash = "#b";
    const { result } = run({ ids: ["a", "b"] });
    await nextTick();
    expect(result.activeId.value).toBe("b");

    window.location.hash = "#nope";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    expect(result.activeId.value).toBe("b");
  });

  it("ignores the hash when trackHash is off", async () => {
    window.location.hash = "#b";
    const { result } = run({ ids: ["a", "b"], trackHash: false });
    await nextTick();
    expect(result.activeId.value).toBeNull();
  });

  it("rebuilds the observer when ids change", async () => {
    const ids = ref(["a"]);
    run({ ids, trackHash: false });
    await nextTick();
    ids.value = ["a", "b"];
    await nextTick();
    expect(instances[0].disconnected).toBe(true);
    expect(instances[1].targets).toHaveLength(2);
  });
});
