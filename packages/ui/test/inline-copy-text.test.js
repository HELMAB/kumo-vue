import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { h } from "vue";

import InlineCopyText from "../src/inline-copy-text/InlineCopyText.vue";

const ID = "f86b3f10-32e9-4db7-ae95-84a1b2c3d4e5";
let writeText;

beforeEach(() => {
  writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
});

afterEach(() => vi.useRealTimers());

const mountCopy = (options = {}) => mount(InlineCopyText, { slots: { default: ID }, ...options });

describe("InlineCopyText", () => {
  it("renders string content as an accessible copy button", () => {
    const wrapper = mountCopy();
    expect(wrapper.element.tagName).toBe("BUTTON");
    expect(wrapper.attributes("type")).toBe("button");
    expect(wrapper.attributes("aria-label")).toBe("Copy to clipboard");
    expect(wrapper.attributes("data-kumo-component")).toBe("InlineCopyText");
    expect(wrapper.find(".kv-text--mono-secondary").text()).toBe(ID);
  });

  it("copies the string content and announces success", async () => {
    const wrapper = mountCopy();
    await wrapper.trigger("click");
    await flushPromises();
    expect(writeText).toHaveBeenCalledWith(ID);
    expect(wrapper.attributes("aria-label")).toBe("Copied");
    expect(wrapper.find("[aria-live]").text()).toBe("Copied");
    expect(wrapper.emitted("copy")).toHaveLength(1);
  });

  it("copies value instead of the content when provided", async () => {
    const wrapper = mountCopy({ props: { value: "other" } });
    await wrapper.trigger("click");
    await flushPromises();
    expect(writeText).toHaveBeenCalledWith("other");
  });

  it("renders rich content with Text props and copies value", async () => {
    const wrapper = mount(InlineCopyText, {
      props: { value: ID, variant: "body", size: "sm", bold: true, as: "span" },
      slots: { default: () => h("strong", "f86b3f10…") },
    });
    const text = wrapper.find(".kv-text");
    expect(text.element.tagName).toBe("SPAN");
    expect(text.classes()).toEqual(expect.arrayContaining(["kv-text--body", "kv-text--size-sm", "kv-text--bold", "kv-text--truncate"]));
    await wrapper.trigger("click");
    await flushPromises();
    expect(writeText).toHaveBeenCalledWith(ID);
  });

  it("throws when rich content has no value", () => {
    const error = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => mount(InlineCopyText, { slots: { default: () => h("strong", "x") } })).toThrow(/requires a value prop/);
    error.mockRestore();
  });

  it("supports localized accessible labels", async () => {
    const wrapper = mountCopy({ props: { labels: { copyAction: "Copy database ID", copied: "Database ID copied" } } });
    expect(wrapper.attributes("aria-label")).toBe("Copy database ID");
    await wrapper.trigger("click");
    await flushPromises();
    expect(wrapper.attributes("aria-label")).toBe("Database ID copied");
  });

  it("calls the consumer click handler once, then copies", async () => {
    const onClick = vi.fn();
    const wrapper = mountCopy({ attrs: { onClick } });
    await wrapper.trigger("click");
    await flushPromises();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledTimes(1);
  });

  it("does not copy when the consumer prevents the click", async () => {
    const wrapper = mountCopy({ attrs: { onClick: (event) => event.preventDefault() } });
    await wrapper.trigger("click");
    await flushPromises();
    expect(writeText).not.toHaveBeenCalled();
  });

  it("keeps the copy label when writing to the clipboard fails", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const wrapper = mountCopy();
    await wrapper.trigger("click");
    await flushPromises();
    expect(wrapper.attributes("aria-label")).toBe("Copy to clipboard");
    expect(wrapper.emitted("copy")).toBeUndefined();
    warn.mockRestore();
  });

  it("resets copied feedback after the last click", async () => {
    vi.useFakeTimers();
    const wrapper = mountCopy();
    await wrapper.trigger("click");
    await flushPromises();
    vi.advanceTimersByTime(1000);
    await wrapper.trigger("click");
    await flushPromises();
    vi.advanceTimersByTime(1000);
    await flushPromises();
    expect(wrapper.attributes("aria-label")).toBe("Copied");
    vi.advanceTimersByTime(500);
    await flushPromises();
    expect(wrapper.attributes("aria-label")).toBe("Copy to clipboard");
  });

  it("merges custom classes", () => {
    expect(mountCopy({ attrs: { class: "custom" } }).classes()).toEqual(expect.arrayContaining(["kv-inline-copy-text", "custom"]));
  });
});
