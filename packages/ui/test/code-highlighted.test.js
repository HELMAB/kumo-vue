import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";

import CodeHighlighted from "../src/code-highlighted/CodeHighlighted.vue";
import ShikiProvider from "../src/code-highlighted/ShikiProvider.vue";
import { useShikiHighlighter } from "../src/code-highlighted/context.js";
import { normalizeLanguage } from "../src/code-highlighted/languages.js";

const mounted = [];

const mountCode = (props, providerProps = {}) => {
  const wrapper = mount(ShikiProvider, {
    props: { engine: "javascript", languages: ["typescript", "bash"], ...providerProps },
    slots: { default: () => h(CodeHighlighted, props) },
    attachTo: document.body,
  });
  mounted.push(wrapper);
  return wrapper;
};

const highlighted = async (wrapper) => {
  await vi.waitFor(() => expect(wrapper.find(".kv-code__shiki").exists()).toBe(true), { timeout: 10000 });
  return wrapper;
};

afterEach(() => {
  mounted.splice(0).forEach((wrapper) => wrapper.unmount());
  vi.restoreAllMocks();
});

describe("normalizeLanguage", () => {
  it("maps aliases to canonical names and rejects unknown ones", () => {
    expect(normalizeLanguage("ts")).toBe("typescript");
    expect(normalizeLanguage("sh")).toBe("bash");
    expect(normalizeLanguage("tsx")).toBe("tsx");
    expect(normalizeLanguage("cobol")).toBeNull();
  });
});

describe("CodeHighlighted", () => {
  it("shows plain text while Shiki loads, then highlighted tokens", async () => {
    const wrapper = mountCode({ code: "const x = 1;", lang: "ts" });
    expect(wrapper.find(".kv-code__fallback").text()).toBe("const x = 1;");
    await highlighted(wrapper);
    expect(wrapper.find(".kv-code__fallback").exists()).toBe(false);
    expect(wrapper.find("pre.shiki").exists()).toBe(true);
    expect(wrapper.find(".kv-code__shiki").text()).toBe("const x = 1;");
    expect(wrapper.find("pre span span").attributes("style")).toContain("--shiki-dark");
  }, 15000);

  it("marks highlighted lines and numbers multi-line code", async () => {
    const wrapper = await highlighted(mountCode({ code: "a\nb\nc", lang: "typescript", highlightLines: [2], showLineNumbers: true }));
    const lines = wrapper.findAll(".line");
    expect(lines.map((line) => line.classes().includes("line-highlighted"))).toEqual([false, true, false]);
    expect(wrapper.findAll(".kv-code__line-numbers > div").map((n) => n.text())).toEqual(["1", "2", "3"]);
  }, 15000);

  it("skips line numbers on a single line and puts the copy button inline", async () => {
    const wrapper = mountCode({ code: "npm i", lang: "bash", showLineNumbers: true, showCopyButton: true });
    expect(wrapper.find(".kv-code__line-numbers").exists()).toBe(false);
    expect(wrapper.find(".kv-code").classes()).toContain("kv-code--inline-copy");
    expect(wrapper.find(".kv-code__copy").classes()).toContain("kv-code__copy--inline");
  });

  it("falls back to plain text for a language the provider did not load", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const wrapper = mountCode({ code: "SELECT 1;", lang: "sql" });
    await vi.waitFor(() => expect(warn).toHaveBeenCalled(), { timeout: 10000 });
    await flushPromises();
    expect(wrapper.find(".kv-code__fallback").text()).toBe("SELECT 1;");
  }, 15000);

  it("copies the code and swaps the label, with provider and per-block labels", async () => {
    const writeText = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const wrapper = mountCode({ code: "npm i", lang: "bash", showCopyButton: true, labels: { copied: "Done!" } }, { labels: { copy: "Copier" } });
    const button = wrapper.find(".kv-code__copy button");
    expect(button.text()).toBe("Copier");
    await button.trigger("click");
    await flushPromises();
    expect(writeText).toHaveBeenCalledWith("npm i");
    expect(button.text()).toBe("Done!");
    expect(wrapper.find(".kv-code__copy").classes()).toContain("kv-code__copy--shown");
  });

  it("drops the frame with the plain variant", () => {
    expect(mountCode({ code: "x", lang: "ts", variant: "plain" }).find(".kv-code").classes()).toContain("kv-code--plain");
  });
});

describe("useShikiHighlighter", () => {
  it("throws outside a ShikiProvider", () => {
    const Probe = defineComponent({ setup: () => (useShikiHighlighter(), () => null) });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => mount(Probe)).toThrow(/ShikiProvider/);
  });
});
