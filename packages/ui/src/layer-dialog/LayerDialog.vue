<!-- Ported from Cloudflare Kumo's LayerDialog (MIT). See /NOTICE. -->
<script setup>
/**
 * A responsive dialog with a sticky title inside its scrolling body: a bottom sheet on mobile, a card on desktop.
 * Without an `#action` slot it closes from an X; with one, a dismiss button sits beside that single action.
 */
import { computed, onBeforeUnmount, onMounted, ref, useSlots, watch } from "vue";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  Presence,
  ScrollAreaRoot,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "reka-ui";
import { Button } from "../button/index.js";
import { useTranslations } from "../locale-provider/index.js";
import { Text } from "../text/index.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** Controlled open state. Use with `v-model:open`. */
  open: { type: Boolean, default: undefined },
  /** Open state on first render, for the uncontrolled case. */
  defaultOpen: { type: Boolean, default: false },
  /** A confirmation that needs an explicit choice: `role="alertdialog"`, always modal, no backdrop or swipe dismissal. Needs `#action`. */
  alert: { type: Boolean, default: false },
  /** Keep the page behind the dialog inert. Always on with `alert`. */
  modal: { type: Boolean, default: true },
  /** Blocks every user dismissal while work is pending. `close` and `v-model:open` still work. */
  dismissDisabled: { type: Boolean, default: false },
  /** The heading that names the dialog. Use the `title` slot for markup. */
  title: { type: String, default: "" },
  /** Copy beneath the title that folds away once the body scrolls. Use the `description` slot for markup. */
  description: { type: String, default: "" },
  /**
   * Desktop width. Mobile dialogs are always full-width.
   * @values sm, base, lg, xl
   */
  size: { type: String, default: "base" },
  /**
   * Desktop placement. Mobile dialogs are always bottom sheets.
   * @values center, top
   */
  verticalAlign: { type: String, default: "center" },
  /** Accessible name of the X button. Defaults to `LocaleProvider`'s `layerDialog.close`, else "Close". */
  closeLabel: { type: String, default: undefined },
  /** Text of the dismiss button beside the action. Defaults to `layerDialog.close`, or `layerDialog.cancel` with `alert`. */
  dismissLabel: { type: String, default: undefined },
  /**
   * Writing direction. Leave unset to follow the trigger's, which the portal would otherwise lose.
   * @values ltr, rtl
   */
  dir: { type: String, default: undefined },
  /** Where the dialog is portalled. */
  to: { type: [String, Object], default: "body" },
});

const emit = defineEmits(["update:open"]);
const slots = useSlots();

if (!props.title && !slots.title) throw new Error("LayerDialog requires a title.");
if (props.alert && !slots.action) throw new Error("LayerDialog with `alert` requires an #action slot.");

const SIZES = ["sm", "base", "lg", "xl"];
const SCROLL_THRESHOLD = 8;
const CONDENSE_MIN_OVERFLOW = 16;
const SCROLLBAR_HIDE_DELAY = 600;
const SWIPE_CLOSE_RATIO = 0.25;
const SWIPE_CLOSE_VELOCITY = 0.5;
const SWIPE_IGNORE = "button, a, input, textarea, select, label, [role='button'], [contenteditable]";

// Starts as mobile so server and client render alike; the real value lands on mount.
const isDesktop = ref(false);
const query = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(min-width: 640px)") : null;
const onQueryChange = (event) => (isDesktop.value = event.matches);
onMounted(() => {
  if (!query) return;
  isDesktop.value = query.matches;
  query.addEventListener("change", onQueryChange);
});
onBeforeUnmount(() => query?.removeEventListener("change", onQueryChange));

const uncontrolledOpen = ref(props.defaultOpen);
const isOpen = computed(() => props.open ?? uncontrolledOpen.value);

function setOpen(value) {
  uncontrolledOpen.value = value;
  emit("update:open", value);
}

const close = () => setOpen(false);
defineExpose({ close });

