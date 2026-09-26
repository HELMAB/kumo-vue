<!-- Ported from Cloudflare Kumo's Toolbar.Input (MIT). See /NOTICE. -->
<script setup>
/** A text input inside the toolbar. Arrow keys move the caret until it reaches an end. */
import { computed, inject } from "vue";
import { TOOLBAR, TOOLBAR_ITEM } from "../shared/toolbar.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** The value. Use with `v-model`. */
  modelValue: { type: [String, Number], default: undefined },
  /** Native input type. */
  type: { type: String, default: "text" },
  /** Disables the input. */
  disabled: { type: Boolean, default: false },
  /** Keeps a disabled input reachable with the keyboard, as Base UI does. */
  focusableWhenDisabled: { type: Boolean, default: true },
});

defineEmits(["update:modelValue"]);

const toolbar = inject(TOOLBAR, null);
const size = computed(() => toolbar?.size.value ?? "base");
const softDisabled = computed(() => props.disabled && props.focusableWhenDisabled);

function onKeydown(event) {
  if (softDisabled.value && event.key !== "Tab") event.preventDefault();
}

function blockWhenDisabled(event) {
  if (props.disabled) event.preventDefault();
}
</script>

<template>
  <input
    v-bind="{ ...$attrs, [TOOLBAR_ITEM]: '' }"
    :class="['kv-input', `kv-input--size-${size}`, 'kv-toolbar__control']"
    :type="type"
    :value="modelValue"
    :disabled="disabled && !focusableWhenDisabled"
    :aria-disabled="softDisabled || undefined"
    data-kumo-component="Toolbar.Input"
    data-kumo-toolbar-input=""
    @keydown="onKeydown"
    @pointerdown="blockWhenDisabled"
    @click="blockWhenDisabled"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<style>
@import "../shared/field.css";
</style>
