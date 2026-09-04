<!-- Ported from Cloudflare Kumo's Select (MIT). See /NOTICE. -->
<script setup>
/**
 * Select - choose one option, or several, from a fixed list.
 *
 * The value is constrained to the list; that is the distinction from
 * Autocomplete, where anything typed is valid.
 *
 *   <Select v-model="fruit" :items="fruits" label="Fruit" placeholder="Choose..." />
 *
 *   <Select v-model="regions" :items="grouped" multiple placeholder="Any region">
 *     <template #item="{ item }">{{ item.label }}</template>
 *   </Select>
 *
 * Built on Reka UI's Select primitive, the counterpart to the Base UI one Kumo
 * builds on: it owns keyboard navigation, typeahead, focus management and the
 * ARIA wiring.
 */
import { computed, useId } from "vue";
import {
  SelectContent,
  SelectGroup,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectPortal,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from "reka-ui";

import { toGroups } from "../shared/items.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** Selected value, or an array of them when `multiple`. */
  modelValue: { type: [String, Number, Boolean, Object, Array], default: undefined },
  /**
   * Options. Accepts plain strings, `{ label, value, disabled }` objects, or
   * `{ label, items }` groups - grouping is a shape here rather than the
   * separate Group and GroupLabel components Kumo exposes.
   */
  items: { type: Array, default: () => [] },
  /**
   * Trigger size, matching the Input and Button scale.
   * @values xs, sm, base, lg
   */
  size: { type: String, default: "base" },
  /** Shown on the trigger while nothing is selected. */
  placeholder: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
  /** Allow several selections. `modelValue` is then an array. */
  multiple: { type: Boolean, default: false },
  /** Shows a placeholder shimmer instead of the value, and blocks interaction. */
  loading: { type: Boolean, default: false },
  /** Renders a label above the trigger and wires it up. */
  label: { type: String, default: "" },
  /** Helper text below the trigger. */
  description: { type: String, default: "" },
  /** Error message. Replaces the description and marks the field invalid. */
  error: { type: String, default: "" },
  /**
   * `true` marks the field required; `false` labels it "(optional)", as Kumo
   * does. Left unset, neither is shown.
   */
  required: { type: Boolean, default: undefined },
  /** Controlled open state. Leave unset to let the component manage it. */
  open: { type: Boolean, default: undefined },
});

defineEmits(["update:modelValue", "update:open"]);

const triggerId = useId();
const labelId = useId();
const describedById = useId();

const groups = computed(() => toGroups(props.items));

/** Every option flattened, for turning selected values back into labels. */
const allOptions = computed(() => groups.value.flatMap((group) => group.options));

const labelFor = (value) =>
  allOptions.value.find((option) => option.value === value)?.label ?? String(value);

/**
 * Reka renders the raw value on the trigger. Kumo shows the option's label, and
 * for a multiple select a comma-joined summary, so both are resolved here.
 */
const displayValue = computed(() => {
  const value = props.modelValue;
  if (value === undefined || value === null || value === "") return "";
  if (Array.isArray(value)) {
    return value.length ? value.map(labelFor).join(", ") : "";
  }
  return labelFor(value);
});

const isEmpty = computed(() => !displayValue.value);

const describedBy = computed(() =>
  props.error || props.description ? describedById : undefined,
);

const rootClasses = computed(() => [
  "kv-select",
  `kv-select--size-${props.size}`,
  { "kv-select--error": Boolean(props.error) },
]);
</script>

