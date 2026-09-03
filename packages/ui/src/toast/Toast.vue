<!-- Ported from Cloudflare Kumo's Toast (MIT). See /NOTICE. -->
<script setup>
/**
 * One toast in the stack.
 *
 * Rendered by `Toaster` for every entry in the queue, never on its own: the
 * queue decides what exists, and this decides what it looks like.
 *
 * Built on Reka UI's Toast primitive, which owns the countdown, the pause
 * while the pointer is over the viewport, the swipe gesture, and the live
 * region that announces the toast.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ToastClose, ToastDescription, ToastRoot, ToastTitle } from "reka-ui";

import { Button } from "../button/index.js";

const props = defineProps({
  /** A toast from the manager's queue. */
  toast: { type: Object, required: true },
  /** Where this toast sits in the stack: 0 is the one in front. */
  index: { type: Number, default: 0 },
  /** Whether the stack is opened up, showing every toast in full. */
  expanded: { type: Boolean, default: false },
  /** Distance from the bottom of the viewport when expanded, in pixels. */
  offset: { type: Number, default: 0 },
  /** Toasts past this many are kept in the DOM but not drawn. */
  limit: { type: Number, default: 3 },
  /** Accessible name for the dismiss button. */
  closeLabel: { type: String, default: "Close" },
});

const emit = defineEmits(["close", "remove", "height"]);

const VARIANTS = new Set(["success", "error", "warning", "info"]);

const variant = computed(() =>
  VARIANTS.has(props.toast.variant) ? props.toast.variant : "default",
);

const isLimited = computed(() => props.index >= props.limit);

const element = ref();
const content = ref();
const height = ref(0);

/** Horizontal travel of an in-progress swipe. */
const swipe = ref(0);
const isSwiping = ref(false);

let observer;

/**
 * The toast's height, which is what the stack needs to know to open up: each
 * toast sits past everything in front of it.
 *
 * Measured from the content rather than the toast, so the number never depends
 * on anything the measurement itself sets.
 */
function measure() {
  const root = element.value?.$el;
  if (!root || !content.value) return;

  const style = getComputedStyle(root);
  const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  const next = Math.round(content.value.offsetHeight + padding);

  if (next === height.value || !next) return;
  height.value = next;
  emit("height", next);
}

onMounted(() => {
  measure();
  if (typeof ResizeObserver === "function") {
    observer = new ResizeObserver(measure);
    observer.observe(content.value);
  }
});

onBeforeUnmount(() => {
  observer?.disconnect();
  clearTimeout(exitTimer);
});

/*
 * A toast that is updated in place - a promise settling into its outcome -
 * changes height, and the stack above it has to move with it.
 */
watch(() => [props.toast.title, props.toast.description, props.toast.actions], measure);

/**
 * The stack is drawn from the bottom up. Collapsed, each toast behind peeks out
 * from under the one in front and is scaled down; expanded, they move apart to
 * their real heights. Both are transforms of the same box, so one transitions
 * into the other.
 */
const style = computed(() => ({
  "--kv-toast-index": props.index,
  "--kv-toast-offset": `${props.offset}px`,
  "--kv-toast-swipe": `${swipe.value}px`,
  zIndex: 1000 - props.index,
}));

function onSwipeMove(event) {
  isSwiping.value = true;
  swipe.value = event.detail.delta.x;
}

function onSwipeCancel() {
  isSwiping.value = false;
  swipe.value = 0;
}

function onSwipeEnd() {
  isSwiping.value = false;
  emit("close");
}

/**
 * How long the toast takes to leave. It matches the `kv-toast-out` animation
 * below, and is the one number the two have to agree on.
 */
const EXIT_MS = 200;

let exitTimer;

/**
 * Take the toast out of the queue once it has finished leaving.
 *
 * Reka's `Presence` unmounts the element itself, so waiting for an event from
 * that element is waiting for something that may already be gone - the timer
 * is what the queue can rely on. Until this runs the entry is still in the
 * list, still holding its place in the stack.
 */
watch(
  () => props.toast.open,
  (open) => {
    clearTimeout(exitTimer);
    if (!open) exitTimer = setTimeout(() => emit("remove"), EXIT_MS);
  },
);
</script>

