import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import SkeletonLine from "../src/skeleton-line/SkeletonLine.vue";

const style = (wrapper) => wrapper.find(".kv-skeleton-line").element.style;

describe("SkeletonLine", () => {
  it("picks a width, duration and delay within range", () => {
    for (let i = 0; i < 20; i += 1) {
      const s = style(mount(SkeletonLine, { props: { minWidth: 40, maxWidth: 60 } }));
      const width = parseInt(s.getPropertyValue("--kv-skeleton-width"), 10);
      const duration = parseFloat(s.getPropertyValue("--kv-shimmer-duration"));
      const delay = parseFloat(s.getPropertyValue("--kv-shimmer-delay"));
      expect(width).toBeGreaterThanOrEqual(40);
      expect(width).toBeLessThanOrEqual(60);
      expect(duration).toBeGreaterThanOrEqual(1.3);
      expect(duration).toBeLessThanOrEqual(1.7);
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThanOrEqual(0.5);
    }
  });

  it("renders the line alone by default", () => {
    const wrapper = mount(SkeletonLine, { attrs: { class: "tall" } });
    expect(wrapper.classes()).toEqual(expect.arrayContaining(["kv-skeleton-line", "tall"]));
  });

  it("wraps the line in a centring block for blockHeight", () => {
    const px = mount(SkeletonLine, { props: { blockHeight: 32 } });
    expect(px.classes()).toContain("kv-skeleton-line__block");
    expect(px.element.style.height).toBe("32px");
    expect(px.find(".kv-skeleton-line").exists()).toBe(true);

    expect(mount(SkeletonLine, { props: { blockHeight: "2rem" } }).element.style.height).toBe("2rem");
  });
});
