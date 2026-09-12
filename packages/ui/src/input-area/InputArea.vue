<!-- Ported from Cloudflare Kumo's InputArea (MIT). See /NOTICE. -->
<script setup>
/**
 * InputArea - a multi-line text field. Input's styling at any height, plus an
 * optional auto-resize that grows the field with what is typed into it.
 *
 *   <InputArea v-model="notes" label="Notes" :rows="4" />
 *
 *   <InputArea v-model="message" label="Message" auto-resize
 *              :min-rows="2" :max-rows="8" />
 *
 * Kumo names this `InputArea` and also exports it as `Textarea`. Only the
 * first name is here: an alias export is a thing a copied component cannot
 * give you anyway.
 */
import { computed, nextTick, ref, useAttrs, useId, watch, watchEffect } from "vue";

import { useAutoResize } from "./useAutoResize.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** The value. Use with `v-model`. */
  modelValue: { type: String, default: undefined },
  /**
   * Padding, radius and type size. The height comes from `rows`.
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
  /** Visible rows, when `auto-resize` is off. */
  rows: { type: Number, default: undefined },
  /** Grows the field to fit its content. */
  autoResize: { type: Boolean, default: false },
  /** Smallest height, in rows, while `auto-resize` is on. */
  minRows: { type: Number, default: 1 },
  /** Largest height, in rows, while `auto-resize` is on. Past it, the field scrolls. */
  maxRows: { type: Number, default: 0 },
});

const emit = defineEmits(["update:modelValue"]);

const attrs = useAttrs();

const generatedId = useId();
const messageId = useId();

/* A caller-supplied id wins, and the label follows it rather than the one
   generated here - otherwise `<InputArea id="bio" />` silently unlabels itself. */
const inputId = computed(() => attrs.id ?? generatedId);

const el = ref(null);

const SIZES = new Set(["xs", "sm", "base", "lg"]);

/** An unknown size falls back to the default, as Kumo's `resolveVariant` does. */
const size = computed(() => (SIZES.has(props.size) ? props.size : "base"));

const variant = computed(() => props.variant ?? (props.error ? "error" : "default"));

const hasField = computed(() => Boolean(props.label || props.description || props.error));

const describedBy = computed(() => (props.error || props.description ? messageId : undefined));

const rootClasses = computed(() => ["kv-input-field", !hasField.value && "kv-input-field--bare"]);

const areaClasses = computed(() => [
  "kv-input",
  "kv-input-area",
  `kv-input--size-${size.value}`,
  variant.value === "error" && "kv-input--error",
  props.autoResize && "kv-input-area--auto",
]);

/* With `auto-resize` on, `rows` is the floor rather than the height - which is
   what makes the first paint the right size, before anything is measured. */
const rowsAttr = computed(() => (props.autoResize ? props.minRows : props.rows));

const { resize } = useAutoResize(el, {
  enabled: () => props.autoResize,
  minRows: () => props.minRows,
  maxRows: () => props.maxRows,
});

/*
 * Kumo re-measures after every commit. Vue re-renders only what changed, so
 * the triggers are named instead: the value, and the props that change the box
 * the text is being measured inside.
 */
watch(
  () => [props.modelValue, size.value, props.minRows, props.maxRows],
  () => nextTick(resize),
);

function onInput(event) {
  /* A field with no `v-model` never re-renders, so its own handler is the only
     thing that can trigger a measure. */
  if (props.modelValue === undefined) resize();
  emit("update:modelValue", event.target.value);
}

/*
 * A field with no name is one a screen reader announces as "edit text" and
 * nothing more. Kumo warns about this in development; so does this.
 */
if (import.meta.env?.DEV) {
  watchEffect(() => {
    if (!props.label && !attrs["aria-label"] && !attrs["aria-labelledby"]) {
      console.warn(
        "[kumo-vue] <InputArea> needs an accessible name: the `label` prop, or " +
          "`aria-label` / `aria-labelledby` when the name is already on the page.",
      );
    }
  });
}

defineExpose({ resize });
</script>

<template>
  <div :class="rootClasses" data-kumo-component="InputArea">
    <label v-if="label" class="kv-input-field__label" :for="inputId">
      {{ label }}
      <span v-if="required === true" class="kv-input-field__required" aria-hidden="true">*</span>
      <span v-else-if="required === false" class="kv-input-field__optional">(optional)</span>
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

    <textarea
      ref="el"
      v-bind="attrs"
      :id="inputId"
      :class="areaClasses"
      :value="modelValue"
      :disabled="disabled"
      :rows="rowsAttr"
      :required="required === true ? true : undefined"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="describedBy"
      data-kumo-part="input"
      @input="onInput"
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
/* The field furniture and `.kv-input` itself, which this component wears. */
@import "../shared/field.css";

/*
 * Everything but the height comes from `.kv-input`, which this element also
 * carries. Kumo does the same - `inputVariants({ size }) + "h-auto py-2"` -
 * so a textarea and an input of the same size agree on radius, ring, type and
 * horizontal padding without either of them restating it.
 */
.kv-input-area {
  block-size: auto;
  padding-block: var(--kv-space-2);
  /* The one thing an input has no opinion about. Vertical only: a textarea
     dragged wider than its container is a layout bug the user cannot undo. */
  resize: vertical;
}

/*
 * With auto-resize on, the height is written by script on every change, so the
 * handle would be fighting it - and the field fills its container, because a
 * measurement against a shrink-to-fit box has nothing stable to measure.
 */
.kv-input-area--auto {
  inline-size: 100%;
  resize: none;
  /* Typing on the last line should not leave the caret under the padding. */
  scroll-padding-block-end: var(--kv-space-2);
}

/* Past `max-rows` the field scrolls, so the scrollbar is part of the design. */
.kv-input-area--auto {
  scrollbar-width: thin;
  scrollbar-color: var(--kv-line) transparent;
}

.kv-input-area--auto::-webkit-scrollbar {
  inline-size: 0.5rem;
  background-color: transparent;
}

.kv-input-area--auto::-webkit-scrollbar-thumb {
  border-radius: 9999px;
  background-color: var(--kv-line);
}

.kv-input-area--auto::-webkit-scrollbar-track {
  margin-block: var(--kv-space-2);
}

.kv-input-area--auto::-webkit-scrollbar-corner {
  background-color: transparent;
}
</style>
