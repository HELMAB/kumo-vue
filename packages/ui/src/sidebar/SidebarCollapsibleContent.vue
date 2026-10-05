<!-- Ported from Cloudflare Kumo's Sidebar.CollapsibleContent (MIT). See /NOTICE. -->
<script setup>
/** The section a `SidebarCollapsible` reveals. Stays mounted, so closing animates; hidden content is inert. */
import { inject, onBeforeUnmount, ref, watch } from "vue";
import { COLLAPSE, prefersReducedMotion, useSidebar } from "./context.js";

const collapse = inject(COLLAPSE);
const sidebar = useSidebar();
const el = ref();
let timer;

watch(collapse.isShown, (shown) => {
  clearTimeout(timer);
  if (!shown || !collapse.autoScrollOnOpen.value) return;
  timer = setTimeout(() => el.value?.scrollIntoView({ block: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" }), sidebar.animationDuration);
});
onBeforeUnmount(() => clearTimeout(timer));

function onTransitionEnd(event) {
  if (event.target === event.currentTarget && event.propertyName === "grid-template-rows") collapse.completeOpenChange();
}
</script>

<template>
  <div
    :id="collapse.contentId"
    ref="el"
    class="kv-sidebar__collapsible-content"
    :class="{ 'kv-sidebar__collapsible-content--shown': collapse.isShown.value }"
    role="region"
    :aria-hidden="!collapse.isShown.value"
    :inert="!collapse.isShown.value || undefined"
    @transitionend="onTransitionEnd"
  >
    <div class="kv-sidebar__collapsible-clip"><slot /></div>
  </div>
</template>
