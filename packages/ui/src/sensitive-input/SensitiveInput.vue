<!-- Ported from Cloudflare Kumo's SensitiveInput (MIT). See /NOTICE. -->
<script setup>
/**
 * SensitiveInput - a field for an API key or a token: masked until asked for,
 * with a reveal toggle and a copy button.
 *
 *   <SensitiveInput v-model="apiKey" label="API token" />
 *
 * Three states rather than a boolean, which is what makes it behave: `empty`
 * is a plain field you can type into, `masked` covers a saved value and is not
 * focusable, `revealed` shows it and returns to masked on blur or Escape. A
 * two-state version leaves you unable to tell "not set yet" from "set and
 * hidden", and they want opposite affordances.
 */
import { computed, ref, useAttrs, useId, watch } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** The value. Use with `v-model`. */
  modelValue: { type: String, default: "" },
  /**
   * Height, padding, radius and type size.
   * @values xs, sm, base, lg
   */
  size: { type: String, default: "base" },
  /** Renders a label above the field and wires it up. */
  label: { type: String, default: "" },
  /** Helper text below the field. */
  description: { type: String, default: "" },
  /** Error message. Replaces the description and marks the field invalid. */
  error: { type: String, default: "" },
  /** `true` marks the field required; `false` labels it "(optional)". */
  required: { type: Boolean, default: undefined },
  /** Disables the field, and with it the reveal and copy buttons. */
  disabled: { type: Boolean, default: false },
  /** Placeholder, shown only while the field is empty. */
  placeholder: { type: String, default: "" },
  /** The prompt shown over a masked value on hover. */
  revealHint: { type: String, default: "Click to reveal" },
  /** Accessible name for the reveal toggle while the value is hidden. */
  revealLabel: { type: String, default: "Reveal value" },
  /** Accessible name for the reveal toggle while the value is shown. */
  hideLabel: { type: String, default: "Hide value" },
  /** Accessible name for the copy button. */
  copyLabel: { type: String, default: "Copy to clipboard" },
  /** Announced once the value is on the clipboard. */
  copiedLabel: { type: String, default: "Copied" },
});

const emit = defineEmits(["update:modelValue", "copy"]);

const attrs = useAttrs();

const generatedId = useId();
const messageId = useId();

const inputId = computed(() => attrs.id ?? generatedId);

const revealed = ref(false);
const copied = ref(false);
let resetTimer;

const SIZES = new Set(["xs", "sm", "base", "lg"]);
const size = computed(() => (SIZES.has(props.size) ? props.size : "base"));

const hasValue = computed(() => props.modelValue.length > 0);

/**
 * `empty`, `masked` or `revealed` - see the note at the top.
 *
 * `revealed` is checked first on purpose: typing into an empty field reveals
 * it, and a field with no `v-model` never reports a value back, so testing for
 * one first would leave it masked while the user was looking at it.
 */
const mode = computed(() => {
  if (revealed.value) return "revealed";
  return hasValue.value ? "masked" : "empty";
});

const isMasked = computed(() => mode.value === "masked");

const hasField = computed(() => Boolean(props.label || props.description || props.error));

const describedBy = computed(() => (props.error || props.description ? messageId : undefined));

const rootClasses = computed(() => ["kv-input-field", !hasField.value && "kv-input-field--bare"]);

const fieldClasses = computed(() => [
  "kv-input",
  "kv-sensitive",
  `kv-input--size-${size.value}`,
  props.error && "kv-input--error",
  isMasked.value && "kv-sensitive--masked",
  props.disabled && "kv-sensitive--disabled",
]);

/* Typing into an empty field reveals it: masking what is being typed would
   stop the user checking their own work, and there is nothing saved to hide. */
watch(hasValue, (has) => {
  if (!has) revealed.value = false;
});

function reveal() {
  if (props.disabled || !hasValue.value) return;
  revealed.value = true;
}

function toggle() {
  if (props.disabled) return;
  revealed.value = !revealed.value;
}

function onInput(event) {
  revealed.value = true;
  emit("update:modelValue", event.target.value);
}

/* Blur re-masks, but only when focus has left the field altogether - moving to
   the reveal or copy button inside it must not hide what was just shown. */
function onFocusout(event) {
  if (event.currentTarget.contains(event.relatedTarget)) return;
  revealed.value = false;
}

async function copy() {
  if (props.disabled || !hasValue.value) return;
  try {
    await navigator.clipboard.writeText(props.modelValue);
  } catch {
    /* Insecure context, or permission refused. Nothing was copied, so say
       nothing: a "Copied" that did not copy is worse than no feedback. */
    return;
  }
  copied.value = true;
  emit("copy", props.modelValue);
  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    copied.value = false;
  }, 1500);
}
</script>

