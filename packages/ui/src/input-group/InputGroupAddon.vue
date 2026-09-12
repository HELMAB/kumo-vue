<!-- Ported from Cloudflare Kumo's InputGroup.Addon (MIT). See /NOTICE. -->
<script setup>
/**
 * Icons, text or a compact button pinned to one end of the group, inside the
 * ring rather than beside it.
 *
 * Upstream sizes icon children by cloning them with a `size` prop. A Vue slot
 * cannot be cloned that way, so the sizing is a CSS rule on the slotted svg -
 * which also leaves a caller who sets their own dimensions alone.
 */
import { computed } from "vue";

import { useInputGroup } from "./context.js";

defineOptions({ name: "InputGroupAddon" });

const props = defineProps({
  /**
   * Which end it attaches to.
   * @values start, end
   */
  align: { type: String, default: "start" },
});

const group = useInputGroup();

const align = computed(() => (props.align === "end" ? "end" : "start"));

const classes = computed(() => [
  "kv-input-group__addon",
  `kv-input-group__addon--${align.value}`,
]);
</script>

<template>
  <div :class="classes" :data-align="align" data-kumo-part="addon">
    <slot />
  </div>
</template>
