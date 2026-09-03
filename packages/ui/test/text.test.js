/**
 * Behavioural contract for Text, mirroring Kumo's own cases where the
 * behaviour carries over - and pinning the places it deliberately does not.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";

import Text from "../src/text/Text.vue";

const mountText = (props = {}, options = {}) =>
  mount(Text, { props, slots: { default: "Content" }, ...options });

let warn;

afterEach(() => {
  warn?.mockRestore();
  warn = undefined;
});

const spyOnWarn = () => (warn = vi.spyOn(console, "warn").mockImplementation(() => {}));

describe("rendering", () => {
  it("renders body copy as a paragraph by default", () => {
    const wrapper = mountText();
    expect(wrapper.element.tagName).toBe("P");
    expect(wrapper.text()).toBe("Content");
    expect(wrapper.attributes("data-kumo-component")).toBe("Text");
  });

  it("defaults to the body variant at base size", () => {
    expect(mountText().classes()).toEqual(
      expect.arrayContaining(["kv-text", "kv-text--body", "kv-text--size-base", "kv-text--copy"]),
    );
  });

  it("renders a heading as a span, keeping it out of the document outline", () => {
    /*
     * Kumo's point: the variant is presentation. A heading only joins the
     * outline when the caller says so with `as`.
     */
    const wrapper = mountText({ variant: "heading" });
    expect(wrapper.element.tagName).toBe("SPAN");
    expect(wrapper.classes()).toContain("kv-text--heading");
  });

  it("renders monospace as a span", () => {
    expect(mountText({ variant: "mono" }).element.tagName).toBe("SPAN");
  });

  it("takes the element it is told to", () => {
    expect(mountText({ variant: "heading", as: "h1" }).element.tagName).toBe("H1");
    expect(mountText({ as: "span" }).element.tagName).toBe("SPAN");
    expect(mountText({ as: "label" }).element.tagName).toBe("LABEL");
    expect(mountText({ as: "dt" }).element.tagName).toBe("DT");
    expect(mountText({ as: "code" }).element.tagName).toBe("CODE");
    expect(mountText({ as: "pre" }).element.tagName).toBe("PRE");
  });

  it("lets a heading opt out of being a heading", () => {
    expect(mountText({ variant: "heading", as: "span" }).element.tagName).toBe("SPAN");
  });

  it("styles a child instead of rendering an element of its own", () => {
    const wrapper = mount(Text, {
      props: { asChild: true, variant: "secondary" },
      slots: { default: "<a href='/docs'>Docs</a>" },
    });
    expect(wrapper.element.tagName).toBe("A");
    expect(wrapper.classes()).toContain("kv-text--secondary");
  });

  it("passes attributes through to the element", () => {
    const wrapper = mountText({}, { attrs: { id: "intro", "data-testid": "x" } });
    expect(wrapper.attributes("id")).toBe("intro");
    expect(wrapper.attributes("data-testid")).toBe("x");
  });

  it("takes a class of its own alongside its variant classes", () => {
    const wrapper = mountText({}, { attrs: { class: "mine" } });
    expect(wrapper.classes()).toEqual(expect.arrayContaining(["kv-text", "mine"]));
  });
});

describe("variants", () => {
  it.each([
    ["body", "kv-text--body"],
    ["secondary", "kv-text--secondary"],
    ["success", "kv-text--success"],
    ["error", "kv-text--error"],
    ["mono", "kv-text--mono"],
    ["mono-secondary", "kv-text--mono-secondary"],
    ["heading", "kv-text--heading"],
  ])("applies the %s variant class", (variant, expected) => {
    expect(mountText({ variant }).classes()).toContain(expected);
  });

  it("marks only the copy variants as copy", () => {
    for (const variant of ["body", "secondary", "success", "error"]) {
      expect(mountText({ variant }).classes()).toContain("kv-text--copy");
    }
    for (const variant of ["heading", "mono", "mono-secondary"]) {
      expect(mountText({ variant }).classes()).not.toContain("kv-text--copy");
    }
  });
});

describe("size", () => {
  it("carries the size class", () => {
    for (const size of ["xs", "sm", "base", "lg"]) {
      expect(mountText({ size }).classes()).toContain(`kv-text--size-${size}`);
    }
  });

  it("keeps the size on non-copy variants, where the stylesheet reads it", () => {
    /* A heading uses `lg` for its 20px step; mono uses it for 14px. */
    expect(mountText({ variant: "heading", size: "lg" }).classes()).toContain("kv-text--size-lg");
    expect(mountText({ variant: "mono", size: "lg" }).classes()).toContain("kv-text--size-lg");
  });
});

describe("bold", () => {
  it("applies to copy", () => {
    expect(mountText({ bold: true }).classes()).toContain("kv-text--bold");
    expect(mountText({ variant: "secondary", bold: true }).classes()).toContain("kv-text--bold");
  });

  it("is ignored elsewhere, as Kumo's types forbid the combination", () => {
    spyOnWarn();
    expect(mountText({ variant: "heading", bold: true }).classes()).not.toContain("kv-text--bold");
    expect(mountText({ variant: "mono", bold: true }).classes()).not.toContain("kv-text--bold");
  });

  it("says so in development rather than failing silently", () => {
    spyOnWarn();
    mountText({ variant: "mono", bold: true });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("bold has no effect"));
  });
});

describe("truncate", () => {
  it("is off unless asked for", () => {
    expect(mountText().classes()).not.toContain("kv-text--truncate");
  });

  it("adds the class that clips and ellipsises", () => {
    expect(mountText({ truncate: true }).classes()).toContain("kv-text--truncate");
  });
});

describe("deprecated heading variants", () => {
  it.each([
    ["heading1", "kv-text--heading1"],
    ["heading2", "kv-text--heading2"],
    ["heading3", "kv-text--heading3"],
  ])("still renders %s, as Kumo still does", (variant, expected) => {
    spyOnWarn();
    const wrapper = mountText({ variant, as: "h2" });
    expect(wrapper.classes()).toContain(expected);
    expect(wrapper.element.tagName).toBe("H2");
  });

  it("warns in development, pointing at the replacement", () => {
    spyOnWarn();
    mountText({ variant: "heading1", as: "h1" });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('variant="heading1" is deprecated'));
  });

  it("says nothing for the variants that are not deprecated", () => {
    spyOnWarn();
    mountText({ variant: "heading" });
    mountText({ variant: "body" });
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("development warnings", () => {
  it("flags an element that is not a text element", () => {
    spyOnWarn();
    mountText({ as: "div" });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('as="div" is not a text element'));
  });

  it("says nothing for the elements it does render", () => {
    spyOnWarn();
    for (const as of ["h1", "p", "span", "label", "li", "code", "time"]) mountText({ as });
    expect(warn).not.toHaveBeenCalled();
  });

  it("flags text with nothing in it", () => {
    spyOnWarn();
    mount(Text);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("no content"));
  });
});
