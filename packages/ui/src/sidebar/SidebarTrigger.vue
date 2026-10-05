<!-- Ported from Cloudflare Kumo's Sidebar.Trigger (MIT). See /NOTICE. -->
<script setup>
/** Toggles the sidebar. Shows an animated panel icon unless given content of its own. */
import { useSidebar } from "./context.js";

const props = defineProps({
  /** Accessible names, for localisation. */
  expandLabel: { type: String, default: "Expand sidebar" },
  collapseLabel: { type: String, default: "Collapse sidebar" },
});

const sidebar = useSidebar();
</script>

<template>
  <button
    type="button"
    class="kv-sidebar__trigger"
    data-sidebar="trigger"
    data-kumo-component="Sidebar"
    data-kumo-part="trigger"
    :aria-expanded="sidebar.open"
    :aria-label="sidebar.open ? props.collapseLabel : props.expandLabel"
    @click="sidebar.toggleSidebar()"
  >
    <slot>
      <svg class="kv-sidebar__panel-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true" focusable="false">
        <path d="M21.25 6.72v10.56a2.97 2.97 0 0 1-2.97 2.97H5.72a2.97 2.97 0 0 1-2.97-2.97V6.72a2.97 2.97 0 0 1 2.97-2.97h12.56a2.97 2.97 0 0 1 2.97 2.97" />
        <path d="M6.25 7.25v9.5" class="kv-sidebar__panel-icon-divider" :class="{ 'kv-sidebar__panel-icon-divider--open': sidebar.open }" />
      </svg>
    </slot>
  </button>
</template>
