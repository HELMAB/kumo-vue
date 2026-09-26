<!-- Ported from Cloudflare Kumo's Pagination.Separator (MIT). See /NOTICE. -->
<script setup>
/** A short vertical rule between pagination parts. */
</script>

<template>
  <div class="kv-pagination__separator" data-slot="pagination-separator" />
</template>

<style>
.kv-pagination__separator {
  block-size: 1.5rem;
  margin-inline: var(--kv-space-2);
  border-inline-start: 1px solid var(--kv-hairline);
}
</style>