const translations = useTranslations("layerDialog");
const hasDescription = computed(() => Boolean(props.description || slots.description));
const hasAction = computed(() => Boolean(slots.action));
const closeText = computed(() => props.closeLabel ?? translations.value.close ?? "Close");
const dismissText = computed(
  () => props.dismissLabel ?? (props.alert ? (translations.value.cancel ?? "Cancel") : (translations.value.close ?? "Close")),
);
const isModal = computed(() => props.alert || props.modal);
const canSwipe = computed(() => !isDesktop.value && !props.alert && !props.dismissDisabled);

const triggerRef = ref();
const resolvedDir = ref(props.dir);

function readDir() {
  if (props.dir) {
    resolvedDir.value = props.dir;
    return;
  }
  const anchor = triggerRef.value?.$el;
  if (!anchor?.closest) return;
  const declared = anchor.closest("[dir]")?.getAttribute("dir");
  resolvedDir.value = declared === "rtl" || declared === "ltr" ? declared : getComputedStyle(anchor).direction;
}

onMounted(readDir);
watch(() => props.dir, readDir);

function onEscapeKeyDown(event) {
  if (props.dismissDisabled) event.preventDefault();
}

function onOpenAutoFocus(event) {
  event.preventDefault();
  event.target.focus({ preventScroll: true });
}

function onInteractOutside(event) {
  if (props.alert || props.dismissDisabled) event.preventDefault();
}

const condensed = ref(false);
const descriptionClip = ref();
const overflowStart = ref(0);
const overflowEnd = ref(0);
const scrolling = ref(false);
let scrollTimer;

function measure(viewport) {
  overflowStart.value = viewport.scrollTop;
  overflowEnd.value = Math.max(0, viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop);
}

function onScroll(event) {
  const viewport = event.currentTarget;
  measure(viewport);
  scrolling.value = true;
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => (scrolling.value = false), SCROLLBAR_HIDE_DELAY);
  if (viewport.scrollTop <= SCROLL_THRESHOLD) {
    condensed.value = false;
    return;
  }
  if (condensed.value) return;
  // Collapsing hands the description's height to the viewport, so only condense if enough overflow survives it.
  const overflowAfterCollapse = viewport.scrollHeight - viewport.clientHeight - (descriptionClip.value?.offsetHeight ?? 0);
  if (overflowAfterCollapse > CONDENSE_MIN_OVERFLOW) condensed.value = true;
}

let observedViewport;
let resizeObserver;

function observeViewport(instance) {
  const viewport = instance?.viewportElement;
  if (viewport === observedViewport) return;
  observedViewport = viewport;
  resizeObserver?.disconnect();
  if (!viewport || typeof ResizeObserver === "undefined") return;
  resizeObserver = new ResizeObserver(() => measure(viewport));
  resizeObserver.observe(viewport);
  if (viewport.firstElementChild) resizeObserver.observe(viewport.firstElementChild);
}

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  clearTimeout(scrollTimer);
});

const maskStyle = computed(() => ({
  "--kv-layer-dialog-overflow-start": `${overflowStart.value}px`,
  "--kv-layer-dialog-overflow-end": `${overflowEnd.value}px`,
}));

const swipeOffset = ref(0);
const swiping = ref(false);
const swipeClosed = ref(false);
let swipeStart = null;

watch(isOpen, (open) => {
  if (!open) return;
  readDir();
  condensed.value = false;
  overflowStart.value = 0;
  overflowEnd.value = 0;
  swipeOffset.value = 0;
  swipeClosed.value = false;
});

const scrolledAway = (target) => (target.closest("[data-reka-scroll-area-viewport]")?.scrollTop ?? 0) > 0;

function onSwipeStart(event) {
  if (!canSwipe.value || event.button !== 0) return;
  if (event.target.closest(SWIPE_IGNORE) || scrolledAway(event.target)) return;
  swipeStart = { y: event.clientY, time: event.timeStamp, pointerId: event.pointerId };
}

