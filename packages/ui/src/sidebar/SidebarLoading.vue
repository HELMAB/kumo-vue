<script setup>
/** Nav-shaped placeholder rows to show in place of `SidebarContent` while the nav loads. */
import { SkeletonLine } from "../skeleton-line/index.js";
import "./context.js";

defineProps({
  /** Accessible name announced to assistive tech. */
  label: { type: String, default: "Loading" },
});

const groups = [
  ["7rem", "10rem", "6rem"],
  ["6rem", "9rem", "8rem"],
];
</script>

<template>
  <div class="kv-sidebar__loading" role="status" :aria-label="label" data-sidebar="loading">
    <div v-for="(widths, group) in groups" :key="group" class="kv-sidebar__loading-group">
      <SkeletonLine class="kv-sidebar__loading-label" />
      <div v-for="(width, item) in widths" :key="item" class="kv-sidebar__loading-row">
        <SkeletonLine class="kv-sidebar__loading-icon" />
        <SkeletonLine class="kv-sidebar__loading-text" :style="{ '--kv-sidebar-loading-width': width }" />
      </div>
    </div>
  </div>
</template>
