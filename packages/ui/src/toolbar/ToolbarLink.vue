<!-- Ported from Cloudflare Kumo's Toolbar.Link (MIT). See /NOTICE. -->
<script setup>
/** A navigation action styled like a toolbar button. */
import { computed, inject, useSlots } from "vue";
import { Button } from "../button/index.js";
import { TOOLBAR, TOOLBAR_ITEM } from "../shared/toolbar.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /**
   * Defaults to `square` for an icon with no label.
   * @values base, square, circle
   */
  shape: { type: String, default: undefined },
  /** Opens in a new tab with a safe `rel`. */
  external: { type: Boolean, default: false },
});

const slots = useSlots();
const toolbar = inject(TOOLBAR, null);

const shape = computed(() => props.shape ?? (!slots.default && slots.icon ? "square" : "base"));
</script>

<template>
  <Button
    v-bind="{ ...$attrs, [TOOLBAR_ITEM]: '' }"
    as="a"
    class="kv-toolbar__control"
    data-kumo-component="Toolbar.Link"
    variant="ghost"
    :size="toolbar?.size.value ?? 'base'"
    :shape="shape"
    :external="external"
  >
    <template v-if="$slots.icon" #icon><slot name="icon" /></template>
      <slot />
    </Button>
</template>
