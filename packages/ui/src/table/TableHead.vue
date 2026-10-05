<script setup>
/** A header cell, a `<th>`. */
defineProps({
  /**
   * Pins the column to an edge of a horizontally scrolling container, with an opaque background and a fade.
   * @values left, right
   */
  sticky: { type: String, default: undefined },
});
</script>

<template>
  <th class="kv-table__head" :class="sticky && ['kv-table__sticky', `kv-table__sticky--${sticky}`]">
    <slot />
  </th>
</template>
