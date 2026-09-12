<!-- Ported from Cloudflare Kumo's Input (MIT). See /NOTICE. -->
<script setup>
/**
 * Input - a single-line text field, on its own or inside a labelled field.
 *
 *   <Input v-model="email" aria-label="Email" placeholder="you@example.com" />
 *
 *   <Input v-model="password" label="Password" type="password"
 *          description="At least 8 characters"
 *          :error="tooShort ? 'Password is too short' : ''" />
 *
 * Kumo composes this from a bare input plus a separate `Field` that supplies
 * the label, description and error. There is no Field component here - Select
 * and Autocomplete already take `label` / `description` / `error` directly -
 * so the field markup lives in the component, as it does in those two.
 */
import { computed, useAttrs, useId, watchEffect } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** The value. Use with `v-model`. */
  modelValue: { type: [String, Number], default: undefined },
  /**
   * Height, padding, radius and type size.
   * @values xs, sm, base, lg
   */
  size: { type: String, default: "base" },
  /**
   * Visual variant. The error treatment is applied on its own whenever the
   * `error` prop is set, so this is only needed to force it without a message.
   * @values default, error
   */
  variant: { type: String, default: undefined },
  /** Renders a label above the field and wires it up. */
  label: { type: String, default: "" },
  /** Explanatory text, shown on an info button beside the label. */
  labelTooltip: { type: String, default: "" },
  /** Helper text below the field. */
  description: { type: String, default: "" },
  /** Error message. Replaces the description and marks the field invalid. */
  error: { type: String, default: "" },
  /**
   * `true` marks the field required; `false` labels it "(optional)", as Kumo
   * does. Left unset, neither is shown.
   */
  required: { type: Boolean, default: undefined },
  /** Disables the field. */
  disabled: { type: Boolean, default: false },
  /** Native input type. */
  type: { type: String, default: "text" },
  /**
   * Asks password managers to leave this field alone - for the inputs that
   * look like credentials to a browser extension and are not.
   */
  passwordManagerIgnore: { type: Boolean, default: false },
});

defineEmits(["update:modelValue"]);

const attrs = useAttrs();

const generatedId = useId();
const messageId = useId();

/* A caller-supplied id wins, and the label follows it rather than the one
   generated here - otherwise `<Input id="email" />` silently unlabels itself. */
const inputId = computed(() => attrs.id ?? generatedId);

const SIZES = new Set(["xs", "sm", "base", "lg"]);

/** An unknown size falls back to the default, as Kumo's `resolveVariant` does. */
const size = computed(() => (SIZES.has(props.size) ? props.size : "base"));

/*
 * Kumo applies the error treatment whenever `error` is truthy and keeps the
 * explicit prop as an override. Same here, without the deprecation warning it
 * prints for the prop: there was never a version of this port where the prop
 * was the only way to get there.
 */
const variant = computed(() => props.variant ?? (props.error ? "error" : "default"));

/** The label, description and error are what turn a bare input into a field. */
const hasField = computed(() => Boolean(props.label || props.description || props.error));

const describedBy = computed(() => (props.error || props.description ? messageId : undefined));

const rootClasses = computed(() => ["kv-input-field", !hasField.value && "kv-input-field--bare"]);

const inputClasses = computed(() => [
  "kv-input",
  `kv-input--size-${size.value}`,
  variant.value === "error" && "kv-input--error",
  /* Keeper reads a class rather than an attribute; Kumo sets it alongside. */
  props.passwordManagerIgnore && "keeper-ignore",
]);

/*
 * Kumo's opt-out attributes for the extensions that read them. Emitted only
 * when asked for: an input that genuinely wants a saved password must not
 * carry them.
 */
const passwordManagerAttrs = computed(() =>
  props.passwordManagerIgnore
    ? {
        "data-1p-ignore": "true",
        "data-bwignore": "true",
        "data-lpignore": "true",
        "data-form-type": "other",
      }
    : {},
);

/*
 * A field with no name is one a screen reader announces as "edit text" and
 * nothing more. Kumo warns about this in development; so does this.
 */
if (import.meta.env?.DEV) {
  watchEffect(() => {
    if (!props.label && !attrs["aria-label"] && !attrs["aria-labelledby"]) {
      console.warn(
        "[kumo-vue] <Input> needs an accessible name: the `label` prop, or " +
          "`aria-label` / `aria-labelledby` when the name is already on the page.",
      );
    }
  });
}
</script>

<template>
  <div :class="rootClasses" data-kumo-component="Input">
    <label v-if="label" class="kv-input-field__label" :for="inputId">
      {{ label }}
      <span v-if="required === true" class="kv-input-field__required" aria-hidden="true">*</span>
      <span v-else-if="required === false" class="kv-input-field__optional">(optional)</span>
      <!--
        `title` rather than a bubble: there is no Tooltip component here yet,
        the same gap Button records for the same prop.
      -->
      <button
        v-if="labelTooltip"
        class="kv-input-field__info"
        type="button"
        :title="labelTooltip"
        aria-label="More information"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <circle cx="8" cy="8" r="6.25" />
          <path d="M8 7.25v4" stroke-linecap="round" />
          <circle cx="8" cy="4.9" r=".85" fill="currentColor" stroke="none" />
        </svg>
      </button>
    </label>

    <input
      v-bind="{ ...attrs, ...passwordManagerAttrs }"
      :id="inputId"
      :class="inputClasses"
      :type="type"
      :value="modelValue"
      :disabled="disabled"
      :required="required === true ? true : undefined"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="describedBy"
      data-kumo-part="input"
      @input="$emit('update:modelValue', $event.target.value)"
    />

    <!-- Kumo shows one or the other, error winning; never both. -->
    <p v-if="error" :id="messageId" class="kv-input-field__error" data-kumo-part="error">
      {{ error }}
    </p>
    <p v-else-if="description" :id="messageId" class="kv-input-field__description" data-kumo-part="description">
      {{ description }}
    </p>
  </div>
