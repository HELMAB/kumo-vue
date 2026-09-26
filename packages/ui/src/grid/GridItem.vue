<!-- Ported from Cloudflare Kumo's GridItem (MIT). See /NOTICE. -->
<script setup>
/** A single cell within a `Grid`. */
import { computed, inject } from "vue";
import { GRID_CONTEXT } from "./context.js";

const grid = inject(GRID_CONTEXT, null);

const divided = computed(() => grid?.mobileDivider.value && grid?.variant.value === "4up");
</script>

<template>
  <div :class="{ 'kv-grid-item--divider': divided }">
    <slot />
  </div>
</template>

<style>
.kv-grid-item--divider {
  border-block-end: 1px solid var(--kv-hairline);
  padding-block-end: var(--kv-space-8);
}

@media (min-width: 48rem) {
  .kv-grid-item--divider {
    border-block-end-width: 0;
    padding-block-end: 0;
  }
}
</style>
