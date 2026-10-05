<!-- Ported from Cloudflare Kumo's Sidebar.MenuChevron (MIT). See /NOTICE. -->
<script setup>
/** A chevron for a collapsible menu button that turns as its section opens. Hidden while collapsed. */
import { inject } from "vue";
import { COLLAPSE } from "./context.js";

const collapse = inject(COLLAPSE, null);
</script>

<template>
  <svg
    class="kv-sidebar__chevron"
    :class="{ 'kv-sidebar__chevron--open': collapse?.isOpen.value }"
    width="12"
    height="12"
    viewBox="0 0 256 256"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M184.49,136.49l-80,80a12,12,0,0,1-17-17L159,128,87.51,56.49a12,12,0,1,1,17-17l80,80A12,12,0,0,1,184.49,136.49Z" />
  </svg>
</template>
