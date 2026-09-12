/**
 * Behavioural contract for Empty.
 *
 * The component is mostly composition, so what is pinned here is the wiring:
 * which rows appear for which props, what the slots replace, where the heading
 * level comes from, and that the command line is a real ClipboardText rather
 * than a second copy button that happens to look like one.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { h, nextTick } from "vue";

import Empty from "../src/empty/Empty.vue";

const flush = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

const mountEmpty = (props = {}, options = {}) =>
  mount(Empty, {
    props: { title: "No results found", ...props },
    attachTo: document.body,
    ...options,
  });

const title = (wrapper) => wrapper.get('[data-kumo-part="title"]');
const description = (wrapper) => wrapper.find('[data-kumo-part="description"]');
const command = (wrapper) => wrapper.find('[data-kumo-part="command"]');
const actions = (wrapper) => wrapper.find('[data-kumo-part="actions"]');

/** Replaces the clipboard jsdom does not have, and reports what was written. */
const stubClipboard = () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  return writeText;
};

afterEach(() => {
  document.body.innerHTML = "";
  Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
});

describe("rendering", () => {
  it("draws a heading and nothing else it was not given", () => {
    const wrapper = mountEmpty();

    expect(wrapper.attributes("data-kumo-component")).toBe("Empty");
    expect(title(wrapper).text()).toBe("No results found");
    expect(description(wrapper).exists()).toBe(false);
    expect(command(wrapper).exists()).toBe(false);
    expect(actions(wrapper).exists()).toBe(false);
  });

  it("draws the description when there is one", () => {
    const wrapper = mountEmpty({ description: "Try adjusting your search." });

    expect(description(wrapper).text()).toBe("Try adjusting your search.");
  });

  /* Kumo's `contents` prop: buttons and links below the description. */
  it("puts the default slot in the actions row", () => {
    const wrapper = mountEmpty({}, { slots: { default: () => h("button", "Clear filters") } });

    expect(actions(wrapper).text()).toBe("Clear filters");
  });

  /* Kumo's `icon` prop. The heading carries the meaning, so the mark beside it
     is hidden rather than described. */
  it("hides the icon from assistive technology", () => {
    const wrapper = mountEmpty({}, { slots: { icon: () => h("svg") } });
    const icon = wrapper.get(".kv-empty__icon");

    expect(icon.attributes("aria-hidden")).toBe("true");
  });

  /* The same pairing Banner and Collapsible make: a prop for translated
     strings, a slot for anything a string cannot express. */
  it("takes its title and description from the slots over the props", () => {
    const wrapper = mountEmpty(
      { description: "Plain" },
      {
        slots: {
          title: () => h("span", "Rich title"),
          description: () => h("span", "Rich description"),
        },
      },
    );

    expect(title(wrapper).text()).toBe("Rich title");
    expect(description(wrapper).text()).toBe("Rich description");
  });

  /* A description slot with no description prop still gets a row. */
  it("draws the description row for a slot alone", () => {
    const wrapper = mountEmpty({}, { slots: { description: () => h("span", "Slotted") } });

    expect(description(wrapper).text()).toBe("Slotted");
  });
});

describe("the heading", () => {
  it("is an h2, as upstream", () => {
    expect(title(mountEmpty()).element.tagName).toBe("H2");
  });

  /*
   * Upstream's level is fixed, which is wrong anywhere the placeholder is not
   * sitting directly under the page's h1 - inside a card already under an h3,
   * the outline skips a level.
   */
  it("renders at the level it was given", () => {
    expect(title(mountEmpty({ titleAs: "h4" })).element.tagName).toBe("H4");
    expect(title(mountEmpty({ titleAs: "p" })).element.tagName).toBe("P");
  });
});

describe("sizes", () => {
  it("defaults to base", () => {
    expect(mountEmpty().classes()).toContain("kv-empty--size-base");
  });

  it("takes the size it was given", () => {
    expect(mountEmpty({ size: "lg" }).classes()).toContain("kv-empty--size-lg");
  });

  /* Kumo's `resolveVariant` falls back rather than dropping the class. */
  it("falls back to base for a size it does not know", () => {
    expect(mountEmpty({ size: "enormous" }).classes()).toContain("kv-empty--size-base");
  });
});

describe("the command line", () => {
  it("is a ClipboardText carrying the command", () => {
    const wrapper = mountEmpty({ commandLine: "npm install @cloudflare/kumo" });
    const field = command(wrapper);

    expect(field.attributes("data-kumo-component")).toBe("ClipboardText");
    expect(field.get('[data-kumo-part="text"]').text()).toBe("npm install @cloudflare/kumo");
  });

  it("copies the command and re-emits the copy", async () => {
    const writeText = stubClipboard();
    const wrapper = mountEmpty({ commandLine: "npx kumo-vue add empty" });

    await command(wrapper).get('[data-kumo-part="copy"]').trigger("click");
    await flush();

    expect(writeText).toHaveBeenCalledWith("npx kumo-vue add empty");
    expect(wrapper.emitted("copy")).toEqual([["npx kumo-vue add empty"]]);
  });

  /* The prompt is generated content, so it is not in the copied string and not
     in the text content either - which is what upstream's `select-none` buys. */
  it("keeps the shell prompt out of the value", () => {
    const wrapper = mountEmpty({ commandLine: "ls" });

    expect(command(wrapper).get('[data-kumo-part="text"]').text()).toBe("ls");
  });

  it("names the copy button for the command it copies", () => {
    const wrapper = mountEmpty({ commandLine: "ls", copyLabel: "Copier la commande" });

    expect(command(wrapper).get('[data-kumo-part="copy"]').attributes("aria-label")).toBe(
      "Copier la commande",
    );
  });
});

describe("the container", () => {
  it("renders as the element it was given, keeping its attributes", () => {
    const wrapper = mountEmpty({ as: "section" }, { attrs: { "aria-label": "Results" } });

    expect(wrapper.element.tagName).toBe("SECTION");
    expect(wrapper.attributes("aria-label")).toBe("Results");
  });
});

describe("development warnings", () => {
  /* The heading is what tells a screen reader why the region is blank. */
  it("warns when there is no title at all", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    mount(Empty, { attachTo: document.body });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("<Empty> needs a title"));
    warn.mockRestore();
  });

  it("stays quiet when the title comes from the slot", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    mount(Empty, { slots: { title: () => h("span", "Nothing here") }, attachTo: document.body });

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
