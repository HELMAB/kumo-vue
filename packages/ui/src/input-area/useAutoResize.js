/**
 * Grows a textarea to fit its content, clamped between `minRows` and
 * `maxRows`. A port of Kumo's `useTextareaAutoResize`.
 *
 * Kept out of the component because it is the part worth testing directly -
 * the measurement is all arithmetic on computed styles, and driving it through
 * a mounted textarea in jsdom, where layout does not run, tests nothing.
 */
import { onBeforeUnmount, onMounted, watch } from "vue";

const px = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

/**
 * The line height a textarea is actually using, in pixels.
 *
 * `getComputedStyle` normally returns a px value, but `normal` and a bare
 * multiplier both turn up - in jsdom, and for a font stack with no metrics -
 * and both would otherwise parse to 0 and collapse the field.
 */
export function resolveLineHeight(style) {
  const fontSize = px(style.fontSize);
  const raw = style.lineHeight;
  if (raw === "normal" || raw === "") return fontSize * 1.2;
  if (raw.endsWith("px")) return px(raw);
  return px(raw) * fontSize;
}

/**
 * The height to set, given a measured `scrollHeight` and the box metrics.
 * Returns `{ height, overflowY }` - the caller writes both.
 */
export function measure({ scrollHeight, style, minRows, maxRows }) {
  const borders = px(style.borderTopWidth) + px(style.borderBottomWidth);
  const padding = px(style.paddingTop) + px(style.paddingBottom);
  const isBorderBox = style.boxSizing === "border-box";

  /* scrollHeight is content + padding. A border-box height wants the borders
     added back; a content-box height wants the padding taken off. */
  let height = isBorderBox ? scrollHeight + borders : scrollHeight - padding;

  if (minRows > 0 || maxRows > 0) {
    const lineHeight = resolveLineHeight(style);
    const boxSpacing = isBorderBox ? padding + borders : 0;

    height = Math.max(height, lineHeight * minRows + boxSpacing);

    if (maxRows > 0) {
      const maxHeight = lineHeight * maxRows + boxSpacing;
      if (height > maxHeight) {
        /* Clamped, so the overflow has to go somewhere the user can reach. */
        return { height: maxHeight, overflowY: "auto" };
      }
    }
  }

  return { height, overflowY: "hidden" };
}

/**
 * Wires `measure` to an element ref. `enabled`, `minRows` and `maxRows` are
 * getters so the caller can pass reactive props without this module importing
 * their shape.
 */
export function useAutoResize(elRef, { enabled, minRows, maxRows }) {
  let observer = null;

  function resize() {
    const el = elRef.value;
    if (!enabled() || !el || typeof window === "undefined") return;

    const style = window.getComputedStyle(el);
    /* Collapsing to `auto` first is what lets scrollHeight report the true
       content height, which is the only way the field can also shrink. */
    el.style.height = "auto";

    const { height, overflowY } = measure({
      scrollHeight: el.scrollHeight,
      style,
      minRows: minRows(),
      maxRows: maxRows(),
    });

    el.style.overflowY = overflowY;
    el.style.height = `${height}px`;
  }

  /** Clears what `resize` wrote, so turning `auto-resize` off restores the
      native resize handle rather than freezing the last measured height. */
  function reset() {
    const el = elRef.value;
    if (!el) return;
    el.style.height = "";
    el.style.overflowY = "";
  }

  function observe() {
    const el = elRef.value;
    if (!el || typeof ResizeObserver === "undefined") return;
    /* A narrower container rewraps the text, which changes the height without
       the value changing - so width has to be watched, not just input. */
    observer = new ResizeObserver(() => resize());
    observer.observe(el);
  }

  function unobserve() {
    observer?.disconnect();
    observer = null;
  }

  onMounted(() => {
    if (enabled()) {
      resize();
      observe();
    }
  });

  watch(
    () => enabled(),
    (on) => {
      if (on) {
        resize();
        observe();
      } else {
        unobserve();
        reset();
      }
    },
  );

  onBeforeUnmount(unobserve);

  return { resize };
}
