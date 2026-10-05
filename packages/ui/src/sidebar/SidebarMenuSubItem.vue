<!-- Ported from Cloudflare Kumo's Sidebar.MenuSubItem (MIT). See /NOTICE. -->
<script setup>
/** A sub-menu list item. Needed explicitly only to wrap a `SidebarCollapsible`. */
import { provide } from "vue";
import { MENU_SUB_ITEM } from "./context.js";

provide(MENU_SUB_ITEM, true);
</script>

<template>
  <li class="kv-sidebar__menu-sub-item" data-sidebar="menu-sub-item"><slot /></li>
</template>
