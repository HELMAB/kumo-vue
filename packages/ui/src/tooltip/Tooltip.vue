<!-- Ported from Cloudflare Kumo's Tooltip (MIT). See /NOTICE. -->
<script setup>
/**
 * Tooltip - a short explanation that appears on hover or focus.
 *
 *   <Tooltip content="Save changes">
 *     <Button variant="primary">Save</Button>
 *   </Tooltip>
 *
 * The trigger is the default slot rather than Kumo's `render` prop, which is
 * how a Vue caller passes an element. A trigger that is already a button or a
 * link is rendered as itself; anything else gets a transparent button wrapper,
 * because a tooltip that only opens on hover is invisible to a keyboard.
 */
import { computed } from "vue";
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from "reka-ui";

import { MaybeProvider } from "./maybeProvider.js";

const props = defineProps({
  /** The text to show. */
  content: { type: String, default: "" },
  /**
   * Which side of the trigger it prefers. It flips when there is no room.
   * @values top, right, bottom, left
   */
  side: { type: String, default: "top" },
  /**
   * Alignment on the axis across from `side`.
   * @values start, center, end
   */
  align: { type: String, default: "center" },
  /** Wait before opening, in milliseconds. */
  delay: { type: Number, default: 600 },
  /** Held open, ignoring hover and focus. */
  open: { type: Boolean, default: undefined },
  /** Disables the tooltip without removing it, leaving the trigger alone. */
  disabled: { type: Boolean, default: false },
  /** Renders the trigger as its own child rather than wrapping it in a button. */
  asChild: { type: Boolean, default: true },
  /** Where the popup is portalled. */
  to: { type: [String, Object], default: "body" },
});

defineEmits(["update:open"]);

const SIDES = new Set(["top", "right", "bottom", "left"]);
const ALIGNS = new Set(["start", "center", "end"]);

const side = computed(() => (SIDES.has(props.side) ? props.side : "top"));
const align = computed(() => (ALIGNS.has(props.align) ? props.align : "center"));

const hasContent = computed(() => Boolean(props.content));
</script>

<template>
  <!-- Brings a provider only when there is not one already; see maybeProvider.js. -->
  <MaybeProvider :delay-duration="delay">
    <TooltipRoot
      :open="open"
      :delay-duration="delay"
      :disable-hoverable-content="false"
      @update:open="$emit('update:open', $event)"
    >
      <TooltipTrigger
        :as-child="asChild"
        class="kv-tooltip__trigger"
        data-kumo-component="Tooltip"
      >
        <slot />
      </TooltipTrigger>

      <TooltipPortal v-if="hasContent && !disabled" :to="to">
        <TooltipContent
          class="kv-tooltip"
          data-kumo-part="content"
          :side="side"
          :align="align"
          :side-offset="10"
        >
          <slot name="content">{{ content }}</slot>

          <TooltipArrow class="kv-tooltip__arrow" :width="20" :height="10" as-child>
            <!--
              Three paths, not one. An arrow's border cannot be a single shape:
              in light mode it has to sit outside the triangle and in dark mode
              inside it, and the two geometries differ. Each mode paints one and
              leaves the other at zero alpha, which is what the two arrow tokens
              are for. Kumo solves it the same way, after Base UI.
            -->
            <svg width="20" height="10" viewBox="0 0 20 10" fill="none" aria-hidden="true">
              <path
                class="kv-tooltip__arrow-fill"
                d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
              />
              <path
                class="kv-tooltip__arrow-edge"
                d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
              />
              <path
                class="kv-tooltip__arrow-stroke"
                d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
              />
            </svg>
          </TooltipArrow>
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </MaybeProvider>
</template>

<style>
/*
 * A tooltip is a disclosure, not an action. Kumo overrides the pointer cursor
 * for exactly this reason: a Button used as a trigger would otherwise say it
 * can be clicked when the tooltip is all there is.
 */
.kv-tooltip__trigger {
  cursor: default;
}

.kv-tooltip {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  /* Reka reports how much room the popup has; a long string wraps rather than
     running off the edge of the viewport. */
  max-inline-size: var(--reka-tooltip-content-available-width);

  padding-inline: 0.625rem;
  padding-block: var(--kv-space-1-5);
  border-radius: var(--kv-radius-md);

  background-color: var(--kv-surface-base);
  color: var(--kv-text-default);
  /* An outline rather than a border: it costs no layout, so the arrow's
     geometry is measured against the same box in both modes. */
  outline: 1px solid var(--kv-line);
  box-shadow:
    0 4px 6px -1px var(--kv-shadow-elevated),
    0 2px 4px -2px var(--kv-shadow-elevated);

  font-family: var(--kv-font-sans);
  font-size: var(--kv-text-sm);
  line-height: var(--kv-leading-normal);

  /* It grows out of the edge it is anchored to, not out of its own middle. */
  transform-origin: var(--reka-tooltip-content-transform-origin);
  transition:
    transform 150ms ease,
    opacity 150ms ease;
}

.kv-tooltip[data-state="delayed-open"],
.kv-tooltip[data-state="instant-open"] {
  animation: kv-tooltip-in 150ms ease;
}

.kv-tooltip[data-state="closed"] {
  animation: kv-tooltip-out 150ms ease;
}

@keyframes kv-tooltip-in {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
}

@keyframes kv-tooltip-out {
  to {
    transform: scale(0.9);
    opacity: 0;
  }
}

/* The arrow */

/*
 * Kumo's arrow is drawn tip-up, because Base UI rotates it per side and takes
 * `top` as the rotated case. Reka's arrow middleware assumes the opposite -
 * tip-down, rotating for `bottom` instead - so the shape is turned once here
 * and every side then lands the way Reka expects. Rotating the shape rather
 * than branching on `data-side` keeps the four cases Reka already handles.
 */
.kv-tooltip__arrow {
  display: block;
  transform: rotate(180deg);
}

.kv-tooltip__arrow-fill {
  fill: var(--kv-surface-base);
}

.kv-tooltip__arrow-edge {
  fill: var(--kv-arrow-edge);
}

.kv-tooltip__arrow-stroke {
  fill: var(--kv-arrow-stroke);
}

@media (prefers-reduced-motion: reduce) {
  .kv-tooltip {
    transition: none;
  }

  .kv-tooltip[data-state="delayed-open"],
  .kv-tooltip[data-state="instant-open"],
  .kv-tooltip[data-state="closed"] {
    animation: none;
  }
}
</style>
