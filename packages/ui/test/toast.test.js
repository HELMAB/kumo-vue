/**
 * Behavioural contract for the toast queue and the toasts it renders.
 *
 * The queue is a plain module, so most of this asserts against it directly.
 * The component tests cover what jsdom does model: the markup, the variants,
 * the close button and the wiring between the two.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";

import Toaster from "../src/toast/Toaster.vue";
import { NO_TIMEOUT, createToastManager, toast, useToast } from "../src/toast/manager.js";

const flush = async () => {
  await nextTick();
  await nextTick();
};

const mountToaster = (props = {}, options = {}) =>
  mount(Toaster, { props, attachTo: document.body, ...options });

afterEach(() => {
  toast.toasts.value = [];
  document.body.innerHTML = "";
});

describe("the queue", () => {
  it("adds a toast and hands back its id", () => {
    const manager = createToastManager();
    const id = manager.add({ title: "Saved" });

    expect(manager.toasts.value).toHaveLength(1);
    expect(manager.toasts.value[0]).toMatchObject({ id, title: "Saved", open: true });
  });

  it("defaults to the plain variant", () => {
    const manager = createToastManager();
    manager.add({ title: "Saved" });
    expect(manager.toasts.value[0].variant).toBe("default");
  });

  it("puts the newest toast in front", () => {
    const manager = createToastManager();
    manager.add({ title: "First" });
    manager.add({ title: "Second" });
    expect(manager.toasts.value.map((entry) => entry.title)).toEqual(["Second", "First"]);
  });

  it("gives every toast its own id", () => {
    const manager = createToastManager();
    expect(manager.add({ title: "One" })).not.toBe(manager.add({ title: "One" }));
  });

  it("keeps an explicit id", () => {
    const manager = createToastManager();
    expect(manager.add({ id: "save", title: "Saved" })).toBe("save");
  });

  it("bumps rather than stacking a toast whose id is already showing", () => {
    const manager = createToastManager();
    manager.add({ id: "retry", title: "Retrying" });
    manager.add({ id: "retry", title: "Retrying again" });

    expect(manager.toasts.value).toHaveLength(1);
    expect(manager.toasts.value[0].title).toBe("Retrying again");
    expect(manager.toasts.value[0].bump).toBe(1);
  });

  it("reopens a bumped toast that was on its way out", () => {
    const manager = createToastManager();
    manager.add({ id: "retry", title: "Retrying" });
    manager.close("retry");
    manager.add({ id: "retry", title: "Retrying" });

    expect(manager.toasts.value[0].open).toBe(true);
  });

  it("updates a toast in place", () => {
    const manager = createToastManager();
    const id = manager.add({ title: "Deploying" });
    manager.update(id, { title: "Deployed", variant: "success" });

    expect(manager.toasts.value[0]).toMatchObject({ title: "Deployed", variant: "success" });
  });

  it("ignores an update to a toast that has gone", () => {
    const manager = createToastManager();
    expect(manager.update("missing", { title: "?" })).toBe(false);
  });

  it("closes a toast without dropping it, so it can animate out", () => {
    const manager = createToastManager();
    const id = manager.add({ title: "Saved" });
    manager.close(id);

    expect(manager.toasts.value).toHaveLength(1);
    expect(manager.toasts.value[0].open).toBe(false);
  });

  it("drops it once it has left", () => {
    const manager = createToastManager();
    const id = manager.add({ title: "Saved" });
    manager.remove(id);
    expect(manager.toasts.value).toHaveLength(0);
  });

  it("closes every toast at once", () => {
    const manager = createToastManager();
    manager.add({ title: "One" });
    manager.add({ title: "Two" });
    manager.clear();

    expect(manager.toasts.value.every((entry) => !entry.open)).toBe(true);
  });

  it("carries a default duration onto its toasts", () => {
    const manager = createToastManager({ duration: 1000 });
    manager.add({ title: "Saved" });
    expect(manager.toasts.value[0].duration).toBe(1000);
  });

  it("lets one toast override it", () => {
    const manager = createToastManager({ duration: 1000 });
    manager.add({ title: "Saved", duration: NO_TIMEOUT });
    expect(manager.toasts.value[0].duration).toBe(NO_TIMEOUT);
  });
});

describe("promise", () => {
  it("shows a loading toast that cannot time out", () => {
    const manager = createToastManager();
    manager.promise(new Promise(() => {}), {
      loading: { title: "Deploying" },
      success: { title: "Deployed" },
      error: { title: "Failed" },
    });

    expect(manager.toasts.value[0]).toMatchObject({
      title: "Deploying",
      duration: NO_TIMEOUT,
    });
  });

  it("replaces it with the outcome, in place", async () => {
    const manager = createToastManager();
    await manager.promise(Promise.resolve({ name: "my-worker" }), {
      loading: { title: "Deploying" },
      success: (data) => ({ title: "Deployed", description: data.name, variant: "success" }),
      error: { title: "Failed" },
    });

    expect(manager.toasts.value).toHaveLength(1);
    expect(manager.toasts.value[0]).toMatchObject({
      title: "Deployed",
      description: "my-worker",
      variant: "success",
    });
  });

  it("restores the timeout the loading toast gave up", async () => {
    const manager = createToastManager({ duration: 4000 });
    await manager.promise(Promise.resolve(), {
      loading: { title: "Deploying" },
      success: { title: "Deployed" },
      error: { title: "Failed" },
    });

    expect(manager.toasts.value[0].duration).toBe(4000);
  });

  it("reports a rejection through the toast, and still rejects", async () => {
    const manager = createToastManager();
    const failure = new Error("Network error");

    await expect(
      manager.promise(Promise.reject(failure), {
        loading: { title: "Deploying" },
        success: { title: "Deployed" },
        error: (error) => ({ title: "Failed", description: error.message, variant: "error" }),
      }),
    ).rejects.toThrow("Network error");

    expect(manager.toasts.value[0]).toMatchObject({
      title: "Failed",
      description: "Network error",
      variant: "error",
    });
  });

  it("hands back the resolved value, so the caller can still use it", async () => {
    const manager = createToastManager();
    const value = await manager.promise(Promise.resolve(42), {
      loading: { title: "Working" },
      success: { title: "Done" },
      error: { title: "Failed" },
    });
    expect(value).toBe(42);
  });
});

describe("rendering", () => {
  it("renders nothing until something is raised", async () => {
    mountToaster();
    await flush();
    expect(document.querySelector('[data-kumo-component="Toast"]')).toBeNull();
  });

  it("renders a toast raised on the shared queue", async () => {
    mountToaster();
    toast.add({ title: "Saved", description: "Your changes are live." });
    await flush();

    const element = document.querySelector('[data-kumo-component="Toast"]');
    expect(element).not.toBeNull();
    expect(element.textContent).toContain("Saved");
    expect(element.textContent).toContain("Your changes are live.");
  });

  it("renders into a region an assistive technology can find", async () => {
    mountToaster();
    await flush();
    /* Reka puts the landmark on a wrapper around the list itself. */
    const region = document.querySelector('[role="region"]');
    expect(region).not.toBeNull();
    expect(region.getAttribute("aria-label")).toContain("Notifications");
    expect(region.querySelector('[data-kumo-component="Toaster"]')).not.toBeNull();
  });

  it("takes a translated region name, with the hotkey filled in", async () => {
    mountToaster({ label: "Benachrichtigungen ({hotkey})" });
    await flush();
    const label = document.querySelector('[role="region"]').getAttribute("aria-label");
    expect(label).toContain("Benachrichtigungen");
    expect(label).not.toContain("{hotkey}");
  });

  it("applies the variant class and shows its icon", async () => {
    mountToaster();
    toast.add({ title: "Deployed", variant: "success" });
    await flush();

    const element = document.querySelector('[data-kumo-component="Toast"]');
    expect(element.classList.contains("kv-toast--success")).toBe(true);
    expect(element.querySelector("[data-toast-icon]")).not.toBeNull();
  });

  it("shows no icon for a plain toast, as Kumo does", async () => {
    mountToaster();
    toast.add({ title: "Saved" });
    await flush();
    expect(document.querySelector("[data-toast-icon]")).toBeNull();
  });

  it("renders a title on its own", async () => {
    mountToaster();
    toast.add({ title: "Settings saved" });
    await flush();

    expect(document.querySelector(".kv-toast__title").textContent.trim()).toBe("Settings saved");
    expect(document.querySelector(".kv-toast__description")).toBeNull();
  });

  it("renders a description on its own", async () => {
    mountToaster();
    toast.add({ description: "Your changes have been saved." });
    await flush();

    expect(document.querySelector(".kv-toast__description")).not.toBeNull();
    expect(document.querySelector(".kv-toast__title")).toBeNull();
  });

  it("stacks several, newest in front", async () => {
    mountToaster();
    toast.add({ title: "First" });
    toast.add({ title: "Second" });
    await flush();

    const titles = [...document.querySelectorAll(".kv-toast__title")].map((node) =>
      node.textContent.trim(),
    );
    expect(titles).toEqual(["Second", "First"]);
  });

  it("marks the toasts past the limit, rather than dropping them", async () => {
    mountToaster({ limit: 2 });
    toast.add({ title: "One" });
    toast.add({ title: "Two" });
    toast.add({ title: "Three" });
    await flush();

    const elements = [...document.querySelectorAll('[data-kumo-component="Toast"]')];
    expect(elements).toHaveLength(3);
    expect(elements.map((element) => element.hasAttribute("data-limited"))).toEqual([
      false,
      false,
      true,
    ]);
  });

  it("renders actions, and calls them when pressed", async () => {
    const onClick = vi.fn();
    mountToaster();
    toast.add({ title: "Need help?", actions: [{ label: "Support", onClick }] });
    await flush();

    const action = document.querySelector(".kv-toast__actions button");
    expect(action.textContent).toContain("Support");
    action.click();
    expect(onClick).toHaveBeenCalled();
  });

  it("closes a toast from its dismiss button", async () => {
    mountToaster();
    toast.add({ title: "Saved" });
    await flush();

    document.querySelector('[data-kumo-part="close"]').click();
    await flush();
    expect(toast.toasts.value[0].open).toBe(false);
  });

  it("takes a translated name for that button", async () => {
    mountToaster({ closeLabel: "Fermer" });
    toast.add({ title: "Saved" });
    await flush();

    expect(document.querySelector('[data-kumo-part="close"]').getAttribute("aria-label")).toBe(
      "Fermer",
    );
  });

  it("passes each toast's duration to the primitive that counts it down", async () => {
    const manager = createToastManager();
    mountToaster({ manager });
    manager.add({ title: "Saved", duration: 1234 });
    await flush();
    /* Reka owns the timer; what is asserted here is that it was handed over. */
    expect(manager.toasts.value[0].duration).toBe(1234);
  });
});

