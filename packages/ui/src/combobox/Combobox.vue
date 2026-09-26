<!-- Ported from Cloudflare Kumo's Combobox (MIT). See /NOTICE. -->
<script setup>
/**
 * A typeahead picker constrained to its items: an input trigger, a value button with search
 * inside the popup, or chips for `multiple`. Items take the same shapes as Select's.
 */
import { computed, ref, useId, useSlots } from "vue";
import {
  ComboboxAnchor,
  ComboboxCancel,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxLabel,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxViewport,
} from "reka-ui";
import { Label } from "../label/index.js";
import { toGroups } from "../shared/items.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** The selected value, or an array with `multiple`. Use with `v-model`. */
  modelValue: { type: [String, Number, Boolean, Object, Array], default: undefined },
  /** Strings, `{ label, value, disabled }` objects, or `{ label, items }` groups. */
  items: { type: Array, default: () => [] },
  /**
   * `input` types into the field; `value` is a button showing the selection, with search in the popup.
   * @values input, value
   */
  trigger: { type: String, default: "input" },
  /** Selects several items, shown as chips. */
  multiple: { type: Boolean, default: false },
  /**
   * With `multiple`, puts the input beside the chips or above them.
   * @values right, top
   */
  inputSide: { type: String, default: "right" },
  /**
   * Matches the Input scale.
   * @values xs, sm, base, lg
   */
  size: { type: String, default: "base" },
  placeholder: { type: String, default: undefined },
  /** Placeholder of the search input inside the popup, for the `value` trigger or a `#trigger` slot. */
  searchPlaceholder: { type: String, default: undefined },
  /** Shows the search input inside the popup, for the `value` trigger or a `#trigger` slot. */
  searchable: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  /** Renders the field label and wires it to the control. */
  label: { type: String, default: "" },
  /** Info tooltip beside the label. */
  labelTooltip: { type: String, default: "" },
  /** Helper text below the field. */
  description: { type: String, default: "" },
  /** Error message. Replaces the description and marks the field invalid. */
  error: { type: String, default: "" },
  /** `false` shows "(optional)" after the label. */
  required: { type: Boolean, default: undefined },
  /** Shown when nothing matches. */
  emptyMessage: { type: String, default: "No labels found." },
  /** Accessible names, for localisation. */
  clearLabel: { type: String, default: "Clear selection" },
  showOptionsLabel: { type: String, default: "Show options" },
  removeLabel: { type: String, default: "Remove" },
  /** Controlled open state. Use with `v-model:open`. */
  open: { type: Boolean, default: undefined },
  /** Where the popup is portalled. */
  to: { type: [String, Object], default: "body" },
});

const emit = defineEmits(["update:modelValue", "update:open"]);
const slots = useSlots();

const SIZES = ["xs", "sm", "base", "lg"];
const size = computed(() => (SIZES.includes(props.size) ? props.size : "base"));
const groups = computed(() => toGroups(props.items));
const options = computed(() => groups.value.flatMap((group) => group.options));

const same = (a, b) => (a && typeof a === "object" && b && typeof b === "object" ? a.value === b.value : a === b);
const optionFor = (value) => options.value.find((option) => same(option.value, value));
const labelFor = (value) => (value == null ? "" : (optionFor(value)?.label ?? String(value)));

const selected = computed(() => (props.multiple ? (props.modelValue ?? []) : props.modelValue));
const hasValue = computed(() => (props.multiple ? selected.value.length > 0 : selected.value != null && selected.value !== ""));

const inputId = useId();
const messageId = useId();
const describedBy = computed(() => (props.error || props.description ? messageId : undefined));

function update(value) {
  emit("update:modelValue", value);
}

function remove(value) {
  update(selected.value.filter((item) => !same(item, value)));
}

const searchTerm = ref("");

// Backspace in an empty chip input removes the last chip, as Base UI's Chips do.
function onChipsKeydown(event) {
  if (event.key === "Backspace" && !event.target.value && selected.value.length) {
    remove(selected.value.at(-1));
  }
}

