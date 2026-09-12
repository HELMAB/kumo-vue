/**
 * Behavioural contract for ClipboardText.
 *
 * jsdom has no clipboard at all, so `navigator.clipboard` is stubbed per test
 * and removed again afterwards - which also lets the fallback path be
 * exercised honestly, by taking it away. The bubble is portalled, so
 * assertions about it look at `document.body` rather than the wrapper.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";

import ClipboardText from "../src/clipboard-text/ClipboardText.vue";

const flush = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

const mountField = (props = {}, options = {}) =>
  mount(ClipboardText, {
    props: { text: "0c239dd2", ...props },
    attachTo: document.body,
    ...options,
  });

/** Replaces the clipboard jsdom does not have, and reports what was written. */
const stubClipboard = () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  return writeText;
};

/** Takes the clipboard away, leaving only the `execCommand` path. */
const removeClipboard = () => {
  Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
};

const copyButton = (wrapper) => wrapper.get('[data-kumo-part="copy"]');
const checkIcon = (wrapper) => wrapper.get(".kv-clipboard-text__icon--check");
const status = (wrapper) => wrapper.get(".kv-clipboard-text__status");
const bubble = () => document.querySelector(".kv-clipboard-text__bubble");

/*
 * The bubble also holds the visually-hidden description Reka points
 * `aria-describedby` at, so what is on screen is the label alone.
 */
const bubbleLabel = () => bubble()?.querySelector(".kv-clipboard-text__bubble-label");

/** Click, and let the clipboard promise and the re-render settle. */
const clickCopy = async (wrapper) => {
  await copyButton(wrapper).trigger("click");
  await flush();
};

