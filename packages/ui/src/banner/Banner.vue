<!-- Ported from Cloudflare Kumo's Banner (MIT). See /NOTICE. -->
<script setup>
/**
 * Banner - a full-width message bar for informational, warning or error notices.
 *
 *   <Banner title="Update available" description="A new version is ready." />
 *   <Banner variant="error" size="sm" title="Save failed">
 *     <template #icon><WarningIcon /></template>
 *     <template #action><Button size="xs">Retry</Button></template>
 *   </Banner>
 *
 * `title` and `description` are props rather than slots so they can take
 * translated strings directly, which is how Kumo intends them to be used. A
 * default slot is accepted for unstructured content.
 */
import { computed, useSlots } from "vue";
import { Primitive } from "reka-ui";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /**
   * Visual style.
   * @values default, alert, error, secondary
   */
  variant: { type: String, default: "default" },
  /**
   * `sm` tightens the spacing and keeps title and description on one line,
   * for dialogs and other cramped places.
   * @values base, sm
   */
  size: { type: String, default: "base" },
  /** Heading text. */
  title: { type: String, default: "" },
  /** Secondary text below the title. */
  description: { type: String, default: "" },
  /** Element to render as. */
  as: { type: [String, Object], default: "div" },
  /**
   * Announce the banner to assistive technology as it appears. Use for
   * messages that show up in response to something the user did.
   */
  live: { type: Boolean, default: false },
});

const slots = useSlots();

const isCompact = computed(() => props.size === "sm");
const isStructured = computed(() => Boolean(props.title || props.description));

const classes = computed(() => [
  "kv-banner",
  `kv-banner--${props.variant}`,
  `kv-banner--size-${props.size}`,
]);

/**
 * An error banner is worth interrupting for; the rest can wait for a pause.
 * Only set when `live` is on, so a banner rendered with the page does not
 * announce itself out of context.
 */
const liveAttrs = computed(() => {
  if (!props.live) return {};
  return props.variant === "error"
    ? { role: "alert", "aria-live": "assertive" }
    : { role: "status", "aria-live": "polite" };
});
</script>

<template>
  <Primitive
    v-bind="{ ...$attrs, ...liveAttrs }"
    :as="as"
    :class="classes"
    data-kumo-component="Banner"
  >
    <span v-if="$slots.icon" class="kv-banner__icon">
      <slot name="icon" />
    </span>

    <div class="kv-banner__row">
      <div v-if="isStructured" class="kv-banner__content">
        <p v-if="title" class="kv-banner__title">{{ title }}</p>
        <p v-if="description" class="kv-banner__description">{{ description }}</p>
      </div>
      <div v-else class="kv-banner__content">
        <slot />
      </div>

      <div v-if="$slots.action" class="kv-banner__action">
        <slot name="action" />
      </div>
    </div>
  </Primitive>
</template>

<style>
.kv-banner {
  display: flex;
  inline-size: 100%;
  align-items: flex-start;
  gap: var(--kv-space-3);
  padding-block: var(--kv-space-3);
  padding-inline: var(--kv-space-4);
  border-radius: var(--kv-radius-lg);
  font-family: inherit;
  font-size: var(--kv-text-base);
  line-height: var(--kv-leading-normal);
}

.kv-banner--size-sm {
  align-items: center;
  gap: var(--kv-space-2);
  padding-block: var(--kv-space-2);
  padding-inline: var(--kv-space-3);
  border-radius: var(--kv-radius-md);
  font-size: var(--kv-text-sm);
}

.kv-banner__icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  block-size: 1.375em;
  color: inherit;
}

.kv-banner--size-sm .kv-banner__icon {
  block-size: 1.25em;
}

.kv-banner__icon > svg {
  inline-size: 1em;
  block-size: 1em;
  /* Kumo fills its banner icons rather than stroking them. */
  fill: currentColor;
}

.kv-banner__row {
  display: flex;
  min-inline-size: 0;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: var(--kv-space-3);
}

.kv-banner--size-sm .kv-banner__row {
  gap: var(--kv-space-2);
}

.kv-banner__content {
  display: flex;
  min-inline-size: 0;
  flex-direction: column;
  gap: 0.125rem;
}

/*
 * Compact banners run title and description together on one line, wrapping
 * only when they have to.
 */
.kv-banner--size-sm .kv-banner__content {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: var(--kv-space-1-5);
  row-gap: 0;
}

.kv-banner__title,
.kv-banner__description {
  margin: 0;
  /* Snug leading for a message bar; still clears tall and stacked scripts. */
  line-height: 1.375;
}

.kv-banner__title {
  font-weight: 500;
}

.kv-banner__description {
  font-size: var(--kv-text-sm);
}

.kv-banner__action {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: var(--kv-space-2);
}

/* Variants */

.kv-banner--default {
  background-color: var(--kv-info-tint);
  color: var(--kv-text-info);
}

.kv-banner--alert {
  background-color: var(--kv-warning-tint);
  color: var(--kv-text-warning);
}

.kv-banner--error {
  background-color: var(--kv-danger-tint);
  color: var(--kv-text-danger);
}

.kv-banner--secondary {
  background-color: color-mix(in oklch, var(--kv-surface-contrast) 5%, transparent);
  color: var(--kv-text-default);
}

.kv-banner--secondary .kv-banner__icon {
  color: var(--kv-interact);
}
</style>
