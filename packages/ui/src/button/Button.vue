<!-- Ported from Cloudflare Kumo's Button (MIT). See /NOTICE. -->
<script setup>
/**
 * Button — the primary action trigger.
 *
 * Renders a `<button>` by default. Pass `as="a"` with an `href` for a link
 * styled as a button, or `as-child` to hand the styling to a router link:
 *
 *   <Button as="a" href="/docs" variant="ghost">Docs</Button>
 *   <Button as-child><RouterLink to="/docs">Docs</RouterLink></Button>
 *
 * Ported from Cloudflare Kumo's React Button. Variant, size and shape names
 * match Kumo's; see the README for where the two deliberately differ.
 */
import { computed, useAttrs, useSlots, watchEffect } from "vue";
import { Primitive } from "reka-ui";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /**
   * Visual style.
   * `primary` and `destructive` are the high-emphasis, filled treatments;
   * the rest are quieter.
   * @values primary, secondary, ghost, destructive, secondary-destructive, outline
   */
  variant: { type: String, default: "secondary" },
  /** @values xs, sm, base, lg */
  size: { type: String, default: "base" },
  /**
   * `square` and `circle` drop the label and size the button to its icon.
   * Both require an accessible name — `aria-label`, `aria-labelledby`, or
   * `title`.
   * @values base, square, circle
   */
  shape: { type: String, default: "base" },
  /** Shows a spinner in place of the icon and blocks interaction. */
  loading: { type: Boolean, default: false },
  /** Disables the button. A disabled `as="a"` renders a `<button>` instead. */
  disabled: { type: Boolean, default: false },
  /** Element or component to render as. */
  as: { type: [String, Object], default: "button" },
  /** Render the single child element instead of an element of our own. */
  asChild: { type: Boolean, default: false },
  /** On `as="a"`, opens in a new tab with a safe `rel`. */
  external: { type: Boolean, default: false },
});

const slots = useSlots();
const attrs = useAttrs();

/* The fill each of these resolves to is defined in CSS, not here - see below. */
const EMPHASIS_VARIANTS = new Set(["primary", "destructive"]);

const isEmphasis = computed(() => EMPHASIS_VARIANTS.has(props.variant));
const isCompact = computed(() => props.shape === "square" || props.shape === "circle");
const isInert = computed(() => props.disabled || props.loading);

/**
 * A disabled anchor is still focusable and still navigable, so `disabled` on
 * `as="a"` renders a real `<button disabled>` instead - the same swap Kumo
 * makes. Anchor-only attributes go with it.
 */
const renderAs = computed(() =>
  props.disabled && props.as === "a" ? "button" : props.as,
);
const isAnchor = computed(() => renderAs.value === "a");

const classes = computed(() => [
  "kv-button",
  `kv-button--${props.variant}`,
  `kv-button--size-${props.size}`,
  `kv-button--shape-${props.shape}`,
  { "kv-button--emphasis": isEmphasis.value, "kv-button--loading": props.loading },
]);

const ANCHOR_ONLY = ["href", "target", "rel", "download", "hreflang", "ping", "referrerpolicy"];

const omit = (source, predicate) =>
  Object.fromEntries(Object.entries(source).filter(([key]) => !predicate(key)));

/**
 * Everything bound to the rendered element, merged here rather than in the
 * template so listener stripping is under our control.
 */
const bindings = computed(() => {
  const base = { "data-kumo-component": "Button" };

  if (isAnchor.value) {
    /*
     * An anchor has no `disabled`, so a loading one is marked `aria-disabled`
     * and its listeners are dropped - the same stripping Kumo applies when it
     * swaps a disabled link for a button. `onClick` below stops navigation,
     * which is not a listener and so survives the strip.
     */
    const passed = props.loading ? omit(attrs, (k) => /^on[A-Z]/.test(k)) : attrs;
    return {
      ...passed,
      ...base,
      ...(props.external ? { target: "_blank", rel: "noopener noreferrer" } : {}),
      ...(props.loading ? { "aria-disabled": "true" } : {}),
    };
  }

  /* Dropping href and friends keeps the swapped-in button valid HTML. */
  const passed = props.as === "a" ? omit(attrs, (k) => ANCHOR_ONLY.includes(k)) : attrs;
  return {
    ...passed,
    ...base,
    type: attrs.type ?? "button",
    disabled: isInert.value || undefined,
  };
});

