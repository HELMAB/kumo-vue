<!-- Ported from Cloudflare Kumo's Checkbox.Group (MIT). See /NOTICE. -->
<script setup>
/**
 * CheckboxGroup - several related checkboxes under one legend, sharing one
 * array value.
 *
 *   <CheckboxGroup v-model="prefs" :items="options" legend="Email preferences"
 *     description="Choose how you'd like to receive updates" />
 *
 *   <CheckboxGroup v-model="prefs" :items="options" legend="Required"
 *     error="Please select at least one notification method" />
 *
 * The options are an `items` prop rather than the `Checkbox.Item` children
 * Kumo takes - the same shape Select and Autocomplete accept, normalised by
 * the same helper.
 */
import { computed, useId } from "vue";
import { CheckboxGroupRoot } from "reka-ui";

import { toOption } from "../shared/items.js";
import Checkbox from "./Checkbox.vue";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** Checked values. */
  modelValue: { type: Array, default: () => [] },
  /** Options: plain strings, or `{ label, value, disabled }` objects. */
  items: { type: Array, default: () => [] },
  /** Legend for the fieldset. The `legend` slot takes richer content. */
  legend: { type: String, default: "" },
  /** Keep the legend for screen readers but take it off the screen. */
  legendHidden: { type: Boolean, default: false },
  /** Helper text below the options. */
  description: { type: String, default: "" },
  /** Error message. Replaces the description and marks every box invalid. */
  error: { type: String, default: "" },
  /** Disables every box in the group. */
  disabled: { type: Boolean, default: false },
  /** `false` puts each label before its control. */
  controlFirst: { type: Boolean, default: true },
  /** Name for form submission. */
  name: { type: String, default: undefined },
});

defineEmits(["update:modelValue"]);

const describedById = useId();

const options = computed(() => props.items.map(toOption));

const message = computed(() => props.error || props.description);

/*
 * Reka makes the group one tab stop and moves between boxes with the arrow
 * keys. Kumo's group is plain checkboxes, where Tab reaches each one - which is
 * what its own documentation promises - so roving focus is off.
 */
const ROVING_FOCUS = false;
</script>

<template>
  <CheckboxGroupRoot
    v-bind="$attrs"
    as="fieldset"
    class="kv-checkbox-group"
    data-kumo-component="CheckboxGroup"
    :model-value="modelValue"
    :disabled="disabled"
    :name="name"
    :aria-describedby="message ? describedById : undefined"
    :aria-invalid="error ? 'true' : undefined"
    :roving-focus="ROVING_FOCUS"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <legend
      v-if="legend || $slots.legend"
      class="kv-checkbox-group__legend"
      :class="{ 'kv-checkbox-group__legend--hidden': legendHidden }"
    >
      <slot name="legend">{{ legend }}</slot>
    </legend>

    <div class="kv-checkbox-group__items">
      <Checkbox
        v-for="(option, index) in options"
        :key="String(option.value)"
        :value="option.value"
        :label="option.label"
        :disabled="disabled || option.disabled"
        :error="Boolean(error)"
        :control-first="controlFirst"
      >
        <template v-if="$slots.item" #label>
          <slot name="item" :item="option.raw" :option="option" :index="index" />
        </template>
      </Checkbox>
    </div>

    <p
      v-if="message"
      :id="describedById"
      class="kv-checkbox-group__message"
      :class="error ? 'kv-checkbox-group__error' : 'kv-checkbox-group__description'"
    >
      {{ message }}
    </p>
  </CheckboxGroupRoot>
</template>

<style>
.kv-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: var(--kv-space-4);

  /* A fieldset carries browser furniture that has nothing to do with us. */
  margin: 0;
  padding: 0;
  border: 0;
  min-inline-size: 0;

  font-family: var(--kv-font-sans);
  font-size: var(--kv-text-base);
  line-height: var(--kv-leading-normal);
}

.kv-checkbox-group__legend {
  padding: 0;
  color: var(--kv-text-default);
  font-weight: 500;
}

/*
 * Kumo's example reaches for a `sr-only` utility class; the port has no
 * utility layer, so hiding the legend is a prop and the rule lives here.
 */
.kv-checkbox-group__legend--hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.kv-checkbox-group__items {
  display: flex;
  flex-direction: column;
  gap: var(--kv-space-2);
}

.kv-checkbox-group__message {
  margin: 0;
  font-size: var(--kv-text-sm);
  line-height: var(--kv-leading-normal);
}

.kv-checkbox-group__description {
  color: var(--kv-text-subtle);
}

.kv-checkbox-group__error {
  color: var(--kv-text-danger);
}
</style>
