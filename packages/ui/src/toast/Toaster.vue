<!-- Ported from Cloudflare Kumo's Toasty (MIT). See /NOTICE. -->
<script setup>
/**
 * Toaster - the viewport toasts appear in.
 *
 *   <Toaster />                      <!-- once, near the root of the app -->
 *
 *   import { toast } from "@/components/ui/toast";
 *   toast.add({ title: "Saved", description: "Your changes are live." });
 *
 * Kumo's `Toasty` wraps the application so a React context can carry the
 * queue. Nothing needs wrapping here: the queue is a module, so a toast can be
 * raised from an interceptor or a store action as easily as from a component,
 * and this only has to exist somewhere on the page.
 *
 * It still takes children, for the case that does need a context - a section
 * of the page with its own queue, which `useToast()` finds from inside:
 *
 *   <Toaster :manager="previewToasts"><PreviewPane /></Toaster>
 */
import { computed, provide, ref } from "vue";
import { ToastPortal, ToastProvider, ToastViewport } from "reka-ui";

import Toast from "./Toast.vue";
import { TOAST_MANAGER_KEY, toast as defaultManager } from "./manager.js";

const props = defineProps({
  /** A queue from `createToastManager()`. Defaults to the shared one. */
  manager: { type: Object, default: undefined },
  /** How long a toast stays, in milliseconds. */
  duration: { type: Number, default: 5000 },
  /** How many toasts are drawn at once. The rest wait behind them. */
  limit: { type: Number, default: 3 },
  /** Where the viewport is portalled to. */
  to: { type: [String, Object], default: "body" },
  /**
   * Accessible name for the region holding the toasts. `{hotkey}` is replaced
   * with the key that moves focus into it, so keyboard users are told about it.
   */
  label: { type: String, default: "Notifications ({hotkey})" },
  /** Prefix a screen reader announces a toast with. */
  announceLabel: { type: String, default: "Notification" },
  /** Accessible name for each toast's dismiss button. */
  closeLabel: { type: String, default: "Close" },
  /** Which way a toast is dragged to dismiss it. */
  swipeDirection: { type: String, default: "right" },
});

/* Resolved once: a Toaster keeps the queue it was mounted with. */
const manager = props.manager ?? defaultManager;

/*
 * Anything rendered inside reaches this queue with `useToast()`, which is what
 * makes a second, isolated Toaster useful.
 */
provide(TOAST_MANAGER_KEY, manager);

const toasts = computed(() => manager.toasts.value);

/** Measured heights, by id: what the stack needs to know to open up. */
const heights = ref({});

function setHeight(id, height) {
  heights.value = { ...heights.value, [id]: height };
}

/** The gap between two toasts once the stack is opened up. */
const GAP = 12;

/**
 * Where each toast sits: its place in the stack, and how far up it goes when
 * the stack is opened - past everything in front of it, plus a gap for each.
 *
 * A toast that is leaving is skipped over rather than counted. It is on its way
 * out; holding its place would leave a hole in the stack, and would count
 * against `limit` and push a real toast out of sight.
 */
const layout = computed(() => {
  let index = 0;
  let offset = 0;

  return toasts.value.map((entry) => {
    if (!entry.open) return { index, offset };

    const place = { index, offset };
    offset += (heights.value[entry.id] ?? 0) + GAP;
    index += 1;
    return place;
  });
});

/*
 * The stack opens up on hover, and on focus - a keyboard reaches the toasts
 * through Reka's viewport hotkey (F8), and would otherwise be tabbing into a
 * pile of toasts stacked on top of one another.
 */
const isExpanded = ref(false);
</script>

<template>
  <ToastProvider
    :duration="duration"
    :label="announceLabel"
    :swipe-direction="swipeDirection"
  >
    <slot />

    <ToastPortal :to="to">
      <ToastViewport
        class="kv-toast-viewport"
        data-kumo-component="Toaster"
        :label="label"
        :data-expanded="isExpanded ? '' : undefined"
        @mouseenter="isExpanded = true"
        @mouseleave="isExpanded = false"
        @focusin="isExpanded = true"
        @focusout="isExpanded = false"
      >
        <Toast
          v-for="(entry, index) in toasts"
          :key="entry.id"
          :toast="entry"
          :index="layout[index].index"
          :expanded="isExpanded"
          :offset="layout[index].offset"
          :limit="limit"
          :close-label="closeLabel"
          @height="setHeight(entry.id, $event)"
          @close="manager.close(entry.id)"
          @remove="manager.remove(entry.id)"
        >
          <template v-if="$slots.toast" #default="slotProps">
            <slot name="toast" v-bind="slotProps" />
          </template>
        </Toast>
      </ToastViewport>
    </ToastPortal>
  </ToastProvider>
</template>

<style>
/*
 * Anchored to the bottom corner, as Kumo's is. The toasts inside are
 * positioned against this, so it is the thing that has to be the right size:
 * as wide as a toast, and only as tall as the stack needs.
 */
.kv-toast-viewport {
  position: fixed;
  z-index: 100;
  inset-block-end: var(--kv-space-4);
  inset-inline-end: var(--kv-space-4);
  inset-block-start: auto;

  display: flex;
  inline-size: calc(100% - var(--kv-space-8));
  margin: 0;
  padding: 0;
  list-style: none;
  outline: none;
}

@media (min-width: 640px) {
  .kv-toast-viewport {
    inset-block-end: var(--kv-space-8);
    inset-inline-end: var(--kv-space-8);
    inline-size: 21.25rem;
  }
}
</style>