const fieldClasses = computed(() => ["kv-input-field", "kv-combobox", `kv-combobox--size-${size.value}`, !props.label && "kv-input-field--bare"]);
const controlClasses = computed(() => ["kv-input", `kv-input--size-${size.value}`, { "kv-input--error": Boolean(props.error) }]);
</script>

<template>
  <div :class="fieldClasses" data-kumo-component="Combobox">
    <Label v-if="label" class="kv-combobox__label" :for="inputId" :show-optional="required === false" :tooltip="labelTooltip">
      {{ label }}
    </Label>

    <ComboboxRoot
      :model-value="modelValue"
      :multiple="multiple"
      :disabled="disabled"
      :open="open"
      :required="required === true"
      :by="(a, b) => same(a, b)"
      :reset-search-term-on-blur="trigger !== 'input' || multiple || Boolean($slots.trigger)"
      @update:model-value="update"
      @update:open="emit('update:open', $event)"
    >
      <ComboboxAnchor v-if="multiple" as-child>
        <div
          v-bind="$attrs"
          :class="[...controlClasses, 'kv-combobox__chips', `kv-combobox__chips--${inputSide}`]"
          :data-disabled="disabled ? '' : undefined"
          data-kumo-component="Combobox"
          data-kumo-part="chips"
        >
          <ComboboxInput
            v-if="inputSide === 'top'"
            :id="inputId"
            v-model="searchTerm"
            class="kv-combobox__chips-input kv-combobox__chips-input--top"
            :placeholder="placeholder"
            :aria-invalid="error ? true : undefined"
            :aria-describedby="describedBy"
            @keydown="onChipsKeydown"
          />
          <div class="kv-combobox__chip-row">
            <span v-for="value in selected" :key="String(value?.value ?? value)" class="kv-combobox__chip" data-kumo-part="chip">
              <slot name="chip" :value="value" :item="optionFor(value)?.raw" :label="labelFor(value)">{{ labelFor(value) }}</slot>
              <button
                type="button"
                class="kv-combobox__chip-remove"
                data-kumo-component="Combobox"
                data-kumo-part="chip-remove"
                :aria-label="removeLabel"
                :disabled="disabled"
                @click="remove(value)"
              >
                <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" width="10" height="10">
                  <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
                </svg>
              </button>
            </span>
            <ComboboxInput
              v-if="inputSide !== 'top'"
              :id="inputId"
              v-model="searchTerm"
              class="kv-combobox__chips-input"
              :placeholder="placeholder"
              :aria-invalid="error ? true : undefined"
              :aria-describedby="describedBy"
              @keydown="onChipsKeydown"
            />
          </div>
        </div>
      </ComboboxAnchor>

      <ComboboxAnchor v-else-if="$slots.trigger" as-child>
        <ComboboxTrigger v-bind="$attrs" as-child data-kumo-component="Combobox" data-kumo-part="trigger">
          <slot name="trigger" :value="selected" :label="labelFor(selected)" />
        </ComboboxTrigger>
      </ComboboxAnchor>

      <ComboboxAnchor v-else-if="trigger === 'value'" as-child>
        <ComboboxTrigger
          v-bind="$attrs"
          :id="inputId"
          :class="[...controlClasses, 'kv-combobox__value']"
          :data-placeholder="hasValue ? undefined : ''"
          :aria-invalid="error ? true : undefined"
          :aria-describedby="describedBy"
          data-kumo-component="Combobox"
          data-kumo-part="trigger"
        >
          <span class="kv-combobox__value-text">
            <slot name="value" :value="selected" :label="labelFor(selected)">{{ hasValue ? labelFor(selected) : placeholder }}</slot>
          </span>
          <span class="kv-combobox__icon kv-combobox__icon--value" aria-hidden="true">
            <svg viewBox="0 0 256 256" fill="currentColor"><path d="M181.66,170.34a8,8,0,0,1,0,11.32l-48,48a8,8,0,0,1-11.32,0l-48-48a8,8,0,0,1,11.32-11.32L128,212.69l42.34-42.35A8,8,0,0,1,181.66,170.34Zm-96-84.68L128,43.31l42.34,42.35a8,8,0,0,0,11.32-11.32l-48-48a8,8,0,0,0-11.32,0l-48,48A8,8,0,0,0,85.66,85.66Z" /></svg>
          </span>
        </ComboboxTrigger>
      </ComboboxAnchor>

      <ComboboxAnchor v-else as-child>
        <div v-bind="$attrs" class="kv-combobox__field" :data-disabled="disabled ? '' : undefined">
          <ComboboxInput
            :id="inputId"
            :class="[...controlClasses, 'kv-combobox__input']"
            :placeholder="placeholder"
            :display-value="labelFor"
            :aria-invalid="error ? true : undefined"
            :aria-describedby="describedBy"
          />
          <ComboboxCancel
            v-if="hasValue && !disabled"
            class="kv-combobox__clear"
            data-kumo-component="Combobox"
            data-kumo-part="clear"
            :aria-label="clearLabel"
          >
            <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" /></svg>
          </ComboboxCancel>
          <ComboboxTrigger class="kv-combobox__caret" data-kumo-component="Combobox" data-kumo-part="trigger" :aria-label="showOptionsLabel">
            <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M181.66,170.34a8,8,0,0,1,0,11.32l-48,48a8,8,0,0,1-11.32,0l-48-48a8,8,0,0,1,11.32-11.32L128,212.69l42.34-42.35A8,8,0,0,1,181.66,170.34Zm-96-84.68L128,43.31l42.34,42.35a8,8,0,0,0,11.32-11.32l-48-48a8,8,0,0,0-11.32,0l-48,48A8,8,0,0,0,85.66,85.66Z" /></svg>
          </ComboboxTrigger>
        </div>
      </ComboboxAnchor>

      <ComboboxPortal :to="to">
        <ComboboxContent class="kv-combobox__popup" position="popper" align="start" :side-offset="4" data-kumo-part="popup">
          <ComboboxInput
            v-if="(trigger === 'value' || $slots.trigger) && !multiple && searchable"
            class="kv-input kv-input--size-base kv-combobox__search"
            :placeholder="searchPlaceholder"
          />
          <ComboboxEmpty class="kv-combobox__empty">
            <slot name="empty">{{ emptyMessage }}</slot>
          </ComboboxEmpty>
          <ComboboxViewport class="kv-combobox__list">
            <ComboboxGroup v-for="(group, index) in groups" :key="group.label || index" class="kv-combobox__group">
              <ComboboxLabel v-if="group.label" class="kv-combobox__group-label">
                <slot name="group-label" :label="group.label">{{ group.label }}</slot>
              </ComboboxLabel>
              <ComboboxItem
                v-for="option in group.options"
                :key="String(option.value?.value ?? option.value)"
                class="kv-combobox__item"
                :value="option.value"
                :text-value="option.label"
                :disabled="option.disabled"
                data-kumo-component="Combobox"
                data-kumo-part="item"
              >
                <div class="kv-combobox__item-label">
                  <slot name="item" :item="option.raw" :option="option">{{ option.label }}</slot>
                </div>
                <ComboboxItemIndicator class="kv-combobox__indicator">
                  <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" /></svg>
                </ComboboxItemIndicator>
              </ComboboxItem>
            </ComboboxGroup>
          </ComboboxViewport>
        </ComboboxContent>
      </ComboboxPortal>
    </ComboboxRoot>

    <p v-if="error" :id="messageId" class="kv-combobox__message kv-combobox__message--error">{{ error }}</p>
    <p v-else-if="description" :id="messageId" class="kv-combobox__message">{{ description }}</p>
  </div>
