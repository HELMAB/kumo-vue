<!-- Ported from Cloudflare Kumo's Sidebar.Content (MIT). See /NOTICE. -->
<script setup>
/** The scrolling middle of the sidebar, with a fade where content runs past an edge. */
import { computed, onBeforeUnmount, ref } from "vue";
import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from "reka-ui";
import "./context.js";

const overflow = ref({ start: 0, end: 0 });
const scrolling = ref(false);
let timer;
let observer;
let observed;

function measure(viewport) {
  overflow.value = { start: viewport.scrollTop, end: Math.max(0, viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop) };
}

function onScroll(event) {
  measure(event.currentTarget);
  scrolling.value = true;
  clearTimeout(timer);
  timer = setTimeout(() => (scrolling.value = false), 600);
}

function observe(instance) {
  const viewport = instance?.viewportElement;
  if (viewport === observed) return;
  observed = viewport;
  observer?.disconnect();
  if (!viewport || typeof ResizeObserver === "undefined") return;
  observer = new ResizeObserver(() => measure(viewport));
  observer.observe(viewport);
  if (viewport.firstElementChild) observer.observe(viewport.firstElementChild);
}

onBeforeUnmount(() => {
  observer?.disconnect();
  clearTimeout(timer);
});

const maskStyle = computed(() => ({
  "--kv-sidebar-overflow-start": `${overflow.value.start}px`,
  "--kv-sidebar-overflow-end": `${overflow.value.end}px`,
}));
</script>

<template>
  <ScrollAreaRoot class="kv-sidebar__content" type="auto" :data-scrolling="scrolling ? '' : undefined" data-sidebar="content">
    <ScrollAreaViewport :ref="observe" class="kv-sidebar__viewport" :style="maskStyle" tabindex="-1" data-sidebar="viewport" @scroll="onScroll">
      <div class="kv-sidebar__scroll-content"><slot /></div>
    </ScrollAreaViewport>
    <ScrollAreaScrollbar class="kv-sidebar__scrollbar" orientation="vertical">
      <ScrollAreaThumb class="kv-sidebar__thumb" />
    </ScrollAreaScrollbar>
  </ScrollAreaRoot>
</template>
