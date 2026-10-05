<!-- Ported from Cloudflare Kumo's Sidebar.Provider (MIT). See /NOTICE. -->
<script setup>
/** Holds the sidebar's state and lays the sidebar out beside the page. Wrap `Sidebar` and the main content in it. */
import { computed, provide, reactive, ref } from "vue";
import { SIDEBAR, prefersReducedMotion, useIsMobile, useOpenChangeComplete } from "./context.js";

const props = defineProps({
  /** Controlled open state. Use with `v-model:open`. */
  open: { type: Boolean, default: undefined },
  /** Open state on first render, for the uncontrolled case. */
  defaultOpen: { type: Boolean, default: true },
  /**
   * `sidebar` has a border, `floating` a shadow and rounded corners, `inset` sits within a recessed page.
   * @values sidebar, floating, inset
   */
  variant: { type: String, default: "sidebar" },
  /** @values left, right */
  side: { type: String, default: "left" },
  /**
   * `icon` collapses to a rail of icons, `offcanvas` slides away, `none` stays open.
   * @values icon, offcanvas, none
   */
  collapsible: { type: String, default: "icon" },
  /** Drag the edge to resize. Pair with `SidebarResizeHandle`. */
  resizable: { type: Boolean, default: false },
  /** Starting width in pixels, when resizable. */
  defaultWidth: { type: Number, default: 256 },
  minWidth: { type: Number, default: 200 },
  maxWidth: { type: Number, default: 480 },
  /** Keeps the collapsed sidebar inside a bounded parent instead of fixed to the viewport. */
  contained: { type: Boolean, default: false },
  /** Hovering or focusing the collapsed sidebar expands it until the pointer leaves. */
  peekable: { type: Boolean, default: false },
  /** Expand and collapse duration in milliseconds. */
  animationDuration: { type: Number, default: 250 },
  /** Below this viewport width the sidebar becomes a sheet. */
  mobileBreakpoint: { type: Number, default: 768 },
});

const emit = defineEmits(["update:open", "open-change-complete", "width-change"]);

const isMobile = useIsMobile(() => props.mobileBreakpoint);
const uncontrolledOpen = ref(props.defaultOpen);
const uncontrolledOpenMobile = ref(false);
const width = ref(props.defaultWidth);
const isResizing = ref(false);
const isPeeking = ref(false);

const open = computed(() => props.open ?? uncontrolledOpen.value);
const openMobile = computed(() => (isMobile.value && props.open !== undefined ? props.open : uncontrolledOpenMobile.value));
const state = computed(() => (isPeeking.value ? "peeking" : open.value ? "expanded" : "collapsed"));

function setOpen(value) {
  emit("update:open", value);
  uncontrolledOpen.value = value;
}

function setOpenMobile(value) {
  uncontrolledOpenMobile.value = value;
  if (isMobile.value && props.open !== undefined) emit("update:open", value);
}

function setWidth(value) {
  width.value = Math.min(props.maxWidth, Math.max(props.minWidth, value));
  emit("width-change", width.value);
}

function toggleSidebar() {
  if (isMobile.value) {
    setOpenMobile(!openMobile.value);
    return;
  }
  isPeeking.value = false;
  setOpen(!open.value);
}

const items = new Map();

function scrollToItem(id, { align = "auto", behavior = "auto" } = {}) {
  const target = items.get(id);
  const viewport = target?.closest('[data-sidebar="viewport"]');
  if (!viewport) return;
  // Assign scrollTop rather than scrollIntoView, which would scroll the page too.
  const targetRect = target.getBoundingClientRect();
  const viewportRect = viewport.getBoundingClientRect();
  const scale = viewport.offsetHeight > 0 && viewportRect.height > 0 ? viewportRect.height / viewport.offsetHeight : 1;
  const offset = (targetRect.top - viewportRect.top) / scale + viewport.scrollTop;
  let desired = offset;
  if (align === "center") desired = offset - (viewport.clientHeight - target.offsetHeight) / 2;
  else if (align === "end") desired = offset - (viewport.clientHeight - target.offsetHeight);
  else if (align === "auto") {
    if (offset < viewport.scrollTop) desired = offset;
    else if (offset + target.offsetHeight > viewport.scrollTop + viewport.clientHeight) desired = offset + target.offsetHeight - viewport.clientHeight;
    else return;
  }
  const top = Math.max(0, Math.min(desired, viewport.scrollHeight - viewport.clientHeight));
  viewport.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : behavior });
}

function scrollItemIntoView(id, options) {
  const target = items.get(id);
  const viewport = target?.closest('[data-sidebar="viewport"]');
  if (!viewport) return;
  const targetRect = target.getBoundingClientRect();
  const viewportRect = viewport.getBoundingClientRect();
  if (targetRect.top >= viewportRect.top && targetRect.bottom <= viewportRect.bottom) return;
  scrollToItem(id, options);
}

const sidebar = reactive({
  state,
  open,
  setOpen,
  openMobile,
  setOpenMobile,
  isMobile,
  toggleSidebar,
  variant: computed(() => props.variant),
  side: computed(() => props.side),
  collapsible: computed(() => props.collapsible),
  width,
  resizable: computed(() => props.resizable),
  minWidth: computed(() => props.minWidth),
  maxWidth: computed(() => props.maxWidth),
  isResizing,
  setIsResizing: (value) => (isResizing.value = value),
  setWidth,
  isPeeking,
  peekable: computed(() => props.peekable),
  startPeek: () => props.peekable && !open.value && !isMobile.value && (isPeeking.value = true),
  stopPeek: () => (isPeeking.value = false),
  contained: computed(() => props.contained),
  animationDuration: computed(() => props.animationDuration),
  registerItem: (id, el) => (el ? items.set(id, el) : items.delete(id)),
  scrollToItem,
  scrollItemIntoView,
});

provide(SIDEBAR, sidebar);
defineExpose(sidebar);

const notify = (value) => emit("open-change-complete", value);
const completeDesktop = useOpenChangeComplete(open, () => props.animationDuration, notify, () => !isMobile.value);
const completeMobile = useOpenChangeComplete(openMobile, () => props.animationDuration, notify, () => isMobile.value);

function onTransitionEnd(event) {
  const property = isMobile.value ? "transform" : "width";
  if (event.target.closest("[data-sidebar-wrapper]") !== event.currentTarget) return;
  if (event.target.dataset.sidebar !== "sidebar" || event.propertyName !== property) return;
  (isMobile.value ? completeMobile : completeDesktop)();
}

const style = computed(() => ({
  "--sidebar-width": props.resizable ? `${width.value}px` : "16.25rem",
  "--sidebar-width-icon": "57px",
  "--sidebar-animation-duration": `${props.animationDuration}ms`,
  "--sidebar-easing": "cubic-bezier(0.77, 0, 0.175, 1)",
}));
</script>

<template>
  <div
    class="kv-sidebar-wrapper"
    :class="{ 'kv-sidebar-wrapper--page': !contained && !isMobile, 'kv-sidebar-wrapper--resizing': isResizing }"
    :style="style"
    data-sidebar-wrapper=""
    :data-state="state"
    :data-side="side"
    data-kumo-component="SidebarProvider"
    @transitionend="onTransitionEnd"
  >
    <slot />
  </div>
</template>