</template>

<style>
@import "../shared/field.css";

.kv-combobox {
  --kv-combobox-icon: 16px;
  --kv-combobox-caret-end: var(--kv-space-2);
  --kv-combobox-clear-end: var(--kv-space-8);
  --kv-combobox-value-pad: var(--kv-space-8);
  --kv-combobox-input-pad: var(--kv-space-12);
}

.kv-combobox--size-xs {
  --kv-combobox-icon: 12px;
  --kv-combobox-caret-end: var(--kv-space-1);
  --kv-combobox-clear-end: var(--kv-space-5);
  --kv-combobox-value-pad: var(--kv-space-5);
  --kv-combobox-input-pad: 1.75rem;
}

.kv-combobox--size-sm {
  --kv-combobox-icon: 14px;
  --kv-combobox-caret-end: var(--kv-space-1-5);
  --kv-combobox-clear-end: var(--kv-space-6);
  --kv-combobox-value-pad: var(--kv-space-6);
  --kv-combobox-input-pad: 2.25rem;
}

.kv-combobox--size-lg {
  --kv-combobox-icon: 18px;
  --kv-combobox-caret-end: var(--kv-space-3);
  --kv-combobox-clear-end: 2.25rem;
  --kv-combobox-value-pad: var(--kv-space-10);
  --kv-combobox-input-pad: 3.5rem;
}

