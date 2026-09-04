<!-- Ported from Cloudflare Kumo's Autocomplete (MIT). See /NOTICE. -->
<script setup>
/**
 * Autocomplete - a free-form text input with a filtered suggestion list.
 *
 * Free-form is the distinction from a combobox: the value is whatever is
 * typed, and the suggestions are a convenience. Use a combobox when the value
 * must come from the list.
 *
 *   <Autocomplete v-model="fruit" :items="fruits" label="Fruit" />
 *
 *   <Autocomplete v-model="q" :items="products" placeholder="Search...">
 *     <template #item="{ item }">{{ item.label }}</template>
 *   </Autocomplete>
 *
 * Built on Reka UI's Autocomplete primitive, the counterpart to the Base UI
 * one Kumo builds on: it owns filtering, keyboard navigation, focus management
 * and the ARIA wiring.
 */
import { computed, useId } from "vue";
import {
  AutocompleteInput,
  AutocompleteRoot,
  ComboboxAnchor,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxLabel,
  ComboboxPortal,
  ComboboxSeparator,
  ComboboxViewport,
} from "reka-ui";

import { toGroups } from "../shared/items.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** The input's text. Free-form: not constrained to the item list. */
  modelValue: { type: String, default: undefined },
  /**
   * Suggestions. Accepts plain strings, `{ label, value, disabled }` objects,
   * or `{ label, items }` groups - grouping is a shape here rather than the
   * separate Group and GroupLabel components Kumo exposes.
   */
  items: { type: Array, default: () => [] },
  /**
   * Field size, matching the Input scale.
   * @values xs, sm, base, lg
   */
  size: { type: String, default: "base" },
  placeholder: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
  /** Renders a label above the field and wires it to the input. */
  label: { type: String, default: "" },
  /** Helper text below the field. */
  description: { type: String, default: "" },
  /** Error message. Replaces the description and marks the field invalid. */
  error: { type: String, default: "" },
  required: { type: Boolean, default: false },
  /** Shown when nothing matches. Set to "" to render nothing. */
  emptyMessage: { type: String, default: "No results found" },
  /**
   * Turn off the built-in filtering, for lists you filter yourself - a server
   * query, say. `items` is then rendered as given.
   */
  ignoreFilter: { type: Boolean, default: false },
  /** Open the list as soon as the field receives focus. */
  openOnFocus: { type: Boolean, default: false },
  /** Controlled open state. Leave unset to let the component manage it. */
  open: { type: Boolean, default: undefined },
});

defineEmits(["update:modelValue", "update:open"]);

const inputId = useId();
const describedById = useId();

/** One shape for the template: a flat list becomes a single unlabelled group. */
const groups = computed(() => toGroups(props.items));

const describedBy = computed(() =>
  props.error || props.description ? describedById : undefined,
);

const rootClasses = computed(() => [
  "kv-autocomplete",
  `kv-autocomplete--size-${props.size}`,
  { "kv-autocomplete--error": Boolean(props.error) },
]);
</script>

