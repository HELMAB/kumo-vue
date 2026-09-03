/**
 * jsdom gaps that Reka's popup primitives rely on.
 *
 * These exist in every browser; jsdom implements neither, so opening a popup
 * throws rather than failing a test honestly. Stubbing them keeps the failures
 * that matter visible.
 */

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

/*
 * A real ResizeObserver delivers one entry as soon as it observes an element.
 * Anything that measures on that first delivery - the Tabs indicator, which
 * only renders once it knows how wide the active tab is - never renders at all
 * against a stub that stays silent. The sizes are all zero in jsdom, but the
 * delivery is what the code under test is waiting for.
 */
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback;
    }

    observe(target) {
      queueMicrotask(() => this.callback?.([{ target }], this));
    }

    unobserve() {}

    disconnect() {
      this.callback = undefined;
    }
  };
}

if (!globalThis.DOMRect) {
  globalThis.DOMRect = class {
    constructor(x = 0, y = 0, width = 0, height = 0) {
      Object.assign(this, {
        x, y, width, height,
        top: y, left: x, right: x + width, bottom: y + height,
      });
    }
  };
}