function onSwipeMove(event) {
  if (!swipeStart || event.pointerId !== swipeStart.pointerId) return;
  const delta = event.clientY - swipeStart.y;
  if (!swiping.value && delta > 4) {
    swiping.value = true;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}
  }
  if (swiping.value) swipeOffset.value = Math.max(0, delta);
}

// A downward drag from the top of the body moves the sheet; anything else stays a native scroll.
function onTouchMove(event) {
  if (swipeStart && (swiping.value || event.touches[0].clientY > swipeStart.y)) event.preventDefault();
}

function onSwipeEnd(event) {
  if (!swipeStart) return;
  const elapsed = Math.max(1, event.timeStamp - swipeStart.time);
  const height = event.currentTarget.offsetHeight;
  swipeStart = null;
  if (!swiping.value) return;
  swiping.value = false;
  if (swipeOffset.value > height * SWIPE_CLOSE_RATIO || swipeOffset.value / elapsed > SWIPE_CLOSE_VELOCITY) {
    swipeClosed.value = true;
    close();
  } else {
    swipeOffset.value = 0;
  }
}

const popupClasses = computed(() => [
  "kv-layer-dialog__popup",
  `kv-layer-dialog__popup--size-${SIZES.includes(props.size) ? props.size : "base"}`,
  `kv-layer-dialog__popup--${props.verticalAlign === "top" ? "top" : "center"}`,
  { "kv-layer-dialog__popup--swiping": swiping.value, "kv-layer-dialog__popup--swiped": swipeClosed.value },
]);

const popupStyle = computed(() => (swipeOffset.value ? { "--kv-layer-dialog-swipe": `${swipeOffset.value}px` } : undefined));
</script>

<template>
  <DialogRoot :open="isOpen" :modal="isModal" @update:open="setOpen">
    <DialogTrigger v-if="$slots.trigger" ref="triggerRef" as-child>
      <slot name="trigger" />
    </DialogTrigger>

    <DialogPortal :to="to">
      <DialogOverlay v-if="isModal" class="kv-layer-dialog__backdrop" data-kumo-part="backdrop" />
      <Presence v-else :present="isOpen">
        <div class="kv-layer-dialog__backdrop" :data-state="isOpen ? 'open' : 'closed'" data-kumo-part="backdrop" />
      </Presence>

      <DialogContent
        v-bind="$attrs"
        :class="popupClasses"
        :style="popupStyle"
        :role="alert ? 'alertdialog' : 'dialog'"
        :dir="resolvedDir"
        data-kumo-component="LayerDialog"
        @open-auto-focus="onOpenAutoFocus"
        @escape-key-down="onEscapeKeyDown"
        @interact-outside="onInteractOutside"
        @pointerdown="onSwipeStart"
        @pointermove="onSwipeMove"
        @pointerup="onSwipeEnd"
        @pointercancel="onSwipeEnd"
        @touchmove="onTouchMove"
      >
        <div class="kv-layer-dialog__card">
          <div v-if="!alert" class="kv-layer-dialog__handle" aria-hidden="true">
            <div class="kv-layer-dialog__handle-bar" />
          </div>

          <div class="kv-layer-dialog__content">
            <div class="kv-layer-dialog__body">
              <div class="kv-layer-dialog__header">
                <div class="kv-layer-dialog__heading">
                  <DialogTitle as-child>
                    <Text variant="heading" as="h2" class="kv-layer-dialog__title">
                      <slot name="title">{{ title }}</slot>
                    </Text>
                  </DialogTitle>
                  <div
                    v-if="hasDescription"
                    class="kv-layer-dialog__description"
                    :class="{ 'kv-layer-dialog__description--condensed': condensed }"
                    :data-condensed="condensed ? '' : undefined"
                  >
                    <div ref="descriptionClip" class="kv-layer-dialog__description-clip">
                      <DialogDescription as-child>
                        <Text variant="secondary" as="p" class="kv-layer-dialog__description-text">
                          <slot name="description">{{ description }}</slot>
                        </Text>
                      </DialogDescription>
                    </div>
                  </div>
                </div>

                <DialogClose v-if="!hasAction" as-child>
                  <Button
                    class="kv-layer-dialog__close"
                    variant="ghost"
                    shape="square"
                    size="sm"
                    :aria-label="closeText"
                    :disabled="dismissDisabled"
                    data-kumo-part="close"
                  >
                    <template #icon>
                      <svg viewBox="0 0 256 256" fill="currentColor" width="15" height="15" aria-hidden="true">
                        <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
                      </svg>
                    </template>
                  </Button>
                </DialogClose>
              </div>

              <ScrollAreaRoot class="kv-layer-dialog__scroll" type="auto" :data-scrolling="scrolling ? '' : undefined">
                <ScrollAreaViewport :ref="observeViewport" class="kv-layer-dialog__viewport-scroll" :style="maskStyle" @scroll="onScroll">
                  <div class="kv-layer-dialog__scroll-content">
                    <slot v-if="hasDescription" :close="close" />
                    <DialogDescription v-else as="div">
                      <slot :close="close" />
                    </DialogDescription>
                  </div>
                </ScrollAreaViewport>
                <ScrollAreaScrollbar class="kv-layer-dialog__scrollbar" orientation="vertical">
                  <ScrollAreaThumb class="kv-layer-dialog__thumb" />
                </ScrollAreaScrollbar>
              </ScrollAreaRoot>
            </div>

            <div v-if="hasAction" class="kv-layer-dialog__actions">
              <DialogClose as-child>
                <Button
                  class="kv-layer-dialog__dismiss"
                  :variant="isDesktop ? 'ghost' : 'secondary'"
                  :disabled="dismissDisabled"
                  data-kumo-part="dismiss"
                >
                  {{ dismissText }}
                </Button>
              </DialogClose>
              <slot name="action" :close="close" />
            </div>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style>
