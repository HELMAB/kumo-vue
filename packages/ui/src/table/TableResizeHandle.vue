<!-- Ported from Cloudflare Kumo's Table.ResizeHandle (MIT). See /NOTICE. -->
<script setup>
/** A column resize grip for the end of a `TableHead`, shown on hover. Wire the drag up yourself. */
defineProps({
  /** Accessible name, for localisation. */
  label: { type: String, default: "Resize column" },
});
</script>

<template>
  <button type="button" class="kv-table__resize" :aria-label="label" data-kumo-part="resize-handle">
    <span class="kv-table__resize-bar" />
  </button>
</template>