<template>
  <div :class="rootClasses" data-kumo-component="Select">
    <label v-if="label" :id="labelId" class="kv-select__label" :for="triggerId">
      {{ label }}
      <span v-if="required === true" class="kv-select__required" aria-hidden="true">*</span>
      <span v-else-if="required === false" class="kv-select__optional">(optional)</span>
    </label>

    <SelectRoot
      :model-value="modelValue"
      :multiple="multiple"
      :disabled="disabled || loading"
      :open="open"
      @update:model-value="$emit('update:modelValue', $event)"
      @update:open="$emit('update:open', $event)"
    >
      <SelectTrigger
        v-bind="$attrs"
        :id="triggerId"
        class="kv-select__trigger"
        data-kumo-part="trigger"
        :aria-labelledby="label ? labelId : undefined"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="describedBy"
      >
        <span v-if="loading" class="kv-select__skeleton" aria-hidden="true" />
        <SelectValue v-else class="kv-select__value" :class="{ 'kv-select__value--placeholder': isEmpty }">
          <slot name="value" :value="modelValue" :label="displayValue">
            {{ displayValue || placeholder }}
          </slot>
        </SelectValue>

        <SelectIcon class="kv-select__icon">
          <!-- Caret up-down: the affordance that says this opens a list. -->
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path d="M5 6.5 8 3.5l3 3M5 9.5l3 3 3-3" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </SelectIcon>
      </SelectTrigger>

      <SelectPortal>
        <SelectContent
          class="kv-select__popup"
          position="popper"
          align="start"
          :side-offset="4"
        >
          <SelectViewport class="kv-select__list">
            <template v-for="(group, index) in groups" :key="group.label || index">
              <SelectSeparator v-if="index > 0" class="kv-select__separator" />
              <SelectGroup class="kv-select__group">
                <SelectLabel v-if="group.label" class="kv-select__group-label">
                  {{ group.label }}
                </SelectLabel>
                <SelectItem
                  v-for="option in group.options"
                  :key="String(option.value)"
                  class="kv-select__option"
                  data-kumo-part="option"
                  :value="option.value"
                  :disabled="option.disabled"
                >
                  <SelectItemText>
                    <slot name="item" :item="option.raw" :option="option">
                      {{ option.label }}
                    </slot>
                  </SelectItemText>
                  <SelectItemIndicator class="kv-select__check">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path d="m3 8.5 3.5 3.5L13 5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </SelectItemIndicator>
                </SelectItem>
              </SelectGroup>
            </template>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>

    <p v-if="error" :id="describedById" class="kv-select__error">{{ error }}</p>
    <p v-else-if="description" :id="describedById" class="kv-select__description">
      {{ description }}
    </p>
  </div>
</template>

<style>
.kv-select {
  --kv-field-height: 2.25rem;
  --kv-field-radius: var(--kv-radius-lg);
  --kv-field-padding: var(--kv-space-3);
  --kv-field-font-size: var(--kv-text-base);
  --kv-field-icon: 1rem;

  display: flex;
  flex-direction: column;
  gap: var(--kv-space-1-5);
  font-family: var(--kv-font-sans);
}

.kv-select--size-xs {
  --kv-field-height: 1.25rem;
  --kv-field-radius: var(--kv-radius-sm);
  --kv-field-padding: var(--kv-space-1-5);
  --kv-field-font-size: var(--kv-text-xs);
  --kv-field-icon: 0.75rem;
}

.kv-select--size-sm {
  --kv-field-height: 1.625rem;
  --kv-field-radius: var(--kv-radius-md);
  --kv-field-padding: var(--kv-space-2);
  --kv-field-font-size: var(--kv-text-xs);
  --kv-field-icon: 0.875rem;
}

.kv-select--size-lg {
  --kv-field-height: 2.5rem;
  --kv-field-padding: var(--kv-space-4);
  --kv-field-icon: 1.125rem;
}

/* Field furniture */

.kv-select__label {
  font-size: var(--kv-text-sm);
  font-weight: 500;
  line-height: var(--kv-leading-normal);
  color: var(--kv-text-strong);
}

.kv-select__required {
  color: var(--kv-text-danger);
  margin-inline-start: 0.125rem;
}

.kv-select__optional {
  margin-inline-start: 0.25rem;
  font-weight: 400;
  color: var(--kv-text-subtle);
}

.kv-select__description,
.kv-select__error {
  margin: 0;
  font-size: var(--kv-text-sm);
  line-height: var(--kv-leading-normal);
}

.kv-select__description {
  color: var(--kv-text-subtle);
}

.kv-select__error {
  color: var(--kv-text-danger);
}

/* Trigger */

/*
 * Kumo builds the trigger from its Button styles, then swaps the background
 * and drops the weight to normal. Same result here, written out rather than
 * inherited so the Select stands alone when copied.
 */
