/**
 * Behavioural contract for Switch, RadioGroup, SensitiveInput and TagInput.
 *
 * The look is CSS; what is tested here is what each component decides - the
 * three-state masking in SensitiveInput, the commit rules in TagInput, and the
 * ARIA each of them owes a screen reader.
 */

import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";

import RadioGroup from "../src/radio/RadioGroup.vue";
import SensitiveInput from "../src/sensitive-input/SensitiveInput.vue";
import Switch from "../src/switch/Switch.vue";
import TagInput from "../src/tag-input/TagInput.vue";

describe("Switch", () => {
  const mountSwitch = (props = {}) => mount(Switch, { props: { label: "Caching", ...props } });

  it("is a switch to assistive technology, not a checkbox", () => {
    const button = mountSwitch().find("button");
    expect(button.attributes("role")).toBe("switch");
    expect(button.attributes("aria-checked")).toBe("false");
  });

  it("reports its state both ways", () => {
    expect(mountSwitch({ modelValue: true }).find("button").attributes("aria-checked")).toBe("true");
    expect(mountSwitch({ modelValue: true }).find("button").attributes("data-state")).toBe("checked");
  });

  it("toggles on click", async () => {
    const wrapper = mountSwitch({ modelValue: false });
    await wrapper.find("button").trigger("click");
    expect(wrapper.emitted("update:modelValue").at(-1)).toEqual([true]);
  });

  it("stays put while disabled", async () => {
    const wrapper = mountSwitch({ modelValue: false, disabled: true });
    await wrapper.find("button").trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("points the label at the control", () => {
    const wrapper = mountSwitch();
    expect(wrapper.find("label").attributes("for")).toBe(wrapper.find("button").attributes("id"));
  });

  it("falls back for an unknown size or variant", () => {
    const classes = mountSwitch({ size: "huge", variant: "neon" }).find("button").classes();
    expect(classes).toContain("kv-switch__track--size-base");
    expect(classes).toContain("kv-switch__track--brand");
  });
});

describe("RadioGroup", () => {
  const ITEMS = ["Automatic", "Western Europe"];
  const mountGroup = (props = {}) => mount(RadioGroup, { props: { items: ITEMS, legend: "Region", ...props } });

  it("is a fieldset with a legend, which is what groups the options", () => {
    const wrapper = mountGroup();
    expect(wrapper.element.tagName).toBe("FIELDSET");
    expect(wrapper.find("legend").text()).toBe("Region");
  });

  it("renders one option per item", () => {
    expect(mountGroup().findAll("[data-kumo-part=item]")).toHaveLength(2);
  });

  it("takes objects with their own labels and hints", () => {
    const wrapper = mountGroup({
      items: [{ label: "Free", value: "free", description: "100,000 a day." }],
    });
    expect(wrapper.find(".kv-radio__label").text()).toBe("Free");
    expect(wrapper.find(".kv-radio__hint").text()).toBe("100,000 a day.");
  });

  it("shows the error instead of the description, and marks the group invalid", () => {
    const wrapper = mountGroup({ description: "Helper", error: "Pick one" });
    expect(wrapper.find("[data-kumo-part=description]").exists()).toBe(false);
    expect(wrapper.find("[data-kumo-part=error]").text()).toBe("Pick one");
    expect(wrapper.find("[aria-invalid=true]").exists()).toBe(true);
  });

  it("falls back for an unknown orientation or appearance", () => {
    const classes = mountGroup({ orientation: "diagonal", appearance: "fancy" }).find(".kv-radio-group").classes();
    expect(classes).toContain("kv-radio-group--vertical");
    expect(classes).toContain("kv-radio-group--default");
  });
});

describe("SensitiveInput", () => {
  const mountSecret = (props = {}) => mount(SensitiveInput, { props: { label: "Token", ...props } });

  it("is empty, not masked, with no value to hide", () => {
    const wrapper = mountSecret({ modelValue: "" });
    expect(wrapper.find(".kv-sensitive").classes()).not.toContain("kv-sensitive--masked");
    /* Nothing to reveal or copy, so neither button is offered. */
    expect(wrapper.find("[data-kumo-part=toggle-visibility]").exists()).toBe(false);
    expect(wrapper.find("[data-kumo-part=copy]").exists()).toBe(false);
  });

  it("masks a saved value, and keeps it out of the tab order", () => {
    const wrapper = mountSecret({ modelValue: "sk_live_1" });
    const input = wrapper.find("input");
    expect(wrapper.find(".kv-sensitive").classes()).toContain("kv-sensitive--masked");
    expect(input.attributes("type")).toBe("password");
    expect(input.attributes("readonly")).toBeDefined();
    expect(input.attributes("tabindex")).toBe("-1");
    expect(input.attributes("aria-hidden")).toBe("true");
  });

  it("reveals on a click anywhere in the field", async () => {
    const wrapper = mountSecret({ modelValue: "sk_live_1" });
    await wrapper.find("[data-kumo-part=field]").trigger("click");
    expect(wrapper.find("input").attributes("type")).toBe("text");
  });

  it("re-masks on Escape", async () => {
    const wrapper = mountSecret({ modelValue: "sk_live_1" });
    await wrapper.find("[data-kumo-part=field]").trigger("click");
    await wrapper.find("input").trigger("keydown", { key: "Escape" });
    expect(wrapper.find("input").attributes("type")).toBe("password");
  });

  it("keeps the mask mounted so revealing cannot blur it away", () => {
    /* The mask is hidden by class, never unmounted: unmounting a focused
       element fires focusout, which used to re-mask in the same tick. */
    const wrapper = mountSecret({ modelValue: "sk_live_1" });
    expect(wrapper.find("[data-kumo-part=mask]").exists()).toBe(true);
    expect(wrapper.find("[data-kumo-part=mask]").attributes("aria-hidden")).toBe("true");
  });

  it("reveals what is being typed into an empty field", async () => {
    const wrapper = mountSecret({ modelValue: "" });
    await wrapper.find("input").setValue("abc");
    expect(wrapper.emitted("update:modelValue").at(-1)).toEqual(["abc"]);
    expect(wrapper.find("input").attributes("type")).toBe("text");
  });
});

describe("TagInput", () => {
  const mountTags = (props = {}) => mount(TagInput, { props: { label: "Domains", modelValue: [], ...props } });

  const type = async (wrapper, text) => {
    const input = wrapper.find("input");
    await input.setValue(text);
    return input;
  };

  it("renders one chip per value", () => {
    expect(mountTags({ modelValue: ["a.com", "b.com"] }).findAll("[data-kumo-part=chip]")).toHaveLength(2);
  });

  it("commits on Enter, a comma and Tab", async () => {
    for (const key of ["Enter", ",", "Tab"]) {
      const wrapper = mountTags();
      const input = await type(wrapper, "a.com");
      await input.trigger("keydown", { key });
      expect(wrapper.emitted("update:modelValue").at(-1)).toEqual([["a.com"]]);
    }
  });

  it("commits on blur, because an abandoned value was meant to be added", async () => {
    const wrapper = mountTags();
    const input = await type(wrapper, "a.com");
    await input.trigger("blur");
    expect(wrapper.emitted("update:modelValue").at(-1)).toEqual([["a.com"]]);
  });

  it("ignores blanks and duplicates", async () => {
    const wrapper = mountTags({ modelValue: ["a.com"] });
    const input = await type(wrapper, "   ");
    await input.trigger("keydown", { key: "Enter" });
    await type(wrapper, "a.com");
    await input.trigger("keydown", { key: "Enter" });
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("takes the last chip back into the field on Backspace", async () => {
    const wrapper = mountTags({ modelValue: ["a.com", "b.com"] });
    await wrapper.find("input").trigger("keydown", { key: "Backspace" });
    expect(wrapper.emitted("update:modelValue").at(-1)).toEqual([["a.com"]]);
    /* Back in the field rather than gone, so a mistaken press is undoable. */
    expect(wrapper.find("input").element.value).toBe("b.com");
  });

  it("refuses to pass max-values, and says why", async () => {
    const wrapper = mountTags({ modelValue: ["a.com"], maxValues: 1 });
    const input = await type(wrapper, "b.com");
    await input.trigger("keydown", { key: "Enter" });
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    expect(wrapper.find("[data-kumo-part=error]").text()).toBe("Limit of 1 tags reached.");
  });

  it("removes a chip from its button", async () => {
    const wrapper = mountTags({ modelValue: ["a.com", "b.com"] });
    await wrapper.findAll("[data-kumo-part=chip] button")[0].trigger("click");
    expect(wrapper.emitted("update:modelValue").at(-1)).toEqual([["b.com"]]);
  });

  it("splits a pasted list", async () => {
    const wrapper = mountTags();
    await wrapper.find("input").trigger("paste", {
      clipboardData: { getData: () => "a.com, b.com" },
    });
    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
  });
});
