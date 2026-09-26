<!-- Ported from Cloudflare Kumo's TableOfContents.List (MIT). See /NOTICE. -->
<script setup>
/** The list of items, with a rail down its leading edge. */
</script>

<template>
  <ul class="kv-toc__list">
    <slot />
  </ul>
</template>

<style>
.kv-toc__list {
  display: flex;
  flex-direction: column;
  gap: var(--kv-space-2);
  margin: 0;
  padding: 0;
  list-style: none;
  border-inline-start: 2px solid var(--kv-hairline);
}
</style>
