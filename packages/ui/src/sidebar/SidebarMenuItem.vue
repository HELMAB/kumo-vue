<!-- Ported from Cloudflare Kumo's Sidebar.MenuItem (MIT). See /NOTICE. -->
<script setup>
/** A menu list item. Needed explicitly only to wrap a `SidebarCollapsible`. */
import { onBeforeUnmount, onMounted, provide, ref } from "vue";
import { MENU_ITEM, useSidebar } from "./context.js";

const props = defineProps({
  /** Anchor for `useSidebar().scrollToItem(id)`. */
  itemId: { type: String, default: undefined },
});

const sidebar = useSidebar();
const el = ref();
provide(MENU_ITEM, true);
onMounted(() => props.itemId && sidebar.registerItem(props.itemId, el.value));
onBeforeUnmount(() => props.itemId && sidebar.registerItem(props.itemId, null));
</script>

<template>
  <li ref="el" class="kv-sidebar__menu-item" data-sidebar="menu-item" :data-sidebar-item-id="itemId"><slot /></li>
</template>