<template>
  <div :class="rootClasses" data-kumo-component="Autocomplete">
    <label v-if="label" class="kv-autocomplete__label" :for="inputId">
      {{ label }}
      <span v-if="required" class="kv-autocomplete__required" aria-hidden="true">*</span>
    </label>

    <AutocompleteRoot
      :model-value="modelValue"
      :disabled="disabled"
      :ignore-filter="ignoreFilter"
      :open-on-focus="openOnFocus"
      :open="open"
      @update:model-value="$emit('update:modelValue', $event)"
      @update:open="$emit('update:open', $event)"
    >
      <!--
        The anchor is what the popup positions against, and what publishes
        --reka-combobox-trigger-width. Without it the popper has no reference
        and renders off-screen.
      -->
      <ComboboxAnchor as-child>
        <AutocompleteInput
          v-bind="$attrs"
          :id="inputId"
          class="kv-autocomplete__input"
          :placeholder="placeholder"
          :required="required"
          :aria-invalid="error ? true : undefined"
          :aria-describedby="describedBy"
        />
      </ComboboxAnchor>

      <ComboboxPortal>
        <ComboboxContent
          class="kv-autocomplete__popup"
          position="popper"
          align="start"
          :side-offset="4"
        >
          <ComboboxViewport class="kv-autocomplete__list">
            <ComboboxEmpty v-if="emptyMessage" class="kv-autocomplete__empty">
              <slot name="empty">{{ emptyMessage }}</slot>
            </ComboboxEmpty>

            <template v-for="(group, index) in groups" :key="group.label || index">
              <ComboboxSeparator v-if="index > 0" class="kv-autocomplete__separator" />
              <ComboboxGroup class="kv-autocomplete__group">
                <ComboboxLabel v-if="group.label" class="kv-autocomplete__group-label">
                  {{ group.label }}
                </ComboboxLabel>
                <ComboboxItem
                  v-for="option in group.options"
                  :key="String(option.value)"
                  class="kv-autocomplete__item"
                  :value="option.label"
                  :disabled="option.disabled"
                >
                  <span class="kv-autocomplete__item-label">
                    <slot name="item" :item="option.raw" :option="option">
                      {{ option.label }}
                    </slot>
                  </span>
                  <span class="kv-autocomplete__check" aria-hidden="true">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="m3 8.5 3.5 3.5L13 5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </span>
                </ComboboxItem>
              </ComboboxGroup>
            </template>
          </ComboboxViewport>
        </ComboboxContent>
      </ComboboxPortal>
    </AutocompleteRoot>

    <p v-if="error" :id="describedById" class="kv-autocomplete__error">{{ error }}</p>
    <p v-else-if="description" :id="describedById" class="kv-autocomplete__description">
      {{ description }}
    </p>
  </div>
</template>

<style>
.kv-autocomplete {
  --kv-field-height: 2.25rem;
  --kv-field-radius: var(--kv-radius-lg);
  --kv-field-padding: var(--kv-space-3);
  --kv-field-font-size: var(--kv-text-base);

  display: flex;
  flex-direction: column;
  gap: var(--kv-space-1-5);
  font-family: var(--kv-font-sans);
}

.kv-autocomplete--size-xs {
  --kv-field-height: 1.25rem;
  --kv-field-radius: var(--kv-radius-sm);
  --kv-field-padding: var(--kv-space-1-5);
  --kv-field-font-size: var(--kv-text-xs);
}

.kv-autocomplete--size-sm {
  --kv-field-height: 1.625rem;
  --kv-field-radius: var(--kv-radius-md);
  --kv-field-padding: var(--kv-space-2);
  --kv-field-font-size: var(--kv-text-xs);
}

.kv-autocomplete--size-lg {
  --kv-field-height: 2.5rem;
  --kv-field-padding: var(--kv-space-4);
}

/* Field furniture */

.kv-autocomplete__label {
  font-size: var(--kv-text-sm);
  font-weight: 500;
  line-height: var(--kv-leading-normal);
  color: var(--kv-text-strong);
}

.kv-autocomplete__required {
  color: var(--kv-text-danger);
  margin-inline-start: 0.125rem;
}

.kv-autocomplete__description,
.kv-autocomplete__error {
  margin: 0;
  font-size: var(--kv-text-sm);
  line-height: var(--kv-leading-normal);
}

.kv-autocomplete__description {
  color: var(--kv-text-subtle);
}

.kv-autocomplete__error {
  color: var(--kv-text-danger);
}

/* Input */

.kv-autocomplete__input {
  inline-size: 100%;
  block-size: var(--kv-field-height);
  padding-block: 0;
  padding-inline: var(--kv-field-padding);
  border: 0;
  border-radius: var(--kv-field-radius);
  background-color: var(--kv-surface-control);
  color: var(--kv-text-default);
  font-family: inherit;
  font-size: var(--kv-field-font-size);
  line-height: var(--kv-leading-normal);
  outline: none;
  box-shadow: 0 0 0 1px var(--kv-line);
  transition: box-shadow 100ms ease;
}

