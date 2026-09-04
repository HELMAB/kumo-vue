/**
 * Overflow detection and drag-to-scroll for a tab list, split out of the
 * component the way `items.js` is: the arithmetic is pure and can be tested
 * directly, rather than through a component that jsdom gives no layout to.
 *
 * Ported from the two hooks in Cloudflare Kumo's Tabs (MIT). See /NOTICE.
 */

import { onBeforeUnmount, onMounted, ref, watch } from "vue";

/**
 * How far a tab list is scrolled, in logical terms.
 *
 * `scrollLeft` counts up from zero in LTR and *down* from zero in RTL, so the
 * raw number cannot say how far from the start you are. Its magnitude can, in
 * both directions - which is what makes the controls work under `dir="rtl"`,
 * where Kumo's raw comparison reports "can scroll start" the moment you scroll.
 *
 * @param {{ scrollWidth: number, clientWidth: number, scrollLeft: number }} el
 */
function scrollMetrics(el) {
  const max = Math.max(0, el.scrollWidth - el.clientWidth);
  return { max, offset: Math.min(Math.abs(el.scrollLeft), max) };
}

/**
 * Whether the list overflows, and which edges it can still scroll towards.
 *
 * The one-pixel slack absorbs sub-pixel layout: a list that is 0.4px wider than
 * its container is not overflowing in any sense a reader would recognise.
 *
 * @param {{ scrollWidth: number, clientWidth: number, scrollLeft: number }} el
 * @returns {{ isOverflowing: boolean, canScrollStart: boolean, canScrollEnd: boolean }}
 */
export function getOverflowState(el) {
  const { max, offset } = scrollMetrics(el);
  return {
    isOverflowing: max > 1,
    canScrollStart: offset > 1,
    canScrollEnd: max - offset > 1,
  };
}

/**
 * How far one press of a scroll control moves the list: as many whole tabs as
 * fit, so nothing is left half-shown. Falls back to most of a screenful when
 * even the first tab is wider than the container.
 *
 * @param {number} containerWidth
 * @param {number[]} tabWidths
 * @returns {number}
 */
export function getScrollDistance(containerWidth, tabWidths) {
  let total = 0;

  for (const width of tabWidths) {
    if (total + width > containerWidth) return total || containerWidth;
    total += width;
  }

  return Math.max(80, Math.floor(containerWidth * 0.8));
}

const prefersReducedMotion = () =>
  typeof matchMedia === "function" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Watch a tab list for overflow, and let it be dragged sideways with a mouse.
 *
 * @param {() => HTMLElement | undefined | null} getElement resolved lazily, so
 *   the list can be a component that only exposes its element once mounted.
 * @param {import("vue").Ref<unknown>} watchKey re-measures when it changes -
 *   the tabs themselves, whose count decides whether the list overflows at all.
 */
export function useTabsScroll(getElement, watchKey) {
  const isOverflowing = ref(false);
  const canScrollStart = ref(false);
  const canScrollEnd = ref(false);

  let observers = [];
  let element;

  function measure() {
    if (!element) return;
    const next = getOverflowState(element);
    isOverflowing.value = next.isOverflowing;
    canScrollStart.value = next.canScrollStart;
    canScrollEnd.value = next.canScrollEnd;
  }

  /** Scroll by whole tabs towards the logical start or end of the list. */
  function scrollBy(direction) {
    if (!element) return;

    const tabs = Array.from(element.querySelectorAll('[data-kumo-part="tab"]'));
    const distance = getScrollDistance(
      element.clientWidth,
      tabs.map((tab) => tab.offsetWidth),
    );

    /* In RTL the axis runs the other way, so "towards the start" is positive. */
    const rtl = getComputedStyle(element).direction === "rtl";
    const sign = (direction === "start" ? -1 : 1) * (rtl ? -1 : 1);

    element.scrollBy({
      left: distance * sign,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }

  /** Bring a tab fully into view when it is clicked at the clipped edge. */
  function revealTab(tab) {
    tab?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }

  function connect() {
    disconnect();
    element = getElement();
    if (!element) return;

    if (typeof ResizeObserver === "function") {
      const resize = new ResizeObserver(measure);
      resize.observe(element);
      for (const tab of element.querySelectorAll('[data-kumo-part="tab"]')) {
        resize.observe(tab);
      }
      observers.push(() => resize.disconnect());
    }

    element.addEventListener("scroll", measure, { passive: true });
    observers.push(() => element.removeEventListener("scroll", measure));

    measure();
  }

  function disconnect() {
    for (const stop of observers) stop();
    observers = [];
  }

  onMounted(connect);
  onBeforeUnmount(disconnect);

  /*
   * The tab set changing can add or remove overflow on its own, and brings new
   * elements to observe with it. Kumo watches the DOM with a MutationObserver;
   * the tabs are a prop here, so the prop is the more direct thing to watch.
   */
  watch(watchKey, () => {
    connect();
  });

  /* Drag to scroll */

  /*
   * Mouse only. Touch and trackpad already scroll the list natively, with
   * inertia, and hijacking them would replace something better.
   */
  let drag = null;
  let suppressClick = false;

  function onPointerdownCapture(event) {
    if (!element || !isOverflowing.value) return;
    if (event.pointerType !== "mouse" || event.button !== 0) return;

    drag = { pointerId: event.pointerId, startX: event.clientX, scrollLeft: element.scrollLeft };
    suppressClick = false;
  }

  function onPointermoveCapture(event) {
    if (!element || !drag || drag.pointerId !== event.pointerId) return;

    const movedBy = event.clientX - drag.startX;
    /* Under the threshold this is still a click on a tab, not a drag. */
    if (!suppressClick) {
      if (Math.abs(movedBy) <= 3) return;
      suppressClick = true;
      element.setPointerCapture(event.pointerId);
    }

    event.preventDefault();
    element.scrollLeft = drag.scrollLeft - movedBy;
  }

  function endDrag(event) {
    if (!element || !drag || drag.pointerId !== event.pointerId) return;

    drag = null;
    if (element.hasPointerCapture?.(event.pointerId)) {
      element.releasePointerCapture(event.pointerId);
    }
  }

  /** A drag that ends on a tab must not also select it. */
  function onClickCapture(event) {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick = false;
  }

  const dragHandlers = {
    onPointerdownCapture,
    onPointermoveCapture,
    onPointerupCapture: (event) => {
      endDrag(event);
      /* Cleared after the click that follows this pointerup has been seen. */
      if (suppressClick) setTimeout(() => (suppressClick = false), 0);
    },
    onPointercancelCapture: endDrag,
    onClickCapture,
  };

  return {
    isOverflowing,
    canScrollStart,
    canScrollEnd,
    dragHandlers,
    scrollBy,
    revealTab,
    measure,
  };
}
