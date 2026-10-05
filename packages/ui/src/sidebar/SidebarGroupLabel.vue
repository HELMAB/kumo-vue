<script setup>
/** A group's heading. Collapsed, it becomes a thin divider between icon groups, except above the first. */
import "./context.js";
</script>

<template>
  <div class="kv-sidebar__group-label" data-sidebar="group-label">
    <div class="kv-sidebar__group-label-clip">
      <div class="kv-sidebar__group-label-text"><slot /></div>
    </div>
  </div>
</template>
