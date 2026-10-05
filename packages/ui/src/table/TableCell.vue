<!-- Ported from Cloudflare Kumo's Table.Cell (MIT). See /NOTICE. -->
<script setup>
/** A body cell, a `<td>`. */
defineProps({
  /**
   * Pins the column to an edge of a horizontally scrolling container, with an opaque background and a fade.
   * @values left, right
   */
  sticky: { type: String, default: undefined },
});
</script>

<template>
  <td class="kv-table__cell" :class="sticky && ['kv-table__sticky', `kv-table__sticky--${sticky}`]">
    <slot />
  </td>
</template>
