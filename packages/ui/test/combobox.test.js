import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";

import Combobox from "../src/combobox/Combobox.vue";

const fruits = ["Apple", "Banana", "Cherry"];
const mounted = [];

const mountCombobox = (props = {}, slots) => {
  const wrapper = mount(Combobox, {
    props: { items: fruits, to: "body", ...props },
    slots,
    attachTo: document.body,
  });
  mounted.push(wrapper);
  return wrapper;
};

const items = () => [...document.body.querySelectorAll('[data-kumo-part="item"]')];

afterEach(() => mounted.splice(0).forEach((w) => w.unmount()));

describe("Combobox", () => {
  it("renders an input trigger showing the selected label, with clear and caret controls", async () => {
    const wrapper = mountCombobox({ modelValue: "Apple", placeholder: "Please select" });
    const input = wrapper.find("input");
    expect(input.element.value).toBe("Apple");
    expect(input.classes()).toEqual(expect.arrayContaining(["kv-input", "kv-input--size-base"]));
    expect(wrapper.find('[data-kumo-part="clear"]').attributes("aria-label")).toBe("Clear selection");
    expect(wrapper.find('button[data-kumo-part="trigger"]').attributes("aria-label")).toBe("Show options");
  });

  it("hides the clear control with no value", () => {
    expect(mountCombobox().find('[data-kumo-part="clear"]').exists()).toBe(false);
  });

  it("opens the list and selects an item", async () => {
    const wrapper = mountCombobox({ open: true });
    await flushPromises();
    expect(items().map((el) => el.textContent.trim())).toEqual(fruits);
    items()[1].click();
    await flushPromises();
    expect(wrapper.emitted("update:modelValue").at(-1)).toEqual(["Banana"]);
  });

  it("renders a value trigger with a placeholder and search inside the popup", async () => {
    const wrapper = mountCombobox({ trigger: "value", placeholder: "Select a fruit", searchPlaceholder: "Search", open: true });
    await flushPromises();
    const trigger = wrapper.find('[data-kumo-part="trigger"]');
    expect(trigger.text()).toBe("Select a fruit");
    expect(trigger.attributes("data-placeholder")).toBe("");
    expect(document.body.querySelector(".kv-combobox__search").getAttribute("placeholder")).toBe("Search");
  });

  it("shows the selection in the value trigger", () => {
    const wrapper = mountCombobox({ trigger: "value", items: [{ label: "PostgreSQL", value: "postgres" }], modelValue: "postgres" });
    expect(wrapper.find('[data-kumo-part="trigger"]').text()).toBe("PostgreSQL");
  });

  it("renders groups with labels", async () => {
    mountCombobox({ open: true, items: [{ label: "Asia", items: ["Japan"] }, { label: "Europe", items: ["France"] }] });
    await flushPromises();
    const labels = [...document.body.querySelectorAll(".kv-combobox__group-label")].map((el) => el.textContent.trim());
    expect(labels).toEqual(["Asia", "Europe"]);
  });

  it("renders chips for multiple values and removes them", async () => {
    const wrapper = mountCombobox({ multiple: true, modelValue: ["Apple", "Cherry"], placeholder: "Select" });
    const chips = wrapper.findAll('[data-kumo-part="chip"]');
    expect(chips.map((c) => c.text())).toEqual(["Apple", "Cherry"]);
    await chips[0].find('[data-kumo-part="chip-remove"]').trigger("click");
    expect(wrapper.emitted("update:modelValue").at(-1)).toEqual([["Cherry"]]);

    await wrapper.find("input").trigger("keydown", { key: "Backspace" });
    expect(wrapper.emitted("update:modelValue").at(-1)).toEqual([["Apple"]]);
  });

  it("wraps the control in a field with label, description and error", () => {
    const wrapper = mountCombobox({ label: "Fruit", description: "Pick one", required: false });
    expect(wrapper.find("label").text()).toContain("Fruit");
    expect(wrapper.find("label").text()).toContain("(optional)");
    expect(wrapper.find(".kv-combobox__message").text()).toBe("Pick one");

    const errored = mountCombobox({ label: "Fruit", description: "Pick one", error: "Required" });
    expect(errored.find(".kv-combobox__message--error").text()).toBe("Required");
    expect(errored.find("input").attributes("aria-invalid")).toBe("true");
    expect(errored.find("input").classes()).toContain("kv-input--error");
  });

  it("disables the control", () => {
    const wrapper = mountCombobox({ disabled: true });
    expect(wrapper.find("input").attributes("disabled")).toBeDefined();
    expect(wrapper.find(".kv-combobox__field").attributes("data-disabled")).toBe("");
  });
  it("opens the popup search empty even with a selection", async () => {
    mountCombobox({ trigger: "value", items: [{ label: "English", value: "en" }], modelValue: "en", open: true });
    await flushPromises();
    expect(document.body.querySelector(".kv-combobox__search").value).toBe("");
  });

  it("anchors the multiple popup to the text input, not the chip box", async () => {
    vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
    const wrapper = mountCombobox({ multiple: true, modelValue: ["Apple"] });
    const rect = (width) => ({ x: 0, y: 0, top: 0, left: 0, right: width, bottom: 20, width, height: 20, toJSON() {} });
    wrapper.find(".kv-combobox__chips").element.getBoundingClientRect = () => rect(400);
    wrapper.find(".kv-combobox__chips-input").element.getBoundingClientRect = () => rect(123);
    await wrapper.setProps({ open: true });
    await flushPromises();
    await new Promise((resolve) => setTimeout(resolve, 50));
    const popup = document.body.querySelector('[data-kumo-part="popup"]');
    expect(popup.closest("[data-reka-popper-content-wrapper]").style.getPropertyValue("--reka-popper-anchor-width")).toBe("123px");
    vi.unstubAllGlobals();
  });
});
