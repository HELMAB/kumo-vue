<!-- Ported from Cloudflare Kumo's Sidebar.MenuSub (MIT). See /NOTICE. -->
<script setup>
/** An indented sub-menu with a guide line. `SidebarMenuSubButton` wraps itself in an item. */
import "./context.js";
</script>

<template>
  <ul class="kv-sidebar__menu-sub" data-sidebar="menu-sub">
    <div class="kv-sidebar__menu-sub-line" />
    <slot />
  </ul>
</template>
