<!-- Ported from Cloudflare Kumo's Badge (MIT). See /NOTICE. -->
<script setup>
/**
 * Badge - a small status label for categorising or highlighting content.
 *
 *   <Badge variant="green">Active</Badge>
 *   <Badge variant="success" appearance="dot">Healthy</Badge>
 *   <Badge variant="secondary"><template #icon><StarIcon /></template>Starred</Badge>
 *
 * Ported from Cloudflare Kumo's React Badge; variant names match Kumo's.
 */
import { computed, useSlots } from "vue";
import { Primitive } from "reka-ui";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /**
   * Colour variant.
   *
   * Semantic: `primary` `secondary` `error` `warning` `success` `info`
   * `outline` `beta`. Palette: `red` `green` `orange` `purple` `teal` `blue`
   * `neutral` `inverted` `teal-subtle` `neutral-subtle`.
   * @values primary, secondary, error, warning, success, info, outline, beta, red, green, orange, purple, teal, blue, neutral, inverted, teal-subtle, neutral-subtle
   */
  variant: { type: String, default: "primary" },
  /**
   * `dot` swaps the fill for an outlined badge with a coloured status dot.
   * Only `success`, `warning`, `error` and `neutral` carry a dot colour.
   * @values filled, dot
   */
  appearance: { type: String, default: "filled" },
  /** Element to render as. */
  as: { type: [String, Object], default: "span" },
  /** Render the single child element instead of an element of our own. */
  asChild: { type: Boolean, default: false },
});

const slots = useSlots();

/** Kumo keeps `destructive` as a deprecated alias for `red`. */
const ALIASES = { destructive: "red" };

/** Only these four resolve to a dot colour; anything else renders no dot. */
const DOT_VARIANTS = new Set(["success", "warning", "error", "neutral"]);

const variant = computed(() => ALIASES[props.variant] ?? props.variant);
const isDot = computed(() => props.appearance === "dot");
const hasDot = computed(() => isDot.value && DOT_VARIANTS.has(variant.value));

const classes = computed(() => [
  "kv-badge",
  /* In dot mode the outline replaces the variant's fill, so the variant class
     is dropped rather than layered under it - as Kumo does. */
  isDot.value ? "kv-badge--dot" : `kv-badge--${variant.value}`,
  { "kv-badge--with-icon": !isDot.value && Boolean(slots.icon) },
]);

const dotClass = computed(() => `kv-badge__dot kv-badge__dot--${variant.value}`);
</script>

<template>
  <Primitive
    v-bind="$attrs"
    :as="as"
    :as-child="asChild"
    :class="classes"
    data-kumo-component="Badge"
  >
    <span v-if="hasDot" :class="dotClass" aria-hidden="true" />
    <span v-else-if="$slots.icon && !isDot" class="kv-badge__icon">
      <slot name="icon" />
    </span>
    <slot />
  </Primitive>
</template>

<style>
/*
 * Logical properties throughout, so the badge mirrors under dir="rtl" without
 * a second stylesheet.
 */
.kv-badge {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  flex: none;
  inline-size: fit-content;

  gap: var(--kv-space-1);
  padding-block: 0.125rem;
  padding-inline: var(--kv-space-2);
  border: 0;
  border-radius: var(--kv-radius-full);

  font-family: inherit;
  font-size: var(--kv-text-xs);
  font-weight: 500;
  line-height: 1.3333;
  white-space: nowrap;
}

/* A badge inside a link picks up a ring on hover, matching Kumo. */
a:hover .kv-badge {
  box-shadow: 0 0 0 1px currentColor;
}

.kv-badge--with-icon {
  padding-inline-start: var(--kv-space-1-5);
}

.kv-badge__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  inline-size: 0.75rem;
  block-size: 0.75rem;
}

.kv-badge__icon > svg {
  inline-size: 100%;
  block-size: 100%;
}

/* Semantic variants */

.kv-badge--primary,
.kv-badge--inverted {
  background-color: var(--kv-badge-inverted);
  color: var(--kv-badge-inverted-text);
}

.kv-badge--secondary,
.kv-badge--neutral-subtle {
  background-color: var(--kv-fill);
  color: var(--kv-badge-neutral-subtle-text);
}

.kv-badge--error {
  background-color: var(--kv-danger-tint);
  color: var(--kv-text-danger);
}

.kv-badge--warning {
  background-color: var(--kv-warning-tint);
  color: var(--kv-text-warning);
}

.kv-badge--success {
  background-color: var(--kv-success-tint);
  color: var(--kv-text-success);
}

.kv-badge--info {
  background-color: var(--kv-info-tint);
  color: var(--kv-text-info);
}

.kv-badge--outline {
  background-color: var(--kv-surface-base);
  color: var(--kv-text-default);
  box-shadow: inset 0 0 0 1px var(--kv-fill);
}

.kv-badge--beta {
  background-color: transparent;
  color: var(--kv-text-link);
  border: 1px dashed var(--kv-brand);
  /* The border is inside the box here, so trim the padding to keep the height. */
  padding-block: calc(0.125rem - 1px);
  padding-inline: calc(var(--kv-space-2) - 1px);
}

/* Palette variants */

.kv-badge--red,
.kv-badge--green,
.kv-badge--purple,
.kv-badge--teal,
.kv-badge--blue,
.kv-badge--neutral {
  color: #fff;
}

.kv-badge--red { background-color: var(--kv-badge-red); }
.kv-badge--green { background-color: var(--kv-badge-green); }
.kv-badge--purple { background-color: var(--kv-badge-purple); }
.kv-badge--teal { background-color: var(--kv-badge-teal); }
.kv-badge--blue { background-color: var(--kv-badge-blue); }
.kv-badge--neutral { background-color: var(--kv-badge-neutral); }

/* Orange is light enough that a black label is the readable one, as in Kumo. */
.kv-badge--orange {
  background-color: var(--kv-badge-orange);
  color: #000;
}

/*
 * Kumo's `teal-subtle` asks for a `--color-kumo-badge-teal-subtle` background
 * that its theme never defines, so upstream the variant renders with no fill
 * at all. A tint of the teal is supplied here so the variant works.
 */
.kv-badge--teal-subtle {
  background-color: color-mix(in oklch, var(--kv-badge-teal) 18%, transparent);
  color: var(--kv-badge-teal-subtle-text);
}

/* Dot appearance */

.kv-badge--dot {
  gap: var(--kv-space-1-5);
  background-color: transparent;
  color: var(--kv-text-default);
  box-shadow: 0 0 0 1px var(--kv-hairline);
}

.kv-badge__dot {
  flex-shrink: 0;
  inline-size: 0.4375rem;
  block-size: 0.4375rem;
  border-radius: var(--kv-radius-full);
}

.kv-badge__dot--success { background-color: var(--kv-success); }
.kv-badge__dot--warning { background-color: var(--kv-badge-orange); }
.kv-badge__dot--error { background-color: var(--kv-badge-red); }
.kv-badge__dot--neutral { background-color: var(--kv-badge-neutral); }
</style>
