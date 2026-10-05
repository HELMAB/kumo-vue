<!-- Ported from Cloudflare Kumo's Table.CheckCell (MIT). See /NOTICE. -->
<script setup>
/** A body cell holding a row's selection checkbox; the whole cell is the hit area. */
import { Checkbox } from "../checkbox/index.js";
import TableCell from "./TableCell.vue";

defineProps({
  /** Use with `v-model:checked`. */
  checked: { type: Boolean, default: false },
  indeterminate: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  /** Accessible name of the checkbox. */
  label: { type: String, default: "Select row" },
});

const emit = defineEmits(["update:checked"]);
</script>

<template>
  <TableCell class="kv-table__check">
    <Checkbox
      class="kv-table__check-control"
      :model-value="checked"
      :indeterminate="indeterminate"
      :disabled="disabled"
      :aria-label="label"
      @update:model-value="emit('update:checked', $event === true)"
    />
  </TableCell>
</template>
