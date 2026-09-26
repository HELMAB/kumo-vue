<!-- Ported from Cloudflare Kumo's LayerCard.Secondary (MIT). See /NOTICE. -->
<script setup>
/** The header row of a layered `LayerCard`, sitting behind the primary layer. */
</script>

<template>
  <div class="kv-layer-card__secondary">
    <slot />
  </div>
</template>

<style>
.kv-layer-card__secondary {
  display: flex;
  align-items: center;
  gap: var(--kv-space-2);
  margin-block: calc(var(--kv-space-2) * -1);
  padding: var(--kv-space-4);
  background-color: var(--kv-surface-elevated);
  font-size: var(--kv-text-base);
  line-height: var(--kv-leading-normal);
  font-weight: 500;
  color: var(--kv-text-subtle);
}
</style>
