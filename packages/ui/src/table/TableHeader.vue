<!-- Ported from Cloudflare Kumo's Table.Header (MIT). See /NOTICE. -->
<script setup>
/** The table's header section, a `<thead>`. */
defineProps({
  /**
   * `compact` uses a smaller, tinted header row.
   * @values default, compact
   */
  variant: { type: String, default: "default" },
  /** Pins the header row to the top of a scroll container with a constrained height. */
  sticky: { type: Boolean, default: false },
});
</script>

<template>
  <thead
    class="kv-table__header"
    :class="{ 'kv-table__header--compact': variant === 'compact', 'kv-table__header--sticky': sticky }"
    :data-compact="variant === 'compact' ? '' : undefined"
  >
    <slot />
  </thead>
</template>
