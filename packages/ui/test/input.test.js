/**
 * Behavioural contract for Input and InputArea.
 *
 * The size scale is CSS, so what is tested here is what the component decides:
 * when a bare control becomes a field, how the label, description and error
 * are wired for assistive technology, and the rule that an error turns on the
 * error treatment without anyone asking for it.
 *
 * `measure` is tested directly rather than through a mounted textarea, because
 * jsdom runs no layout: a real textarea there reports a scrollHeight of 0 and
 * would only ever prove that 0 is 0.
 */

import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import Input from "../src/input/Input.vue";
import InputArea from "../src/input-area/InputArea.vue";
import { measure, resolveLineHeight } from "../src/input-area/useAutoResize.js";

const mountInput = (props = {}) => mount(Input, { props: { "aria-label": "Field", ...props } });

describe("Input rendering", () => {
  it("renders an input carrying the component data attribute", () => {
    const wrapper = mountInput();
    expect(wrapper.find("input").exists()).toBe(true);
    expect(wrapper.attributes("data-kumo-component")).toBe("Input");
  });

  it("applies the size class, and falls back for an unknown one", () => {
    expect(mountInput({ size: "lg" }).find("input").classes()).toContain("kv-input--size-lg");
    expect(mountInput({ size: "enormous" }).find("input").classes()).toContain("kv-input--size-base");
  });

  it("takes itself out of the layout when there is nothing to stack", () => {
    expect(mountInput().classes()).toContain("kv-input-field--bare");
    expect(mountInput({ label: "Email" }).classes()).not.toContain("kv-input-field--bare");
  });
});

describe("Input field furniture", () => {
  it("points the label at the input", () => {
    const wrapper = mountInput({ label: "Email" });
    expect(wrapper.find("label").attributes("for")).toBe(wrapper.find("input").attributes("id"));
  });

  it("lets a caller-supplied id win, and follows it with the label", () => {
    const wrapper = mountInput({ label: "Email", id: "email" });
    expect(wrapper.find("input").attributes("id")).toBe("email");
    expect(wrapper.find("label").attributes("for")).toBe("email");
  });

  it("describes the input by its description", () => {
    const wrapper = mountInput({ description: "We only use this for receipts." });
    expect(wrapper.find("input").attributes("aria-describedby"))
      .toBe(wrapper.find("[data-kumo-part=description]").attributes("id"));
  });

  it("shows the error instead of the description, and marks the field invalid", () => {
    const wrapper = mountInput({ description: "Helper", error: "Too short" });
    expect(wrapper.find("[data-kumo-part=description]").exists()).toBe(false);
    expect(wrapper.find("[data-kumo-part=error]").text()).toBe("Too short");
    expect(wrapper.find("input").attributes("aria-invalid")).toBe("true");
  });

  it("turns on the error treatment from the message alone", () => {
    expect(mountInput({ error: "Nope" }).find("input").classes()).toContain("kv-input--error");
  });

  it("keeps an explicit variant over the message", () => {
    const wrapper = mountInput({ variant: "default", error: "Nope" });
    expect(wrapper.find("input").classes()).not.toContain("kv-input--error");
  });

  it("marks required, and labels the other case optional", () => {
    expect(mountInput({ label: "A", required: true }).find(".kv-input-field__required").exists()).toBe(true);
    expect(mountInput({ label: "A", required: false }).find(".kv-input-field__optional").text()).toBe("(optional)");
    const neither = mountInput({ label: "A" });
    expect(neither.find(".kv-input-field__required").exists()).toBe(false);
    expect(neither.find(".kv-input-field__optional").exists()).toBe(false);
  });
});

describe("Input value", () => {
  it("emits the new value on input", async () => {
    const wrapper = mountInput();
    await wrapper.find("input").setValue("hello");
    expect(wrapper.emitted("update:modelValue").at(-1)).toEqual(["hello"]);
  });

  it("emits password-manager opt-outs only when asked", () => {
    expect(mountInput().find("input").attributes("data-1p-ignore")).toBeUndefined();
    expect(mountInput({ passwordManagerIgnore: true }).find("input").attributes("data-lpignore")).toBe("true");
  });
});

describe("InputArea", () => {
  const mountArea = (props = {}) => mount(InputArea, { props: { "aria-label": "Notes", ...props } });

  it("renders a textarea wearing the input styling", () => {
    const area = mountArea().find("textarea");
    expect(area.classes()).toContain("kv-input");
    expect(area.classes()).toContain("kv-input-area");
  });

  it("treats min-rows as the starting height when auto-resizing", () => {
    expect(mountArea({ autoResize: true, minRows: 3 }).find("textarea").attributes("rows")).toBe("3");
    expect(mountArea({ rows: 5 }).find("textarea").attributes("rows")).toBe("5");
  });

  it("drops the resize handle only while auto-resizing", () => {
    expect(mountArea({ autoResize: true }).find("textarea").classes()).toContain("kv-input-area--auto");
    expect(mountArea().find("textarea").classes()).not.toContain("kv-input-area--auto");
  });
});

describe("auto-resize measurement", () => {
  const style = {
    borderTopWidth: "1px", borderBottomWidth: "1px",
    paddingTop: "8px", paddingBottom: "8px",
    boxSizing: "border-box", fontSize: "14px", lineHeight: "20px",
  };

  it("adds the borders back for a border-box element", () => {
    const { height } = measure({ scrollHeight: 100, style, minRows: 0, maxRows: 0 });
    expect(height).toBe(102);
  });

  it("takes the padding off for a content-box element", () => {
    const { height } = measure({
      scrollHeight: 100, style: { ...style, boxSizing: "content-box" }, minRows: 0, maxRows: 0,
    });
    expect(height).toBe(84);
  });

  it("holds the floor at min-rows", () => {
    const { height } = measure({ scrollHeight: 10, style, minRows: 3, maxRows: 0 });
    expect(height).toBe(20 * 3 + 18);
  });

  it("clamps at max-rows and hands the overflow to a scrollbar", () => {
    const result = measure({ scrollHeight: 1000, style, minRows: 1, maxRows: 4 });
    expect(result.height).toBe(20 * 4 + 18);
    expect(result.overflowY).toBe("auto");
  });

  it("keeps the overflow hidden while there is room to grow", () => {
    expect(measure({ scrollHeight: 40, style, minRows: 1, maxRows: 10 }).overflowY).toBe("hidden");
  });

  it("survives a line-height jsdom reports as a word or a multiplier", () => {
    expect(resolveLineHeight({ fontSize: "14px", lineHeight: "normal" })).toBeCloseTo(16.8);
    expect(resolveLineHeight({ fontSize: "14px", lineHeight: "1.5" })).toBe(21);
    expect(resolveLineHeight({ fontSize: "14px", lineHeight: "20px" })).toBe(20);
  });
});
