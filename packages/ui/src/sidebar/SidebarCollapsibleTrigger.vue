<!-- Ported from Cloudflare Kumo's Sidebar.CollapsibleTrigger (MIT). See /NOTICE. -->
<script setup>
/** Opens and closes the section around it. Renders its single child, usually a `SidebarMenuButton`, with the toggle wired in. */
import { inject } from "vue";
import { Slot } from "reka-ui";
import { COLLAPSE } from "./context.js";

const collapse = inject(COLLAPSE);
</script>

<template>
  <Slot :aria-expanded="collapse.isOpen.value" :aria-controls="collapse.contentId" :data-open="collapse.isOpen.value || undefined" @click="collapse.toggle()">
    <slot />
  </Slot>
</template>
