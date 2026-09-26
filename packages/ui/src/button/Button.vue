<!-- Ported from Cloudflare Kumo's Button (MIT). See /NOTICE. -->
<script setup>
/**
 * Button — the primary action trigger. `as="a"` is Kumo's LinkButton: an anchor
 * styled as a button, ghost by default. `title` shows a Tooltip, as in Kumo.
 */
import { computed, useAttrs, useSlots, watchEffect } from "vue";
import { Primitive } from "reka-ui";
import { Loader } from "../loader/index.js";
import { Tooltip } from "../tooltip/index.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /**
   * Visual style. Defaults to `secondary`, or `ghost` on `as="a"`.
   * @values primary, secondary, ghost, destructive, secondary-destructive, outline
   */
  variant: { type: String, default: undefined },
  /** @values xs, sm, base, lg */
  size: { type: String, default: "base" },
  /**
   * `square` and `circle` are icon-only and need `aria-label`, `aria-labelledby` or `title`.
   * @values base, square, circle
   */
  shape: { type: String, default: "base" },
  /** Shows a spinner in place of the icon and blocks interaction. */
  loading: { type: Boolean, default: false },
  /** Disables the button. A disabled `as="a"` renders a `<button>` instead. */
  disabled: { type: Boolean, default: false },
  /** Shows a Tooltip with this text, and names an icon-only button. */
  title: { type: [String, Number], default: undefined },
  /** Element or component to render as. */
  as: { type: [String, Object], default: "button" },
  /** Render the single child element instead of an element of our own. */
  asChild: { type: Boolean, default: false },
  /** On `as="a"`, opens in a new tab with a safe `rel`. */
  external: { type: Boolean, default: false },
});

const slots = useSlots();
const attrs = useAttrs();

const EMPHASIS_VARIANTS = new Set(["primary", "destructive"]);
const ANCHOR_ONLY = ["href", "target", "rel", "download", "hreflang", "media", "ping", "referrerpolicy"];

const isLink = computed(() => props.as === "a");
const variant = computed(() => props.variant ?? (isLink.value ? "ghost" : "secondary"));
const isEmphasis = computed(() => EMPHASIS_VARIANTS.has(variant.value));
const isCompact = computed(() => props.shape === "square" || props.shape === "circle");
const isInert = computed(() => props.disabled || props.loading);
const hasTitle = computed(() => props.title !== undefined && props.title !== "");

const renderAs = computed(() => (props.disabled && isLink.value ? "button" : props.as));
const isAnchor = computed(() => renderAs.value === "a");

const classes = computed(() => [
  "kv-button",
  `kv-button--${variant.value}`,
  `kv-button--size-${props.size}`,
  `kv-button--shape-${props.shape}`,
  {
    "kv-button--emphasis": isEmphasis.value,
    "kv-button--link": isLink.value,
    "kv-button--disabled": props.disabled,
  },
]);

const omit = (source, predicate) =>
  Object.fromEntries(Object.entries(source).filter(([key]) => !predicate(key)));

const bindings = computed(() => {
  const named = attrs["aria-label"] || attrs["aria-labelledby"];
  const base = {
    "data-kumo-component": attrs["data-kumo-component"] ?? (isLink.value ? "LinkButton" : "Button"),
    ...(!slots.default && !named && hasTitle.value ? { "aria-label": String(props.title) } : {}),
  };

  if (isAnchor.value) {
    const passed = props.loading ? omit(attrs, (k) => /^on[A-Z]/.test(k)) : attrs;
    return {
      ...(props.external ? { target: "_blank", rel: "noopener noreferrer" } : {}),
      ...passed,
      ...base,
      ...(props.loading ? { "aria-disabled": "true" } : {}),
    };
  }

  const passed = isLink.value
    ? omit(attrs, (k) => ANCHOR_ONLY.includes(k.toLowerCase()) || /^on[A-Z]/.test(k))
    : attrs;
  return { ...passed, ...base, type: attrs.type ?? "button", disabled: isInert.value || undefined };
});

function onClick(event) {
  if (isAnchor.value && props.loading) {
    event.preventDefault();
    event.stopPropagation();
  }
}

