<!-- Ported from Cloudflare Kumo's LayerCard (MIT). See /NOTICE. -->
<script setup>
/**
 * A card: a single surface, or a layered one when its children are
 * `LayerCardSecondary` and `LayerCardPrimary`.
 */
import { Fragment } from "vue";
import { Primitive } from "reka-ui";
import LayerCardPrimary from "./LayerCardPrimary.vue";
import LayerCardSecondary from "./LayerCardSecondary.vue";

defineProps({
  /** Element or component to render as. */
  as: { type: [String, Object], default: "div" },
  /** Render the single child element instead of an element of our own. */
  asChild: { type: Boolean, default: false },
});

function hasSections(nodes) {
  return (nodes ?? []).some((node) => {
    if (node.type === LayerCardPrimary || node.type === LayerCardSecondary) return true;
    return node.type === Fragment && Array.isArray(node.children) && hasSections(node.children);
  });
}
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="hasSections($slots.default?.()) ? 'kv-layer-card kv-layer-card--layered' : 'kv-layer-card'"
  >
    <slot />
  </Primitive>
</template>

<style>
.kv-layer-card {
  overflow: hidden;
  border-radius: var(--kv-radius-lg);
  background-color: var(--kv-surface-base);
  box-shadow:
    0 0 0 1px var(--kv-line),
    0 1px 2px 0 rgb(0 0 0 / 0.05);
}

.kv-layer-card--layered {
  display: flex;
  flex-direction: column;
  inline-size: 100%;
  background-color: var(--kv-surface-elevated);
  font-size: var(--kv-text-base);
  line-height: var(--kv-leading-normal);
  box-shadow: 0 0 0 1px var(--kv-hairline);
}
</style>
