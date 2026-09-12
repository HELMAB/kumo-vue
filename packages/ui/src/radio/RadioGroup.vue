<!-- Ported from Cloudflare Kumo's Radio.Group (MIT). See /NOTICE. -->
<script setup>
/**
 * RadioGroup - one choice from a short list.
 *
 *   <RadioGroup v-model="size" legend="Size" :items="['Small', 'Medium', 'Large']" />
 *
 * A fieldset with a legend rather than a div with a label: a group of radios
 * is the case `<fieldset>` exists for, and it is what tells a screen reader
 * that the options belong together and how many there are.
 */
import { computed, useId } from "vue";
import { RadioGroupItem, RadioGroupRoot } from "reka-ui";

import { toOption } from "../shared/items.js";

const props = defineProps({
  /** The chosen value. Use with `v-model`. */
  modelValue: { type: [String, Number, Boolean], default: undefined },
  /** Options. Plain strings, or `{ label, value, disabled, description }`. */
  items: { type: Array, default: () => [] },
  /** The group's name, rendered as the legend. */
  legend: { type: String, default: "" },
  /**
   * How the options are laid out.
   * @values vertical, horizontal
   */
  orientation: { type: String, default: "vertical" },
  /**
   * `card` gives each option a bordered, padded box that highlights when
   * chosen - for a choice that deserves more room than a line of text.
   * @values default, card
   */
  appearance: { type: String, default: "default" },
  /** Puts the control after the label. */
  controlFirst: { type: Boolean, default: true },
  /** Helper text below the group. */
  description: { type: String, default: "" },
  /** Error message. Replaces the description and marks the group invalid. */
  error: { type: String, default: "" },
  /** Disables every option. */
  disabled: { type: Boolean, default: false },
});

defineEmits(["update:modelValue"]);

const messageId = useId();

const ORIENTATIONS = new Set(["vertical", "horizontal"]);
const APPEARANCES = new Set(["default", "card"]);

const orientation = computed(() =>
  ORIENTATIONS.has(props.orientation) ? props.orientation : "vertical",
);
const appearance = computed(() =>
  APPEARANCES.has(props.appearance) ? props.appearance : "default",
);

const options = computed(() => props.items.map(toOption));

const describedBy = computed(() => (props.error || props.description ? messageId : undefined));

const rootClasses = computed(() => [
  "kv-radio-group",
  `kv-radio-group--${orientation.value}`,
  `kv-radio-group--${appearance.value}`,
  props.error && "kv-radio-group--error",
]);
</script>

<template>
  <fieldset class="kv-radio-field" data-kumo-component="RadioGroup" :disabled="disabled">
    <legend v-if="legend" class="kv-radio-field__legend">{{ legend }}</legend>

    <RadioGroupRoot
      :model-value="modelValue"
      :orientation="orientation"
      :disabled="disabled"
      :class="rootClasses"
      :aria-describedby="describedBy"
      :aria-invalid="error ? true : undefined"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <label
        v-for="option in options"
        :key="String(option.value)"
        class="kv-radio"
        data-kumo-part="item-label"
      >
        <RadioGroupItem
          :value="option.value"
          :disabled="option.disabled"
          class="kv-radio__control"
          data-kumo-part="item"
        >
          <!-- Always mounted, so the dot scales in rather than appearing. -->
          <span class="kv-radio__dot" aria-hidden="true" />
        </RadioGroupItem>

        <span class="kv-radio__text">
          <slot name="item" :option="option">
            <span class="kv-radio__label">{{ option.label }}</span>
            <span v-if="option.raw?.description" class="kv-radio__hint">
              {{ option.raw.description }}
            </span>
          </slot>
        </span>
      </label>
    </RadioGroupRoot>

    <p v-if="error" :id="messageId" class="kv-radio-field__error" data-kumo-part="error">{{ error }}</p>
    <p v-else-if="description" :id="messageId" class="kv-radio-field__description" data-kumo-part="description">
      {{ description }}
    </p>
  </fieldset>