.kv-select__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--kv-space-2);
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
  font-weight: 400;
  line-height: var(--kv-leading-normal);
  text-align: start;
  cursor: pointer;
  user-select: none;
  outline: none;
  box-shadow:
    0 0 0 1px var(--kv-line),
    0 1px 2px 0 var(--kv-shadow-drop);
  transition: box-shadow 100ms ease;
}

.kv-select__trigger:focus-visible {
  box-shadow: 0 0 0 1.5px color-mix(in oklch, var(--kv-focus) 50%, transparent);
}

.kv-select--error .kv-select__trigger {
  box-shadow:
    0 0 0 1px var(--kv-danger),
    0 1px 2px 0 var(--kv-shadow-drop);
}

.kv-select--error .kv-select__trigger:focus-visible {
  box-shadow: 0 0 0 1.5px color-mix(in oklch, var(--kv-danger) 50%, transparent);
}

.kv-select__trigger:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (prefers-reduced-motion: reduce) {
  .kv-select__trigger {
    transition: none;
  }
}

.kv-select__value {
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kv-select__value--placeholder {
  color: var(--kv-text-placeholder);
}

.kv-select__icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  inline-size: var(--kv-field-icon);
  block-size: var(--kv-field-icon);
  color: var(--kv-text-subtle);
}

.kv-select__icon > svg {
  inline-size: 100%;
  block-size: 100%;
}

/* A stand-in for the value while the options are still loading. */
.kv-select__skeleton {
  inline-size: 8rem;
  block-size: 0.75em;
  border-radius: var(--kv-radius-sm);
  background: linear-gradient(
    90deg,
    var(--kv-fill) 0%,
    var(--kv-surface-tint) 50%,
    var(--kv-fill) 100%
  );
  background-size: 200% 100%;
  animation: kv-select-shimmer 1.5s ease-in-out infinite;
}

@keyframes kv-select-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .kv-select__skeleton {
    animation: none;
  }
}

/* Popup */

.kv-select__popup {
  z-index: 50;
  display: flex;
  flex-direction: column;
  padding-block: var(--kv-space-1-5);

  min-inline-size: var(--reka-select-trigger-width);
  max-inline-size: var(--reka-select-content-available-width);
  max-block-size: var(--reka-select-content-available-height);

  background-color: var(--kv-surface-base);
  color: var(--kv-text-default);
  border-radius: var(--kv-radius-lg);
  box-shadow:
    0 0 0 1px var(--kv-line),
    0 10px 15px -3px var(--kv-shadow-elevated),
    0 4px 6px -4px var(--kv-shadow-elevated);
  font-family: var(--kv-font-sans);
}

.kv-select__list {
  min-block-size: 0;
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: none;
  scroll-padding-block: var(--kv-space-2);
}

.kv-select__group + .kv-select__group {
  margin-block-start: var(--kv-space-1);
}

.kv-select__group-label {
  display: block;
  padding-block: var(--kv-space-1-5);
  padding-inline: var(--kv-space-3-5);
  font-size: var(--kv-text-sm);
  font-weight: 600;
  color: var(--kv-text-subtle);
}

.kv-select__separator {
  block-size: 1px;
  margin-block: var(--kv-space-1);
  margin-inline: var(--kv-space-1);
  background-color: var(--kv-hairline);
}

/* Option */

.kv-select__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

/*
 * Reka moves DOM focus onto the highlighted option, where Base UI leaves focus
 * on the popup and points at the option with aria-activedescendant. Kumo's
 * source carries a `focus-visible` ring that therefore almost never fires
 * upstream; copied verbatim it would draw a ring on every mouse click. The
 * highlight is the affordance, in both implementations.
 */
.kv-select__option[data-highlighted] {
  background-color: var(--kv-surface-tint);
}

.kv-select__option[data-disabled] {
  pointer-events: none;
  cursor: not-allowed;
  opacity: 0.5;
}

.kv-select__check {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  inline-size: 0.875rem;
  block-size: 0.875rem;
}

.kv-select__check > svg {
  inline-size: 100%;
  block-size: 100%;
}
</style>