afterEach(() => {
  delete navigator.clipboard;
  document.body.innerHTML = "";
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("rendering", () => {
  it("shows the value and a named copy button", () => {
    const wrapper = mountField({ text: "sk_live_51H8..." });

    expect(wrapper.get('[data-kumo-part="text"]').text()).toBe("sk_live_51H8...");
    expect(copyButton(wrapper).attributes("aria-label")).toBe("Copy to clipboard");
    expect(wrapper.attributes("data-kumo-component")).toBe("ClipboardText");
  });

  it("takes a size, and hands the same one to the button", () => {
    const wrapper = mountField({ size: "sm" });

    expect(wrapper.classes()).toContain("kv-clipboard-text--sm");
    expect(copyButton(wrapper).classes()).toContain("kv-button--size-sm");
  });

  /* Kumo's default is the largest of the three, and `resolveVariant` falls
     back to it rather than rendering an unknown size. */
  it("defaults to lg, and falls back to it for a size it does not know", () => {
    expect(mountField().classes()).toContain("kv-clipboard-text--lg");
    expect(mountField({ size: "enormous" }).classes()).toContain("kv-clipboard-text--lg");
  });

  it("passes attributes through to the field", () => {
    const wrapper = mountField({}, { attrs: { class: "w-full", id: "account-id" } });

    expect(wrapper.classes()).toContain("w-full");
    expect(wrapper.attributes("id")).toBe("account-id");
  });

  it("draws no bubble unless one is asked for", async () => {
    const wrapper = mountField();
    stubClipboard();

    await clickCopy(wrapper);

    expect(bubble()).toBeNull();
  });
});

describe("copying", () => {
  it("puts the value on the clipboard and says what it copied", async () => {
    const writeText = stubClipboard();
    const wrapper = mountField({ text: "0c239dd2" });

    await clickCopy(wrapper);

    expect(writeText).toHaveBeenCalledWith("0c239dd2");
    expect(wrapper.emitted("copy")).toEqual([["0c239dd2"]]);
  });

  /* A masked secret is displayed masked and copied whole. */
  it("copies textToCopy in place of the displayed value", async () => {
    const writeText = stubClipboard();
    const wrapper = mountField({
      text: "sk_live_***********",
      textToCopy: "sk_live_51H8_abc123",
    });

    await clickCopy(wrapper);

    expect(writeText).toHaveBeenCalledWith("sk_live_51H8_abc123");
    expect(wrapper.emitted("copy")).toEqual([["sk_live_51H8_abc123"]]);
  });

  it("falls back to a selection and execCommand where there is no clipboard", async () => {
    removeClipboard();
    const execCommand = vi.fn(() => true);
    document.execCommand = execCommand;

    const wrapper = mountField({ text: "no-secure-context" });
    await clickCopy(wrapper);

    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(wrapper.emitted("copy")).toEqual([["no-secure-context"]]);
    /* The textarea it selects through is temporary and must not be left behind. */
    expect(document.querySelector("textarea")).toBeNull();

    delete document.execCommand;
  });

  it("confirms nothing when the copy is refused", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
      configurable: true,
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const wrapper = mountField();
    await clickCopy(wrapper);

    expect(wrapper.emitted("copy")).toBeUndefined();
    expect(checkIcon(wrapper).attributes("data-state")).toBe("out");
    expect(warn).toHaveBeenCalled();
  });
});

describe("confirmation", () => {
  it("swaps the copy icon for the tick, and swaps it back", async () => {
    vi.useFakeTimers();
    stubClipboard();
    const wrapper = mountField();

    expect(checkIcon(wrapper).attributes("data-state")).toBe("out");

    await clickCopy(wrapper);
    expect(checkIcon(wrapper).attributes("data-state")).toBe("in");

    vi.advanceTimersByTime(1500);
    await flush();
    expect(checkIcon(wrapper).attributes("data-state")).toBe("out");
  });

  /* Copying again while it is still confirming restarts the window rather than
     letting the first one's timer cut the second one short. */
  it("restarts the window on a second copy", async () => {
    vi.useFakeTimers();
    stubClipboard();
    const wrapper = mountField();

    await clickCopy(wrapper);
    vi.advanceTimersByTime(1400);
    await clickCopy(wrapper);

    vi.advanceTimersByTime(1400);
    await flush();
    expect(checkIcon(wrapper).attributes("data-state")).toBe("in");

    vi.advanceTimersByTime(200);
    await flush();
    expect(checkIcon(wrapper).attributes("data-state")).toBe("out");
  });

  it("announces the copy without renaming the button", async () => {
    stubClipboard();
    const wrapper = mountField({ copiedLabel: "Copied to clipboard" });

    expect(status(wrapper).text()).toBe("");

    await clickCopy(wrapper);

    expect(status(wrapper).text()).toBe("Copied to clipboard");
    expect(status(wrapper).attributes("aria-live")).toBe("polite");
    expect(copyButton(wrapper).attributes("aria-label")).toBe("Copy to clipboard");
  });

  it("takes its labels from props", () => {
    const wrapper = mountField({ copyLabel: "Copier dans le presse-papiers" });

    expect(copyButton(wrapper).attributes("aria-label")).toBe("Copier dans le presse-papiers");
  });

  /* The timer outlives the component otherwise, and wakes up to write to a
     ref nothing is watching any more. */
  it("drops its timer when it goes away", async () => {
    vi.useFakeTimers();
    stubClipboard();
    const wrapper = mountField();

    await clickCopy(wrapper);
    wrapper.unmount();

    expect(() => vi.advanceTimersByTime(1500)).not.toThrow();
  });
});

describe("the bubble", () => {
  it("appears on a copy, carrying the confirmation", async () => {
    stubClipboard();
    const wrapper = mountField({ tooltip: true });

    expect(bubble()).toBeNull();

    await clickCopy(wrapper);

    expect(bubbleLabel().textContent.trim()).toBe("Copied");
  });

  it("takes the hover text from a string, and everything from an object", async () => {
    stubClipboard();
    const wrapper = mountField({
      tooltip: { text: "Copy", copiedText: "Copied!", side: "bottom" },
    });

    await clickCopy(wrapper);

    expect(bubbleLabel().textContent.trim()).toBe("Copied!");
    expect(bubble().getAttribute("data-side")).toBe("bottom");
    /* The description a screen reader is pointed at stays the hover text, so
       the change is announced once - by the live region - and not twice. */
    expect(document.querySelector('[role="tooltip"]').textContent.trim()).toBe("Copy");

    await wrapper.setProps({ tooltip: "Copy link" });
    await flush();
    expect(document.querySelector('[role="tooltip"]').textContent.trim()).toBe("Copy link");
  });

  it("falls back to copiedLabel for its confirmation", async () => {
    stubClipboard();
    const wrapper = mountField({ tooltip: true, copiedLabel: "Copié" });

    await clickCopy(wrapper);

    expect(bubbleLabel().textContent.trim()).toBe("Copié");
  });

  it("marks the confirmation so it can pop, and re-creates it on each copy", async () => {
    stubClipboard();
    const wrapper = mountField({ tooltip: true });

    await clickCopy(wrapper);
    const first = bubbleLabel();
    expect(bubble().hasAttribute("data-copied")).toBe(true);

    await clickCopy(wrapper);
    expect(bubbleLabel()).not.toBe(first);
  });

  it("goes away again when the confirmation lapses", async () => {
    vi.useFakeTimers();
    stubClipboard();
    const wrapper = mountField({ tooltip: true });

    await clickCopy(wrapper);
    expect(bubble()).not.toBeNull();

    vi.advanceTimersByTime(1500);
    await flush();

    expect(bubble()).toBeNull();
  });
});

describe("writing direction", () => {
  it("carries the direction it was written in across the portal", async () => {
    stubClipboard();
    const host = document.createElement("div");
    host.setAttribute("dir", "rtl");
    document.body.append(host);

    const wrapper = mount(ClipboardText, {
      props: { text: "0c239dd2", tooltip: true },
      attachTo: host,
    });

    await clickCopy(wrapper);

    expect(bubble().getAttribute("dir")).toBe("rtl");
  });

  it("lets an explicit dir win", async () => {
    stubClipboard();
    const wrapper = mountField({ tooltip: true, dir: "rtl" });

    await clickCopy(wrapper);

    expect(bubble().getAttribute("dir")).toBe("rtl");
  });
});