<template>
  <ToastRoot
    ref="element"
    class="kv-toast"
    :class="[`kv-toast--${variant}`, { 'kv-toast--swiping': isSwiping }]"
    data-kumo-component="Toast"
    :open="toast.open"
    :duration="toast.duration"
    :style="style"
    :data-expanded="expanded ? '' : undefined"
    :data-limited="isLimited ? '' : undefined"
    :data-bump="toast.bump || undefined"
    @update:open="$event || emit('close')"
    @swipe-move="onSwipeMove"
    @swipe-cancel="onSwipeCancel"
    @swipe-end="onSwipeEnd"
  >
    <!-- A tint of the variant's colour over the surface, as Kumo layers it. -->
    <div class="kv-toast__background" />

    <div ref="content" class="kv-toast__content">
      <slot :toast="toast">
        <div class="kv-toast__row">
          <span v-if="variant !== 'default'" class="kv-toast__icon" data-toast-icon aria-hidden="true">
            <svg v-if="variant === 'success'" viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="8" r="7" fill="currentColor" />
              <path
                d="m4.75 8.25 2.25 2.25 4.25-4.75"
                fill="none"
                stroke="var(--kv-surface-base)"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <svg v-else-if="variant === 'warning'" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M8 1.75 15 14H1L8 1.75Z"
                fill="currentColor"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linejoin="round"
              />
              <path
                d="M8 6v3.25"
                stroke="var(--kv-surface-base)"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <circle cx="8" cy="11.75" r="0.9" fill="var(--kv-surface-base)" />
            </svg>
            <svg v-else-if="variant === 'error'" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M5.4 1.25h5.2l3.15 3.15v5.2L10.6 12.75H5.4L2.25 9.6V4.4L5.4 1.25Z"
                fill="currentColor"
                stroke="currentColor"
                stroke-width="1.4"
                stroke-linejoin="round"
              />
              <path
                d="M8 4.5v3.25"
                stroke="var(--kv-surface-base)"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <circle cx="8" cy="10.1" r="0.9" fill="var(--kv-surface-base)" />
            </svg>
            <svg v-else viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="8" r="7" fill="currentColor" />
              <path
                d="M8 7.25v4"
                stroke="var(--kv-surface-base)"
                stroke-width="1.75"
                stroke-linecap="round"
              />
              <circle cx="8" cy="4.9" r="0.95" fill="var(--kv-surface-base)" />
            </svg>
          </span>

          <div class="kv-toast__text">
            <ToastTitle v-if="toast.title" class="kv-toast__title" data-toast-title>
              {{ toast.title }}
            </ToastTitle>
            <ToastDescription v-if="toast.description" class="kv-toast__description">
              {{ toast.description }}
            </ToastDescription>

            <div v-if="toast.actions?.length" class="kv-toast__actions">
              <Button
                v-for="(action, actionIndex) in toast.actions"
                :key="actionIndex"
                size="sm"
                v-bind="action"
                @click="action.onClick?.($event)"
              >
                {{ action.label }}
              </Button>
            </div>
          </div>
        </div>
      </slot>

      <ToastClose as-child>
        <Button
          variant="ghost"
          shape="square"
          size="sm"
          class="kv-toast__close"
          data-kumo-part="close"
          :aria-label="closeLabel"
        >
          <template #icon>
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="m4 4 8 8M12 4l-8 8"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
              />
            </svg>
          </template>
        </Button>
      </ToastClose>
    </div>
  </ToastRoot>
</template>

<style>
/*
 * Logical properties throughout, except where a physical axis is the point:
 * the stack grows up the screen and the swipe runs along it, and neither
 * mirrors with the writing direction.
 */
.kv-toast {
  --kv-toast-gap: 0.75rem;
  --kv-toast-peek: 0.75rem;
  /* Each toast behind the front one is drawn a little smaller. */
  --kv-toast-scale: max(0, calc(1 - var(--kv-toast-index) * 0.05));

  position: absolute;
  inset-inline: 0;
  bottom: 0;
  z-index: 1;

  box-sizing: border-box;
  inline-size: 100%;
  padding: var(--kv-space-4);
  border-radius: var(--kv-radius-xl);

  color: var(--kv-text-default);
  font-family: var(--kv-font-sans);
  box-shadow:
    0 0 0 1px var(--kv-line),
    0 10px 15px -3px var(--kv-shadow-elevated),
    0 4px 6px -4px var(--kv-shadow-elevated);

  user-select: none;
  touch-action: none;
  transform: translateX(var(--kv-toast-swipe))
    translateY(calc(var(--kv-toast-index) * var(--kv-toast-peek) * -1))
    scale(var(--kv-toast-scale));
  transform-origin: bottom center;
  transition:
    transform 500ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 500ms ease;
}

/*
 * The gap between toasts is not a gap in the pointer's eyes - without this the
 * stack loses hover halfway through expanding and collapses under the cursor.
 */
.kv-toast::after {
  content: "";
  position: absolute;
  inset-inline: 0;
  top: 100%;
  block-size: calc(var(--kv-toast-gap) + 1px);
}

/* Nothing to animate while a finger is dragging the toast. */
.kv-toast--swiping {
  transition: none;
}

.kv-toast[data-expanded] {
  transform: translateX(var(--kv-toast-swipe)) translateY(calc(var(--kv-toast-offset) * -1));
}

/* Deep in the stack: still in the DOM, and still announced, but not drawn. */
.kv-toast[data-limited] {
  opacity: 0;
  pointer-events: none;
}

/*
 * The fade is an animation rather than a transition on purpose: Reka's
 * `Presence` decides whether to keep a closing element mounted by looking for a
 * running CSS *animation*, and unmounts it on the spot when it finds none. With
 * only a transition here the toast vanished instantly - and, because the
 * element went with it, nothing was left to tell the queue the toast had gone.
 */
.kv-toast[data-state="closed"] {
  opacity: 0;
  transform: translateY(150%);
  animation: kv-toast-out 200ms ease forwards;
}

@keyframes kv-toast-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

