<!-- Ported from Cloudflare Kumo's Pagination (MIT). See /NOTICE. -->
<script setup>
/**
 * Page navigation with a page count. Compose `PaginationInfo`, `PaginationPageSize`,
 * `PaginationControls` and `PaginationSeparator` inside it, or leave it empty for the default layout.
 */
import { computed, provide, ref, watch } from "vue";
import PaginationControls from "./PaginationControls.vue";
import { PAGINATION } from "./context.js";

const props = defineProps({
  /** Current page, 1-indexed. Use with `v-model:page`. */
  page: { type: Number, default: 1 },
  /** Items per page. */
  perPage: { type: Number, default: undefined },
  /** Total items across all pages. */
  totalCount: { type: Number, default: undefined },
  /** Whether another page exists when the total is unknown. Ignored with `totalCount`. */
  hasNextPage: { type: Boolean, default: undefined },
  /** Accessible labels, for localisation: `navigation`, `firstPage`, `previousPage`, `nextPage`, `lastPage`, `pageNumber`, `pageSize`. */
  labels: { type: Object, default: () => ({}) },
  /**
   * Controls for the default layout. Compose `PaginationControls` for anything else.
   * @values full, simple
   */
  controls: { type: String, default: "full" },
});

const emit = defineEmits(["update:page"]);

const DEFAULT_LABELS = {
  navigation: "Pagination",
  firstPage: "First page",
  previousPage: "Previous page",
  nextPage: "Next page",
  lastPage: "Last page",
  pageNumber: "Page number",
  pageSize: "Page size",
};

const labels = computed(() => ({ ...DEFAULT_LABELS, ...props.labels }));
const editingPage = ref(props.page);
watch(
  () => props.page,
  (page) => (editingPage.value = page),
);

const pageShowingRange = computed(() => {
  let lower = props.page * (props.perPage ?? 1) - (props.perPage ?? 0) + 1;
  let upper = Math.min(props.page * (props.perPage ?? 0), props.totalCount ?? 0);
  if (Number.isNaN(lower)) lower = 0;
  if (Number.isNaN(upper)) upper = 0;
  return `${lower}-${upper}`;
});

const maxPage = computed(() => Math.ceil((props.totalCount ?? 1) / (props.perPage ?? 1)));

provide(PAGINATION, {
  page: computed(() => props.page),
  perPage: computed(() => props.perPage),
  totalCount: computed(() => props.totalCount),
  hasNextPage: computed(() => props.hasNextPage),
  maxPage,
  pageShowingRange,
  labels,
  editingPage,
  setPage: (page) => emit("update:page", page),
});

const slotProps = computed(() => ({
  page: props.page,
  perPage: props.perPage,
  totalCount: props.totalCount,
  pageShowingRange: pageShowingRange.value,
}));
</script>

<template>
  <div class="kv-pagination" data-slot="pagination" data-kumo-component="Pagination">
    <slot v-if="$slots.default" />
    <template v-else>
      <div class="kv-pagination__info kv-pagination__info--grow" aria-live="polite" aria-atomic="true" data-slot="pagination-info">
        <slot name="text" v-bind="slotProps">
          <template v-if="totalCount && totalCount > 0">
            Showing <span class="kv-pagination__number">{{ pageShowingRange }}</span> of
            <span class="kv-pagination__number">{{ totalCount }}</span>
          </template>
        </slot>
      </div>
      <PaginationControls :controls="controls" />
    </template>
  </div>
</template>

<style>
.kv-pagination {
  display: flex;
  align-items: center;
  gap: var(--kv-space-2);
  inline-size: 100%;
  font-family: var(--kv-font-sans);
}

.kv-pagination__info {
  font-size: var(--kv-text-sm);
  line-height: calc(1 / 0.85);
  color: var(--kv-text-subtle);
}

.kv-pagination__info--grow {
  flex-grow: 1;
}

.kv-pagination__number {
  font-variant-numeric: tabular-nums;
}
</style>
