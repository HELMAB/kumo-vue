<!-- Ported from Cloudflare Kumo's Sidebar.SlidingView (MIT). See /NOTICE. -->
<script setup>
/** One surface inside `SidebarSlidingViews`, shown when its `value` is the active key. */
import { computed, inject, onBeforeUnmount } from "vue";
import { SLIDING } from "./context.js";

const props = defineProps({
  /** Matches `active-key` on `SidebarSlidingViews`. */
  value: { type: String, required: true },
});

const sliding = inject(SLIDING);
sliding.register(props.value);
onBeforeUnmount(() => sliding.unregister(props.value));
const isActive = computed(() => sliding.activeKey.value === props.value);
</script>

<template>
  <div
    class="kv-sidebar__sliding-view"
    :class="{ 'kv-sidebar__sliding-view--inactive': !isActive }"
    data-sidebar="sliding-view"
    :data-value="value"
    :aria-hidden="!isActive"
    :inert="!isActive"
  >
    <slot />
  </div>
</template>