.kv-layer-dialog__backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  background-color: var(--kv-surface-recessed);
  opacity: 0.8;
  animation: kv-layer-dialog-fade-in 450ms cubic-bezier(0.32, 0.72, 0, 1);
}

.kv-layer-dialog__backdrop[data-state="closed"] {
  animation: kv-layer-dialog-fade-out 400ms cubic-bezier(0.32, 0.72, 0, 1) forwards;
}

.kv-layer-dialog__popup {
  position: fixed;
  inset-inline: 0;
  inset-block-end: 0;
  z-index: 50;
  display: flex;
  box-sizing: border-box;
  inline-size: 100%;
  min-block-size: 0;
  max-block-size: 85dvh;
  color: var(--kv-text-default);
  font-family: var(--kv-font-sans);
  outline: none;
  pointer-events: auto;
  transform: translate3d(0, var(--kv-layer-dialog-swipe, 0px), 0);
  transition: transform 450ms cubic-bezier(0.32, 0.72, 0, 1);
  will-change: transform;
  animation: kv-layer-dialog-sheet-in 450ms cubic-bezier(0.32, 0.72, 0, 1);
}

.kv-layer-dialog__popup[data-state="closed"] {
  animation: kv-layer-dialog-sheet-out 400ms cubic-bezier(0.32, 0.72, 0, 1) forwards;
}

.kv-layer-dialog__popup--swiped[data-state="closed"] {
  animation-duration: 200ms;
}

.kv-layer-dialog__popup--swiping {
  transition: none;
  user-select: none;
}

