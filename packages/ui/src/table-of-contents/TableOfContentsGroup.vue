<!-- Ported from Cloudflare Kumo's TableOfContents.Group (MIT). See /NOTICE. -->
<script setup>
/** Items under a labelled, indented section. With `href` the label is a link styled as an item. */
import { computed, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

defineProps({
  /** Label shown above the group's items. */
  label: { type: String, required: true },
  /** Makes the label a link to this URL. */
  href: { type: String, default: undefined },
  /** Marks the label as the active section. Only applies with `href`. */
  active: { type: Boolean, default: false },
});

const attrs = useAttrs();

// A click handler goes on the label link: on the <li> it would also catch clicks from nested items.
const itemAttrs = computed(() => {
  const { onClick, ...rest } = attrs;
  return rest;
});

const onLabelClick = (event) => [attrs.onClick].flat().forEach((handler) => handler?.(event));
</script>

<template>
  <li v-bind="itemAttrs" class="kv-toc__entry kv-toc__group">
    <a
      v-if="href"
      :href="href"
      :class="['kv-toc__item', { 'kv-toc__item--active': active }]"
      :aria-current="active ? 'true' : undefined"
      data-kumo-component="TableOfContents"
      data-kumo-part="group-link"
      @click="onLabelClick"
    >
      <span class="kv-toc__label">{{ label }}</span>
    </a>
    <p v-else class="kv-toc__group-label">{{ label }}</p>
    <ul class="kv-toc__list kv-toc__nested">
      <slot />
    </ul>
  </li>
</template>

<style>
.kv-toc__group {
  display: flex;
  flex-direction: column;
  gap: var(--kv-space-2);
}

.kv-toc__group-label {
  margin: 0;
  padding-block: var(--kv-space-0-5);
  padding-inline-start: var(--kv-space-4);
  font-size: var(--kv-text-sm);
  line-height: 1.25rem;
  font-weight: 500;
  color: var(--kv-text-subtle);
}

.kv-toc__nested > li > .kv-toc__item {
  padding-inline-start: 1.75rem;
}
</style>