if (import.meta.env?.DEV) {
  watchEffect(() => {
    const named = attrs["aria-label"] || attrs["aria-labelledby"] || hasTitle.value;
    if (isCompact.value && !slots.default && !named) {
      console.warn(
        `[kumo-vue] Button shape="${props.shape}" is icon-only but has no accessible name. ` +
          "Add aria-label, aria-labelledby, or title.",
      );
    }
  });
}
</script>

<template>
  <Tooltip v-if="hasTitle && isInert" :content="String(title)">
    <span class="kv-button__tooltip-target">
      <Primitive v-bind="bindings" :as="renderAs" :as-child="asChild" :class="classes" @click="onClick">
        <Loader v-if="loading" :size="size === 'lg' ? 16 : 14" />
        <span v-else-if="$slots.icon" class="kv-button__icon"><slot name="icon" /></span>
        <slot />
      </Primitive>
    </span>
  </Tooltip>
  <Tooltip v-else-if="hasTitle" :content="String(title)">
    <Primitive v-bind="bindings" :as="renderAs" :as-child="asChild" :class="classes" @click="onClick">
      <Loader v-if="loading" :size="size === 'lg' ? 16 : 14" />
      <span v-else-if="$slots.icon" class="kv-button__icon"><slot name="icon" /></span>
      <slot />
    </Primitive>
  </Tooltip>
  <Primitive v-else v-bind="bindings" :as="renderAs" :as-child="asChild" :class="classes" @click="onClick">
    <Loader v-if="loading" :size="size === 'lg' ? 16 : 14" />
    <span v-else-if="$slots.icon" class="kv-button__icon"><slot name="icon" /></span>
    <slot />
  </Primitive>
</template>

<style>
/* Rules follow Kumo's Tailwind cascade: same specificity, same order. */
.kv-button {
  --kv-button-radius: var(--kv-radius-lg);
  --kv-button-height: 2.25rem;
  --kv-button-padding: var(--kv-space-3);
  --kv-button-gap: var(--kv-space-1-5);
  --kv-button-font-size: var(--kv-text-base);
  --kv-button-line-height: 1.5;
  --kv-button-ring-width: 0px;
  --kv-button-ring-color: transparent;

  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  inline-size: max-content;
  block-size: var(--kv-button-height);
  padding-block: 0;
  padding-inline: var(--kv-button-padding);
  gap: var(--kv-button-gap);
  border: 0;
  border-radius: var(--kv-button-radius);
  font-family: inherit;
  font-size: var(--kv-button-font-size);
  font-weight: 500;
  line-height: var(--kv-button-line-height);
  text-decoration: none;
  white-space: nowrap;
  user-select: none;
  cursor: pointer;
  box-shadow:
    var(--kv-button-ring-inset,) 0 0 0 var(--kv-button-ring-width) var(--kv-button-ring-color),
    var(--kv-button-drop, 0 1px 2px 0 rgb(0 0 0 / 0.05));
}

.kv-button--link {
  text-decoration: none !important;
  user-select: text;
}

.kv-button--size-xs {
  --kv-button-height: 1.25rem;
  --kv-button-radius: var(--kv-radius-sm);
  --kv-button-padding: var(--kv-space-1-5);
  --kv-button-gap: var(--kv-space-1);
  --kv-button-font-size: var(--kv-text-xs);
  --kv-button-line-height: calc(1 / 0.75);
}

.kv-button--size-sm {
  --kv-button-height: 1.625rem;
  --kv-button-radius: var(--kv-radius-md);
  --kv-button-padding: var(--kv-space-2);
  --kv-button-gap: var(--kv-space-1);
  --kv-button-font-size: var(--kv-text-xs);
  --kv-button-line-height: calc(1 / 0.75);
}

.kv-button--size-lg {
  --kv-button-height: 2.5rem;
  --kv-button-padding: var(--kv-space-4);
  --kv-button-gap: var(--kv-space-2);
}

.kv-button--shape-square,
.kv-button--shape-circle {
  justify-content: center;
  padding-inline: 0;
  inline-size: var(--kv-button-height);
}

.kv-button--shape-circle {
  --kv-button-radius: var(--kv-radius-full);
}

.kv-button--shape-square.kv-button--size-xs,
.kv-button--shape-circle.kv-button--size-xs {
  --kv-button-height: 0.875rem;
}