<template>
  <div :class="rootClasses" data-kumo-component="SensitiveInput">
    <label v-if="label" class="kv-input-field__label" :for="inputId">
      {{ label }}
      <span v-if="required === true" class="kv-input-field__required" aria-hidden="true">*</span>
      <span v-else-if="required === false" class="kv-input-field__optional">(optional)</span>
    </label>

    <!--
      The click lives on the field, not on the mask: revealing unmounts
      whatever was clicked, and unmounting a focused element fires `focusout`,
      which would re-mask the value in the same tick.
    -->
    <div
      :class="fieldClasses"
      data-kumo-part="field"
      @focusout="onFocusout"
      @click="reveal"
    >
      <input
        v-bind="attrs"
        :id="inputId"
        class="kv-sensitive__input"
        :type="mode === 'revealed' ? 'text' : 'password'"
        :value="modelValue"
        :disabled="disabled"
        :readonly="isMasked"
        :tabindex="isMasked ? -1 : 0"
        :aria-hidden="isMasked ? true : undefined"
        :placeholder="placeholder"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="describedBy"
        data-kumo-part="input"
        @input="onInput"
        @keydown.esc="revealed = false"
      />

      <!--
        The mask is an overlay rather than a replacement for the input, so the
        field keeps its width and nothing shifts when the value is revealed.
      -->
      <span class="kv-sensitive__mask" data-kumo-part="mask" aria-hidden="true">
        <span class="kv-sensitive__dots">••••••••</span>
        <span v-if="!disabled" class="kv-sensitive__hint">{{ revealHint }}</span>
      </span>

      <div class="kv-sensitive__actions">
        <button
          v-if="hasValue && !disabled"
          class="kv-sensitive__button"
          type="button"
          :aria-label="copied ? copiedLabel : copyLabel"
          data-kumo-part="copy"
          @click="copy"
        >
          <svg v-if="copied" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="m3 8.5 3.5 3.5L13 5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <svg v-else viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <rect x="5.75" y="5.75" width="8.5" height="8.5" rx="1.5" />
            <path d="M10.25 3.75a1.5 1.5 0 0 0-1.5-1.5h-5a1.5 1.5 0 0 0-1.5 1.5v5a1.5 1.5 0 0 0 1.5 1.5" />
          </svg>
        </button>

        <button
          v-if="hasValue && !disabled"
          class="kv-sensitive__button"
          type="button"
          :aria-label="mode === 'revealed' ? hideLabel : revealLabel"
          data-kumo-part="toggle-visibility"
          @click="toggle"
        >
          <svg v-if="mode === 'revealed'" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M2 8s2.4-4 6-4 6 4 6 4-2.4 4-6 4-6-4-6-4Z" />
            <circle cx="8" cy="8" r="1.75" />
            <path d="m3 13 10-10" stroke-linecap="round" />
          </svg>
          <svg v-else viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M2 8s2.4-4 6-4 6 4 6 4-2.4 4-6 4-6-4-6-4Z" />
            <circle cx="8" cy="8" r="1.75" />
          </svg>
        </button>
      </div>
    </div>

    <p v-if="error" :id="messageId" class="kv-input-field__error" data-kumo-part="error">{{ error }}</p>
    <p v-else-if="description" :id="messageId" class="kv-input-field__description" data-kumo-part="description">
      {{ description }}
    </p>
  </div>
</template>

<style>
/* The field furniture and `.kv-input` itself, which this component wears. */
@import "../shared/field.css";

/* Input's field, with room at the end for the two buttons. */
.kv-sensitive {
  position: relative;
  display: flex;
  align-items: center;
  padding-inline-end: 0;
}

.kv-sensitive:focus-within {
  --kv-input-ring-width: 1.5px;
  --kv-input-ring: color-mix(in oklab, var(--kv-focus) 50%, transparent);
}

.kv-sensitive.kv-input--error:focus-within {
  --kv-input-ring: color-mix(in oklab, var(--kv-danger) 50%, transparent);
}

.kv-sensitive--disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.kv-sensitive__input {
  flex: 1 1 auto;
  min-inline-size: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  outline: none;
}

.kv-sensitive__input::placeholder {
  color: var(--kv-text-placeholder);
  opacity: 1;
}

/* Masked, the real value must not be readable - or selectable. */
.kv-sensitive--masked .kv-sensitive__input {
  color: transparent;
  pointer-events: none;
  user-select: none;
}

/* The mask */

/*
 * Always mounted, and hidden rather than removed once the value is revealed -
 * see the note in the template. Not interactive either: the field beneath it
 * takes the click, so there is one target rather than two overlapping ones.
 */
.kv-sensitive__mask {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  inset-block: 0;
  inset-inline-start: var(--kv-input-padding-inline);
  /* Stops short of the buttons, so it never covers them. */
  inset-inline-end: 4.5rem;

  display: flex;
  align-items: center;
  overflow: hidden;

  padding: 0;
  border: 0;
  background: none;
  color: var(--kv-text-default);
  font: inherit;
  text-align: start;
}

.kv-sensitive--masked .kv-sensitive__mask {
  visibility: visible;
}

.kv-sensitive--masked:not(.kv-sensitive--disabled) {
  cursor: pointer;
}

/*
 * Both strings are always in the box, one on top of the other, so swapping
 * them on hover cannot change the field's width.
 */
.kv-sensitive__hint {
  position: absolute;
  inset-inline-start: 0;
  white-space: nowrap;
  color: var(--kv-text-subtle);
  visibility: hidden;
}

.kv-sensitive--masked:hover .kv-sensitive__dots {
  visibility: hidden;
}

.kv-sensitive--masked:hover .kv-sensitive__hint {
  visibility: visible;
}

/* The buttons */

.kv-sensitive__actions {
  display: flex;
  align-items: center;
  flex: none;
  gap: var(--kv-space-1);
  margin-inline-start: auto;
  padding-inline-end: var(--kv-space-2);
}

.kv-sensitive__button {
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

.kv-sensitive__button:hover {
  color: var(--kv-text-default);
}

.kv-sensitive__button:focus-visible {
  outline: 2px solid var(--kv-brand);
  outline-offset: 1px;
}

.kv-sensitive__button > svg {
  inline-size: 1rem;
  block-size: 1rem;
}
</style>
