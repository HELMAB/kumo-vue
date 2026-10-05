<!-- Ported from Cloudflare Kumo's Sidebar.Close (MIT). See /NOTICE. -->
<script setup>
/** Closes the mobile sheet; most useful with `full-screen-on-mobile`, where there is no backdrop. Does nothing on desktop. */
import { Button } from "../button/index.js";
import { useSidebar } from "./context.js";

defineProps({
  /** Accessible name, for localisation. */
  label: { type: String, default: "Close navigation" },
});

const sidebar = useSidebar();
</script>

<template>
  <Button
    class="kv-sidebar__close"
    variant="ghost"
    shape="square"
    size="sm"
    :aria-label="label"
    data-sidebar="close"
    data-kumo-component="Sidebar"
    data-kumo-part="close"
    @click="sidebar.setOpenMobile(false)"
  >
    <template #icon>
      <svg viewBox="0 0 256 256" fill="currentColor" width="18" height="18" aria-hidden="true">
        <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
      </svg>
    </template>
  </Button>
</template>
