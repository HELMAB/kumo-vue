<!-- Ported from Cloudflare Kumo's LayerCard.Primary (MIT). See /NOTICE. -->
<script setup>
/** The raised content layer of a layered `LayerCard`. */
</script>

<template>
  <div class="kv-layer-card__primary">
    <slot />
  </div>
</template>

<style>
.kv-layer-card__primary {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--kv-space-2);
  overflow: hidden;
  padding: var(--kv-space-4);
  padding-inline-end: var(--kv-space-3);
  border-radius: var(--kv-radius-lg);
  background-color: var(--kv-surface-base);
  color: inherit;
  text-decoration: none;
  box-shadow: 0 0 0 1px var(--kv-fill);
}
</style>