.kv-toast[data-state="closed"].kv-toast--swiping,
.kv-toast--swiping[data-state="closed"] {
  transform: translateX(calc(var(--kv-toast-swipe) + 150%));
}

/*
 * Kumo animates regardless; a toast that slides and scales under
 * `prefers-reduced-motion` is exactly the kind of movement the setting is
 * asking about, so it appears and leaves without one.
 */
@media (prefers-reduced-motion: reduce) {
  .kv-toast {
    transition: opacity 150ms ease;
    transform: translateY(calc(var(--kv-toast-index) * var(--kv-toast-peek) * -1));
  }

  .kv-toast[data-expanded] {
    transform: translateY(calc(var(--kv-toast-offset) * -1));
  }

  /* Still an animation, so Presence still waits for it - just no movement. */
  .kv-toast[data-state="closed"] {
    transform: none;
  }
}

/* A repeat of a toast already on screen bumps rather than stacking. */
.kv-toast[data-bump] {
  animation: kv-toast-bump 250ms ease;
}

@keyframes kv-toast-bump {
  0%, 100% { scale: 1; }
  50% { scale: 1.02; }
}

@media (prefers-reduced-motion: reduce) {
  .kv-toast[data-bump] {
    animation: none;
  }
}

/* ---- Surface ----------------------------------------------------------- */

/*
 * The tint is a layer rather than the background itself, so the surface stays
 * opaque over whatever the toast is covering while the tint stays a tint.
 */
.kv-toast__background {
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background-color: var(--kv-surface-base);
}

.kv-toast__background::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-color: var(--kv-toast-tint, transparent);
}

.kv-toast--success {
  --kv-toast-tint: color-mix(in oklch, var(--kv-success-tint) 20%, transparent);
  --kv-toast-accent: var(--kv-text-success);
  box-shadow:
    0 0 0 1px var(--kv-success),
    0 10px 15px -3px var(--kv-shadow-elevated),
    0 4px 6px -4px var(--kv-shadow-elevated);
}

.kv-toast--error {
  --kv-toast-tint: color-mix(in oklch, var(--kv-danger-tint) 50%, transparent);
  --kv-toast-accent: var(--kv-text-danger);
  box-shadow:
    0 0 0 1px var(--kv-danger),
    0 10px 15px -3px var(--kv-shadow-elevated),
    0 4px 6px -4px var(--kv-shadow-elevated);
}

.kv-toast--warning {
  --kv-toast-tint: color-mix(in oklch, var(--kv-warning-tint) 50%, transparent);
  --kv-toast-accent: var(--kv-text-warning);
  box-shadow:
    0 0 0 1px var(--kv-warning),
    0 10px 15px -3px var(--kv-shadow-elevated),
    0 4px 6px -4px var(--kv-shadow-elevated);
}

.kv-toast--info {
  --kv-toast-tint: color-mix(in oklch, var(--kv-info-tint) 50%, transparent);
  --kv-toast-accent: var(--kv-text-info);
  box-shadow:
    0 0 0 1px var(--kv-info),
    0 10px 15px -3px var(--kv-shadow-elevated),
    0 4px 6px -4px var(--kv-shadow-elevated);
}

/* ---- Content ----------------------------------------------------------- */

.kv-toast__content {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  gap: var(--kv-space-1);
  transition: opacity 250ms ease;
}

/*
 * Only the front toast is readable when the stack is collapsed, so the ones
 * behind it do not show their text through it.
 */
.kv-toast:not([data-expanded]) .kv-toast__content {
  opacity: calc(1 - min(1, var(--kv-toast-index)));
  pointer-events: none;
}

.kv-toast[data-expanded] .kv-toast__content {
  pointer-events: auto;
}

.kv-toast__row {
  display: flex;
  align-items: flex-start;
  gap: var(--kv-space-2);
}

.kv-toast__icon {
  display: flex;
  flex-shrink: 0;
  margin-block-start: 0.125rem;
  inline-size: 1rem;
  block-size: 1rem;
  color: var(--kv-toast-accent);
}

.kv-toast__icon > svg {
  inline-size: 100%;
  block-size: 100%;
}

.kv-toast__text {
  display: flex;
  flex-direction: column;
  gap: var(--kv-space-1);
  overflow: hidden;
  /* Room for the close button, which floats over the corner. */
  padding-inline-end: var(--kv-space-4);
}

.kv-toast__title {
  margin: 0;
  font-size: 0.975rem;
  font-weight: 500;
  line-height: 1.25rem;
  color: var(--kv-toast-accent, var(--kv-text-default));
}

.kv-toast__description {
  margin: 0;
  font-size: 0.925rem;
  line-height: 1.25rem;
  color: var(--kv-text-subtle);
}

.kv-toast__actions {
  display: flex;
  flex-wrap: nowrap;
  gap: var(--kv-space-2);
  margin-block-start: var(--kv-space-2);
  min-inline-size: 0;
  overflow-x: auto;
  padding: 1px;
}

.kv-toast__close {
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 0;
  color: var(--kv-toast-accent, var(--kv-text-subtle));
}

.kv-toast__close:hover {
  background-color: color-mix(in oklch, currentColor 15%, transparent);
}
</style>