/** Swallow activation on a loading anchor, which has no `disabled` to do it. */
function onClick(event) {
  if (isAnchor.value && props.loading) {
    event.preventDefault();
    event.stopPropagation();
  }
}

/**
 * Kumo enforces an accessible name on icon-only buttons through its prop
 * types. Without TypeScript the equivalent has to be a runtime check, so it
 * warns in development and costs nothing in a production build.
 */
if (import.meta.env?.DEV) {
  watchEffect(() => {
    const named =
      attrs["aria-label"] || attrs["aria-labelledby"] || attrs.title;
    if (isCompact.value && !slots.default && !named) {
      console.warn(
        '[kumo-vue] Button shape="' +
          props.shape +
          '" is icon-only but has no accessible name. ' +
          "Add aria-label, aria-labelledby, or title.",
      );
    }
  });
}

</script>

<template>
  <Primitive
    v-bind="bindings"
    :as="renderAs"
    :as-child="asChild"
    :class="classes"
    :aria-busy="loading || undefined"
    @click="onClick"
  >
    <!--
      The emphasis fill is a pseudo-element behind the content, so the label
      stays a direct child and `gap` still applies to it.
    -->
    <svg
      v-if="loading"
      class="kv-button__spinner"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="2" opacity="0.25" />
      <path
        d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>
    <span v-else-if="$slots.icon" class="kv-button__icon">
      <slot name="icon" />
    </span>
    <slot />
  </Primitive>
</template>

<style>
/*
 * Every dimension here is either a token or a control height. Control heights
 * are local on purpose: a button's 36px is not a spacing value, and putting it
 * in the token package would imply a control-size scale that does not exist.
 *
 * No directional properties — padding-inline, not padding-left — so the button
 * mirrors under `dir="rtl"` with no extra stylesheet.
 */
.kv-button {
  --kv-button-radius: var(--kv-radius-lg);
  --kv-button-height: 2.25rem;
  --kv-button-padding: var(--kv-space-3);
  --kv-button-gap: var(--kv-space-1-5);
  --kv-button-font-size: var(--kv-text-base);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: max-content;

  block-size: var(--kv-button-height);
  /* Browsers give <button> a default block padding; Tailwind's preflight
     zeroes it for Kumo, and there is no preflight here. */
  padding-block: 0;
  padding-inline: var(--kv-button-padding);
  gap: var(--kv-button-gap);

  border: 0;
  border-radius: var(--kv-button-radius);
  font-family: inherit;
  font-size: var(--kv-button-font-size);
  font-weight: 500;
  line-height: var(--kv-leading-normal);
  text-decoration: none;
  white-space: nowrap;
  user-select: none;
  cursor: pointer;
  box-shadow: 0 1px 2px 0 var(--kv-shadow-drop);
  transition:
    background-color 100ms ease,
    box-shadow 100ms ease,
    color 100ms ease;
}

.kv-button:focus-visible {
  outline: 2px solid var(--kv-brand);
  outline-offset: 1px;
}

.kv-button:disabled,
.kv-button[aria-disabled="true"] {
  cursor: not-allowed;
  color: var(--kv-text-subtle);
  opacity: 0.5;
}

/* An anchor rendered as a button should still allow text selection. */
.kv-button:is(a) {
  user-select: text;
}

@media (prefers-reduced-motion: reduce) {
  .kv-button {
    transition: none;
  }
}

/* ---- Sizes ------------------------------------------------------------- */

.kv-button--size-xs {
  --kv-button-height: 1.25rem;
  --kv-button-radius: var(--kv-radius-sm);
  --kv-button-padding: var(--kv-space-1-5);
  --kv-button-gap: var(--kv-space-1);
  --kv-button-font-size: var(--kv-text-xs);
}

.kv-button--size-sm {
  --kv-button-height: 1.625rem;
  --kv-button-radius: var(--kv-radius-md);
  --kv-button-padding: var(--kv-space-2);
  --kv-button-gap: var(--kv-space-1);
  --kv-button-font-size: var(--kv-text-xs);
}

