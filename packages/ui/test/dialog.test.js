/**
 * Behavioural contract for Dialog.
 *
 * The dialog is portalled, so most assertions look at `document.body` rather
 * than the wrapper. Reka owns the focus trap and the escape key; what is
 * pinned here is the wiring around them - the roles, the labelling, the sizes,
 * and the two ways the dialog can be closed.
 */

import { afterEach, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { h, nextTick } from "vue";

import Dialog from "../src/dialog/Dialog.vue";

const flush = async () => {
  await nextTick();
  await nextTick();
};

const mountDialog = (props = {}, options = {}) =>
  mount(Dialog, {
    props: { title: "Modal title", ...props },
    attachTo: document.body,
    ...options,
  });

/** The portalled panel, wherever Reka put it. */
const panel = () => document.querySelector(".kv-dialog");
const backdrop = () => document.querySelector(".kv-dialog__backdrop");

afterEach(() => {
  document.body.innerHTML = "";
});

describe("opening", () => {
  it("stays closed until asked", () => {
    mountDialog();
    expect(panel()).toBeNull();
  });

  it("opens from the trigger slot", async () => {
    const wrapper = mountDialog(
      {},
      { slots: { trigger: () => h("button", "Open") } },
    );

    await wrapper.find("button").trigger("click");
    await flush();

    expect(panel()).not.toBeNull();
  });

  it("opens on mount with defaultOpen, without a trigger", async () => {
    mountDialog({ defaultOpen: true });
    await flush();
    expect(panel()).not.toBeNull();
  });

  it("follows a controlled open prop", async () => {
    const wrapper = mountDialog({ open: false });
    expect(panel()).toBeNull();

    await wrapper.setProps({ open: true });
    await flush();
    expect(panel()).not.toBeNull();
  });

  it("renders a backdrop over the page", async () => {
    mountDialog({ defaultOpen: true });
    await flush();
    expect(backdrop()).not.toBeNull();
  });
});

describe("labelling", () => {
  it("names the dialog with its title and describes it with its description", async () => {
    mountDialog({ defaultOpen: true, description: "What this is about." });
    await flush();

    const title = document.querySelector(".kv-dialog__title");
    const description = document.querySelector(".kv-dialog__description");

    expect(title.textContent).toBe("Modal title");
    expect(panel().getAttribute("aria-labelledby")).toBe(title.id);
    expect(panel().getAttribute("aria-describedby")).toBe(description.id);
  });

  it("leaves no dangling aria-describedby when there is no description", async () => {
    mountDialog({ defaultOpen: true });
    await flush();
    expect(panel().hasAttribute("aria-describedby")).toBe(false);
  });

  it("takes markup for the title and description through slots", async () => {
    mountDialog(
      { defaultOpen: true },
      {
        slots: {
          title: () => h("span", { class: "custom-title" }, "Sliced"),
          description: () => h("span", "Detail"),
        },
      },
    );
    await flush();

    expect(document.querySelector(".custom-title")).not.toBeNull();
    expect(document.querySelector(".kv-dialog__description").textContent).toBe("Detail");
  });
});

describe("scrolling", () => {
  it("scrolls between the header and the footer, so neither can leave", async () => {
    mountDialog(
      { defaultOpen: true, description: "Context." },
      {
        slots: {
          default: () => h("p", "Body."),
          footer: () => h("button", "Cancel"),
        },
      },
    );
    await flush();

    const region = panel().querySelector(".kv-dialog__scroll");

    expect(region.querySelector(".kv-dialog__description")).not.toBeNull();
    expect(region.querySelector(".kv-dialog__body")).not.toBeNull();
    expect(region.querySelector(".kv-dialog__header")).toBeNull();
    expect(region.querySelector(".kv-dialog__footer")).toBeNull();
    expect(panel().querySelector(":scope > .kv-dialog__header")).not.toBeNull();
    expect(panel().querySelector(":scope > .kv-dialog__footer")).not.toBeNull();
  });

  it("renders no scrolling region for a dialog that is only a header", async () => {
    mountDialog({ defaultOpen: true });
    await flush();
    expect(panel().querySelector(".kv-dialog__scroll")).toBeNull();
  });
});

describe("role", () => {
  it("is a dialog by default", async () => {
    mountDialog({ defaultOpen: true });
    await flush();
    expect(panel().getAttribute("role")).toBe("dialog");
  });

  it("becomes an alertdialog for confirmation flows", async () => {
    mountDialog({ defaultOpen: true, role: "alertdialog" });
    await flush();
    expect(panel().getAttribute("role")).toBe("alertdialog");
  });
});

describe("size", () => {
  it("defaults to base", async () => {
    mountDialog({ defaultOpen: true });
    await flush();
    expect(panel().classList.contains("kv-dialog--size-base")).toBe(true);
  });

  it.each(["sm", "lg", "xl"])("carries the %s size class", async (size) => {
    mountDialog({ defaultOpen: true, size });
    await flush();
    expect(panel().classList.contains(`kv-dialog--size-${size}`)).toBe(true);
  });
});

describe("writing direction", () => {
  it("carries the direction where it was written through the portal", async () => {
    const host = document.createElement("div");
    host.setAttribute("dir", "rtl");
    document.body.append(host);

    const wrapper = mount(Dialog, {
      props: { title: "عنوان" },
      attachTo: host,
      slots: { trigger: () => h("button", "افتح") },
    });

    await wrapper.find("button").trigger("click");
    await flush();

    expect(panel().getAttribute("dir")).toBe("rtl");
  });

  it("takes an explicit direction over the one around it", async () => {
    const host = document.createElement("div");
    host.setAttribute("dir", "rtl");
    document.body.append(host);

    mount(Dialog, {
      props: { title: "Modal title", defaultOpen: true, dir: "ltr" },
      attachTo: host,
    });
    await flush();

    expect(panel().getAttribute("dir")).toBe("ltr");
  });

  it("leaves a triggerless dialog to inherit from where it is portalled", async () => {
    mountDialog({ defaultOpen: true });
    await flush();
    expect(panel().hasAttribute("dir")).toBe(false);
  });
});

describe("closing", () => {
  it("closes from the corner control", async () => {
    const wrapper = mountDialog({ defaultOpen: true });
    await flush();

    document.querySelector(".kv-dialog__close").click();
    await flush();

    expect(panel()).toBeNull();
    expect(wrapper.emitted("update:open").at(-1)).toEqual([false]);
  });

  it("names that control for screen readers, and takes a translation", async () => {
    mountDialog({ defaultOpen: true, closeLabel: "Fermer" });
    await flush();
    expect(document.querySelector(".kv-dialog__close").getAttribute("aria-label")).toBe(
      "Fermer",
    );
  });

  it("omits the control when asked", async () => {
    mountDialog({ defaultOpen: true, closable: false });
    await flush();
    expect(document.querySelector(".kv-dialog__close")).toBeNull();
  });

  it("hands the slots a close function", async () => {
    const wrapper = mountDialog(
      { defaultOpen: true },
      {
        slots: {
          footer: ({ close }) => h("button", { class: "cancel", onClick: close }, "Cancel"),
        },
      },
    );
    await flush();

    document.querySelector(".cancel").click();
    await flush();

    expect(panel()).toBeNull();
    expect(wrapper.emitted("update:open").at(-1)).toEqual([false]);
  });

  it("reports the change but leaves the panel to the parent when controlled", async () => {
    const wrapper = mountDialog({ open: true });
    await flush();

    document.querySelector(".kv-dialog__close").click();
    await flush();

    expect(wrapper.emitted("update:open").at(-1)).toEqual([false]);
    expect(panel()).not.toBeNull();
  });

  it("closes on escape", async () => {
    mountDialog({ defaultOpen: true });
    await flush();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await flush();

    expect(panel()).toBeNull();
  });

  it("still closes on escape with pointer dismissal disabled", async () => {
    mountDialog({ defaultOpen: true, disablePointerDismissal: true });
    await flush();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await flush();

    expect(panel()).toBeNull();
  });
});

describe("pointer dismissal", () => {
  /*
   * Reka registers its `pointerdown` listener in a `setTimeout(0)`, so that the
   * very interaction opening a dialog cannot immediately dismiss it. A test
   * clicking outside has to get past that timer first.
   */
  const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

  const clickOutside = async () => {
    await settle();

    const outside = document.createElement("button");
    document.body.append(outside);

    outside.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await flush();
    outside.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flush();
  };

  it("closes on a click outside", async () => {
    mountDialog({ defaultOpen: true });
    await flush();

    await clickOutside();
    expect(panel()).toBeNull();
  });

  it("stays open when pointer dismissal is disabled", async () => {
    mountDialog({ defaultOpen: true, disablePointerDismissal: true });
    await flush();

    await clickOutside();
    expect(panel()).not.toBeNull();
  });
});
