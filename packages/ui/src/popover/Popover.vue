<!-- Ported from Cloudflare Kumo's Popover (MIT). See /NOTICE. -->
<script setup>
/**
 * Accessible popup content anchored to a trigger: `#trigger`, then a title,
 * description and any content. Slots receive `close`.
 */
import { computed, onUnmounted, ref, useId, useSlots, watchPostEffect } from "vue";
import { PopoverArrow, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from "reka-ui";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** Controls whether the popover is open. Use with `v-model:open`. */
  open: { type: Boolean, default: undefined },
  /** Initial open state when uncontrolled. */
  defaultOpen: { type: Boolean, default: false },
  /** Heading of the popup, which also names it. */
  title: { type: String, default: "" },
  /** Supporting text under the title, which also describes the popup. */
  description: { type: String, default: "" },
  /**
   * Which side of the trigger the popover appears on.
   * @values bottom, top, left, right
   */
  side: { type: String, default: "bottom" },
  /**
   * Alignment against the trigger.
   * @values center, start, end
   */
  align: { type: String, default: "center" },
  /** Distance between the trigger and the popup, in pixels. */
  sideOffset: { type: Number, default: 8 },
  /** Offset along the alignment axis, in pixels. */
  alignOffset: { type: Number, default: 0 },
  /**
   * CSS `position` for the popup. `fixed` escapes stacking contexts such as sticky headers.
   * @values absolute, fixed
   */
  positionMethod: { type: String, default: "absolute" },
  /** An element, or `{ getBoundingClientRect }`, to position against instead of the trigger. */
  anchor: { type: Object, default: undefined },
  /** Shows the arrow pointing at the trigger. */
  arrow: { type: Boolean, default: true },
  /** Opens on hover as well as on click. */
  openOnHover: { type: Boolean, default: false },
  /** Wait before opening on hover, in milliseconds. */
  delay: { type: Number, default: 300 },
  /** Wait before closing on hover out, in milliseconds. */
  closeDelay: { type: Number, default: 0 },
  /** Traps focus and blocks the page behind. */
  modal: { type: Boolean, default: false },
  /** Where the popup is portalled. */
  to: { type: [String, Object], default: "body" },
});

const emit = defineEmits(["update:open"]);
const slots = useSlots();

const titleId = useId();
const descriptionId = useId();
const hasTitle = computed(() => Boolean(props.title || slots.title));
const hasDescription = computed(() => Boolean(props.description || slots.description));

const uncontrolled = ref(props.defaultOpen);
const isOpen = computed(() => props.open ?? uncontrolled.value);

function setOpen(value) {
  uncontrolled.value = value;
  emit("update:open", value);
}

const close = () => setOpen(false);

// Hover opening: the gap between trigger and popup is crossed within a short grace period.
const HOVER_GRACE_MS = 100;
let hoverTimer;
onUnmounted(() => clearTimeout(hoverTimer));

function hoverIn() {
  if (!props.openOnHover) return;
  clearTimeout(hoverTimer);
  if (!isOpen.value) hoverTimer = setTimeout(() => setOpen(true), props.delay);
}

function hoverOut() {
  if (!props.openOnHover) return;
  clearTimeout(hoverTimer);
  hoverTimer = setTimeout(() => setOpen(false), Math.max(props.closeDelay, HOVER_GRACE_MS));
}

const reference = computed(() => props.anchor);

// Reka labels the popup by its trigger; Base UI, which Kumo uses, labels it by the title.
const titleRef = ref();
watchPostEffect(() => {
  titleRef.value?.closest('[role="dialog"]')?.setAttribute("aria-labelledby", titleId);
});
</script>

<template>
  <PopoverRoot :open="isOpen" :modal="modal" @update:open="setOpen">
    <PopoverTrigger
      v-if="$slots.trigger"
      as-child
      data-kumo-component="Popover"
      data-kumo-part="trigger"
      @pointerenter="hoverIn"
      @pointerleave="hoverOut"
    >
      <slot name="trigger" />
    </PopoverTrigger>

    <PopoverPortal :to="to">
      <PopoverContent
        v-bind="$attrs"
        class="kv-popover"
        data-kumo-component="Popover"
        data-kumo-part="popup"
        :side="side"
        :align="align"
        :side-offset="arrow ? sideOffset - 10 : sideOffset"
        :align-offset="alignOffset"
        :position-strategy="positionMethod"
        :reference="reference"
        :aria-describedby="hasDescription ? descriptionId : undefined"
        @pointerenter="hoverIn"
        @pointerleave="hoverOut"
      >
        <PopoverArrow v-if="arrow" class="kv-popover__arrow" :width="20" :height="10" as-child>
          <svg width="20" height="10" viewBox="0 0 20 10" fill="none" aria-hidden="true" data-kumo-component="Popover" data-kumo-part="arrow">
            <path
              class="kv-popover__arrow-fill"
              d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
            />
            <path
              class="kv-popover__arrow-edge"
              d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
            />
            <path
              class="kv-popover__arrow-stroke"
              d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
            />
          </svg>
        </PopoverArrow>

        <h2 v-if="hasTitle" :id="titleId" ref="titleRef" class="kv-popover__title">
          <slot name="title" :close="close">{{ title }}</slot>
        </h2>
        <p v-if="hasDescription" :id="descriptionId" class="kv-popover__description">
          <slot name="description" :close="close">{{ description }}</slot>
        </p>
        <slot :close="close" />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<style>
.kv-popover {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: var(--kv-space-3) var(--kv-space-4);
  border-radius: var(--kv-radius-lg);
  background-color: var(--kv-surface-base);
  color: var(--kv-text-default);
  outline: 1px solid var(--kv-line);
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
  font-family: var(--kv-font-sans);
  font-size: var(--kv-text-sm);
  line-height: calc(1 / 0.85);
  transform-origin: var(--reka-popover-content-transform-origin);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .kv-popover {
    outline-offset: -1px;
  }
}

[data-theme="dark"] .kv-popover {
  outline-offset: -1px;
}

.kv-popover[data-state="open"] {
  animation: kv-popover-in 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.kv-popover[data-state="closed"] {
  animation: kv-popover-out 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes kv-popover-in {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
}

@keyframes kv-popover-out {
  to {
    transform: scale(0.9);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .kv-popover[data-state] {
    animation: none;
  }
}

/* Kumo's arrow is drawn tip-up; Reka expects tip-down, and overlaps it 2px like Base UI. */
.kv-popover__arrow {
  display: block;
  transform: translateY(-2px) rotate(180deg);
}

.kv-popover__arrow-fill {
  fill: var(--kv-surface-base);
}

.kv-popover__arrow-edge {
  fill: var(--kv-arrow-edge);
}

.kv-popover__arrow-stroke {
  fill: var(--kv-arrow-stroke);
}

.kv-popover__title,
.kv-popover__description {
  margin: 0;
  font-size: var(--kv-text-base);
  line-height: 1.5rem;
}

.kv-popover__title {
  font-weight: 500;
}

.kv-popover__description {
  color: var(--kv-text-subtle);
}
</style>