.kv-combobox__label {
  margin: 0;
  user-select: none;
}

.kv-combobox__message {
  margin: 0;
  font-size: var(--kv-text-sm);
  line-height: 1.375;
  color: var(--kv-text-subtle);
}

.kv-combobox__message--error {
  color: var(--kv-text-danger);
}

/* Input trigger */

.kv-combobox__field {
  position: relative;
  display: inline-block;
  inline-size: 100%;
}

.kv-combobox__field[data-disabled] {
  cursor: not-allowed;
  opacity: 0.5;
}

.kv-combobox__input {
  inline-size: 100%;
  padding-inline-end: var(--kv-combobox-input-pad);
}

.kv-combobox__input:disabled {
  cursor: not-allowed;
  opacity: 1;
}

.kv-combobox__clear,
.kv-combobox__caret {
  position: absolute;
  inset-block-start: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transform: translateY(-50%);
}

.kv-combobox__clear {
  inset-inline-end: var(--kv-combobox-clear-end);
}

.kv-combobox__caret {
  inset-inline-end: var(--kv-combobox-caret-end);
  color: var(--kv-text-subtle);
}

.kv-combobox__clear > svg,
.kv-combobox__caret > svg,
.kv-combobox__icon > svg {
  inline-size: var(--kv-combobox-icon);
  block-size: var(--kv-combobox-icon);
}

/* Value trigger */

.kv-combobox__value {
  position: relative;
  display: flex;
  align-items: center;
  padding-inline-end: var(--kv-combobox-value-pad);
  text-align: start;
  cursor: pointer;
}

.kv-combobox__value[data-placeholder] {
  color: var(--kv-text-placeholder);
}

.kv-combobox__value[data-disabled] {
  cursor: not-allowed;
  opacity: 0.5;
}

.kv-combobox__value-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kv-combobox__icon--value {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-end: var(--kv-combobox-caret-end);
  display: flex;
  align-items: center;
  color: var(--kv-text-subtle);
  transform: translateY(-50%);
}

/* Chips */

.kv-combobox__chips {
  display: flex;
  flex-direction: column;
  gap: var(--kv-space-1);
  block-size: auto;
  min-block-size: var(--kv-input-height);
  padding: var(--kv-space-1) var(--kv-space-1-5);
}

.kv-combobox__chips:focus-within {
  --kv-input-ring-width: 1.5px;
  --kv-input-ring: color-mix(in oklab, var(--kv-focus) 50%, transparent);
}

.kv-combobox__chips[data-disabled] {
  cursor: not-allowed;
  opacity: 0.5;
}

.kv-combobox__chip-row {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--kv-space-1-5);
}

