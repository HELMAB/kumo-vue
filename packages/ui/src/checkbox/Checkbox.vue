<!-- Ported from Cloudflare Kumo's Checkbox (MIT). See /NOTICE. -->
<script setup>
/**
 * Checkbox - a control toggled between checked, unchecked and indeterminate.
 *
 *   <Checkbox v-model="agreed" label="Accept terms and conditions" />
 *   <Checkbox v-model="all" indeterminate label="Select all" />
 *   <Checkbox v-model="remember" label="Remember me" :control-first="false" />
 *
 * Built on Reka UI's Checkbox primitive, the counterpart to the Base UI one
 * Kumo builds on: it owns the `role="checkbox"` / `aria-checked` contract, the
 * space-to-toggle keyboard behaviour, and the hidden input that makes the
 * control submit with a form.
 *
 * Drop it inside a `CheckboxGroup` and the group owns the value; `value` is
 * then what this box contributes to the group's array.
 */
import { computed, useAttrs, useId, useSlots, watchEffect } from "vue";
import { CheckboxIndicator, CheckboxRoot } from "reka-ui";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** Checked state. Also accepts `"indeterminate"`, as Reka does. */
  modelValue: { type: [Boolean, String], default: undefined },
  /**
   * Show the mixed state - some but not all of what this box stands for is
   * selected. Kumo keeps this separate from the checked state, and so does
   * this: clicking an indeterminate box checks it and leaves clearing the
   * flag to you.
   */
  indeterminate: { type: Boolean, default: false },
  /** Visible label. The `label` slot takes precedence for richer content. */
  label: { type: String, default: "" },
  /**
   * `true` draws the error ring alone - Kumo's `variant="error"`. A string
   * draws it and renders the message below.
   */
  error: { type: [Boolean, String], default: false },
  /** Helper text below the control. */
  description: { type: String, default: "" },
  /** `false` puts the label before the control, as Kumo's `controlFirst`. */
  controlFirst: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  /**
   * `true` marks the field required; `false` labels it "(optional)", as Kumo
   * does. Left unset, neither is shown.
   */
  required: { type: Boolean, default: undefined },
  /** Name for form submission. */
  name: { type: String, default: undefined },
  /** Value submitted when checked, and the box's identity inside a group. */
  value: { type: null, default: "on" },
  /** Id for the control. Generated when not given. */
  id: { type: String, default: undefined },
});

defineEmits(["update:modelValue"]);

const attrs = useAttrs();
const slots = useSlots();
const generatedId = useId();

const controlId = computed(() => props.id ?? generatedId);
const describedById = computed(() => `${controlId.value}-description`);

const hasError = computed(() => props.error !== false && props.error !== "");
const errorMessage = computed(() =>
  typeof props.error === "string" && props.error ? props.error : "",
);

const message = computed(() => errorMessage.value || props.description);

/**
 * Reka carries the mixed state in the value itself; Kumo carries it in a
 * separate prop. Both are accepted here and folded into the one state Reka
 * wants, so `v-model` stays a plain boolean unless you choose otherwise.
 */
const state = computed(() => {
  if (props.indeterminate || props.modelValue === "indeterminate") return "indeterminate";
  return Boolean(props.modelValue);
});

/**
 * A checkbox with no visible label needs a name from somewhere. Kumo enforces
 * this through its TypeScript prop types; this port is JavaScript, so the
 * equivalent is a development-only warning. It costs nothing in a production
 * build, and stays quiet inside a group, where the item's label is the name.
 */
if (import.meta.env?.DEV) {
  watchEffect(() => {
    const named =
      props.label ||
      attrs["aria-label"] ||
      attrs["aria-labelledby"] ||
      Boolean(slots.label);
    if (!named) {
      console.warn(
        "[kumo-vue] Checkbox needs an accessible name: pass `label`, the " +
          "`label` slot, `aria-label` or `aria-labelledby`.",
      );
    }
  });
}
</script>

<template>
  <div
    class="kv-checkbox"
    :class="{
      'kv-checkbox--error': hasError,
      'kv-checkbox--disabled': disabled,
      'kv-checkbox--label-first': !controlFirst,
    }"
    data-kumo-component="Checkbox"
  >
    <div class="kv-checkbox__row">
      <CheckboxRoot
        v-bind="$attrs"
        :id="controlId"
        class="kv-checkbox__control"
        data-kumo-part="control"
        :model-value="state"
        :disabled="disabled"
        :name="name"
        :value="value"
        :required="required === true"
        :aria-invalid="hasError ? 'true' : undefined"
        :aria-describedby="message ? describedById : undefined"
        @update:model-value="$emit('update:modelValue', $event)"
      >
        <CheckboxIndicator class="kv-checkbox__indicator" force-mount>
          <svg
            v-if="state === 'indeterminate'"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path d="M3.5 8h9" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" />
          </svg>
          <svg v-else viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="m3.25 8.5 3.25 3.25 6.25-6.5"
              stroke="currentColor"
              stroke-width="2.25"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </CheckboxIndicator>
      </CheckboxRoot>

      <label v-if="label || $slots.label" class="kv-checkbox__label" :for="controlId">
        <slot name="label">{{ label }}</slot>
        <span v-if="required === true" class="kv-checkbox__required" aria-hidden="true">*</span>
        <span v-else-if="required === false" class="kv-checkbox__optional">(optional)</span>
      </label>
    </div>

    <p
      v-if="message"
      :id="describedById"
      class="kv-checkbox__message"
      :class="errorMessage ? 'kv-checkbox__error' : 'kv-checkbox__description'"
    >
      {{ message }}
    </p>
  </div>
