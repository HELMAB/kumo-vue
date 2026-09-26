<!-- Ported from Cloudflare Kumo's SkeletonLine (MIT). See /NOTICE. -->
<script setup>
/** A shimmering placeholder line for text that is still loading, at a random width in range. */
import { computed } from "vue";

const props = defineProps({
  /** Narrowest random width, as a percentage. */
  minWidth: { type: Number, default: 30 },
  /** Widest random width, as a percentage. */
  maxWidth: { type: Number, default: 100 },
  /** Shortest random shimmer duration, in seconds. */
  minDuration: { type: Number, default: 1.3 },
  /** Longest random shimmer duration, in seconds. */
  maxDuration: { type: Number, default: 1.7 },
  /** Shortest random shimmer delay, in seconds. */
  minDelay: { type: Number, default: 0 },
  /** Longest random shimmer delay, in seconds. */
  maxDelay: { type: Number, default: 0.5 },
  /** Height of a wrapper that centres the line vertically. A number is pixels. */
  blockHeight: { type: [String, Number], default: undefined },
});

defineOptions({ inheritAttrs: false });

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
const randomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(2);

const lineStyle = computed(() => ({
  "--kv-skeleton-width": `${randomInt(props.minWidth, props.maxWidth)}%`,
  "--kv-shimmer-duration": `${randomFloat(props.minDuration, props.maxDuration)}s`,
  "--kv-shimmer-delay": `${randomFloat(props.minDelay, props.maxDelay)}s`,
}));

const blockStyle = computed(() => ({
  height: typeof props.blockHeight === "number" ? `${props.blockHeight}px` : props.blockHeight,
}));
</script>

<template>
  <div v-if="blockHeight !== undefined" class="kv-skeleton-line__block" :style="blockStyle">
    <div v-bind="$attrs" class="kv-skeleton-line" :style="lineStyle" />
  </div>
  <div v-else v-bind="$attrs" class="kv-skeleton-line" :style="lineStyle" />
</template>

<style>
.kv-skeleton-line {
  --kv-skeleton-fill: #f3f4f6;
  --kv-skeleton-shimmer: rgba(0, 0, 0, 0.08);
  --kv-skeleton-clear: rgba(0, 0, 0, 0);

  position: relative;
  overflow: hidden;
  block-size: 0.5rem;
  inline-size: var(--kv-skeleton-width);
  border-radius: 2px;
  background-color: var(--kv-skeleton-fill);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .kv-skeleton-line {
    --kv-skeleton-fill: rgba(255, 255, 255, 0.06);
    --kv-skeleton-shimmer: rgba(255, 255, 255, 0.05);
    --kv-skeleton-clear: rgba(255, 255, 255, 0);
  }
}

[data-theme="dark"] .kv-skeleton-line {
  --kv-skeleton-fill: rgba(255, 255, 255, 0.06);
  --kv-skeleton-shimmer: rgba(255, 255, 255, 0.05);
  --kv-skeleton-clear: rgba(255, 255, 255, 0);
}

.kv-skeleton-line::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, var(--kv-skeleton-clear) 0%, var(--kv-skeleton-shimmer) 50%, var(--kv-skeleton-clear) 100%);
  animation: kv-shimmer var(--kv-shimmer-duration, 1.5s) var(--kv-shimmer-delay, 0s) infinite ease-in-out;
}

.kv-skeleton-line__block {
  display: flex;
  align-items: center;
}

@keyframes kv-shimmer {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
}
</style>