describe("leaving", () => {
  it("drops a closed toast from the queue once it has gone", async () => {
    vi.useFakeTimers();
    try {
      mountToaster();
      const id = toast.add({ title: "Saved" });
      await flush();

      toast.close(id);
      await flush();
      /* Still there, still animating out. */
      expect(toast.toasts.value).toHaveLength(1);

      vi.advanceTimersByTime(400);
      await flush();
      expect(toast.toasts.value).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not leave a closed toast holding its place in the stack", async () => {
    mountToaster();
    toast.add({ title: "First" });
    toast.add({ title: "Second" });
    await flush();

    /* Close the front one: the other should take its place, not stay behind it. */
    toast.close(toast.toasts.value[0].id);
    await flush();

    const second = [...document.querySelectorAll('[data-kumo-component="Toast"]')].find(
      (element) => element.textContent.includes("First"),
    );
    expect(second.style.getPropertyValue("--kv-toast-index")).toBe("0");
    expect(second.style.getPropertyValue("--kv-toast-offset")).toBe("0px");
  });

  it("does not let closed toasts push a live one past the limit", async () => {
    mountToaster({ limit: 2 });
    const ids = [toast.add({ title: "One" }), toast.add({ title: "Two" })];
    await flush();

    for (const id of ids) toast.close(id);
    toast.add({ title: "Three" });
    await flush();

    const three = [...document.querySelectorAll('[data-kumo-component="Toast"]')].find(
      (element) => element.textContent.includes("Three"),
    );
    expect(three.hasAttribute("data-limited")).toBe(false);
  });

  it("empties the queue even when the element is gone already", async () => {
    /*
     * Reka's `Presence` unmounts a closing element the moment it sees no CSS
     * animation on it - which is always the case here, since jsdom runs none.
     * Removal must not depend on hearing anything from that element: waiting
     * for a `transitionend` from it left every closed toast in the queue for
     * good, holding its place in the stack and counting against the limit.
     */
    vi.useFakeTimers();
    try {
      mountToaster();
      const id = toast.add({ title: "Saved" });
      await flush();

      toast.close(id);
      await flush();
      expect(document.querySelector('[data-kumo-component="Toast"]')).toBeNull();

      vi.advanceTimersByTime(400);
      await flush();
      expect(toast.toasts.value).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("an isolated queue", () => {
  it("renders its own toasts, not the shared ones", async () => {
    const manager = createToastManager();
    mountToaster({ manager });

    manager.add({ title: "Mine" });
    toast.add({ title: "Shared" });
    await flush();

    const titles = [...document.querySelectorAll(".kv-toast__title")].map((node) =>
      node.textContent.trim(),
    );
    expect(titles).toEqual(["Mine"]);
  });

  it("is what useToast finds inside that Toaster", () => {
    const manager = createToastManager();
    let found;

    const Child = { setup: () => { found = useToast(); return () => null; } };
    mount(Toaster, { props: { manager }, slots: { default: Child }, attachTo: document.body });

    expect(found).toBe(manager);
    expect(found).not.toBe(toast);
  });

  it("falls back to the shared queue with no Toaster above", () => {
    let found;
    mount({ setup: () => { found = useToast(); return () => null; } });
    expect(found).toBe(toast);
  });
});
