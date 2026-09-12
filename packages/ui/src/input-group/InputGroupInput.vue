<!-- Ported from Cloudflare Kumo's InputGroup.Input (MIT). See /NOTICE. -->
<script setup>
/**
 * The text field inside an InputGroup. Takes its size, disabled state and
 * error from the group rather than from props of its own - which is why
 * setting them here warns instead of working.
 */
import { computed, useAttrs, watchEffect } from "vue";

import { useInputGroup } from "./context.js";

defineOptions({ name: "InputGroupInput", inheritAttrs: false });

const props = defineProps({
  /** The value. Use with `v-model`. */
  modelValue: { type: [String, Number], default: undefined },
  /** Native input type. */
  type: { type: String, default: "text" },
});

defineEmits(["update:modelValue"]);

const attrs = useAttrs();
const group = useInputGroup();

/* The group owns the id so its label, visible or invisible, can point at it. */
const inputId = computed(() => attrs.id ?? group?.inputId);

const classes = computed(() => [
  "kv-input-group__input",
  group?.focusMode.value === "individual" && "kv-input-group__input--individual",
]);

if (import.meta.env?.DEV) {
  watchEffect(() => {
    if (!group) {
      console.warn("[kumo-vue] <InputGroupInput> must be inside an <InputGroup>.");
      return;
    }
    for (const name of ["size", "disabled", "label", "description", "error"]) {
      if (attrs[name] !== undefined) {
        console.warn(
          `[kumo-vue] <InputGroupInput> takes \`${name}\` from <InputGroup>. ` +
            `Set it there instead - set here it is ignored by everything the group draws.`,
        );
      }
    }
  });
}
</script>

<template>
  <input
    v-bind="attrs"
    :id="inputId"
    :class="classes"
    :type="type"
    :value="modelValue"
    :disabled="group?.disabled.value || undefined"
    :aria-invalid="group?.error.value ? true : undefined"
    :aria-describedby="group?.describedBy.value"
    data-kumo-part="input"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>
