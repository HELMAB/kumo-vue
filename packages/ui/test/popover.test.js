import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { h } from "vue";

import Popover from "../src/popover/Popover.vue";

const mounted = [];
const mountPopover = (props = {}, slots = {}) => {
  const wrapper = mount(Popover, {
    props: { to: "body", ...props },
    slots: { trigger: () => h("button", { type: "button" }, "Open"), ...slots },
    attachTo: document.body,
  });
  mounted.push(wrapper);
  return wrapper;
};

const popup = () => document.body.querySelector('[data-kumo-part="popup"]');

afterEach(() => {
  vi.useRealTimers();
  mounted.splice(0).forEach((w) => w.unmount());
});

describe("Popover", () => {
  it("marks the trigger and opens on click", async () => {
    const wrapper = mountPopover({ title: "Notifications" });
    const trigger = wrapper.find("button");
    expect(trigger.attributes("data-kumo-part")).toBe("trigger");
    expect(popup()).toBeNull();

    await trigger.trigger("click");
    await flushPromises();
    expect(popup()).not.toBeNull();
    expect(wrapper.emitted("update:open")).toEqual([[true]]);
  });

  it("names and describes the popup with its title and description", async () => {
    mountPopover({ open: true, title: "Notifications", description: "You are all caught up." });
    await flushPromises();
    const el = popup();
    const title = document.getElementById(el.getAttribute("aria-labelledby"));
    const description = document.getElementById(el.getAttribute("aria-describedby"));
    expect(el.getAttribute("role")).toBe("dialog");
    expect(title.tagName).toBe("H2");
    expect(title.textContent).toBe("Notifications");
    expect(description.textContent).toBe("You are all caught up.");
  });

  it("renders the arrow unless turned off", async () => {
    mountPopover({ open: true });
    await flushPromises();
    expect(popup().querySelectorAll('[data-kumo-part="arrow"] path')).toHaveLength(3);

    mounted.splice(0).forEach((w) => w.unmount());
    mountPopover({ open: true, arrow: false });
    await flushPromises();
    expect(popup().querySelector('[data-kumo-part="arrow"]')).toBeNull();
  });

  it("hands close to the content slot", async () => {
    const wrapper = mountPopover(
      { defaultOpen: true },
      { default: ({ close }) => h("button", { class: "close", onClick: close }, "Close") },
    );
    await flushPromises();
    popup().querySelector(".close").click();
    await flushPromises();
    expect(wrapper.emitted("update:open").at(-1)).toEqual([false]);
  });

  it("opens on hover after the delay when openOnHover is set", async () => {
    vi.useFakeTimers();
    const wrapper = mountPopover({ openOnHover: true, delay: 200 });
    await wrapper.find("button").trigger("pointerenter");
    vi.advanceTimersByTime(199);
    expect(wrapper.emitted("update:open")).toBeUndefined();
    vi.advanceTimersByTime(1);
    expect(wrapper.emitted("update:open")).toEqual([[true]]);
  });

  it("does not open on hover by default", async () => {
    vi.useFakeTimers();
    const wrapper = mountPopover();
    await wrapper.find("button").trigger("pointerenter");
    vi.advanceTimersByTime(1000);
    expect(wrapper.emitted("update:open")).toBeUndefined();
  });
});