.kv-combobox__chips-input {
  flex: 1;
  min-inline-size: 100px;
  padding: var(--kv-space-1) var(--kv-space-2);
  border: 0;
  background: inherit;
  color: inherit;
  font: inherit;
  outline: none;
}

.kv-combobox__chips-input::placeholder {
  color: var(--kv-text-placeholder);
}

.kv-combobox__chips-input--top {
  inline-size: 100%;
}

.kv-combobox__chip {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  block-size: var(--kv-space-6);
  padding-inline: var(--kv-space-2) 3px;
  border-radius: var(--kv-radius-sm);
  background-color: var(--kv-surface-overlay);
  box-shadow: 0 0 0 1px var(--kv-hairline);
  font-size: var(--kv-text-sm);
  line-height: calc(1 / 0.85);
}

.kv-combobox__chip-remove {
  display: flex;
  padding: var(--kv-space-1);
  border: 0;
  border-radius: var(--kv-radius-md);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.kv-combobox__chip-remove:hover {
  background-color: var(--kv-fill-hover);
}

/* Popup */

.kv-combobox__popup {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-inline-size: var(--reka-combobox-trigger-width);
  max-inline-size: var(--reka-combobox-content-available-width);
  max-block-size: min(var(--reka-combobox-content-available-height), 24rem);
  padding-block: var(--kv-space-1-5);
  border-radius: var(--kv-radius-lg);
  background-color: var(--kv-surface-base);
  color: var(--kv-text-default);
  box-shadow:
    0 0 0 1px var(--kv-line),
    0 10px 15px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -4px rgb(0 0 0 / 0.1);
  font-family: var(--kv-font-sans);
}

.kv-combobox__search {
  flex-shrink: 0;
  inline-size: 100%;
  margin: calc(var(--kv-space-1-5) * -1) 0 0;
  border-end-start-radius: 0;
  border-end-end-radius: 0;
}

.kv-combobox__search:first-child {
  margin-block-end: var(--kv-space-2);
}

.kv-combobox__list {
  flex: 1;
  min-block-size: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-padding-block: var(--kv-space-2);
}

.kv-combobox__empty {
  flex-shrink: 0;
  margin-inline: var(--kv-space-1-5);
  padding: var(--kv-space-2) var(--kv-space-4);
  font-size: 0.925rem;
  line-height: 1rem;
  color: var(--kv-text-subtle);
}

.kv-combobox__group + .kv-combobox__group {
  margin-block-start: var(--kv-space-2);
  padding-block-start: var(--kv-space-2);
  border-block-start: 1px solid var(--kv-hairline);
}

.kv-combobox__group-label {
  margin-inline: var(--kv-space-1-5);
  padding: var(--kv-space-1-5) var(--kv-space-2);
  font-size: var(--kv-text-sm);
  line-height: calc(1 / 0.85);
  color: var(--kv-text-subtle);
}

.kv-combobox__item {
  display: grid;
  grid-template-columns: 1fr 16px;
  gap: var(--kv-space-2);
  margin-inline: var(--kv-space-1-5);
  padding: var(--kv-space-1-5) var(--kv-space-2);
  border-radius: var(--kv-radius-sm);
  font-size: var(--kv-text-base);
  line-height: 1.5;
  cursor: pointer;
  outline: none;
}

.kv-combobox__item[data-highlighted] {
  background-color: var(--kv-surface-tint);
}

.kv-combobox__item[data-disabled] {
  cursor: not-allowed;
  color: var(--kv-text-subtle);
  opacity: 0.6;
}

.kv-combobox__item[data-disabled][data-highlighted] {
  background-color: transparent;
}

.kv-combobox__item-label {
  grid-column-start: 1;
}

.kv-combobox__indicator {
  display: flex;
  grid-column-start: 2;
  align-items: center;
}

.kv-combobox__indicator > svg {
  inline-size: 1em;
  block-size: 1em;
}
</style>
