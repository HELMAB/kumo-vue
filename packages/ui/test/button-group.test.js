import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";

import ButtonGroup from "../src/button-group/ButtonGroup.vue";
import Button from "../src/button/Button.vue";

const mountGroup = (attrs = {}) =>
  mount(ButtonGroup, {
    attrs,
    slots: { default: () => [h(Button, () => "One"), h(Button, () => "Two")] },
  });

describe("ButtonGroup", () => {
  it("renders its children", () => {
    const wrapper = mountGroup();
    expect(wrapper.text()).toContain("One");
    expect(wrapper.text()).toContain("Two");
  });

  it('renders role="group" with the component data attribute', () => {
    const wrapper = mountGroup();
    expect(wrapper.attributes("role")).toBe("group");
    expect(wrapper.attributes("data-kumo-component")).toBe("ButtonGroup");
  });

  it("forwards aria-label to the group", () => {
    expect(mountGroup({ "aria-label": "Deploy" }).attributes("aria-label")).toBe("Deploy");
  });

  it('does not allow role="group" to be overridden', () => {
    expect(mountGroup({ role: "toolbar" }).attributes("role")).toBe("group");
  });

  it("merges a custom class", () => {
    const wrapper = mountGroup({ class: "custom-class" });
    expect(wrapper.classes()).toContain("kv-button-group");
    expect(wrapper.classes()).toContain("custom-class");
  });
});
