<!-- Ported from Cloudflare Kumo's Sidebar.Rail (MIT). See /NOTICE. -->
<script setup>
/** An invisible strip along the sidebar edge that toggles it on click. */
import { useSidebar } from "./context.js";

defineProps({
  /** Accessible name, for localisation. */
  label: { type: String, default: "Toggle sidebar" },
});

const sidebar = useSidebar();
</script>

<template>
  <button
    type="button"
    class="kv-sidebar__rail"
    :class="`kv-sidebar__rail--${sidebar.side}`"
    :aria-label="label"
    tabindex="-1"
    data-sidebar="rail"
    data-kumo-component="Sidebar"
    data-kumo-part="rail"
    @click="sidebar.toggleSidebar()"
  />
</template>
