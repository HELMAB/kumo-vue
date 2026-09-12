/**
 * Behavioural contract for Collapsible.
 *
 * Reka owns the `aria-expanded` / `aria-controls` pairing and the measured
 * height; what is pinned here is the wiring around them - where the open state
 * lives, what the trigger slot replaces, what `keepMounted` keeps, and which
 * of the two panel treatments is drawn.
 */

import { afterEach, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { h, nextTick } from "vue";

import Collapsible from "../src/collapsible/Collapsible.vue";

const flush = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

const mountDisclosure = (props = {}, options = {}) =>
  mount(Collapsible, {
    props: { title: "What is Kumo?", ...props },
    slots: { default: () => h("p", "Kumo is a design system."), ...options.slots },
    attachTo: document.body,
    ...options,
  });

const trigger = (wrapper) => wrapper.get('[data-kumo-part="trigger"]');
const panel = (wrapper) => wrapper.find('[data-kumo-part="panel"]');
const body = (wrapper) => wrapper.find(".kv-collapsible__body");

afterEach(() => {
  document.body.innerHTML = "";
});

describe("rendering", () => {
  it("draws a labelled trigger over a panel", () => {
    const wrapper = mountDisclosure();

    expect(trigger(wrapper).text()).toBe("What is Kumo?");
    expect(wrapper.attributes("data-kumo-component")).toBe("Collapsible");
  });

  /* The label is a prop for translated strings and a slot for anything else -
     the same pairing Dialog makes with its title. */
  it("takes its label from the title slot over the prop", () => {
    const wrapper = mountDisclosure(
      {},
      { slots: { title: () => h("strong", "Rich label"), default: () => h("p", "Body") } },
    );

    expect(trigger(wrapper).text()).toBe("Rich label");
  });

  /* Reka's own `aria-controls` is an empty IDREF until something re-renders
     the trigger, which is invalid rather than merely unhelpful. */
  it("points the trigger at the panel it controls", async () => {
    const wrapper = mountDisclosure({ defaultOpen: true });
    await flush();

    const id = panel(wrapper).attributes("id");
    expect(id).toBeTruthy();
    expect(trigger(wrapper).attributes("aria-controls")).toBe(id);
    expect(trigger(wrapper).attributes("aria-expanded")).toBe("true");
  });

  it("points a replaced trigger at it too", async () => {
    const wrapper = mountDisclosure(
      { defaultOpen: true },
      {
        slots: {
          trigger: () => h("button", { class: "custom" }, "Toggle"),
          default: () => h("p", "Body"),
        },
      },
    );
    await flush();

    expect(wrapper.get("button.custom").attributes("aria-controls")).toBe(
      panel(wrapper).attributes("id"),
    );
  });

  it("accents the body by default and strips it back when plain", () => {
    expect(mountDisclosure().classes()).toContain("kv-collapsible--default");
    expect(mountDisclosure({ variant: "plain" }).classes()).toContain("kv-collapsible--plain");
    /* Both keep the body box: the panel clips and animates, the body holds the
       content, whichever treatment is drawn. */
    expect(body(mountDisclosure({ variant: "plain", defaultOpen: true })).exists()).toBe(true);
  });

  it("passes attributes through to the root", () => {
    const wrapper = mountDisclosure({}, { attrs: { class: "faq-item", id: "faq-1" } });

    expect(wrapper.classes()).toContain("faq-item");
    expect(wrapper.attributes("id")).toBe("faq-1");
  });
});

describe("opening and closing", () => {
  it("starts closed, and keeps nothing in the DOM while it is", () => {
    const wrapper = mountDisclosure();

    expect(trigger(wrapper).attributes("aria-expanded")).toBe("false");
    expect(wrapper.text()).not.toContain("Kumo is a design system.");
  });

  it("starts open when told to", () => {
    const wrapper = mountDisclosure({ defaultOpen: true });

    expect(wrapper.text()).toContain("Kumo is a design system.");
  });

  it("opens and closes from the trigger, saying so each time", async () => {
    const wrapper = mountDisclosure();

    await trigger(wrapper).trigger("click");
    await flush();
    expect(trigger(wrapper).attributes("aria-expanded")).toBe("true");
    expect(wrapper.text()).toContain("Kumo is a design system.");

    await trigger(wrapper).trigger("click");
    await flush();
    expect(trigger(wrapper).attributes("aria-expanded")).toBe("false");

    expect(wrapper.emitted("update:open")).toEqual([[true], [false]]);
  });

  it("follows a controlled open prop rather than its own state", async () => {
    const wrapper = mountDisclosure({ open: false });

    await trigger(wrapper).trigger("click");
    await flush();
    /* The click is reported, and changes nothing until the page says so. */
    expect(wrapper.emitted("update:open")).toEqual([[true]]);
    expect(trigger(wrapper).attributes("aria-expanded")).toBe("false");

    await wrapper.setProps({ open: true });
    await flush();
    expect(trigger(wrapper).attributes("aria-expanded")).toBe("true");
  });

  it("refuses to open while disabled", async () => {
    const wrapper = mountDisclosure({ disabled: true });

    expect(trigger(wrapper).attributes("disabled")).toBeDefined();

    await trigger(wrapper).trigger("click");
    await flush();

    expect(trigger(wrapper).attributes("aria-expanded")).toBe("false");
    expect(wrapper.emitted("update:open")).toBeUndefined();
  });
});

describe("keepMounted", () => {
  /* A half-filled form inside a closed panel should still be there when it
     opens again, which it is not if the panel is torn down. */
  it("keeps the content in the DOM, hidden, while closed", async () => {
    const wrapper = mountDisclosure({ keepMounted: true });

    expect(wrapper.text()).toContain("Kumo is a design system.");
    /*
     * Reka asks for `hidden="until-found"` here, so a closed panel is still
     * reachable by the browser's find-in-page. jsdom has not implemented that
     * value and coerces it to a bare `hidden`, so what is asserted is that the
     * panel is hidden while its content stays in the DOM.
     */
    expect(panel(wrapper).attributes("hidden")).toBeDefined();

    await trigger(wrapper).trigger("click");
    await flush();
    expect(panel(wrapper).attributes("hidden")).toBeUndefined();
  });

  it("tears the content down by default", () => {
    const wrapper = mountDisclosure();

    expect(wrapper.text()).not.toContain("Kumo is a design system.");
  });
});

describe("the trigger slot", () => {
  it("replaces the trigger, semantics and all", async () => {
    const wrapper = mountDisclosure(
      {},
      {
        slots: {
          trigger: ({ open }) => h("button", { class: "custom" }, open ? "Hide" : "Show"),
          default: () => h("p", "Body"),
        },
      },
    );

    /* The default trigger is gone, not hidden behind the slot. */
    expect(wrapper.find('[data-kumo-part="trigger"]').exists()).toBe(false);

    const custom = wrapper.get("button.custom");
    expect(custom.text()).toBe("Show");
    expect(custom.attributes("aria-expanded")).toBe("false");

    await custom.trigger("click");
    await flush();
    expect(custom.text()).toBe("Hide");
    expect(custom.attributes("aria-expanded")).toBe("true");
  });

  it("hands the panel's own content a way to close it", async () => {
    const wrapper = mountDisclosure(
      { defaultOpen: true },
      {
        slots: {
          default: ({ toggle }) => h("button", { class: "close", onClick: toggle }, "Collapse"),
        },
      },
    );

    await wrapper.get("button.close").trigger("click");
    await flush();

    expect(trigger(wrapper).attributes("aria-expanded")).toBe("false");
  });
});

describe("the accordion pattern", () => {
  /* Kumo builds an accordion by controlling each item's `open` from one index
     rather than shipping an Accordion. The same holds here. */
  it("keeps one item open at a time when the page owns the state", async () => {
    const items = ["One", "Two", "Three"];

    const wrapper = mount({
      components: { Collapsible },
      data: () => ({ active: 0, items }),
      template: `
        <div>
          <Collapsible
            v-for="(item, i) in items"
            :key="item"
            :title="item"
            :open="active === i"
            @update:open="(open) => (active = open ? i : null)"
          >{{ item }} body</Collapsible>
        </div>
      `,
    }, { attachTo: document.body });

    const triggers = wrapper.findAll('[data-kumo-part="trigger"]');
    expect(triggers.map((t) => t.attributes("aria-expanded"))).toEqual(["true", "false", "false"]);

    await triggers[2].trigger("click");
    await flush();

    expect(triggers.map((t) => t.attributes("aria-expanded"))).toEqual(["false", "false", "true"]);
  });
});