</template>

<style>
.kv-radio-field {
  display: grid;
  gap: var(--kv-space-2);
  margin: 0;
  padding: 0;
  border: 0;
  font-family: var(--kv-font-sans);
}

.kv-radio-field__legend {
  padding: 0;
  margin-block-end: var(--kv-space-2);
  font-size: var(--kv-text-base);
  font-weight: 500;
  line-height: var(--kv-leading-normal);
  color: var(--kv-text-default);
}

.kv-radio-field__description,
.kv-radio-field__error {
  margin: 0;
  font-size: var(--kv-text-sm);
  line-height: 1.4;
}

.kv-radio-field__description {
  color: var(--kv-text-subtle);
}

.kv-radio-field__error {
  color: var(--kv-text-danger);
}

/* The group */

.kv-radio-group {
  display: flex;
  gap: var(--kv-space-2);
}

.kv-radio-group--vertical {
  flex-direction: column;
}

.kv-radio-group--horizontal {
  flex-direction: row;
  flex-wrap: wrap;
  gap: var(--kv-space-4);
}

/* An option */

.kv-radio {
  display: flex;
  align-items: flex-start;
  gap: var(--kv-space-2);
  cursor: pointer;
  font-size: var(--kv-text-base);
  line-height: var(--kv-leading-normal);
  color: var(--kv-text-default);
}

.kv-radio:has(.kv-radio__control:disabled) {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Cards give each option a box of its own. */
.kv-radio-group--card .kv-radio {
  padding: var(--kv-space-3);
  border: 1px solid var(--kv-hairline);
  border-radius: var(--kv-radius-lg);
  background-color: var(--kv-surface-base);
  transition: background-color 150ms ease, border-color 150ms ease;
}

.kv-radio-group--card .kv-radio:hover {
  background-color: var(--kv-surface-tint);
}

.kv-radio-group--card .kv-radio:has([data-state="checked"]) {
  border-color: var(--kv-interact);
  background-color: var(--kv-surface-tint);
}

.kv-radio-group--horizontal.kv-radio-group--card .kv-radio {
  flex: 1 1 0;
}

/* The control */

.kv-radio__control {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  box-sizing: border-box;

  /* Kumo's `mt-0.5`: nudged down so the circle sits on the text's x-height
     rather than its ascender line. */
  margin-block-start: 0.125rem;
  inline-size: 1rem;
  block-size: 1rem;

  padding: 0;
  border: 0;
  border-radius: 9999px;
  background-color: var(--kv-surface-base);
  /* A ring rather than a border, so checking it does not move the dot. */
  box-shadow: 0 0 0 2px var(--kv-line);
  cursor: inherit;
  transition: background-color 150ms ease, box-shadow 150ms ease;
}

.kv-radio:hover .kv-radio__control:not(:disabled) {
  box-shadow: 0 0 0 2px var(--kv-hairline);
}

.kv-radio__control[data-state="checked"] {
  background-color: var(--kv-surface-contrast);
}

.kv-radio-group--error .kv-radio__control {
  box-shadow: 0 0 0 2px var(--kv-danger);
}

.kv-radio__control:focus-visible {
  outline: 2px solid var(--kv-brand);
  outline-offset: 3px;
}

/* The dot */

.kv-radio__dot {
  inline-size: 0.5rem;
  block-size: 0.5rem;
  border-radius: 9999px;
  background-color: var(--kv-surface-base);
  scale: 0;
  transition: scale 150ms ease;
}

.kv-radio__control[data-state="checked"] .kv-radio__dot {
  scale: 1;
}

/* The text */

.kv-radio__text {
  display: grid;
  gap: 0.125rem;
}

.kv-radio__hint {
  font-size: var(--kv-text-sm);
  line-height: 1.4;
  color: var(--kv-text-subtle);
}

@media (prefers-reduced-motion: reduce) {
  .kv-radio__control,
  .kv-radio__dot,
  .kv-radio-group--card .kv-radio {
    transition: none;
  }
}
</style>
