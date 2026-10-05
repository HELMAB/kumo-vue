<script setup>
/** A list of menu items. `SidebarMenuButton` wraps itself in an item, so `SidebarMenuItem` is only needed around a collapsible. */
import "./context.js";
</script>

<template>
  <ul class="kv-sidebar__menu" data-sidebar="menu"><slot /></ul>
</template>
