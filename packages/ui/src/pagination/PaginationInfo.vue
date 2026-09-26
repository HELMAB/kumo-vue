<!-- Ported from Cloudflare Kumo's Pagination.Info (MIT). See /NOTICE. -->
<script setup>
/** "Showing 1-10 of 100", or your own text through the default slot. */
import { usePagination } from "./context.js";

const pagination = usePagination();
</script>

<template>
  <div class="kv-pagination__info" data-slot="pagination-info">
    <slot
      :page="pagination.page.value"
      :per-page="pagination.perPage.value"
      :total-count="pagination.totalCount.value"
      :page-showing-range="pagination.pageShowingRange.value"
    >
      <template v-if="pagination.totalCount.value && pagination.totalCount.value > 0">
        Showing <span class="kv-pagination__number">{{ pagination.pageShowingRange.value }}</span> of
        <span class="kv-pagination__number">{{ pagination.totalCount.value }}</span>
      </template>
    </slot>
  </div>
</template>