</template>

<style>
/*
 * Logical properties throughout, so the control and its label swap sides under
 * dir="rtl" without a second stylesheet.
 */
.kv-checkbox {
  display: inline-flex;
  flex-direction: column;
  gap: var(--kv-space-1-5);
  font-family: var(--kv-font-sans);
  font-size: var(--kv-text-base);
  line-height: var(--kv-leading-normal);
}

.kv-checkbox__row {
  display: flex;
  align-items: flex-start;
  gap: var(--kv-space-2);
}

/*
 * Label first puts the text in the reading order before the box. `row-reverse`
 * reverses the *logical* order, so this is correct in RTL too.
 */
.kv-checkbox--label-first .kv-checkbox__row {
  flex-direction: row-reverse;
  justify-content: flex-end;
}

/* The box */

.kv-checkbox__control {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  inline-size: 1rem;
  block-size: 1rem;
  /* Nudged down so the box sits on the label's first line, not above it. */
  margin-block-start: 0.125rem;
  padding: 0;
  border: 0;
  border-radius: var(--kv-radius-sm);

  background-color: var(--kv-surface-base);
  color: var(--kv-text-inverse);
  box-shadow: 0 0 0 1px var(--kv-hairline);
  cursor: pointer;
  outline: none;
  transition: background-color 100ms ease, box-shadow 100ms ease;
}

/*
 * The box is 16px, which is below any sensible pointer target, so the hit area
 * is extended past it - the same trick as Kumo's `after:-inset-x-3`.
 */
.kv-checkbox__control::after {
  content: "";
  position: absolute;
  inset-block: -0.5rem;
  inset-inline: -0.75rem;
}

.kv-checkbox__control:hover:not(:disabled) {
  box-shadow: 0 0 0 1px var(--kv-line-strong);
}

.kv-checkbox__control:focus-visible {
  box-shadow:
    0 0 0 1px var(--kv-hairline),
    0 0 0 2px var(--kv-focus);
}

.kv-checkbox__control[data-state="checked"],
.kv-checkbox__control[data-state="indeterminate"] {
  background-color: var(--kv-surface-contrast);
  box-shadow: 0 0 0 1px var(--kv-surface-contrast);
}

.kv-checkbox__control[data-state="checked"]:focus-visible,
.kv-checkbox__control[data-state="indeterminate"]:focus-visible {
  box-shadow:
    0 0 0 1px var(--kv-surface-contrast),
    0 0 0 2px var(--kv-focus);
}

.kv-checkbox--error .kv-checkbox__control {
  box-shadow: 0 0 0 1px var(--kv-danger);
}

.kv-checkbox--error .kv-checkbox__control:focus-visible {
  box-shadow:
    0 0 0 1px var(--kv-danger),
    0 0 0 2px color-mix(in oklch, var(--kv-danger) 50%, transparent);
}

.kv-checkbox__control:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* A disabled box has no hit area to speak of, so the extension goes too. */
.kv-checkbox__control:disabled::after {
  content: none;
}

@media (prefers-reduced-motion: reduce) {
  .kv-checkbox__control {
    transition: none;
  }
}

.kv-checkbox__indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  inline-size: 0.75rem;
  block-size: 0.75rem;
}

/* Kept mounted so the box does not resize as the tick appears. */
.kv-checkbox__indicator[data-state="unchecked"] {
  visibility: hidden;
}

.kv-checkbox__indicator > svg {
  inline-size: 100%;
  block-size: 100%;
}

/* Label and messages */

.kv-checkbox__label {
  color: var(--kv-text-default);
  cursor: pointer;
}

.kv-checkbox--disabled .kv-checkbox__label {
  cursor: not-allowed;
  opacity: 0.5;
}

.kv-checkbox__required {
  color: var(--kv-text-danger);
  margin-inline-start: 0.125rem;
}

.kv-checkbox__optional {
  margin-inline-start: 0.25rem;
  color: var(--kv-text-subtle);
}

.kv-checkbox__message {
  margin: 0;
  font-size: var(--kv-text-sm);
  line-height: var(--kv-leading-normal);
}

.kv-checkbox__description {
  color: var(--kv-text-subtle);
}

.kv-checkbox__error {
  color: var(--kv-text-danger);
}
</style>
