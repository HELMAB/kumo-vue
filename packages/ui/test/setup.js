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

/*
 * jsdom has no PointerEvent, and Reka's dismissable layer - what closes a
 * dialog or a popup on a click outside - listens for `pointerdown`. Without
 * this, that path cannot be exercised at all.
 */
if (!globalThis.PointerEvent) {
  globalThis.PointerEvent = class PointerEvent extends MouseEvent {
    constructor(type, options = {}) {
      super(type, options);
      this.pointerId = options.pointerId ?? 1;
      this.pointerType = options.pointerType ?? "mouse";
      this.isPrimary = options.isPrimary ?? true;
    }
  };
}

/*
 * `:popover-open`, `:modal` and `:fullscreen` send jsdom's selector engine into
 * infinite recursion: its `:modal` test asks whether the element is fullscreen,
 * and that asks the element to match all over again. Nothing here ever enters
 * the top layer, so the honest answer is always `false`.
 *
 * Floating UI asks this of every popup it positions - it is how it decides
 * whether to measure against the viewport or the offset parent - so without
 * this, opening any popup built on it spins forever rather than failing.
 */
{
  const TOP_LAYER = /:(popover-open|modal|fullscreen)\b/;
  const matches = Element.prototype.matches;

  Element.prototype.matches = function (selector) {
    if (TOP_LAYER.test(selector)) return false;
    return matches.call(this, selector);
  };
}
