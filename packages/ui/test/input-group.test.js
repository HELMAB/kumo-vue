/**
 * Behavioural contract for InputGroup and Label.
 *
 * The interesting decision in InputGroup is `detectFocusMode`: how the group
 * draws its focus follows from what is put inside it, so that rule is tested
 * against vnodes directly as well as through a mounted group.
 */

import { describe, expect, it } from "vitest";
import { Fragment, h } from "vue";
import { mount } from "@vue/test-utils";

import InputGroup from "../src/input-group/InputGroup.vue";
import InputGroupAddon from "../src/input-group/InputGroupAddon.vue";
import InputGroupButton from "../src/input-group/InputGroupButton.vue";
import InputGroupInput from "../src/input-group/InputGroupInput.vue";
import InputGroupSuffix from "../src/input-group/InputGroupSuffix.vue";
import Label from "../src/label/Label.vue";
import { detectFocusMode, partition } from "../src/input-group/context.js";

describe("detectFocusMode", () => {
  const input = () => h(InputGroupInput);
  const addon = () => h(InputGroupAddon);
  const ghost = () => h(InputGroupButton);
  const solid = () => h(InputGroupButton, { variant: "secondary" });

  it("defaults to one ring around everything", () => {
    expect(detectFocusMode([input()])).toBe("container");
    expect(detectFocusMode([addon(), input()])).toBe("container");
    expect(detectFocusMode([input(), h(InputGroupSuffix)])).toBe("container");
  });

  it("keeps a ghost button inside the field", () => {
    expect(detectFocusMode([input(), ghost()])).toBe("container");
  });

  it("splits the row once a button means to sit beside the field", () => {
    expect(detectFocusMode([input(), solid()])).toBe("individual");
  });

  it("goes hybrid when an addon and an attached button are both present", () => {
    expect(detectFocusMode([addon(), input(), solid()])).toBe("hybrid");
  });

  it("sees through the fragments v-if and v-for leave behind", () => {
    /* What the compiler emits for a v-for over the parts. */
    expect(detectFocusMode([addon(), h(Fragment, [input(), solid()])])).toBe("hybrid");
    /* And the bare nested arrays a render function can produce. */
    expect(detectFocusMode([[addon(), [input(), solid()]]])).toBe("hybrid");
  });

  it("ignores plain elements and text", () => {
    expect(detectFocusMode([h("span", "hi"), "text", null, input()])).toBe("container");
  });
});

describe("partition", () => {
  it("sends attached buttons out of the shared-ring zone and leaves ghosts in", () => {
    const nodes = [
      h(InputGroupAddon), h(InputGroupInput),
      h(InputGroupButton), h(InputGroupButton, { variant: "primary" }),
    ];
    const { container, individual } = partition(nodes);
    expect(container).toHaveLength(3);
    expect(individual).toHaveLength(1);
  });
});

describe("InputGroup", () => {
  const mountGroup = (props = {}, children = [h(InputGroupInput)]) =>
    mount(InputGroup, { props, slots: { default: () => children } });

  it("carries the component data attribute", () => {
    expect(mountGroup().attributes("data-kumo-component")).toBe("InputGroup");
  });

  it("applies the size class, and falls back for an unknown one", () => {
    expect(mountGroup({ size: "lg" }).find(".kv-input-group").classes()).toContain("kv-input-group--size-lg");
    expect(mountGroup({ size: "huge" }).find(".kv-input-group").classes()).toContain("kv-input-group--size-base");
  });

  it("is a label only when nothing else labels the input", () => {
    expect(mountGroup().find(".kv-input-group").element.tagName).toBe("LABEL");
    expect(mountGroup({ label: "Email" }).find(".kv-input-group").element.tagName).toBe("DIV");
  });

  it("hands its id, disabled state and error to the input", () => {
    const wrapper = mountGroup({ label: "Email", disabled: true, error: "Taken" });
    const input = wrapper.find("input");
    expect(input.attributes("id")).toBe(wrapper.find("label").attributes("for"));
    expect(input.attributes("disabled")).toBeDefined();
    expect(input.attributes("aria-invalid")).toBe("true");
    expect(input.attributes("aria-describedby"))
      .toBe(wrapper.find("[data-kumo-part=error]").attributes("id"));
  });

  it("lets an explicit focus-mode override what the children imply", () => {
    const wrapper = mountGroup({ focusMode: "individual" }, [h(InputGroupInput)]);
    expect(wrapper.find(".kv-input-group").classes()).toContain("kv-input-group--individual");
  });

  it("builds a shared-ring zone in hybrid mode", () => {
    const wrapper = mountGroup({}, [
      h(InputGroupAddon), h(InputGroupInput), h(InputGroupButton, { variant: "secondary" }),
    ]);
    expect(wrapper.find(".kv-input-group--hybrid").exists()).toBe(true);
    const zone = wrapper.find("[data-kumo-part=zone]");
    expect(zone.find("input").exists()).toBe(true);
    expect(zone.find("[data-kumo-part=button]").exists()).toBe(false);
  });

  it("orders an end addon after the input", () => {
    const wrapper = mount(InputGroupAddon, { props: { align: "end" } });
    expect(wrapper.classes()).toContain("kv-input-group__addon--end");
    expect(wrapper.attributes("data-align")).toBe("end");
  });
});

describe("Label", () => {
  it("renders a label pointing at its control", () => {
    const wrapper = mount(Label, { props: { for: "email", text: "Email" } });
    expect(wrapper.element.tagName).toBe("LABEL");
    expect(wrapper.attributes("for")).toBe("email");
    expect(wrapper.text()).toContain("Email");
  });

  it("marks a field optional", () => {
    const wrapper = mount(Label, { props: { text: "Middle name", showOptional: true } });
    expect(wrapper.find("[data-kumo-part=optional]").text()).toBe("(optional)");
  });

  it("puts the tooltip on a focusable button, not a bare icon", () => {
    const wrapper = mount(Label, { props: { text: "Email", tooltip: "For receipts" } });
    const info = wrapper.find("[data-kumo-part=tooltip]");
    expect(info.exists()).toBe(true);
    expect(info.element.tagName).toBe("BUTTON");
    expect(info.attributes("aria-label")).toBe("More information");
    /* A real Tooltip now, so the text is no longer the native `title`: a
       tooltip that only the OS can draw cannot be styled, positioned or read
       on a touch device. */
    expect(info.attributes("title")).toBeUndefined();
    expect(wrapper.find(".kv-tooltip__trigger").exists()).toBe(true);
  });

  it("renders no info button without a tooltip", () => {
    expect(mount(Label, { props: { text: "Email" } }).find("[data-kumo-part=tooltip]").exists()).toBe(false);
  });

  it("drops the label element, and its type, in content mode", () => {
    const wrapper = mount(Label, { props: { text: "Email", asContent: true, for: "email" } });
    expect(wrapper.element.tagName).toBe("SPAN");
    expect(wrapper.attributes("for")).toBeUndefined();
    expect(wrapper.classes()).toContain("kv-label--content");
  });
});
