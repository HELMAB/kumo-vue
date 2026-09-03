/**
 * Behavioural contract for Select.
 *
 * Keyboard navigation, typeahead and popup positioning belong to Reka's Select
 * primitive. What is tested here is what this component decides: how values
 * are turned back into labels for the trigger, how the field furniture is
 * wired for assistive technology, and the required/optional convention.
 *
 * The popup is held closed throughout - opening it starts floating-ui's
 * auto-update loop, which jsdom cannot settle.
 */

import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import Select from "../src/select/Select.vue";

const FRUITS = ["Apple", "Banana", "Cherry"];

const mountSelect = (props = {}, options = {}) =>
  mount(Select, { props: { items: FRUITS, open: false, ...props }, ...options });

describe("rendering", () => {
  it("renders a button trigger", () => {
    const trigger = mountSelect().find("button");
    expect(trigger.exists()).toBe(true);
    expect(trigger.attributes("data-kumo-part")).toBe("trigger");
  });

  it("carries the component data attribute", () => {
    expect(mountSelect().attributes("data-kumo-component")).toBe("Select");
  });

  it("applies the size class, defaulting to base", () => {
    expect(mountSelect().classes()).toContain("kv-select--size-base");
    expect(mountSelect({ size: "lg" }).classes()).toContain("kv-select--size-lg");
  });

  it("forwards unrecognised attributes to the trigger, not the wrapper", () => {
    const wrapper = mountSelect({}, { attrs: { name: "fruit" } });
    expect(wrapper.find("button").attributes("name")).toBe("fruit");
    expect(wrapper.attributes("name")).toBeUndefined();
  });

  it("disables the trigger", () => {
    expect(mountSelect({ disabled: true }).find("button").attributes("disabled")).toBeDefined();
  });
});

describe("the trigger's displayed value", () => {
  it("shows the placeholder when nothing is selected", () => {
    const wrapper = mountSelect({ placeholder: "Choose a fruit" });
    expect(wrapper.text()).toContain("Choose a fruit");
    expect(wrapper.find(".kv-select__value").classes()).toContain(
      "kv-select__value--placeholder",
    );
  });

  it("shows the selected value", () => {
    const wrapper = mountSelect({ modelValue: "Banana" });
    expect(wrapper.find(".kv-select__value").text()).toBe("Banana");
    expect(wrapper.find(".kv-select__value").classes()).not.toContain(
      "kv-select__value--placeholder",
    );
  });

  it("resolves a value to its label rather than showing the raw value", () => {
    const wrapper = mountSelect({
      items: [{ label: "Workers", value: "workers" }],
      modelValue: "workers",
    });
    expect(wrapper.find(".kv-select__value").text()).toBe("Workers");
  });

  it("joins several labels when multiple", () => {
    const wrapper = mountSelect({
      items: [
        { label: "Workers", value: "workers" },
        { label: "Pages", value: "pages" },
      ],
      multiple: true,
      modelValue: ["workers", "pages"],
    });
    expect(wrapper.find(".kv-select__value").text()).toBe("Workers, Pages");
  });

  it("falls back to the placeholder for an empty multiple selection", () => {
    const wrapper = mountSelect({ multiple: true, modelValue: [], placeholder: "Any" });
    expect(wrapper.text()).toContain("Any");
  });

  it("falls back to the raw value when it matches no option", () => {
    const wrapper = mountSelect({ modelValue: "Durian" });
    expect(wrapper.find(".kv-select__value").text()).toBe("Durian");
  });

  it("shows a shimmer instead of the value while loading, and blocks interaction", () => {
    const wrapper = mountSelect({ modelValue: "Apple", loading: true });
    expect(wrapper.find(".kv-select__skeleton").exists()).toBe(true);
    expect(wrapper.find(".kv-select__value").exists()).toBe(false);
    expect(wrapper.find("button").attributes("disabled")).toBeDefined();
  });
});

describe("the field", () => {
  it("associates the label with the trigger", () => {
    const wrapper = mountSelect({ label: "Fruit" });
    const label = wrapper.find("label");
    expect(label.attributes("for")).toBe(wrapper.find("button").attributes("id"));
    expect(wrapper.find("button").attributes("aria-labelledby")).toBe(
      label.attributes("id"),
    );
  });

  it("marks required with an asterisk", () => {
    const wrapper = mountSelect({ label: "Fruit", required: true });
    expect(wrapper.find(".kv-select__required").exists()).toBe(true);
    expect(wrapper.find(".kv-select__optional").exists()).toBe(false);
  });

  it("labels an explicitly optional field, as Kumo does", () => {
    const wrapper = mountSelect({ label: "Fruit", required: false });
    expect(wrapper.find(".kv-select__optional").text()).toBe("(optional)");
    expect(wrapper.find(".kv-select__required").exists()).toBe(false);
  });

  it("shows neither when required is left unset", () => {
    /* Distinguishing unset from false is why `required` has no default. */
    const wrapper = mountSelect({ label: "Fruit" });
    expect(wrapper.find(".kv-select__required").exists()).toBe(false);
    expect(wrapper.find(".kv-select__optional").exists()).toBe(false);
  });

  it("points aria-describedby at the description", () => {
    const wrapper = mountSelect({ description: "Pick one" });
    expect(wrapper.find("button").attributes("aria-describedby")).toBe(
      wrapper.find(".kv-select__description").attributes("id"),
    );
  });

  it("marks the field invalid and describes it by the error", () => {
    const wrapper = mountSelect({ error: "Required" });
    const trigger = wrapper.find("button");
    expect(trigger.attributes("aria-invalid")).toBe("true");
    expect(trigger.attributes("aria-describedby")).toBe(
      wrapper.find(".kv-select__error").attributes("id"),
    );
    expect(wrapper.classes()).toContain("kv-select--error");
  });

  it("shows the error instead of the description when both are given", () => {
    const wrapper = mountSelect({ description: "Helper", error: "Broken" });
    expect(wrapper.find(".kv-select__error").text()).toBe("Broken");
    expect(wrapper.find(".kv-select__description").exists()).toBe(false);
  });

  it("sets neither aria-invalid nor a description when the field is clean", () => {
    const trigger = mountSelect().find("button");
    expect(trigger.attributes("aria-invalid")).toBeUndefined();
    expect(trigger.attributes("aria-describedby")).toBeUndefined();
  });
});
