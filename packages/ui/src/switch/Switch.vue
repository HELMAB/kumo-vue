<!-- Ported from Cloudflare Kumo's Switch (MIT). See /NOTICE. -->
<script setup>
/**
 * Switch - an on/off control that takes effect immediately.
 *
 *   <Switch v-model="enabled" label="Enable caching" />
 *
 * Use it where a Checkbox would need a Save button. Kumo's own rule: a switch
 * applies as soon as it is flipped, a checkbox is part of a form you submit.
 */
import { computed, useAttrs, useId, watchEffect } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** Whether it is on. Use with `v-model`. */
  modelValue: { type: Boolean, default: false },
  /**
   * Track and thumb size.
   * @values sm, base, lg
   */
  size: { type: String, default: "base" },
  /**
   * `brand` is the filled treatment; `neutral` is the quiet one, for a switch
   * that should not pull the eye in a long list of settings.
   * @values brand, neutral
   */
  variant: { type: String, default: "brand" },
  /** Renders a label beside the switch and wires it up. */
  label: { type: String, default: "" },
  /** Helper text below the row. */
  description: { type: String, default: "" },
  /** Puts the switch before the label, for a settings list read right-aligned. */
  controlFirst: { type: Boolean, default: false },
  /** Disables the control. */
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue"]);

const attrs = useAttrs();

const generatedId = useId();
const descriptionId = useId();

const controlId = computed(() => attrs.id ?? generatedId);

const SIZES = new Set(["sm", "base", "lg"]);
const VARIANTS = new Set(["brand", "neutral"]);

/** An unknown value falls back to the default, as Kumo's `resolveVariant` does. */
const size = computed(() => (SIZES.has(props.size) ? props.size : "base"));
const variant = computed(() => (VARIANTS.has(props.variant) ? props.variant : "brand"));

const trackClasses = computed(() => [
  "kv-switch__track",
  `kv-switch__track--size-${size.value}`,
  `kv-switch__track--${variant.value}`,
]);

function toggle() {
  if (props.disabled) return;
  emit("update:modelValue", !props.modelValue);
}

if (import.meta.env?.DEV) {
  watchEffect(() => {
    if (!props.label && !attrs["aria-label"] && !attrs["aria-labelledby"]) {
      console.warn(
        "[kumo-vue] <Switch> needs an accessible name: the `label` prop, or " +
          "`aria-label` / `aria-labelledby` when the name is already on the page.",
      );
    }
  });
}
</script>

<template>
  <div
    class="kv-switch"
    :class="[controlFirst && 'kv-switch--control-first', !label && 'kv-switch--bare']"
    data-kumo-component="Switch"
  >
    <button
      v-bind="attrs"
      :id="controlId"
      type="button"
      role="switch"
      :class="trackClasses"
      :aria-checked="modelValue"
      :aria-describedby="description ? descriptionId : undefined"
      :disabled="disabled"
      data-kumo-part="track"
      :data-state="modelValue ? 'checked' : 'unchecked'"
      @click="toggle"
    >
      <span class="kv-switch__thumb" data-kumo-part="thumb" />
    </button>

    <label v-if="label" class="kv-switch__label" :for="controlId">{{ label }}</label>

    <p v-if="description" :id="descriptionId" class="kv-switch__description" data-kumo-part="description">
      {{ description }}
    </p>
  </div>
</template>

<style>
/*
 * A two-column grid: the control, then the label, with the description under
 * both. `control-first` swaps the columns rather than the writing direction,
 * so the row still reads correctly under `dir="rtl"`.
 */
.kv-switch {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: var(--kv-space-2);
  font-family: var(--kv-font-sans);
}

.kv-switch--bare {
  display: inline-grid;
  grid-template-columns: auto;
}

.kv-switch--control-first .kv-switch__track {
  order: 2;
}

.kv-switch--control-first .kv-switch__label {
  order: 1;
}

.kv-switch__label {
  font-size: var(--kv-text-base);
  font-weight: 500;
  line-height: var(--kv-leading-normal);
  color: var(--kv-text-default);
  cursor: pointer;
  user-select: none;
}

.kv-switch__description {
  grid-column: 1 / -1;
  margin: 0;
  font-size: var(--kv-text-sm);
  line-height: 1.4;
  color: var(--kv-text-subtle);
}

/* The track */

.kv-switch__track {
  --kv-switch-block: 1.125rem;
  --kv-switch-inline: 2.25rem;
  --kv-switch-travel: 1.125rem;

  position: relative;
  display: inline-flex;
  align-items: center;
  flex: none;
  box-sizing: border-box;

  block-size: var(--kv-switch-block);
  inline-size: var(--kv-switch-inline);
  padding: 0;
  border: 0;

  /*
   * Kumo asks for a squircle and falls back to a 5px radius. `corner-shape` is
   * new enough that the fallback is what most people will see, so both are
   * here, in that order.
   */
  border-radius: 5px;
  background-color: var(--kv-fill);
  box-shadow: 0 0 0 1px var(--kv-interact);

  cursor: pointer;
  transition:
    background-color 150ms ease-out,
    box-shadow 150ms ease-out;
}

@supports (corner-shape: squircle) {
  .kv-switch__track,
  .kv-switch__thumb {
    border-radius: 10px;
    corner-shape: squircle;
  }
}

/* Sizes. `base` is set above; these are the other two. */

.kv-switch__track--size-sm {
  --kv-switch-block: 1rem;
  --kv-switch-inline: 2rem;
  --kv-switch-travel: 1rem;
}

.kv-switch__track--size-lg {
  --kv-switch-block: 1.25rem;
  --kv-switch-inline: 2.5rem;
  --kv-switch-travel: 1.25rem;
}

/* On */

.kv-switch__track--brand[data-state="checked"] {
  background-color: var(--kv-brand);
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--kv-brand) 80%, black);
}

.kv-switch__track--neutral[data-state="checked"] {
  background-color: var(--kv-line-strong);
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--kv-line-strong) 80%, black);
}

.kv-switch__track--neutral {
  background-color: var(--kv-surface-recessed);
  box-shadow: 0 0 0 1px var(--kv-hairline);
}

.kv-switch__track:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--kv-brand);
}

.kv-switch__track:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* The thumb */

.kv-switch__thumb {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  inline-size: var(--kv-switch-block);
  border-radius: 5px;
  background-color: var(--kv-surface-base);
  box-shadow:
    0 0 1px 0.5px var(--kv-shadow-edge),
    0 1px 2px var(--kv-shadow-drop);
  transition: translate 150ms ease-out;
}

/*
 * `translate` rather than Kumo's `left`, so the thumb moves on the compositor
 * and mirrors itself under `dir="rtl"` without a second rule.
 */
.kv-switch__track[data-state="checked"] .kv-switch__thumb {
  translate: var(--kv-switch-travel) 0;
}

[dir="rtl"] .kv-switch__track[data-state="checked"] .kv-switch__thumb {
  translate: calc(var(--kv-switch-travel) * -1) 0;
}

@media (prefers-reduced-motion: reduce) {
  .kv-switch__track,
  .kv-switch__thumb {
    transition: none;
  }
}
</style>