.kv-layer-dialog__card {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  inline-size: 100%;
  min-block-size: 0;
  max-block-size: 85dvh;
  overflow: hidden;
  padding: var(--kv-space-1-5);
  border-block-start: 1px solid var(--kv-hairline);
  background-color: var(--kv-surface-elevated);
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

.kv-layer-dialog__handle {
  display: flex;
  justify-content: center;
  padding-block: var(--kv-space-1-5) var(--kv-space-3);
  touch-action: none;
}

.kv-layer-dialog__handle-bar {
  block-size: var(--kv-space-1);
  inline-size: var(--kv-space-10);
  border-radius: var(--kv-radius-full);
  background-color: var(--kv-fill);
}

.kv-layer-dialog__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-block-size: 0;
  overflow: hidden;
  border-radius: var(--kv-radius-lg);
  background-color: var(--kv-surface-base);
  box-shadow: 0 0 0 1px var(--kv-fill);
}

.kv-layer-dialog__body {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-block-size: 0;
  overflow: hidden;
  background-color: var(--kv-surface-base);
}

.kv-layer-dialog__header {
  position: relative;
  z-index: 10;
  display: flex;
  flex-shrink: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--kv-space-4);
  padding: var(--kv-space-4);
  border-start-start-radius: var(--kv-radius-lg);
  border-start-end-radius: var(--kv-radius-lg);
  background-color: var(--kv-surface-base);
  touch-action: none;
}

.kv-layer-dialog__heading {
  display: flex;
  flex-direction: column;
  min-inline-size: 0;
}

.kv-text.kv-layer-dialog__title {
  margin: 0;
  font-weight: 500;
  line-height: var(--kv-leading-normal);
}

.kv-layer-dialog__description {
  display: grid;
  grid-template-rows: 1fr;
  opacity: 1;
  transition:
    grid-template-rows 200ms ease-out,
    opacity 200ms ease-out;
}

.kv-layer-dialog__description--condensed {
  grid-template-rows: 0fr;
  opacity: 0;
}

.kv-layer-dialog__description-clip {
  min-block-size: 0;
  overflow: hidden;
}

.kv-text.kv-layer-dialog__description-text {
  margin: 0;
  padding-block-start: var(--kv-space-1);
}

.kv-button.kv-layer-dialog__close {
  flex-shrink: 0;
  margin-block-start: calc(var(--kv-space-1-5) * -1);
  margin-inline-end: calc(var(--kv-space-1-5) * -1);
  --kv-button-radius: var(--kv-radius-lg);
}

.kv-layer-dialog__scroll {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-block-size: 0;
}

.kv-layer-dialog__viewport-scroll {
  flex: 1;
  min-block-size: 0;
  overscroll-behavior: none;
  outline: none;
  mask-image: linear-gradient(
    to bottom,
    transparent 0,
    black min(24px, var(--kv-layer-dialog-overflow-start, 24px)),
    black calc(100% - min(24px, var(--kv-layer-dialog-overflow-end, 24px))),
    transparent 100%
  );
}

.kv-layer-dialog__scroll:has(> .kv-layer-dialog__viewport-scroll:focus-visible)::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: var(--kv-radius-md);
  box-shadow: inset 0 0 0 2px var(--kv-brand);
  pointer-events: none;
}

.kv-layer-dialog__scroll-content {
  padding: 0 var(--kv-space-4) var(--kv-space-4);
}

.kv-layer-dialog__scrollbar {
  display: flex;
  box-sizing: border-box;
  inline-size: var(--kv-space-2);
  margin-block: var(--kv-space-1-5);
  margin-inline-end: var(--kv-space-0-5);
  padding: 1px;
  opacity: 0;
  touch-action: none;
  user-select: none;
  transition: opacity 150ms ease;
}

.kv-layer-dialog__scroll:hover > .kv-layer-dialog__scrollbar,
.kv-layer-dialog__scroll[data-scrolling] > .kv-layer-dialog__scrollbar {
  opacity: 1;
}

.kv-layer-dialog__thumb {
  position: relative;
  flex: 1;
  border-radius: var(--kv-radius-full);
  background-color: var(--kv-surface-contrast);
  opacity: 0.1;
  transition: opacity 150ms ease;
}

.kv-layer-dialog__thumb:hover {
  opacity: 0.2;
}

