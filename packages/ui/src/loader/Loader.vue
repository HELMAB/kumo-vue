<!-- Ported from Cloudflare Kumo's Loader (MIT). See /NOTICE. -->
<script setup>
/** An animated circular spinner for loading states. Colour follows `currentColor`. */
import { computed } from "vue";

const props = defineProps({
  /**
   * `sm` 16px, `base` 24px, `lg` 32px, or a number of pixels.
   * @values sm, base, lg
   */
  size: { type: [String, Number], default: "base" },
});

const SIZES = { sm: 16, base: 24, lg: 32 };

const pixels = computed(() => (typeof props.size === "number" ? props.size : (SIZES[props.size] ?? SIZES.base)));
</script>

<template>
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    :style="{ height: `${pixels}px`, width: `${pixels}px` }"
    role="status"
    aria-label="Loading"
  >
    <circle cx="12" cy="12" r="9.5" fill="none" stroke-width="2" stroke-linecap="round">
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 12 12"
        to="360 12 12"
        dur="2s"
        repeatCount="indefinite"
      />
      <animate
        attributeName="stroke-dasharray"
        values="0 150;42 150;42 150"
        keyTimes="0;0.5;1"
        dur="1.5s"
        repeatCount="indefinite"
      />
      <animate
        attributeName="stroke-dashoffset"
        values="0;-16;-59"
        keyTimes="0;0.5;1"
        dur="1.5s"
        repeatCount="indefinite"
      />
    </circle>
    <circle cx="12" cy="12" r="9.5" fill="none" opacity="0.1" stroke-width="2" stroke-linecap="round" />
  </svg>
</template>
