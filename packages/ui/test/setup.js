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

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
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
