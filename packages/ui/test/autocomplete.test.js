/**
 * Behavioural contract for Autocomplete.
 *
 * Filtering, keyboard navigation and focus management belong to Reka's
 * Autocomplete primitive and are its tests to run, not ours. What is tested
 * here is what this component actually decides: how items are normalised, how
 * the field furniture is wired for assistive technology, and the free-form
 * value contract.
 */

import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import Autocomplete from "../src/autocomplete/Autocomplete.vue";
import { toGroups, toOption } from "../src/shared/items.js";

const FRUITS = ["Apple", "Banana", "Cherry"];

const mountAc = (props = {}, options = {}) =>
  mount(Autocomplete, { props: { items: FRUITS, ...props }, ...options });

describe("rendering", () => {
  it("renders a combobox input", () => {
    const input = mountAc().find("input");
    expect(input.exists()).toBe(true);
    expect(input.attributes("role")).toBe("combobox");
    expect(input.attributes("aria-autocomplete")).toBe("list");
  });

  it("carries the component data attribute", () => {
    expect(mountAc().attributes("data-kumo-component")).toBe("Autocomplete");
  });

  it("applies the size class, defaulting to base", () => {
    expect(mountAc().classes()).toContain("kv-autocomplete--size-base");
    expect(mountAc({ size: "sm" }).classes()).toContain("kv-autocomplete--size-sm");
  });

  it("passes the placeholder through", () => {
    const wrapper = mountAc({ placeholder: "Search fruits" });
    expect(wrapper.find("input").attributes("placeholder")).toBe("Search fruits");
  });

  it("forwards unrecognised attributes to the input, not the wrapper", () => {
    const wrapper = mountAc({}, { attrs: { name: "fruit", "data-test": "x" } });
    expect(wrapper.find("input").attributes("name")).toBe("fruit");
    expect(wrapper.attributes("name")).toBeUndefined();
  });
});

describe("the field", () => {
  it("associates the label with the input", () => {
    const wrapper = mountAc({ label: "Fruit" });
    const label = wrapper.find("label");
    expect(label.text()).toContain("Fruit");
    expect(label.attributes("for")).toBe(wrapper.find("input").attributes("id"));
  });

  it("renders no label element when none is given", () => {
    expect(mountAc().find("label").exists()).toBe(false);
  });

  it("marks required visually and on the input", () => {
    const wrapper = mountAc({ label: "Fruit", required: true });
    /* The asterisk is decorative - `required` is what assistive tech reads. */
    expect(wrapper.find(".kv-autocomplete__required").attributes("aria-hidden")).toBe("true");
    expect(wrapper.find("input").attributes("required")).toBeDefined();
  });

  it("points aria-describedby at the description", () => {
    const wrapper = mountAc({ description: "Any text is allowed" });
    const description = wrapper.find(".kv-autocomplete__description");
    expect(wrapper.find("input").attributes("aria-describedby")).toBe(
      description.attributes("id"),
    );
  });

  it("marks the field invalid and describes it by the error", () => {
    const wrapper = mountAc({ error: "Required" });
    const input = wrapper.find("input");
    expect(input.attributes("aria-invalid")).toBe("true");
    expect(input.attributes("aria-describedby")).toBe(
      wrapper.find(".kv-autocomplete__error").attributes("id"),
    );
    expect(wrapper.classes()).toContain("kv-autocomplete--error");
  });

  it("shows the error instead of the description when both are given", () => {
    const wrapper = mountAc({ description: "Helper", error: "Broken" });
    expect(wrapper.find(".kv-autocomplete__error").text()).toBe("Broken");
    expect(wrapper.find(".kv-autocomplete__description").exists()).toBe(false);
  });

  it("sets neither aria-invalid nor a description when the field is clean", () => {
    const input = mountAc().find("input");
    expect(input.attributes("aria-invalid")).toBeUndefined();
    expect(input.attributes("aria-describedby")).toBeUndefined();
  });
});

describe("the value is free-form", () => {
  it("shows a value that is not in the item list", () => {
    /* This is the whole distinction from a combobox. */
    const wrapper = mountAc({ modelValue: "Dragonfruit", open: false });
    expect(wrapper.find("input").element.value).toBe("Dragonfruit");
  });

  it("emits update:modelValue as the text changes", async () => {
    /*
     * Held closed: opening starts floating-ui's auto-update loop, which jsdom
     * cannot settle. The popup is Reka's to test; the value contract is ours.
     */
    const wrapper = mountAc({ open: false });
    const input = wrapper.find("input");
    input.element.value = "Ban";
    await input.trigger("input");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["Ban"]);
  });
});

describe("item shapes", () => {
  /*
   * Tested directly rather than by opening the popup: the popup is Reka's, and
   * driving its positioning under jsdom tests the test environment more than
   * the component. What belongs to this component is the normalisation.
   */
  it("accepts plain strings", () => {
    expect(toGroups(FRUITS)[0].options.map((o) => o.label)).toEqual(FRUITS);
  });

  it("accepts label/value objects", () => {
    const [option] = toGroups([{ label: "Workers", value: "workers" }])[0].options;
    expect(option).toMatchObject({ label: "Workers", value: "workers", disabled: false });
  });

  it("falls back to value when an object has no label", () => {
    expect(toOption({ value: "r2" }).label).toBe("r2");
  });

  it("keeps the original item available for the slot", () => {
    const item = { label: "Workers", value: "workers", icon: "w" };
    expect(toOption(item).raw).toBe(item);
  });

  it("marks disabled options", () => {
    expect(toOption({ label: "R2", disabled: true }).disabled).toBe(true);
  });

  it("wraps a flat list in one unlabelled group", () => {
    const groups = toGroups(FRUITS);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("");
  });

  it("keeps groups and their labels", () => {
    const groups = toGroups([
      { label: "Fruit", items: ["Apple"] },
      { label: "Vegetable", items: ["Carrot"] },
    ]);
    expect(groups.map((g) => g.label)).toEqual(["Fruit", "Vegetable"]);
    expect(groups[1].options[0].label).toBe("Carrot");
  });

  it("drops loose items once any group is present", () => {
    /* A loose item has nowhere to sit once headings exist. */
    const groups = toGroups(["Loose", { label: "Fruit", items: ["Apple"] }]);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("Fruit");
  });

  it("handles an empty list", () => {
    expect(toGroups([])).toEqual([{ label: "", options: [] }]);
  });
});
