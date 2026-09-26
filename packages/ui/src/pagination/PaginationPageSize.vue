<!-- Ported from Cloudflare Kumo's Pagination.PageSize (MIT). See /NOTICE. -->
<script setup>
/** A select for the number of items per page. Use with `v-model`. */
import { computed } from "vue";
import { Select } from "../select/index.js";
import { usePagination } from "./context.js";

defineProps({
  /** The page size. Use with `v-model`. */
  modelValue: { type: Number, required: true },
  /** The sizes to choose from. */
  options: { type: Array, default: () => [25, 50, 100, 250] },
  /** Text before the select. Empty hides it. */
  label: { type: String, default: "Per page:" },
});

defineEmits(["update:modelValue"]);

const pagination = usePagination();
const pageSizeLabel = computed(() => pagination.labels.value.pageSize);
</script>

<template>
  <div class="kv-pagination__page-size" data-slot="pagination-page-size">
    <span v-if="label" class="kv-pagination__info">{{ label }}</span>
    <Select
      :aria-label="pageSizeLabel"
      :model-value="modelValue"
      :items="options.map((size) => ({ label: String(size), value: size }))"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>

<style>
.kv-pagination__page-size {
  display: flex;
  align-items: center;
  gap: var(--kv-space-2);
}
</style>
