<!-- Ported from Cloudflare Kumo's TagInput (MIT). See /NOTICE. -->
<script setup>
/**
 * TagInput - a field that collects a list of short strings as chips.
 *
 *   <TagInput v-model="domains" label="Allowed domains" :max-values="5" />
 *
 * Enter, a comma or Tab commits what has been typed; Backspace in an empty
 * field takes the last chip back. Blur commits too, because a value typed and
 * then abandoned is almost always one the user thought they had added.
 */
import { computed, ref, useAttrs, useId } from "vue";

import { Button } from "../button/index.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** The chips. Use with `v-model`. */
  modelValue: { type: Array, default: () => [] },
  /**
   * Padding, radius and type size of the field.
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
  /** Disables the field and every remove button. */
  disabled: { type: Boolean, default: false },
  /** Placeholder for the text field. */
  placeholder: { type: String, default: "" },
  /** Most chips allowed. `0` is no limit. */
  maxValues: { type: Number, default: 0 },
  /** Accessible name for a chip's remove button. Receives the chip's text. */
  removeLabel: { type: Function, default: (value) => `Remove ${value}` },
  /** Shown when adding one more would pass `max-values`. */
  maxValuesMessage: { type: Function, default: (max) => `Limit of ${max} tags reached.` },
});

const emit = defineEmits(["update:modelValue"]);

const attrs = useAttrs();

const generatedId = useId();
const messageId = useId();

const inputId = computed(() => attrs.id ?? generatedId);

const draft = ref("");
/** Set when a commit was refused, and cleared as soon as anything is typed. */
const notice = ref("");

const SIZES = new Set(["xs", "sm", "base", "lg"]);
const size = computed(() => (SIZES.has(props.size) ? props.size : "base"));

const shownError = computed(() => props.error || notice.value);

const hasField = computed(() => Boolean(props.label || props.description || shownError.value));

const describedBy = computed(() =>
  shownError.value || props.description ? messageId : undefined,
);

const rootClasses = computed(() => ["kv-input-field", !hasField.value && "kv-input-field--bare"]);

const fieldClasses = computed(() => [
  "kv-input",
  "kv-tag-input",
  `kv-input--size-${size.value}`,
  shownError.value && "kv-input--error",
  props.disabled && "kv-tag-input--disabled",
]);

/** Commits `text`, ignoring blanks and anything already in the list. */
function commit(text) {
  const value = text.trim();
  draft.value = "";
  if (!value || props.modelValue.includes(value)) return;

  if (props.maxValues > 0 && props.modelValue.length >= props.maxValues) {
    notice.value = props.maxValuesMessage(props.maxValues);
    return;
  }
  emit("update:modelValue", [...props.modelValue, value]);
}

function remove(value) {
  notice.value = "";
  emit("update:modelValue", props.modelValue.filter((item) => item !== value));
}

function onKeydown(event) {
  if (!draft.value && event.key === "Backspace") {
    /* Nothing typed, so Backspace is about the chips - take the last one back
       into the field rather than deleting it outright, which is undoable. */
    const last = props.modelValue.at(-1);
    if (last !== undefined) {
      remove(last);
      draft.value = last;
    }
    return;
  }
  if (!draft.value || !["Enter", ",", "Tab"].includes(event.key)) return;
  /* Tab still moves on when the field is empty; here it means "commit". */
  event.preventDefault();
  commit(draft.value);
}

function onPaste(event) {
  const text = event.clipboardData?.getData("text") ?? "";
  if (!text.includes(",") && !text.includes("\n")) return;
  event.preventDefault();
  for (const part of text.split(/[,\n]/)) commit(part);
}

function onInput(event) {
  draft.value = event.target.value;
  notice.value = "";
}
</script>

<template>
  <div :class="rootClasses" data-kumo-component="TagInput">
    <label v-if="label" class="kv-input-field__label" :for="inputId">
      {{ label }}
      <span v-if="required === true" class="kv-input-field__required" aria-hidden="true">*</span>
      <span v-else-if="required === false" class="kv-input-field__optional">(optional)</span>
    </label>

    <div :class="fieldClasses" data-kumo-part="field">
      <span v-for="item in modelValue" :key="item" class="kv-tag-input__chip" data-kumo-part="chip">
        <span class="kv-tag-input__chip-text">{{ item }}</span>
        <Button
          class="kv-tag-input__remove"
          variant="ghost"
          size="xs"
          shape="square"
          type="button"
          :disabled="disabled"
          :aria-label="removeLabel(item)"
          @mousedown.prevent
          @click="remove(item)"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="m4.5 4.5 7 7m0-7-7 7" stroke-linecap="round" />
          </svg>
        </Button>
      </span>

      <input
        v-bind="attrs"
        :id="inputId"
        class="kv-tag-input__input"
        :value="draft"
        :disabled="disabled"
        :placeholder="placeholder"
        :aria-invalid="shownError ? true : undefined"
        :aria-describedby="describedBy"
        data-kumo-part="input"
        @input="onInput"
        @keydown="onKeydown"
        @paste="onPaste"
        @blur="commit(draft)"
      />
    </div>

    <p v-if="shownError" :id="messageId" class="kv-input-field__error" data-kumo-part="error">
      {{ shownError }}
    </p>
    <p v-else-if="description" :id="messageId" class="kv-input-field__description" data-kumo-part="description">
      {{ description }}
    </p>
  </div>
</template>

<style>
/* The field furniture and `.kv-input` itself, which this component wears. */
@import "../shared/field.css";

/*
 * Input's field, grown to fit its contents. The height becomes a floor rather
 * than a fixed value, because the chips wrap and the field has to follow them.
 */
.kv-tag-input {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--kv-space-1-5) var(--kv-space-2);

  block-size: auto;
  min-block-size: var(--kv-input-height);
  padding-inline: var(--kv-space-2);
  padding-block: var(--kv-space-1-5);
  cursor: text;
}

.kv-tag-input:focus-within {
  --kv-input-ring-width: 1.5px;
  --kv-input-ring: color-mix(in oklab, var(--kv-focus) 50%, transparent);
}

.kv-tag-input.kv-input--error:focus-within {
  --kv-input-ring: color-mix(in oklab, var(--kv-danger) 50%, transparent);
}

.kv-tag-input--disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* A chip */

.kv-tag-input__chip {
  display: flex;
  align-items: center;
  flex: none;
  gap: 0.625rem;
  max-inline-size: 100%;

  block-size: 1.5rem;
  padding-inline-start: var(--kv-space-2);
  padding-inline-end: 3px;
  border-radius: var(--kv-radius-sm);

  background-color: var(--kv-surface-overlay);
  box-shadow: 0 0 0 1px var(--kv-hairline);
  color: var(--kv-text-default);
  font-size: var(--kv-text-sm);
}

.kv-tag-input__chip-text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.kv-tag-input__remove.kv-button {
  flex: none;
  color: var(--kv-text-subtle);
}

.kv-tag-input__remove.kv-button:hover {
  color: var(--kv-text-default);
}

.kv-tag-input__remove.kv-button > svg {
  inline-size: 0.625rem;
  block-size: 0.625rem;
}

/* The field */

.kv-tag-input__input {
  flex: 1 1 auto;
  min-inline-size: 8rem;
  padding-inline: var(--kv-space-1);
  padding-block: 0.125rem;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  outline: none;
}

.kv-tag-input__input::placeholder {
  color: var(--kv-text-placeholder);
  opacity: 1;
}
</style>
