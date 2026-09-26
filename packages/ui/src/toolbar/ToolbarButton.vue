<!-- Ported from Cloudflare Kumo's Toolbar.Button (MIT). See /NOTICE. -->
<script setup>
/** A quiet toolbar button. An icon with no label makes it square. */
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
  /** Shows a spinner in place of the icon and blocks interaction. */
  loading: { type: Boolean, default: false },
  /** Disables the button. */
  disabled: { type: Boolean, default: false },
});

const slots = useSlots();
const toolbar = inject(TOOLBAR, null);

const shape = computed(() => props.shape ?? (!slots.default && slots.icon ? "square" : "base"));
</script>

<template>
  <Button
    v-bind="{ ...$attrs, [TOOLBAR_ITEM]: '' }"
    class="kv-toolbar__control"
    data-kumo-component="Toolbar.Button"
    variant="ghost"
    :size="toolbar?.size.value ?? 'base'"
    :shape="shape"
    :loading="loading"
    :disabled="disabled"
  >
    <template v-if="$slots.icon" #icon><slot name="icon" /></template>
      <slot />
    </Button>
</template>
