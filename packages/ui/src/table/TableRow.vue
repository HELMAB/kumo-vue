<!-- Ported from Cloudflare Kumo's Table.Row (MIT). See /NOTICE. -->
<script setup>
/** A row, a `<tr>`. Even rows are striped. */
defineProps({
  /**
   * `selected` highlights the row.
   * @values default, selected
   */
  variant: { type: String, default: "default" },
});
</script>

<template>
  <tr class="kv-table__row" :class="{ 'kv-table__row--selected': variant === 'selected' }">
    <slot />
  </tr>
</template>
