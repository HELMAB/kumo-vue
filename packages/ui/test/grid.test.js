import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";

import Grid from "../src/grid/Grid.vue";
import GridItem from "../src/grid/GridItem.vue";

const mountGrid = (props = {}) =>
  mount(Grid, { props, slots: { default: () => [h(GridItem, () => "One"), h(GridItem, () => "Two")] } });

describe("Grid", () => {
  it("defaults to the base gap and no column preset", () => {
    const wrapper = mountGrid();
    expect(wrapper.classes()).toEqual(["kv-grid", "kv-grid--gap-base"]);
  });

  it("applies the variant and gap", () => {
    const wrapper = mountGrid({ variant: "3up", gap: "sm" });
    expect(wrapper.classes()).toContain("kv-grid--3up");
    expect(wrapper.classes()).toContain("kv-grid--gap-sm");
  });

  it("falls back to 2up and base for unknown values", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const wrapper = mountGrid({ variant: "9up", gap: "huge" });
    expect(wrapper.classes()).toContain("kv-grid--2up");
    expect(wrapper.classes()).toContain("kv-grid--gap-base");
    warn.mockRestore();
  });
});

describe("GridItem", () => {
  it("adds the mobile divider on the 4up variant only", () => {
    const divided = mountGrid({ variant: "4up", mobileDivider: true });
    expect(divided.findAll(".kv-grid-item--divider")).toHaveLength(2);

    const plain = mountGrid({ variant: "3up", mobileDivider: true });
    expect(plain.findAll(".kv-grid-item--divider")).toHaveLength(0);
  });

  it("renders outside a Grid", () => {
    expect(mount(GridItem, { slots: { default: "Cell" } }).text()).toBe("Cell");
  });
});
