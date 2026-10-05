<script setup>
/** A header cell holding the select-all checkbox; the whole cell is the hit area. */
import { Checkbox } from "../checkbox/index.js";
import TableHead from "./TableHead.vue";

defineProps({
  /** Use with `v-model:checked`. */
  checked: { type: Boolean, default: false },
  indeterminate: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  /** Accessible name of the checkbox. */
  label: { type: String, default: "Select all rows" },
});

const emit = defineEmits(["update:checked"]);
</script>

<template>
  <TableHead class="kv-table__check">
    <Checkbox
      class="kv-table__check-control"
      :model-value="checked"
      :indeterminate="indeterminate"
      :disabled="disabled"
      :aria-label="label"
      @update:model-value="emit('update:checked', $event === true)"
    />
  </TableHead>
</template>
