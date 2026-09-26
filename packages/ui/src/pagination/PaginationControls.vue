<!-- Ported from Cloudflare Kumo's Pagination.Controls (MIT). See /NOTICE. -->
<script setup>
/** First, previous, page number, next and last buttons. Without a total only previous and next show. */
import { computed } from "vue";
import { InputGroup, InputGroupButton, InputGroupInput } from "../input-group/index.js";
import { Select } from "../select/index.js";
import { ICONS, usePagination } from "./context.js";

const props = defineProps({
  /**
   * `simple` shows only the previous and next buttons.
   * @values full, simple
   */
  controls: { type: String, default: "full" },
  /**
   * How the page number is chosen in `full` controls. `dropdown` lists every page, so suits small counts.
   * @values input, dropdown
   */
  pageSelector: { type: String, default: "input" },
});

const pagination = usePagination();
const { page, totalCount, hasNextPage, maxPage, editingPage, labels } = pagination;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const hasKnownTotal = computed(() => totalCount.value != null);
const showFull = computed(() => props.controls === "full" && !(!hasKnownTotal.value && hasNextPage.value !== undefined));
const nextDisabled = computed(() => (hasKnownTotal.value ? page.value === maxPage.value : hasNextPage.value !== true));
const pages = computed(() => Array.from({ length: maxPage.value }, (_, i) => ({ label: String(i + 1), value: i + 1 })));

function go(target) {
  pagination.setPage(target);
  editingPage.value = target;
}

const commitEditing = () => go(clamp(editingPage.value, 1, maxPage.value));
</script>

<template>
  <div class="kv-pagination__controls" data-slot="pagination-controls">
    <nav :aria-label="labels.navigation">
      <InputGroup>
        <InputGroupButton v-if="showFull" variant="secondary" :aria-label="labels.firstPage" :disabled="page <= 1" @click="go(1)">
          <svg class="kv-pagination__icon" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path :d="ICONS.first" /></svg>
        </InputGroupButton>
        <InputGroupButton variant="secondary" :aria-label="labels.previousPage" :disabled="page <= 1" @click="go(Math.max(page - 1, 1))">
          <svg class="kv-pagination__icon" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path :d="ICONS.previous" /></svg>
        </InputGroupButton>
        <template v-if="showFull">
          <Select
            v-if="pageSelector === 'dropdown'"
            class="kv-pagination__page-select"
            :aria-label="labels.pageNumber"
            :model-value="page"
            :items="pages"
            @update:model-value="go($event)"
          />
          <InputGroupInput
            v-else
            class="kv-pagination__page-input"
            style="inline-size: 50px"
            :aria-label="labels.pageNumber"
            :model-value="editingPage"
            autocomplete="off"
            data-1p-ignore=""
            data-lpignore="true"
            data-form-type="other"
            @update:model-value="editingPage = Number($event)"
            @blur="commitEditing"
            @keydown.enter="commitEditing"
          />
        </template>
        <InputGroupButton
          variant="secondary"
          :aria-label="labels.nextPage"
          :disabled="nextDisabled"
          @click="go(hasKnownTotal ? Math.min(page + 1, maxPage) : page + 1)"
        >
          <svg class="kv-pagination__icon" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path :d="ICONS.next" /></svg>
        </InputGroupButton>
        <InputGroupButton v-if="showFull" variant="secondary" :aria-label="labels.lastPage" :disabled="page === maxPage" @click="go(maxPage)">
          <svg class="kv-pagination__icon" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path :d="ICONS.last" /></svg>
        </InputGroupButton>
      </InputGroup>
    </nav>
  </div>
</template>

<style>
.kv-pagination__controls {
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  align-items: flex-end;
}

.kv-pagination__icon {
  inline-size: 16px;
  block-size: 16px;
}

.kv-pagination__page-input {
  text-align: center;
}

.kv-pagination__page-select.kv-select__trigger {
  border-radius: 0;
}

.kv-pagination__page-select.kv-select__trigger:not(:focus-visible) {
  box-shadow:
    0 0 0 1px var(--kv-hairline),
    0 1px 2px 0 var(--kv-shadow-drop);
}
</style>