.kv-button--size-lg {
  --kv-button-height: 2.5rem;
  --kv-button-padding: var(--kv-space-4);
  --kv-button-gap: var(--kv-space-2);
}

/* ---- Shapes ------------------------------------------------------------ */

.kv-button--shape-square,
.kv-button--shape-circle {
  padding-inline: 0;
  inline-size: var(--kv-button-height);
}

.kv-button--shape-circle {
  --kv-button-radius: var(--kv-radius-full);
}

/* ---- Variants ---------------------------------------------------------- */

.kv-button--secondary,
.kv-button--secondary-destructive,
.kv-button--outline {
  background-color: var(--kv-surface-base);
  color: var(--kv-text-default);
  box-shadow:
    0 0 0 1px var(--kv-line),
    0 1px 2px 0 var(--kv-shadow-drop);
}

.kv-button--outline {
  background-color: transparent;
}

.kv-button--secondary-destructive {
  color: var(--kv-text-danger);
}

.kv-button--secondary:not(:disabled):hover,
.kv-button--secondary-destructive:not(:disabled):hover {
  background-color: var(--kv-surface-tint);
}

.kv-button--outline:not(:disabled):hover {
  color: var(--kv-text-strong);
  box-shadow:
    0 0 0 1px var(--kv-line-strong),
    0 1px 2px 0 var(--kv-shadow-drop);
}

.kv-button--ghost {
  background-color: transparent;
  color: var(--kv-text-default);
  box-shadow: none;
}

.kv-button--ghost:not(:disabled):hover {
  background-color: var(--kv-surface-tint);
}

/*
 * Emphasis fill (primary, destructive).
 *
 * A soft top-down gradient with an inset highlight, matching Kumo exactly:
 * same 15% white top stop, same 1px outset ring at 10% black, and a hover that
 * lightens the top stop to 30% white.
 *
 * This puts the white label below WCAG AA — 3.46:1 on primary, 2.68:1 on
 * hover. That is Kumo's design, kept here for visual parity and reported by
 * `scripts/check-contrast.js` rather than silently shipped. Overriding
 * `--kv-brand` and `--kv-danger-fill` with darker values restores AA without
 * touching this file; see the README.
 */
.kv-button--primary {
  --kv-button-fill-source: var(--kv-brand);
}

.kv-button--destructive {
  /*
   * Split from `--kv-danger` so the fill can be retargeted for contrast
   * without moving the status colour with it.
   */
  --kv-button-fill-source: var(--kv-danger-fill);
}

.kv-button--emphasis {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  color: #fff;
  background-color: color-mix(in oklch, var(--kv-button-fill-source), white 30%);
  box-shadow:
    0 0 0 1px color-mix(in oklch, var(--kv-button-fill-source), black 10%),
    0 1px 2px 0 var(--kv-shadow-drop);
}

.kv-button--emphasis::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background: linear-gradient(
    to bottom,
    color-mix(in oklch, var(--kv-button-fill-source), white 15%),
    var(--kv-button-fill-source)
  );
  box-shadow: inset 0 1px 0 0 color-mix(in oklch, var(--kv-button-fill-source), white 30%);
}

.kv-button--emphasis:not(:disabled):hover::before {
  background: linear-gradient(
    to bottom,
    color-mix(in oklch, var(--kv-button-fill-source), white 30%),
    var(--kv-button-fill-source)
  );
}

/* Colour-mix is unavailable in older engines; fall back to the flat fill. */
@supports not (color: color-mix(in oklch, red, blue)) {
  .kv-button--emphasis::before {
    background: var(--kv-button-fill-source);
    box-shadow: none;
  }
}

/* ---- Icon and spinner -------------------------------------------------- */

.kv-button__icon,
.kv-button__spinner {
  display: inline-flex;
  flex-shrink: 0;
  inline-size: 1em;
  block-size: 1em;
}

.kv-button__icon > svg {
  inline-size: 100%;
  block-size: 100%;
}

.kv-button--size-lg .kv-button__spinner,
.kv-button--size-lg .kv-button__icon {
  inline-size: 1.125em;
  block-size: 1.125em;
}

.kv-button__spinner {
  animation: kv-button-spin 700ms linear infinite;
}

@keyframes kv-button-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .kv-button__spinner {
    animation-duration: 2.4s;
  }
}
</style>