.kv-autocomplete__input::placeholder {
  color: var(--kv-text-placeholder);
  /* Chrome fades the placeholder without this. */
  opacity: 1;
}

.kv-autocomplete__input:focus {
  box-shadow: 0 0 0 1.5px color-mix(in oklch, var(--kv-focus) 50%, transparent);
}

.kv-autocomplete--error .kv-autocomplete__input {
  box-shadow: 0 0 0 1px var(--kv-danger);
}

.kv-autocomplete--error .kv-autocomplete__input:focus {
  box-shadow: 0 0 0 1.5px color-mix(in oklch, var(--kv-danger) 50%, transparent);
}

.kv-autocomplete__input:disabled {
  color: var(--kv-text-inactive);
  cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
  .kv-autocomplete__input {
    transition: none;
  }
}

/* Popup */

.kv-autocomplete__popup {
  z-index: 50;
  display: flex;
  flex-direction: column;
  padding-block: var(--kv-space-1-5);

  /* Reka publishes the anchor width and the room available to the popup. */
  min-inline-size: var(--reka-combobox-trigger-width);
  max-inline-size: var(--reka-combobox-content-available-width);
  max-block-size: min(var(--reka-combobox-content-available-height), 24rem);

  background-color: var(--kv-surface-control);
  color: var(--kv-text-default);
  border-radius: var(--kv-radius-lg);
  box-shadow:
    0 0 0 1px var(--kv-line),
    0 10px 15px -3px var(--kv-shadow-elevated),
    0 4px 6px -4px var(--kv-shadow-elevated);
  font-family: var(--kv-font-sans);
}

.kv-autocomplete__list {
  min-block-size: 0;
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-padding-block: var(--kv-space-2);
}

.kv-autocomplete__empty {
  padding-block: var(--kv-space-1-5);
  padding-inline: var(--kv-space-3-5);
  font-size: var(--kv-text-base);
  color: var(--kv-text-subtle);
}

.kv-autocomplete__group + .kv-autocomplete__group {
  margin-block-start: var(--kv-space-2);
}

.kv-autocomplete__group-label {
  display: block;
  margin-inline: var(--kv-space-1-5);
  padding-block: var(--kv-space-1-5);
  padding-inline: var(--kv-space-2);
  font-size: var(--kv-text-sm);
  color: var(--kv-text-strong);
}

.kv-autocomplete__separator {
  block-size: 1px;
  margin-block: var(--kv-space-1);
  background-color: var(--kv-line);
}

/* Item */

.kv-autocomplete__item {
  display: grid;
  grid-template-columns: 1fr 1rem;
  align-items: center;
  gap: var(--kv-space-2);

  margin-inline: var(--kv-space-1-5);
  padding-block: var(--kv-space-1-5);
  padding-inline: var(--kv-space-2);
  border-radius: var(--kv-radius-sm);

  font-size: var(--kv-text-base);
  line-height: var(--kv-leading-normal);
  cursor: pointer;
  outline: none;
}

.kv-autocomplete__item[data-highlighted] {
  background-color: var(--kv-surface-overlay);
}

.kv-autocomplete__item[data-state="checked"] {
  font-weight: 500;
}

.kv-autocomplete__item[data-disabled] {
  color: var(--kv-text-inactive);
  cursor: not-allowed;
}

.kv-autocomplete__item-label {
  grid-column-start: 1;
  min-inline-size: 0;
}

.kv-autocomplete__check {
  grid-column-start: 2;
  display: none;
  align-items: center;
  inline-size: 0.875rem;
  block-size: 0.875rem;
}

.kv-autocomplete__item[data-state="checked"] .kv-autocomplete__check {
  display: flex;
}

.kv-autocomplete__check > svg {
  inline-size: 100%;
  block-size: 100%;
}
</style>
