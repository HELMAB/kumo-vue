<!-- Ported from Cloudflare Kumo's TableOfContents.Title (MIT). See /NOTICE. -->
<script setup>
/** Optional uppercase heading above the list. */
</script>

<template>
  <p class="kv-toc__title">
    <slot />
  </p>
</template>

<style>
.kv-toc__title {
  margin: 0 0 var(--kv-space-3);
  font-size: var(--kv-text-xs);
  line-height: calc(1 / 0.75);
  font-weight: 600;
  letter-spacing: 0.025em;
  text-transform: uppercase;
  color: var(--kv-text-subtle);
}
</style>
