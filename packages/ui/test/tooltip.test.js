import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { h, nextTick } from "vue";

import Tooltip from "../src/tooltip/Tooltip.vue";

const mountTooltip = (props = {}) =>
  mount(Tooltip, {
    props: { content: "Add new item", to: "body", ...props },
    slots: { default: () => h("button", { type: "button" }, "Add") },
    attachTo: document.body,
  });

const popup = () => document.body.querySelector(".kv-tooltip");

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("Tooltip", () => {
  it("renders the trigger as itself, with a default cursor", () => {
    const wrapper = mountTooltip();
    const trigger = wrapper.find("button");
    expect(trigger.classes()).toContain("kv-tooltip__trigger");
    expect(trigger.attributes("data-kumo-component")).toBe("Tooltip");
  });

  it("shows the content with the arrow when open", async () => {
    mountTooltip({ open: true });
    await flushPromises();
    expect(popup().textContent).toContain("Add new item");
    expect(popup().querySelectorAll(".kv-tooltip__arrow path")).toHaveLength(3);
  });

  it("renders nothing without content or when disabled", async () => {
    mountTooltip({ open: true, content: "" });
    await flushPromises();
    expect(popup()).toBeNull();

    mountTooltip({ open: true, disabled: true });
    await flushPromises();
    expect(popup()).toBeNull();
  });

  it("holds the tooltip open for closeDelay after it would close", async () => {
    vi.useFakeTimers();
    const wrapper = mountTooltip({ closeDelay: 500 });
    const root = wrapper.findComponent({ name: "TooltipRoot" });

    root.vm.$emit("update:open", true);
    await nextTick();
    root.vm.$emit("update:open", false);
    await nextTick();
    expect(wrapper.emitted("update:open")).toEqual([[true]]);

    vi.advanceTimersByTime(500);
    await nextTick();
    expect(wrapper.emitted("update:open")).toEqual([[true], [false]]);
  });
});