</template>

<style>
/* The field */

/*
 * Kumo's Field is `grid gap-2`. The wrapper is unconditional here so the
 * input element is written once rather than once per branch; with nothing to
 * stack it takes itself out of the layout entirely, which leaves a bare
 * `<Input />` the intrinsic width of an input rather than the full width of
 * whatever contains it.
 */
.kv-input-field {
  display: grid;
  gap: var(--kv-space-2);
  font-family: var(--kv-font-sans);
}

.kv-input-field--bare {
  display: contents;
}

.kv-input-field__label {
  display: inline-flex;
  align-items: center;
  gap: var(--kv-space-1);
  margin: 0;
  font-size: var(--kv-text-base);
  font-weight: 500;
  line-height: var(--kv-leading-normal);
  color: var(--kv-text-default);
  /* A double-click on the label should select the field's value, not the
     field's name. Kumo's Field sets `select-none` for the same reason. */
  user-select: none;
}

.kv-input-field__required {
  margin-inline-start: 0.125rem;
  color: var(--kv-text-danger);
}

.kv-input-field__optional {
  margin-inline-start: 0.25rem;
  font-weight: 400;
  color: var(--kv-text-subtle);
}

.kv-input-field__info {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  inline-size: 1.25rem;
  block-size: 1.25rem;
  padding: 0;
  border: 0;
  border-radius: var(--kv-radius-sm);
  background: none;
  color: var(--kv-text-subtle);
  cursor: pointer;
}

.kv-input-field__info:hover {
  color: var(--kv-text-default);
}

.kv-input-field__info:focus-visible {
  outline: 2px solid var(--kv-focus);
  outline-offset: 1px;
}

.kv-input-field__info > svg {
  inline-size: 1rem;
  block-size: 1rem;
}

.kv-input-field__description,
.kv-input-field__error {
  margin: 0;
  font-size: var(--kv-text-sm);
  /* Kumo's `leading-snug`. */
  line-height: 1.4;
}

.kv-input-field__description {
  color: var(--kv-text-subtle);
}

.kv-input-field__error {
  color: var(--kv-text-danger);
}

/* The control */

/*
 * Kumo draws the outline with Tailwind's `ring`, which is a spread box-shadow
 * outside the border box rather than a border - so it costs no layout width
 * and the 1px -> 1.5px change on focus does not move anything. Same here.
 *
 * No width: Kumo sets none either. In a field the input is a grid item and
 * stretches; bare, it keeps an input's intrinsic width. One rule, both
 * behaviours, which is why the wrapper below disappears rather than shrinks.
 */
.kv-input {
  --kv-input-height: 2.25rem;
  --kv-input-padding-inline: var(--kv-space-3);
  --kv-input-radius: var(--kv-radius-lg);
  --kv-input-font-size: var(--kv-text-base);
  --kv-input-ring: var(--kv-line);
  --kv-input-ring-width: 1px;

  box-sizing: border-box;
  block-size: var(--kv-input-height);
  min-inline-size: 0;

  padding-inline: var(--kv-input-padding-inline);
  padding-block: 0;
  border: 0;
  border-radius: var(--kv-input-radius);

  background-color: var(--kv-surface-control);
  color: var(--kv-text-default);
  box-shadow: 0 0 0 var(--kv-input-ring-width) var(--kv-input-ring);

  font-family: var(--kv-font-sans);
  font-size: var(--kv-input-font-size);
  line-height: var(--kv-leading-normal);

  outline: none;
  transition: box-shadow 150ms ease;
}

/* Sizes. `base` is set above; these are the other three. */

.kv-input--size-xs {
  --kv-input-height: 1.25rem;
  --kv-input-padding-inline: var(--kv-space-1-5);
  --kv-input-radius: var(--kv-radius-sm);
  --kv-input-font-size: var(--kv-text-xs);
}

.kv-input--size-sm {
  --kv-input-height: 1.625rem;
  --kv-input-padding-inline: var(--kv-space-2);
  --kv-input-radius: var(--kv-radius-md);
  --kv-input-font-size: var(--kv-text-xs);
}

.kv-input--size-lg {
  --kv-input-height: 2.5rem;
  --kv-input-padding-inline: var(--kv-space-4);
}

/* States */

.kv-input::placeholder {
  color: var(--kv-text-placeholder);
  /* Firefox dims placeholders by default; Kumo's colour is the whole rule. */
  opacity: 1;
}

.kv-input:focus {
  --kv-input-ring-width: 1.5px;
  --kv-input-ring: color-mix(in oklab, var(--kv-focus) 50%, transparent);
}

.kv-input--error {
  --kv-input-ring: var(--kv-danger);
}

.kv-input--error:focus {
  --kv-input-ring-width: 1.5px;
  --kv-input-ring: color-mix(in oklab, var(--kv-danger) 50%, transparent);
}

.kv-input:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (prefers-reduced-motion: reduce) {
  .kv-input {
    transition: none;
  }
}
</style>
