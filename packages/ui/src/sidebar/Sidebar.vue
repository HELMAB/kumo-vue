<!-- Ported from Cloudflare Kumo's Sidebar (MIT). See /NOTICE. -->
<script setup>
/** The navigation panel: an `<aside>` rail on desktop, a sheet with a backdrop on mobile. Use inside `SidebarProvider`. */
import { computed, nextTick, onBeforeUnmount, ref, useSlots, watch } from "vue";
import { TooltipProvider } from "reka-ui";
import SidebarFooter from "./SidebarFooter.vue";
import { FOCUSABLE, flatten, useSidebar } from "./context.js";

defineOptions({ inheritAttrs: false });

defineProps({
  /** On mobile, fills the viewport instead of `--sidebar-width`, with no backdrop. */
  fullScreenOnMobile: { type: Boolean, default: false },
  /** Classes for the inner content container on desktop. */
  contentClass: { type: [String, Array, Object], default: undefined },
});

const sidebar = useSidebar();
const slots = useSlots();

const isFooter = (node) => node.type === SidebarFooter;
const Body = () => flatten(slots.default?.() ?? []).filter((node) => !isFooter(node));
const Footers = () => flatten(slots.default?.() ?? []).filter(isFooter);

const mobileNav = ref();
let returnFocusTo = null;
let restoreFocus = false;

function closeMobile() {
  restoreFocus = true;
  sidebar.setOpenMobile(false);
}

function onKeydown(event) {
  if (event.key === "Escape") closeMobile();
}

watch(
  () => sidebar.isMobile && sidebar.openMobile,
  (open) => {
    if (open) document.addEventListener("keydown", onKeydown);
    else document.removeEventListener("keydown", onKeydown);
  },
  { immediate: true },
);
onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown));

watch(
  () => sidebar.openMobile,
  async (open) => {
    if (!sidebar.isMobile) return;
    if (open) {
      returnFocusTo = document.activeElement;
      restoreFocus = false;
      await nextTick();
      requestAnimationFrame(() => (mobileNav.value?.querySelector(FOCUSABLE) ?? mobileNav.value)?.focus());
    } else if (restoreFocus && returnFocusTo instanceof HTMLElement) {
      returnFocusTo.focus();
      restoreFocus = false;
      returnFocusTo = null;
    }
  },
);

let pointerInPeekZone = false;

function onPeekEnter() {
  pointerInPeekZone = true;
  sidebar.startPeek();
}

function onPeekLeave() {
  pointerInPeekZone = false;
  sidebar.stopPeek();
}

function onPeekFocusOut(event) {
  if (!event.currentTarget.contains(event.relatedTarget) && !pointerInPeekZone) sidebar.stopPeek();
}

const expandedWidth = computed(() => (sidebar.resizable ? `${sidebar.width}px` : "var(--sidebar-width)"));
const collapsedWidth = computed(() => (sidebar.collapsible === "icon" ? "var(--sidebar-width-icon)" : "0px"));
const railWidth = computed(() => (sidebar.open ? expandedWidth.value : collapsedWidth.value));
const contentWidth = computed(() => (sidebar.open || sidebar.isPeeking ? expandedWidth.value : collapsedWidth.value));
</script>

<template>
  <aside
    v-if="sidebar.collapsible === 'none'"
    v-bind="$attrs"
    class="kv-sidebar kv-sidebar--fixed"
    :class="[`kv-sidebar--${sidebar.variant}`, `kv-sidebar--${sidebar.side}`]"
    data-state="expanded"
    :data-side="sidebar.side"
    :data-variant="sidebar.variant"
    data-sidebar="sidebar"
    data-kumo-component="Sidebar"
  >
    <slot />
  </aside>

  <template v-else-if="sidebar.isMobile">
    <div
      class="kv-sidebar__backdrop"
      :class="{
        'kv-sidebar__backdrop--contained': sidebar.contained,
        'kv-sidebar__backdrop--open': sidebar.openMobile && !fullScreenOnMobile,
      }"
      data-sidebar-backdrop=""
      aria-hidden="true"
      @click="closeMobile"
    />
    <nav
      ref="mobileNav"
      v-bind="$attrs"
      class="kv-sidebar kv-sidebar--mobile"
      :class="[
        `kv-sidebar--${sidebar.side}`,
        {
          'kv-sidebar--contained': sidebar.contained,
          'kv-sidebar--full-screen': fullScreenOnMobile,
          'kv-sidebar--sheet-open': sidebar.openMobile,
        },
      ]"
      tabindex="-1"
      aria-label="Navigation"
      :aria-hidden="!sidebar.openMobile"
      :inert="!sidebar.openMobile"
      :data-state="sidebar.openMobile ? 'expanded' : 'collapsed'"
      :data-side="sidebar.side"
      :data-variant="sidebar.variant"
      :data-collapsible="sidebar.collapsible"
      data-sidebar="sidebar"
      data-mobile="true"
      data-kumo-component="Sidebar"
    >
      <slot />
    </nav>
  </template>

  <aside
    v-else
    v-bind="$attrs"
    class="kv-sidebar kv-sidebar--desktop"
    :class="[`kv-sidebar--${sidebar.variant}`, { 'kv-sidebar--resizing': sidebar.isResizing }]"
    :style="{ width: railWidth }"
    :data-state="sidebar.state"
    :data-side="sidebar.side"
    :data-variant="sidebar.variant"
    :data-collapsible="sidebar.collapsible"
    data-sidebar="sidebar"
    data-kumo-component="Sidebar"
  >
    <TooltipProvider>
      <div
        class="kv-sidebar__container"
        :class="[
          contentClass,
          `kv-sidebar__container--${sidebar.variant}`,
          `kv-sidebar__container--${sidebar.side}`,
          {
            'kv-sidebar__container--collapsed': !sidebar.open,
            'kv-sidebar__container--contained': sidebar.contained,
          },
        ]"
        :style="{ width: contentWidth }"
        data-sidebar="content-container"
      >
        <div
          class="kv-sidebar__peek-zone"
          data-sidebar="peek-zone"
          @mouseenter="onPeekEnter"
          @mouseleave="onPeekLeave"
          @focusin="sidebar.startPeek()"
          @focusout="onPeekFocusOut"
        >
          <Body />
        </div>
        <Footers />
      </div>
    </TooltipProvider>
  </aside>
</template>
