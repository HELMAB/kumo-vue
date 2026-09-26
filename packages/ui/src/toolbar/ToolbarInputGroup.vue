<!-- Ported from Cloudflare Kumo's Toolbar.InputGroup (MIT). See /NOTICE. -->
<script setup>
/** An InputGroup as one toolbar item, for an input that needs an addon or suffix. */
import { computed, inject, provide, useAttrs } from "vue";
import { InputGroup } from "../input-group/index.js";
import { TOOLBAR, TOOLBAR_INPUT_GROUP } from "../shared/toolbar.js";

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const toolbar = inject(TOOLBAR, null);

// InputGroup's own wrapper is `display: contents`, so the toolbar item is this element instead.
const groupAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});

provide(TOOLBAR_INPUT_GROUP, {
  label: computed(() => attrs["aria-label"]),
  labelledBy: computed(() => attrs["aria-labelledby"]),
});
</script>

<template>
  <div :class="['kv-toolbar__control', 'kv-toolbar__group', attrs.class]" :style="attrs.style" data-kumo-component="Toolbar.InputGroup">
    <InputGroup v-bind="groupAttrs" :size="toolbar?.size.value ?? 'base'">
      <slot />
    </InputGroup>
  </div>
</template>
