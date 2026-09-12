<!-- Ported from Cloudflare Kumo's TooltipProvider (MIT). See /NOTICE. -->
<script setup>
/**
 * Groups the tooltips beneath it so that, once one has opened, the next opens
 * immediately instead of waiting out its delay again.
 *
 * Optional. A `Tooltip` with no provider above it makes its own, so this is
 * only needed for the grouping.
 */
import { provide } from "vue";
import { TooltipProvider as RekaTooltipProvider } from "reka-ui";

import { TOOLTIP_PROVIDER_KEY } from "./context.js";

defineProps({
  /** Wait before opening, in milliseconds. Kumo's default is 600. */
  delayDuration: { type: Number, default: 600 },
  /** How long the group stays "warm" after one closes, in milliseconds. */
  skipDelayDuration: { type: Number, default: 300 },
  /** Closes as soon as the pointer leaves the trigger, even towards the popup. */
  disableHoverableContent: { type: Boolean, default: false },
});

provide(TOOLTIP_PROVIDER_KEY, true);
</script>

<template>
  <RekaTooltipProvider
    :delay-duration="delayDuration"
    :skip-delay-duration="skipDelayDuration"
    :disable-hoverable-content="disableHoverableContent"
  >
    <slot />
  </RekaTooltipProvider>
</template>
