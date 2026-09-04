/**
 * Behavioural contract for Checkbox and CheckboxGroup, mirroring Kumo's own
 * cases where the behaviour carries over - and pinning the places it does not.
 */

import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";

import Checkbox from "../src/checkbox/Checkbox.vue";
import CheckboxGroup from "../src/checkbox/CheckboxGroup.vue";

const mountCheckbox = (props = {}, options = {}) =>
  mount(Checkbox, { props: { label: "Accept terms", ...props }, ...options });

const control = (wrapper) => wrapper.get('[data-kumo-part="control"]');

describe("rendering", () => {
  it("renders a button carrying the checkbox role", () => {
    const wrapper = mountCheckbox();
    const box = control(wrapper);
    expect(box.element.tagName).toBe("BUTTON");
    expect(box.attributes("role")).toBe("checkbox");
    expect(box.attributes("type")).toBe("button");
    expect(wrapper.attributes("data-kumo-component")).toBe("Checkbox");
  });

  it("associates the label with the control", () => {
    const wrapper = mountCheckbox();
    const label = wrapper.get("label");
    expect(label.text()).toBe("Accept terms");
    expect(label.attributes("for")).toBe(control(wrapper).attributes("id"));
  });

  it("takes a label slot for richer content", () => {
    const wrapper = mountCheckbox(
      { label: "" },
      { slots: { label: '<strong>Accept</strong> the terms' } },
    );
    expect(wrapper.get("label strong").text()).toBe("Accept");
  });

  it("renders no label element when there is nothing to label with", () => {
    const wrapper = mountCheckbox({ label: "" }, { attrs: { "aria-label": "Select row" } });
    expect(wrapper.find("label").exists()).toBe(false);
    expect(control(wrapper).attributes("aria-label")).toBe("Select row");
  });

  it("puts the control before the label, and after it on request", () => {
    expect(mountCheckbox().classes()).not.toContain("kv-checkbox--label-first");
    expect(mountCheckbox({ controlFirst: false }).classes()).toContain(
      "kv-checkbox--label-first",
    );
  });
});

describe("checked state", () => {
  it("starts unchecked", () => {
    expect(control(mountCheckbox()).attributes("aria-checked")).toBe("false");
    expect(control(mountCheckbox()).attributes("data-state")).toBe("unchecked");
  });

  it("reflects the model value", () => {
    const box = control(mountCheckbox({ modelValue: true }));
    expect(box.attributes("aria-checked")).toBe("true");
    expect(box.attributes("data-state")).toBe("checked");
  });

  it("emits the new value on click", async () => {
    const wrapper = mountCheckbox({ modelValue: false });
    await control(wrapper).trigger("click");
    expect(wrapper.emitted("update:modelValue")).toEqual([[true]]);
  });

  it("emits false when unchecking", async () => {
    const wrapper = mountCheckbox({ modelValue: true });
    await control(wrapper).trigger("click");
    expect(wrapper.emitted("update:modelValue")).toEqual([[false]]);
  });

  it("toggles on space, which the primitive owns", async () => {
    const wrapper = mountCheckbox({ modelValue: false });
    await control(wrapper).trigger("keydown", { key: " " });
    await control(wrapper).trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
  });
});

describe("indeterminate", () => {
  it("announces the mixed state", () => {
    const box = control(mountCheckbox({ indeterminate: true }));
    expect(box.attributes("aria-checked")).toBe("mixed");
    expect(box.attributes("data-state")).toBe("indeterminate");
  });

  it("accepts the mixed state through the model value too, as Reka does", () => {
    expect(control(mountCheckbox({ modelValue: "indeterminate" })).attributes("aria-checked")).toBe(
      "mixed",
    );
  });

  it("draws a dash rather than a tick", () => {
    const wrapper = mountCheckbox({ indeterminate: true });
    expect(wrapper.get(".kv-checkbox__indicator path").attributes("d")).toBe("M3.5 8h9");
  });

  it("checks on click, leaving the flag to the caller as Kumo does", async () => {
    const wrapper = mountCheckbox({ indeterminate: true });
    await control(wrapper).trigger("click");
    expect(wrapper.emitted("update:modelValue")).toEqual([[true]]);
  });

  it("keeps the indicator mounted so the box does not resize", () => {
    const wrapper = mountCheckbox();
    expect(wrapper.find(".kv-checkbox__indicator").exists()).toBe(true);
    expect(wrapper.get(".kv-checkbox__indicator").attributes("data-state")).toBe("unchecked");
  });
});

