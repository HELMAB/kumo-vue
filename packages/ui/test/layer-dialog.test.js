import { afterEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { h, nextTick } from "vue";

import LayerDialog from "../src/layer-dialog/LayerDialog.vue";
import LayerDialogAction from "../src/layer-dialog/LayerDialogAction.vue";
import LocaleProvider from "../src/locale-provider/LocaleProvider.vue";

const mounted = [];

const flush = async () => {
  await nextTick();
  await nextTick();
};

const mountDialog = (props = {}, slots = {}) => {
  const wrapper = mount(LayerDialog, {
    props: { title: "Configure hostname", defaultOpen: true, ...props },
    slots: { default: () => h("p", "Body copy"), ...slots },
    attachTo: document.body,
  });
  mounted.push(wrapper);
  return wrapper;
};

const popup = () => document.querySelector('[data-kumo-component="LayerDialog"]');
const part = (name) => document.querySelector(`[data-kumo-part="${name}"]`);
const escape = () => document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));

const pointer = (target, type, clientY) => target.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, clientY }));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const desktop = (matches) =>
  vi.stubGlobal("matchMedia", () => ({ matches, addEventListener() {}, removeEventListener() {} }));

afterEach(() => {
  mounted.splice(0).forEach((wrapper) => wrapper.unmount());
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

describe("LayerDialog", () => {
  it("names the dialog from its title and closes from an X without an action", async () => {
    mountDialog({ description: "Route requests to your Worker." });
    await flush();

    const dialog = popup();
    expect(dialog.getAttribute("role")).toBe("dialog");
    expect(document.getElementById(dialog.getAttribute("aria-labelledby")).textContent).toBe("Configure hostname");
    expect(document.getElementById(dialog.getAttribute("aria-describedby")).textContent).toContain("Route requests");
    expect(part("close").getAttribute("aria-label")).toBe("Close");
    expect(part("dismiss")).toBeNull();
  });

  it("describes the dialog with the body when there is no description", async () => {
    mountDialog();
    await flush();
    expect(document.getElementById(popup().getAttribute("aria-describedby")).textContent).toBe("Body copy");
  });

  it("swaps the X for a dismiss button beside the action", async () => {
    mountDialog({ dismissLabel: "Keep editing" }, { action: () => h(LayerDialogAction, () => "Save") });
    await flush();

    expect(part("close")).toBeNull();
    expect(part("dismiss").textContent.trim()).toBe("Keep editing");
    expect(popup().textContent).toContain("Save");
  });

  it("renders an alert with Cancel and requires an action", async () => {
    mountDialog({ alert: true }, { action: () => h(LayerDialogAction, { variant: "destructive" }, () => "Delete") });
    await flush();

    expect(popup().getAttribute("role")).toBe("alertdialog");
    expect(part("dismiss").textContent.trim()).toBe("Cancel");
    expect(() => mount(LayerDialog, { props: { title: "Delete", alert: true } })).toThrow(/#action/);
  });

  it("emits update:open from the dismiss button", async () => {
    const wrapper = mountDialog({}, { action: () => h(LayerDialogAction, () => "Save") });
    await flush();

    part("dismiss").click();
    await flush();
    expect(wrapper.emitted("update:open")).toEqual([[false]]);
  });

  it("blocks Escape and disables dismissal while dismissDisabled", async () => {
    const wrapper = mountDialog({ dismissDisabled: true }, { action: () => h(LayerDialogAction, { loading: true }, () => "Save") });
    await flush();

    expect(part("dismiss").disabled).toBe(true);
    escape();
    await flush();
    expect(wrapper.emitted("update:open")).toBeUndefined();
  });

  it("closes programmatically through the default slot's close", async () => {
    const wrapper = mountDialog({}, { default: ({ close }) => h("button", { class: "done", onClick: close }, "Done") });
    await flush();

    document.querySelector(".done").click();
    await flush();
    expect(wrapper.emitted("update:open")).toEqual([[false]]);
  });

  it("applies the desktop size and placement classes", async () => {
    mountDialog({ size: "lg", verticalAlign: "top" });
    await flush();
    expect(popup().classList).toContain("kv-layer-dialog__popup--size-lg");
    expect(popup().classList).toContain("kv-layer-dialog__popup--top");
  });
});

describe("LayerDialog layout", () => {
  it("is a bottom sheet with a handle and a secondary dismiss on mobile", async () => {
    desktop(false);
    mountDialog({}, { action: () => h(LayerDialogAction, () => "Save") });
    await flush();
    expect(document.querySelector(".kv-layer-dialog__handle")).not.toBeNull();
    expect(part("dismiss").classList).toContain("kv-button--secondary");
  });

  it("uses a ghost dismiss on desktop, with one action element across layouts", async () => {
    desktop(true);
    mountDialog({}, { action: () => h(LayerDialogAction, () => "Save") });
    await flush();
    expect(part("dismiss").classList).toContain("kv-button--ghost");
    expect(document.querySelectorAll(".kv-layer-dialog__actions")).toHaveLength(1);
  });

  it("hides the handle for alerts", async () => {
    mountDialog({ alert: true }, { action: () => h(LayerDialogAction, () => "Delete") });
    await flush();
    expect(document.querySelector(".kv-layer-dialog__handle")).toBeNull();
  });

  it("renders a backdrop when not modal", async () => {
    mountDialog({ modal: false });
    await flush();
    expect(part("backdrop")).not.toBeNull();
  });
});

describe("LayerDialog swipe", () => {
  it("closes on a long downward drag from the header", async () => {
    const wrapper = mountDialog();
    await flush();
    const header = document.querySelector(".kv-layer-dialog__header");
    pointer(header, "pointerdown", 100);
    pointer(header, "pointermove", 400);
    pointer(header, "pointerup", 400);
    await flush();
    expect(wrapper.emitted("update:open")).toEqual([[false]]);
  });

  it("snaps back after a short, slow drag", async () => {
    const wrapper = mountDialog();
    await flush();
    Object.defineProperty(popup(), "offsetHeight", { value: 1000 });
    const header = document.querySelector(".kv-layer-dialog__header");
    pointer(header, "pointerdown", 100);
    await wait(150);
    pointer(header, "pointermove", 150);
    pointer(header, "pointerup", 150);
    await flush();
    expect(wrapper.emitted("update:open")).toBeUndefined();
    expect(popup().style.getPropertyValue("--kv-layer-dialog-swipe")).toBe("");
  });

  it("ignores drags on desktop, in alerts, while pending and from a scrolled body", async () => {
    const action = { action: () => h(LayerDialogAction, () => "Go") };
    const cases = [
      [() => desktop(true), {}, {}],
      [() => {}, { alert: true }, action],
      [() => {}, { dismissDisabled: true }, {}],
    ];
    for (const [setup, props, slots] of cases) {
      setup();
      const wrapper = mountDialog(props, slots);
      await flush();
      const header = document.querySelector(".kv-layer-dialog__header");
      pointer(header, "pointerdown", 100);
      pointer(header, "pointermove", 600);
      pointer(header, "pointerup", 600);
      await flush();
      expect(wrapper.emitted("update:open")).toBeUndefined();
      mounted.splice(0).forEach((w) => w.unmount());
      vi.unstubAllGlobals();
    }

    const wrapper = mountDialog();
    await flush();
    const viewport = document.querySelector("[data-reka-scroll-area-viewport]");
    viewport.scrollTop = 40;
    pointer(viewport.querySelector("p"), "pointerdown", 100);
    pointer(viewport.querySelector("p"), "pointermove", 600);
    pointer(viewport.querySelector("p"), "pointerup", 600);
    await flush();
    expect(wrapper.emitted("update:open")).toBeUndefined();
  });
});

describe("LayerDialog localisation and direction", () => {
  it("takes its labels from LocaleProvider, with props still winning", async () => {
    const wrapper = mount(LocaleProvider, {
      props: { translations: { layerDialog: { close: "Schließen", cancel: "Abbrechen" } } },
      slots: {
        default: () => [
          h(LayerDialog, { title: "A", defaultOpen: true }, { default: () => "a" }),
          h(LayerDialog, { title: "B", defaultOpen: true, alert: true }, { default: () => "b", action: () => h(LayerDialogAction, () => "Go") }),
          h(LayerDialog, { title: "C", defaultOpen: true, closeLabel: "Zu" }, { default: () => "c" }),
        ],
      },
      attachTo: document.body,
    });
    mounted.push(wrapper);
    await flush();
    const closes = [...document.querySelectorAll('[data-kumo-part="close"]')].map((el) => el.getAttribute("aria-label"));
    expect(closes).toEqual(["Schließen", "Zu"]);
    expect(part("dismiss").textContent.trim()).toBe("Abbrechen");
  });

  it("carries the trigger's writing direction through the portal", async () => {
    const wrapper = mount(
      { render: () => h("div", { dir: "rtl" }, [h(LayerDialog, { title: "T" }, { trigger: () => h("button", "Open"), default: () => "b" })]) },
      { attachTo: document.body },
    );
    mounted.push(wrapper);
    await wrapper.find("button").trigger("click");
    await flush();
    expect(popup().getAttribute("dir")).toBe("rtl");
  });

  it("uses an explicit dir over the trigger's", async () => {
    mountDialog({ dir: "rtl" });
    await flush();
    expect(popup().getAttribute("dir")).toBe("rtl");
  });
});

describe("LayerDialogAction", () => {
  it("renders a split button when given a menu", () => {
    const wrapper = mount(LayerDialogAction, { props: { menu: ["Save as draft"], menuLabel: "Save options" }, slots: { default: "Save" } });
    expect(wrapper.find('[role="group"]').attributes("aria-label")).toBe("Save options");
    expect(wrapper.findAll("button")).toHaveLength(2);
    expect(wrapper.find('button[aria-label="Save options"]').exists()).toBe(true);
  });

  it("forwards button attributes to the action", () => {
    const wrapper = mount(LayerDialogAction, { attrs: { form: "deploy", type: "submit" }, slots: { default: "Create" } });
    const button = wrapper.find("button");
    expect(button.attributes("form")).toBe("deploy");
    expect(button.attributes("type")).toBe("submit");
    expect(button.classes()).toContain("kv-button--primary");
  });
});
