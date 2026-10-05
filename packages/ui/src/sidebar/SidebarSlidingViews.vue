<!-- Ported from Cloudflare Kumo's Sidebar.SlidingViews (MIT). See /NOTICE. -->
<script setup>
/** Slides between navigation surfaces, one `SidebarSlidingView` per surface. Inactive views are hidden and inert. */
import { computed, provide, shallowRef, toRef } from "vue";
import { SLIDING, prefersReducedMotion } from "./context.js";

const props = defineProps({
  /** The `value` of the view to show. */
  activeKey: { type: String, required: true },
  /**
   * Which way the new view slides in from. Kept for Kumo parity; the slide follows view order.
   * @values left, right
   */
  direction: { type: String, default: "left" },
});

const views = shallowRef([]);
provide(SLIDING, {
  activeKey: toRef(props, "activeKey"),
  register: (value) => (views.value = [...views.value, value]),
  unregister: (value) => (views.value = views.value.filter((v) => v !== value)),
});

const index = computed(() => views.value.indexOf(props.activeKey));
const trackStyle = computed(() => ({
  transform: `translateX(${index.value > 0 ? `-${index.value * 100}%` : "0%"})`,
  transition: prefersReducedMotion() ? "none" : "transform var(--sidebar-animation-duration) var(--sidebar-easing)",
}));
</script>

<template>
  <div class="kv-sidebar__sliding-views" data-sidebar="sliding-views">
    <div class="kv-sidebar__sliding-track" :style="trackStyle"><slot /></div>
  </div>
</template>