describe("error and description", () => {
  it("draws the error ring alone for Kumo's visual-only variant", () => {
    const wrapper = mountCheckbox({ error: true });
    expect(wrapper.classes()).toContain("kv-checkbox--error");
    expect(control(wrapper).attributes("aria-invalid")).toBe("true");
    expect(wrapper.find(".kv-checkbox__error").exists()).toBe(false);
  });

  it("renders the message when the error is a string", () => {
    const wrapper = mountCheckbox({ error: "Required" });
    const message = wrapper.get(".kv-checkbox__error");
    expect(message.text()).toBe("Required");
    expect(control(wrapper).attributes("aria-describedby")).toBe(message.attributes("id"));
  });

  it("lets the error replace the description", () => {
    const wrapper = mountCheckbox({ description: "We will email you", error: "Required" });
    expect(wrapper.text()).toContain("Required");
    expect(wrapper.text()).not.toContain("We will email you");
  });

  it("describes the control with its description", () => {
    const wrapper = mountCheckbox({ description: "We will email you" });
    const description = wrapper.get(".kv-checkbox__description");
    expect(control(wrapper).attributes("aria-describedby")).toBe(description.attributes("id"));
  });
});

describe("disabled and required", () => {
  it("disables the control", () => {
    const wrapper = mountCheckbox({ disabled: true });
    expect(control(wrapper).attributes("disabled")).toBeDefined();
    expect(wrapper.classes()).toContain("kv-checkbox--disabled");
  });

  it("does not emit while disabled", async () => {
    const wrapper = mountCheckbox({ disabled: true });
    await control(wrapper).trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("marks a required field, and labels an optional one", () => {
    expect(control(mountCheckbox({ required: true })).attributes("aria-required")).toBe("true");
    expect(mountCheckbox({ required: false }).text()).toContain("(optional)");
    expect(mountCheckbox().text()).not.toContain("(optional)");
  });

  it("warns in development when there is no accessible name", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mountCheckbox({ label: "" });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("accessible name"));
    warn.mockRestore();
  });

  it("stays quiet when a name is provided", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mountCheckbox();
    mountCheckbox({ label: "" }, { attrs: { "aria-label": "Select row" } });
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

/* Group */

const OPTIONS = [
  { label: "Email notifications", value: "email" },
  { label: "SMS notifications", value: "sms" },
  { label: "Push notifications", value: "push" },
];

const mountGroup = (props = {}, options = {}) =>
  mount(CheckboxGroup, { props: { items: OPTIONS, ...props }, ...options });

describe("group", () => {
  it("renders a fieldset and legend, which is what makes it a group", () => {
    const wrapper = mountGroup({ legend: "Email preferences" });
    expect(wrapper.element.tagName).toBe("FIELDSET");
    expect(wrapper.get("legend").text()).toBe("Email preferences");
    expect(wrapper.attributes("data-kumo-component")).toBe("CheckboxGroup");
  });

  it("renders one checkbox per item", () => {
    const wrapper = mountGroup();
    const labels = wrapper.findAll(".kv-checkbox__label").map((node) => node.text());
    expect(labels).toEqual(["Email notifications", "SMS notifications", "Push notifications"]);
  });

  it("accepts plain strings, normalised by the shared helper", () => {
    const wrapper = mountGroup({ items: ["Email", "SMS"] });
    expect(wrapper.findAll('[data-kumo-part="control"]')).toHaveLength(2);
  });

  it("checks the boxes named in the model value", () => {
    const wrapper = mountGroup({ modelValue: ["email", "push"] });
    const states = wrapper
      .findAll('[data-kumo-part="control"]')
      .map((box) => box.attributes("data-state"));
    expect(states).toEqual(["checked", "unchecked", "checked"]);
  });

  it("emits the whole array when a box is clicked", async () => {
    const wrapper = mountGroup({ modelValue: ["email"] });
    await wrapper.findAll('[data-kumo-part="control"]')[1].trigger("click");
    expect(wrapper.emitted("update:modelValue")).toEqual([[["email", "sms"]]]);
  });

  it("removes a value when its box is unchecked", async () => {
    const wrapper = mountGroup({ modelValue: ["email", "sms"] });
    await wrapper.findAll('[data-kumo-part="control"]')[0].trigger("click");
    expect(wrapper.emitted("update:modelValue")).toEqual([[["sms"]]]);
  });

  it("leaves every box in the tab order rather than roving focus", () => {
    const wrapper = mountGroup();
    expect(
      wrapper
        .findAll('[data-kumo-part="control"]')
        .every((box) => box.attributes("tabindex") === undefined),
    ).toBe(true);
  });

  it("disables every box at once", () => {
    const wrapper = mountGroup({ disabled: true });
    expect(
      wrapper
        .findAll('[data-kumo-part="control"]')
        .every((box) => box.attributes("disabled") !== undefined),
    ).toBe(true);
  });

  it("honours a single disabled option", () => {
    const wrapper = mountGroup({
      items: [{ label: "Email", value: "email" }, { label: "SMS", value: "sms", disabled: true }],
    });
    const boxes = wrapper.findAll('[data-kumo-part="control"]');
    expect(boxes[0].attributes("disabled")).toBeUndefined();
    expect(boxes[1].attributes("disabled")).toBeDefined();
  });

  it("marks every box invalid when the group has an error", () => {
    const wrapper = mountGroup({ error: "Choose at least one" });
    expect(
      wrapper
        .findAll('[data-kumo-part="control"]')
        .every((box) => box.attributes("aria-invalid") === "true"),
    ).toBe(true);
  });

  it("describes the group with its error, which replaces the description", () => {
    const wrapper = mountGroup({ description: "How to reach you", error: "Choose at least one" });
    const message = wrapper.get(".kv-checkbox-group__error");
    expect(message.text()).toBe("Choose at least one");
    expect(wrapper.attributes("aria-describedby")).toBe(message.attributes("id"));
    expect(wrapper.text()).not.toContain("How to reach you");
  });

  it("describes the group with its description", () => {
    const wrapper = mountGroup({ description: "How to reach you" });
    const description = wrapper.get(".kv-checkbox-group__description");
    expect(wrapper.attributes("aria-describedby")).toBe(description.attributes("id"));
  });

  it("keeps a hidden legend available to screen readers", () => {
    const wrapper = mountGroup({ legend: "Preferences", legendHidden: true });
    const legend = wrapper.get("legend");
    expect(legend.text()).toBe("Preferences");
    expect(legend.classes()).toContain("kv-checkbox-group__legend--hidden");
  });

  it("takes a legend slot for custom presentation", () => {
    const wrapper = mountGroup({}, { slots: { legend: '<span class="mine">Preferences</span>' } });
    expect(wrapper.get("legend .mine").text()).toBe("Preferences");
  });

  it("renders no legend when there is none to render", () => {
    expect(mountGroup().find("legend").exists()).toBe(false);
  });

  it("lets the item slot render the label", () => {
    const wrapper = mountGroup(
      {},
      { slots: { item: '<template #item="{ option }">{{ option.value }}</template>' } },
    );
    expect(wrapper.findAll(".kv-checkbox__label").map((n) => n.text())).toEqual([
      "email",
      "sms",
      "push",
    ]);
  });

  it("passes the label order down to each box", () => {
    const wrapper = mountGroup({ controlFirst: false });
    expect(
      wrapper.findAll(".kv-checkbox").every((box) => box.classes().includes("kv-checkbox--label-first")),
    ).toBe(true);
  });

  it("warns about nothing: every item in a group has a label", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mountGroup();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
