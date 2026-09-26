<!-- Ported from Cloudflare Kumo's Grid (MIT). See /NOTICE. -->
<script setup>
/** Responsive CSS grid with preset column layouts. Wrap each cell in a `GridItem`. */
import { computed, provide, watchEffect } from "vue";
import { GRID_CONTEXT } from "./context.js";

const props = defineProps({
  /**
   * Responsive column layout. Unset, the grid is a single column.
   * @values 2up, side-by-side, 2-1, 1-2, 1-3up, 3up, 4up, 6up, 1-2-4up
   */
  variant: { type: String, default: undefined },
  /**
   * Gap between items: 0, 12px, 8 → 24 → 32px responsive, or 32px.
   * @values none, sm, base, lg
   */
  gap: { type: String, default: "base" },
  /** Rule between stacked items on small screens. `4up` only. */
  mobileDivider: { type: Boolean, default: false },
});

const VARIANTS = ["2up", "side-by-side", "2-1", "1-2", "1-3up", "3up", "4up", "6up", "1-2-4up"];
const GAPS = ["none", "sm", "base", "lg"];

const variant = computed(() => {
  if (!props.variant) return undefined;
  return VARIANTS.includes(props.variant) ? props.variant : "2up";
});
const gap = computed(() => (GAPS.includes(props.gap) ? props.gap : "base"));

if (import.meta.env?.DEV) {
  watchEffect(() => {
    if (props.variant && !VARIANTS.includes(props.variant)) {
      console.warn(`[kumo-vue] Grid variant="${props.variant}" is unknown. Falling back to "2up".`);
    }
    if (!GAPS.includes(props.gap)) {
      console.warn(`[kumo-vue] Grid gap="${props.gap}" is unknown. Falling back to "base".`);
    }
  });
}

provide(GRID_CONTEXT, {
  variant,
  mobileDivider: computed(() => props.mobileDivider),
});
</script>

<template>
  <div :class="['kv-grid', variant && `kv-grid--${variant}`, `kv-grid--gap-${gap}`]">
    <slot />
  </div>
</template>

<style>
.kv-grid {
  display: grid;
}

.kv-grid--2up,
.kv-grid--2-1,
.kv-grid--1-2,
.kv-grid--1-3up,
.kv-grid--3up,
.kv-grid--4up,
.kv-grid--1-2-4up {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.kv-grid--side-by-side,
.kv-grid--6up {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.kv-grid--gap-none { gap: 0; }
.kv-grid--gap-sm { gap: var(--kv-space-3); }
.kv-grid--gap-base { gap: var(--kv-space-2); }
.kv-grid--gap-lg { gap: var(--kv-space-8); }

@media (min-width: 48rem) {
  .kv-grid--2up,
  .kv-grid--3up,
  .kv-grid--4up,
  .kv-grid--1-2-4up {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .kv-grid--2-1 { grid-template-columns: 2fr 1fr; }
  .kv-grid--1-2 { grid-template-columns: 1fr 2fr; }
  .kv-grid--6up { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .kv-grid--gap-base { gap: var(--kv-space-6); }
}

@media (min-width: 64rem) {
  .kv-grid--1-3up,
  .kv-grid--3up,
  .kv-grid--4up {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .kv-grid--6up,
  .kv-grid--1-2-4up {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .kv-grid--gap-base { gap: var(--kv-space-8); }
}

@media (min-width: 80rem) {
  .kv-grid--4up { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .kv-grid--6up { grid-template-columns: repeat(6, minmax(0, 1fr)); }
}
</style>
