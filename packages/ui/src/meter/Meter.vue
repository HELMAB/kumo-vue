<!-- Ported from Cloudflare Kumo's Meter (MIT). See /NOTICE. -->
<script setup>
/** A bar showing a measured value within a known range, such as quota usage. */
import { computed, useId } from "vue";

const props = defineProps({
  /** The measured value. */
  value: { type: Number, required: true },
  /** Lower bound of the range. */
  min: { type: Number, default: 0 },
  /** Upper bound of the range. */
  max: { type: Number, default: 100 },
  /** Label shown above the track, and the meter's accessible name. */
  label: { type: String, required: true },
  /** Text shown instead of the percentage, such as `"750 / 1,000"`. */
  customValue: { type: String, default: undefined },
  /** Show the value next to the label. */
  showValue: { type: Boolean, default: true },
  /** `Intl.NumberFormat` options for the value. Without them it is a percentage of the range. */
  format: { type: Object, default: undefined },
  /** Locale for formatting the value. */
  locale: { type: String, default: undefined },
  /** Builds the announced value from the formatted one: `(formatted, value) => string`. */
  getAriaValueText: { type: Function, default: undefined },
  /** Extra class for the track. */
  trackClass: { type: [String, Array, Object], default: undefined },
  /** Extra class for the filled indicator. */
  indicatorClass: { type: [String, Array, Object], default: undefined },
});

const labelId = useId();

const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);

const percentage = computed(() => {
  const raw = ((props.value - props.min) * 100) / (props.max - props.min);
  return clamp(Number.isNaN(raw) ? 0 : raw, 0, 100);
});
const clampedValue = computed(() => clamp(Number.isNaN(props.value) ? props.min : props.value, props.min, props.max));

const formattedValue = computed(() =>
  props.format
    ? new Intl.NumberFormat(props.locale, props.format).format(clampedValue.value)
    : new Intl.NumberFormat(props.locale, { style: "percent" }).format(percentage.value / 100),
);
const ariaValueText = computed(() =>
  props.getAriaValueText ? props.getAriaValueText(formattedValue.value, props.value) : formattedValue.value,
);
</script>

<template>
  <div
    class="kv-meter"
    role="meter"
    :aria-labelledby="labelId"
    :aria-valuemax="max"
    :aria-valuemin="min"
    :aria-valuenow="clampedValue"
    :aria-valuetext="ariaValueText"
  >
    <div class="kv-meter__header">
      <span :id="labelId" class="kv-meter__label" role="presentation">{{ label }}</span>
      <span v-if="customValue" class="kv-meter__value">{{ customValue }}</span>
      <span v-else-if="showValue" class="kv-meter__value" aria-hidden="true">{{ formattedValue }}</span>
    </div>
    <div :class="['kv-meter__track', trackClass]">
      <div :class="['kv-meter__indicator', indicatorClass]" :style="{ width: `${percentage}%` }" />
    </div>
    <span class="kv-meter__hidden" role="presentation">x</span>
  </div>
</template>

<style>
.kv-meter {
  display: flex;
  flex-direction: column;
  gap: var(--kv-space-2);
  inline-size: 100%;
}

.kv-meter__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--kv-space-4);
}

.kv-meter__label {
  font-size: var(--kv-text-xs);
  line-height: calc(1 / 0.75);
  color: var(--kv-text-subtle);
}

.kv-meter__value {
  font-size: var(--kv-text-sm);
  line-height: calc(1 / 0.85);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--kv-text-default);
}

.kv-meter__track {
  position: relative;
  overflow: hidden;
  block-size: 0.5rem;
  inline-size: 100%;
  border-radius: var(--kv-radius-full);
  background-color: var(--kv-fill);
}

.kv-meter__indicator {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  border-radius: var(--kv-radius-full);
  background-image: linear-gradient(to right in oklab, var(--kv-meter-fill, var(--kv-brand)) 0%, var(--kv-meter-fill, var(--kv-brand)) 50%, var(--kv-meter-fill, var(--kv-brand)) 100%);
  transition: width 300ms cubic-bezier(0, 0, 0.2, 1);
}

.kv-meter__hidden {
  position: fixed;
  inset-block-start: 0;
  left: 0;
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
</style>
