<!-- Ported from Cloudflare Kumo's Sidebar.Collapsible (MIT). See /NOTICE. -->
<script setup>
/** An expandable section: a `SidebarCollapsibleTrigger` and its `SidebarCollapsibleContent`. Keyboard focus opens it for the visit. */
import { computed, provide, ref, useId } from "vue";
import { COLLAPSE, useOpenChangeComplete, useSidebar } from "./context.js";

const props = defineProps({
  /** Controlled open state. Use with `v-model:open`. */
  open: { type: Boolean, default: undefined },
  /** Open state on first render, for the uncontrolled case. */
  defaultOpen: { type: Boolean, default: false },
  /** Scrolls the revealed content into view after opening. */
  autoScrollOnOpen: { type: Boolean, default: false },
});

const emit = defineEmits(["update:open", "open-change-complete"]);

const sidebar = useSidebar();
const contentId = useId();
const uncontrolledOpen = ref(props.defaultOpen);
const isOpen = computed(() => props.open ?? uncontrolledOpen.value);
const isShown = computed(() => isOpen.value && (sidebar.isMobile ? sidebar.openMobile : sidebar.state !== "collapsed"));
let openedByKeyboard = false;

function setOpen(value) {
  uncontrolledOpen.value = value;
  emit("update:open", value);
}

function toggle() {
  setOpen(!isOpen.value);
  openedByKeyboard = false;
}

const completeOpenChange = useOpenChangeComplete(isShown, () => sidebar.animationDuration, (value) => emit("open-change-complete", value));

provide(COLLAPSE, { contentId, isOpen, isShown, autoScrollOnOpen: computed(() => props.autoScrollOnOpen), toggle, completeOpenChange });

function onFocusIn(event) {
  if (isOpen.value || !event.target.matches(":focus-visible")) return;
  openedByKeyboard = true;
  setOpen(true);
}

function onFocusOut(event) {
  if (!openedByKeyboard || event.currentTarget.contains(event.relatedTarget) || event.currentTarget.querySelector("[data-active]")) return;
  openedByKeyboard = false;
  setOpen(false);
}
</script>

<template>
  <div class="kv-sidebar__collapsible" :data-open="isOpen || undefined" @focusin="onFocusIn" @focusout="onFocusOut">
    <slot />
  </div>
</template>
