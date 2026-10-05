import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";

import Table from "../src/table/Table.vue";
import TableBody from "../src/table/TableBody.vue";
import TableCell from "../src/table/TableCell.vue";
import TableCheckCell from "../src/table/TableCheckCell.vue";
import TableCheckHead from "../src/table/TableCheckHead.vue";
import TableFooter from "../src/table/TableFooter.vue";
import TableHead from "../src/table/TableHead.vue";
import TableHeader from "../src/table/TableHeader.vue";
import TableResizeHandle from "../src/table/TableResizeHandle.vue";
import TableRow from "../src/table/TableRow.vue";

const row = (cells, props = {}) => h(TableRow, props, () => cells);

const mountTable = (props = {}, { header = {}, rows = [h(TableCell, () => "A")] } = {}) =>
  mount(Table, {
    props,
    slots: {
      default: () => [
        h(TableHeader, header, () => row([h(TableHead, () => "Name")])),
        h(TableBody, () => row(rows)),
        h(TableFooter, () => row([h(TableCell, () => "Total")])),
      ],
    },
  });

describe("Table", () => {
  it("renders semantic table sections", () => {
    const wrapper = mountTable();
    expect(wrapper.element.tagName).toBe("TABLE");
    expect(wrapper.attributes("data-kumo-component")).toBe("Table");
    expect(wrapper.find("thead th").text()).toBe("Name");
    expect(wrapper.find("tbody td").text()).toBe("A");
    expect(wrapper.find("tfoot td").text()).toBe("Total");
  });

  it("switches to a fixed layout", () => {
    expect(mountTable().classes()).not.toContain("kv-table--fixed");
    expect(mountTable({ layout: "fixed" }).classes()).toContain("kv-table--fixed");
  });

  it("marks a compact and a sticky header", () => {
    const thead = mountTable({}, { header: { variant: "compact", sticky: true } }).find("thead");
    expect(thead.classes()).toEqual(expect.arrayContaining(["kv-table__header--compact", "kv-table__header--sticky"]));
    expect(thead.attributes("data-compact")).toBe("");
  });

  it("highlights a selected row", () => {
    const wrapper = mount(TableRow, { props: { variant: "selected" } });
    expect(wrapper.classes()).toContain("kv-table__row--selected");
  });

  it("pins sticky cells to a side", () => {
    expect(mount(TableHead, { props: { sticky: "left" } }).classes()).toEqual(
      expect.arrayContaining(["kv-table__sticky", "kv-table__sticky--left"]),
    );
    expect(mount(TableCell, { props: { sticky: "right" } }).classes()).toEqual(
      expect.arrayContaining(["kv-table__sticky", "kv-table__sticky--right"]),
    );
    expect(mount(TableCell).classes()).not.toContain("kv-table__sticky");
  });

  it("renders a labelled resize handle", () => {
    const wrapper = mount(TableResizeHandle);
    expect(wrapper.attributes("type")).toBe("button");
    expect(wrapper.attributes("aria-label")).toBe("Resize column");
  });
});

describe("TableCheckCell and TableCheckHead", () => {
  it("renders a checkbox in a cell and emits update:checked", async () => {
    const wrapper = mount(TableCheckCell, { props: { checked: false } });
    expect(wrapper.element.tagName).toBe("TD");
    const box = wrapper.find('button[role="checkbox"]');
    expect(box.attributes("aria-label")).toBe("Select row");
    await box.trigger("click");
    expect(wrapper.emitted("update:checked")).toEqual([[true]]);
  });

  it("shows the mixed state and the select-all label in the header", () => {
    const wrapper = mount(TableCheckHead, { props: { indeterminate: true } });
    expect(wrapper.element.tagName).toBe("TH");
    const box = wrapper.find('button[role="checkbox"]');
    expect(box.attributes("aria-label")).toBe("Select all rows");
    expect(box.attributes("aria-checked")).toBe("mixed");
  });

  it("disables the checkbox and takes a custom label", () => {
    const box = mount(TableCheckCell, { props: { disabled: true, label: "Select Worker A" } }).find('button[role="checkbox"]');
    expect(box.attributes("disabled")).toBeDefined();
    expect(box.attributes("aria-label")).toBe("Select Worker A");
  });
});