.kv-layer-dialog__thumb:active {
  opacity: 0.3;
}

.kv-layer-dialog__actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: var(--kv-space-2);
  inline-size: 100%;
  box-sizing: border-box;
  padding: var(--kv-space-4);
  border-block-start: 1px solid var(--kv-hairline);
}

.kv-layer-dialog__dismiss:not(:disabled):hover {
  background-color: color-mix(in oklab, var(--kv-fill) 50%, transparent);
}

@media (min-width: 640px) {
  .kv-layer-dialog__handle {
    display: none;
  }

  .kv-layer-dialog__content {
    overflow: visible;
    border-radius: 0;
    background-color: transparent;
    box-shadow: none;
  }

  .kv-layer-dialog__body {
    border-radius: var(--kv-radius-lg);
    box-shadow: 0 0 0 1px var(--kv-fill);
  }

  .kv-layer-dialog__actions {
    padding: 7px 0 0;
    border: 0;
  }

  .kv-layer-dialog__backdrop {
    animation-duration: 200ms;
  }

  .kv-layer-dialog__backdrop[data-state="closed"] {
    animation-duration: 200ms;
  }

  .kv-layer-dialog__popup {
    inset: var(--kv-space-6) var(--kv-space-4);
    block-size: fit-content;
    inline-size: auto;
    max-block-size: calc(100dvh - 2 * var(--kv-space-6));
    margin: auto;
    transform: none;
    animation: kv-layer-dialog-card-in 200ms cubic-bezier(0.32, 0.72, 0, 1);
  }

  .kv-layer-dialog__popup[data-state="closed"] {
    animation: kv-layer-dialog-card-out 200ms cubic-bezier(0.32, 0.72, 0, 1) forwards;
  }

  .kv-layer-dialog__popup--top {
    inset-block-start: var(--kv-space-16);
    max-block-size: calc(100dvh - var(--kv-space-16) - var(--kv-space-6));
    margin-block-start: 0;
  }

  .kv-layer-dialog__popup--size-sm { max-inline-size: 28rem; }
  .kv-layer-dialog__popup--size-base { max-inline-size: 36rem; }
  .kv-layer-dialog__popup--size-lg { max-inline-size: 42rem; }
  .kv-layer-dialog__popup--size-xl { max-inline-size: 48rem; }

  .kv-layer-dialog__card {
    max-block-size: none;
    border: 0;
    border-radius: var(--kv-radius-xl);
    box-shadow:
      0 0 0 1px var(--kv-line),
      0 20px 25px -5px rgb(0 0 0 / 0.03),
      0 8px 10px -6px rgb(0 0 0 / 0.03);
  }

  .kv-layer-dialog__header {
    padding-inline: 1.125rem;
  }

  .kv-layer-dialog__scroll-content {
    padding: 0 1.125rem 1.125rem;
  }
}

@keyframes kv-layer-dialog-fade-in {
  from { opacity: 0; }
}

@keyframes kv-layer-dialog-fade-out {
  to { opacity: 0; }
}

@keyframes kv-layer-dialog-sheet-in {
  from { transform: translate3d(0, 100%, 0); }
}

@keyframes kv-layer-dialog-sheet-out {
  from { transform: translate3d(0, var(--kv-layer-dialog-swipe, 0px), 0); }
  to { transform: translate3d(0, 100%, 0); }
}

@keyframes kv-layer-dialog-card-in {
  from { opacity: 0; transform: translate3d(0, 8px, 0); }
}

@keyframes kv-layer-dialog-card-out {
  to { opacity: 0; transform: translate3d(0, 8px, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .kv-layer-dialog__backdrop,
  .kv-layer-dialog__backdrop[data-state="closed"],
  .kv-layer-dialog__popup,
  .kv-layer-dialog__popup[data-state="closed"],
  .kv-layer-dialog__description,
  .kv-layer-dialog__scrollbar {
    animation: none;
    transition: none;
  }
}
</style>
