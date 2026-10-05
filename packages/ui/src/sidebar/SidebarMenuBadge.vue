<!-- Ported from Cloudflare Kumo's Sidebar.MenuBadge (MIT). See /NOTICE. -->
<script setup>
/** A dashed pill inside a menu button, such as "Beta". Hidden while collapsed. */
import "./context.js";
</script>

<template>
  <span class="kv-sidebar__badge" data-sidebar="menu-badge"><slot /></span>
</template>
