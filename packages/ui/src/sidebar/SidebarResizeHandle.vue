<!-- Ported from Cloudflare Kumo's Sidebar.ResizeHandle (MIT). See /NOTICE. -->
<script setup>
/** Drag or arrow-key handle for a `resizable` sidebar. Past `min-width` it collapses to the icon rail, and expands back out. */
import { useSidebar } from "./context.js";

defineProps({
  /** Accessible name, for localisation. */
  label: { type: String, default: "Resize sidebar" },
});

const sidebar = useSidebar();
const STEP = 10;

function onPointerDown(event) {
  event.preventDefault();
  sidebar.setIsResizing(true);
  const startX = event.clientX;
  const startWidth = event.currentTarget.closest("[data-sidebar-wrapper]")?.querySelector("[data-sidebar='sidebar']")?.getBoundingClientRect().width ?? 0;
  let collapsed = !sidebar.open;

  function onMove(move) {
    const width = startWidth + (sidebar.side === "left" ? move.clientX - startX : startX - move.clientX);
    if (collapsed) {
      if (width < sidebar.minWidth) return;
      collapsed = false;
      sidebar.setOpen(true);
      sidebar.setWidth(width);
      return;
    }
    if (width < sidebar.minWidth) {
      sidebar.setOpen(false);
      collapsed = true;
      return;
    }
    sidebar.setWidth(width);
  }

  function onUp() {
    sidebar.setIsResizing(false);
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
  }

  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
}

function onKeydown(event) {
  const grow = sidebar.side === "left" ? "ArrowRight" : "ArrowLeft";
  const shrink = sidebar.side === "left" ? "ArrowLeft" : "ArrowRight";
  if (event.key === grow) {
    if (sidebar.open) sidebar.setWidth(Math.min(sidebar.width + STEP, sidebar.maxWidth));
    else {
      sidebar.setOpen(true);
      sidebar.setWidth(sidebar.minWidth);
    }
  } else if (event.key === shrink) {
    if (sidebar.width - STEP < sidebar.minWidth) sidebar.setOpen(false);
    else sidebar.setWidth(sidebar.width - STEP);
  } else if (event.key === "Home") sidebar.setOpen(false);
  else if (event.key === "End") {
    sidebar.setOpen(true);
    sidebar.setWidth(sidebar.maxWidth);
  } else return;
  event.preventDefault();
}
</script>

<template>
  <button
    v-if="sidebar.resizable"
    type="button"
    class="kv-sidebar__resize-handle"
    :class="`kv-sidebar__resize-handle--${sidebar.side}`"
    :aria-label="label"
    tabindex="0"
    data-sidebar="resize-handle"
    @pointerdown="onPointerDown"
    @keydown="onKeydown"
  />
</template>
