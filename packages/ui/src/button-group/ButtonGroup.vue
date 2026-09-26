<!-- Ported from Cloudflare Kumo's ButtonGroup (MIT). See /NOTICE. -->
<script setup>
/**
 * Joins tightly-coupled buttons into one control, most often a split button.
 * Children keep their own variant, size and shape; give the group an `aria-label`.
 */
defineOptions({ inheritAttrs: false });
</script>

<template>
  <div v-bind="$attrs" role="group" class="kv-button-group" data-kumo-component="ButtonGroup">
    <slot />
  </div>
</template>

<style>
.kv-button-group {
  position: relative;
  isolation: isolate;
  display: inline-flex;
  flex-direction: row;
  inline-size: max-content;
}

.kv-button-group > * {
  position: relative;
  --kv-shadow-drop: transparent;
}

.kv-button-group > :focus-visible,
.kv-button-group > :has(:focus-visible) {
  z-index: 10;
}

.kv-button-group > :not(:first-child):is(button, a),
.kv-button-group > :not(:first-child) > :is(button, a) {
  border-start-start-radius: 0;
  border-end-start-radius: 0;
}

.kv-button-group > :is(button, a):has(~ :is(button, a)),
.kv-button-group > :not(:last-child) > :is(button, a) {
  border-start-end-radius: 0;
  border-end-end-radius: 0;
}

.kv-button-group > :not(:first-child) {
  margin-inline-start: -1px;
}
</style>