.kv-button--disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.kv-button--primary {
  --kv-button-fill-source: var(--kv-brand);
}

.kv-button--destructive {
  --kv-button-fill-source: var(--kv-danger-fill);
}

.kv-button--emphasis {
  --kv-button-ring-width: 1px;
  --kv-button-ring-color: color-mix(in oklch, var(--kv-button-fill-source), black 10%);

  position: relative;
  isolation: isolate;
  overflow: hidden;
  background-color: color-mix(in oklch, var(--kv-button-fill-source), white 30%);
  color: #fff !important;
}

.kv-button.kv-button--emphasis {
  gap: var(--kv-space-1-5);
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

.kv-button--secondary,
.kv-button--secondary-destructive {
  --kv-button-ring-width: 1px;
  --kv-button-ring-color: var(--kv-line);

  background-color: var(--kv-surface-base);
  color: var(--kv-text-default) !important;
}

.kv-button--secondary-destructive {
  color: var(--kv-text-danger) !important;
}

.kv-button--ghost {
  --kv-button-drop: 0 0 #0000;

  background-color: inherit;
  color: var(--kv-text-default);
}

.kv-button--outline {
  --kv-button-ring-width: 1px;
  --kv-button-ring-color: var(--kv-line);

  background-color: transparent;
  color: var(--kv-text-default);
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke;
  transition-duration: 100ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

@media (hover: hover) {
  .kv-button--emphasis:hover::before {
    background: linear-gradient(
      to bottom,
      color-mix(in oklch, var(--kv-button-fill-source), white 30%),
      var(--kv-button-fill-source)
    );
  }

  .kv-button--ghost:hover {
    background-color: var(--kv-surface-tint);
  }

  .kv-button--secondary:not(:disabled):hover {
    background-color: var(--kv-surface-tint);
  }

  .kv-button--outline:not(:disabled):hover {
    color: var(--kv-text-strong);
  }

  .kv-button--secondary-destructive:not(:disabled):hover {
    --kv-button-ring-color: color-mix(in oklab, var(--kv-danger) 30%, transparent);

    color: var(--kv-text-danger) !important;
  }

  .kv-button--outline:not(:disabled):hover {
    --kv-button-ring-color: color-mix(in oklab, var(--kv-focus) 25%, transparent);
  }
}

.kv-button:focus {
  --kv-button-ring-color: color-mix(in oklab, var(--kv-focus) 50%, transparent);

  outline: none;
}

.kv-button:focus-visible {
  --kv-button-ring-width: 2px;
  --kv-button-ring-color: var(--kv-brand);

  outline: none;
}

/* Kumo's class merge drops the base focus colours for these, so the emphasis ring stays. */
.kv-button--emphasis:is(:focus, :focus-visible, :active) {
  --kv-button-ring-color: color-mix(in oklch, var(--kv-button-fill-source), black 10%);
}

.kv-button:disabled {
  cursor: not-allowed;
  color: var(--kv-text-subtle);
}

.kv-button--secondary:disabled,
.kv-button--secondary-destructive:disabled {
  background-color: color-mix(in oklab, var(--kv-surface-base) 50%, transparent);
}

.kv-button--secondary:disabled {
  color: color-mix(in oklab, var(--kv-text-default) 70%, transparent) !important;
}

.kv-button--secondary-destructive:disabled {
  color: color-mix(in oklab, var(--kv-text-danger) 70%, transparent) !important;
}

.kv-button--emphasis:disabled {
  opacity: 0.5;
}

.kv-button--secondary[data-state="open"],
.kv-button--secondary-destructive[data-state="open"] {
  background-color: var(--kv-surface-base);
}

@supports not (color: color-mix(in oklch, red, blue)) {
  .kv-button--emphasis::before {
    background: var(--kv-button-fill-source);
    box-shadow: none;
  }
}

.kv-button.kv-tooltip__trigger {
  cursor: pointer;
}

.kv-button__tooltip-target {
  display: inline-flex;
}

.kv-button__icon {
  display: inline-flex;
  flex-shrink: 0;
  inline-size: 1em;
  block-size: 1em;
}

.kv-button__icon > svg {
  inline-size: 100%;
  block-size: 100%;
}
</style>
