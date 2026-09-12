<!-- Ported from Cloudflare Kumo's InputGroup (MIT). See /NOTICE. -->
<script setup>
/**
 * InputGroup - an input with things attached to it: icons, a static suffix,
 * inline buttons, or a row of buttons beside it.
 *
 *   <InputGroup label="Email">
 *     <InputGroupAddon><MailIcon /></InputGroupAddon>
 *     <InputGroupInput v-model="email" placeholder="you@example.com" />
 *   </InputGroup>
 *
 *   <InputGroup>
 *     <InputGroupInput v-model="name" placeholder="my-worker" />
 *     <InputGroupSuffix>.workers.dev</InputGroupSuffix>
 *   </InputGroup>
 *
 * How the group draws its focus follows from what is put inside it - see
 * `detectFocusMode`. Kumo reads its children's `displayName`; this reads the
 * vnodes' component names, which is the same trick in Vue's terms.
 */
import { computed, useId, useSlots } from "vue";

import { detectFocusMode, partition, provideInputGroup } from "./context.js";
import { Zone } from "./zone.js";

const props = defineProps({
  /**
   * Height, padding, radius and type size. Kumo declares a second size scale
   * for the group and never reads it; the one that reaches the DOM is Input's,
   * so that is the one here.
   * @values xs, sm, base, lg
   */
  size: { type: String, default: "base" },
  /** Renders a label above the group and wires it to the input. */
  label: { type: String, default: "" },
  /** Explanatory text, shown on an info button beside the label. */
  labelTooltip: { type: String, default: "" },
  /** Helper text below the group. */
  description: { type: String, default: "" },
  /** Error message. Replaces the description and marks the input invalid. */
  error: { type: String, default: "" },
  /**
   * `true` marks the field required; `false` labels it "(optional)", as Kumo
   * does. Left unset, neither is shown.
   */
  required: { type: Boolean, default: undefined },
  /** Disables every control in the group. */
  disabled: { type: Boolean, default: false },
  /**
   * Overrides what the children imply. Rarely needed - reach for it when the
   * parts are behind a `v-if` that has not resolved on first render.
   * @values container, individual, hybrid
   */
  focusMode: { type: String, default: undefined },
});

const slots = useSlots();

const generatedId = useId();
const messageId = useId();

const SIZES = new Set(["xs", "sm", "base", "lg"]);

/** An unknown size falls back to the default, as Kumo's `resolveVariant` does. */
const size = computed(() => (SIZES.has(props.size) ? props.size : "base"));

const children = computed(() => slots.default?.() ?? []);

const focusMode = computed(() => props.focusMode ?? detectFocusMode(children.value));

const zones = computed(() => partition(children.value));

const hasField = computed(() => Boolean(props.label || props.description || props.error));

const describedBy = computed(() => (props.error || props.description ? messageId : undefined));

provideInputGroup({
  size,
  disabled: computed(() => props.disabled),
  error: computed(() => props.error),
  inputId: generatedId,
  describedBy,
  focusMode,
});

const rootClasses = computed(() => ["kv-input-field", !hasField.value && "kv-input-field--bare"]);

const groupClasses = computed(() => [
  "kv-input-group",
  `kv-input-group--size-${size.value}`,
  `kv-input-group--${focusMode.value}`,
  props.error && "kv-input-group--error",
  props.disabled && "kv-input-group--disabled",
]);
</script>

<template>
  <div :class="rootClasses" data-kumo-component="InputGroup">
    <label v-if="label" class="kv-input-field__label" :for="generatedId">
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

    <!--
      Hybrid splits the row: the addon and the input share one ring inside the
      zone, the buttons stay separate beside it.
    -->
    <div
      v-if="focusMode === 'hybrid'"
      :class="groupClasses"
      data-kumo-part="group"
      :data-disabled="disabled ? '' : undefined"
    >
      <div class="kv-input-group__zone" data-kumo-part="zone">
        <Zone :nodes="zones.container" />
      </div>
      <Zone :nodes="zones.individual" />
    </div>

    <!--
      Everywhere else the group is one row. It is a `<label>` only when there is
      no label above: two labels for one control is invalid, and the browser
      propagates a label's `:hover` to its first labelable descendant, which
      would light up the wrong button in a toolbar.
    -->
    <component
      :is="hasField || focusMode === 'individual' ? 'div' : 'label'"
      v-else
      :class="groupClasses"
      data-kumo-part="group"
      :for="hasField || focusMode === 'individual' ? undefined : generatedId"
      :data-disabled="disabled ? '' : undefined"
    >
      <slot />
    </component>

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
 * The row. Kumo builds it from `inputVariants({ size })` - the same height,
 * radius, surface and ring as a bare Input - then zeroes the horizontal
 * padding and hands spacing to the children, which is what lets an addon sit
 * flush inside the ring.
 *
 * The per-size values are custom properties rather than repeated rules,
 * because four of them are read by four different child components.
 */
.kv-input-group {
  --kv-ig-height: 2.25rem;
  --kv-ig-radius: var(--kv-radius-lg);
  --kv-ig-font-size: var(--kv-text-base);
  --kv-ig-input-pad: var(--kv-space-3);
  --kv-ig-addon-pad: var(--kv-space-2);
  --kv-ig-addon-button-pad: var(--kv-space-1);
  --kv-ig-seam: var(--kv-space-2);
  --kv-ig-suffix-pad: var(--kv-space-3);
  --kv-ig-icon: 1.125rem;
  --kv-ig-ring: var(--kv-line);
  --kv-ig-ring-width: 1px;

  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 0;

  block-size: var(--kv-ig-height);
  padding: 0;
  border: 0;
  border-radius: var(--kv-ig-radius);

  background-color: var(--kv-surface-control);
  color: var(--kv-text-default);
  font-family: var(--kv-font-sans);
  font-size: var(--kv-ig-font-size);
  line-height: var(--kv-leading-normal);

  /* Clicking the padding either side of the text should put the caret in it. */
  cursor: text;
}

/* Sizes. `base` is set above; these are the other three. */

.kv-input-group--size-xs {
  --kv-ig-height: 1.25rem;
  --kv-ig-radius: var(--kv-radius-sm);
  --kv-ig-font-size: var(--kv-text-xs);
  --kv-ig-input-pad: var(--kv-space-1-5);
  --kv-ig-addon-pad: var(--kv-space-1-5);
  --kv-ig-addon-button-pad: var(--kv-space-1);
  --kv-ig-seam: var(--kv-space-1);
  --kv-ig-suffix-pad: var(--kv-space-1-5);
  --kv-ig-icon: 0.625rem;
}

.kv-input-group--size-sm {
  --kv-ig-height: 1.625rem;
  --kv-ig-radius: var(--kv-radius-md);
  --kv-ig-font-size: var(--kv-text-xs);
  --kv-ig-input-pad: var(--kv-space-2);
  --kv-ig-addon-pad: var(--kv-space-1-5);
  --kv-ig-addon-button-pad: var(--kv-space-1);
  --kv-ig-seam: var(--kv-space-1-5);
  --kv-ig-suffix-pad: var(--kv-space-2);
  --kv-ig-icon: 0.8125rem;
}

.kv-input-group--size-lg {
  --kv-ig-height: 2.5rem;
  --kv-ig-input-pad: var(--kv-space-4);
  --kv-ig-addon-pad: 0.625rem;
  --kv-ig-addon-button-pad: var(--kv-space-1-5);
  --kv-ig-seam: 0.625rem;
  --kv-ig-suffix-pad: var(--kv-space-4);
  --kv-ig-icon: 1.25rem;
}

/*
 * Container: one ring around the whole row, and the corners clip whatever the
 * children paint so an addon's background cannot square them off.
 */
.kv-input-group--container,
.kv-input-group__zone {
  overflow: hidden;
  box-shadow: 0 0 0 var(--kv-ig-ring-width) var(--kv-ig-ring);
  transition: box-shadow 150ms ease;
}

.kv-input-group--container:focus-within,
.kv-input-group__zone:focus-within {
  --kv-ig-ring-width: 1.5px;
  --kv-ig-ring: color-mix(in oklab, var(--kv-focus) 50%, transparent);
}

/*
 * Individual: this is a toolbar, not a field. The row paints nothing; each
 * child draws its own border and they butt against each other.
 *
 * `isolate` keeps the children's z-index from escaping into the page.
 */
.kv-input-group--individual,
.kv-input-group--hybrid {
  isolate: isolate;
  isolation: isolate;
  overflow: visible;
  background-color: transparent;
  box-shadow: none;
}

/* The shared-ring half of a hybrid row. */
.kv-input-group__zone {
  display: flex;
  align-items: center;
  min-inline-size: 0;
  flex: 1 1 auto;
  block-size: 100%;
  border-radius: inherit;
  background-color: var(--kv-surface-control);
}

/* Error and disabled */

/*
 * Kumo drives this off `:has(input[aria-invalid=true])` so an input marked
 * invalid by a form library turns the ring red without the group being told.
 * The class covers the group's own `error` prop, and both are kept.
 */
.kv-input-group--error,
.kv-input-group:has(input[aria-invalid="true"]),
.kv-input-group__zone:has(input[aria-invalid="true"]) {
  --kv-ig-ring: var(--kv-danger);
}

.kv-input-group--disabled {
  pointer-events: none;
  opacity: 0.5;
}

/* The input */

.kv-input-group__input {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  min-inline-size: 0;
  flex: 1 1 auto;
  block-size: 100%;

  padding-inline: var(--kv-ig-input-pad);
  padding-block: 0;
  border: 0;
  border-radius: 0;
  background-color: transparent;
  color: inherit;

  font-family: inherit;
  font-size: inherit;
  line-height: inherit;

  /* The row owns the ring; an input drawing its own would double it. */
  box-shadow: none;
  outline: none;
  /* Too long to fit is elided rather than widening the row. */
  text-overflow: ellipsis;
  /* Above the invisible click-to-focus label, so the caret and selection work. */
  position: relative;
  z-index: 1;
}

.kv-input-group__input::placeholder {
  color: var(--kv-text-placeholder);
  opacity: 1;
}

/* An addon takes the padding on its side, so the input gives that side back. */
.kv-input-group:has(.kv-input-group__addon--start) .kv-input-group__input {
  padding-inline-start: var(--kv-ig-seam);
}

.kv-input-group:has(.kv-input-group__addon--end) .kv-input-group__input {
  padding-inline-end: var(--kv-ig-seam);
}

/*
 * With a suffix the input shrinks to what has been typed, so the suffix reads
 * as a continuation of the value rather than sitting at the far end of the row.
 * `field-sizing` is what Kumo uses and is Chromium-only; the fallback is an
 * input that simply does not grow, which keeps the two adjacent either way.
 */
.kv-input-group:has(.kv-input-group__suffix) .kv-input-group__input {
  field-sizing: content;
  flex-grow: 0;
  max-inline-size: 100%;
  padding-inline-end: 0;
}

/*
 * Individual mode: the input carries its own border - and its own surface.
 * The row went transparent so the children could paint their own edges, which
 * leaves the input showing the page behind it unless it says otherwise.
 */
.kv-input-group__input--individual {
  border: 1px solid var(--kv-line);
  box-shadow: none;
  background-color: var(--kv-surface-control);
  border-start-start-radius: var(--kv-ig-radius);
  border-end-start-radius: var(--kv-ig-radius);
}

.kv-input-group__input--individual:not(:first-child) {
  margin-inline-start: -1px;
}

.kv-input-group__input--individual:last-child {
  border-start-end-radius: var(--kv-ig-radius);
  border-end-end-radius: var(--kv-ig-radius);
}

.kv-input-group__input--individual:focus {
  z-index: 2;
  border-color: color-mix(in oklab, var(--kv-focus) 50%, transparent);
}

/* The addon */

.kv-input-group__addon {
  display: flex;
  align-items: center;
  gap: var(--kv-space-1-5);
  flex: none;
  position: relative;
  z-index: 1;

  block-size: 100%;
  color: var(--kv-text-subtle);
  font-size: var(--kv-ig-font-size);

  /*
   * The addon itself is not a click target - clicking it should focus the
   * input behind it, as clicking the row's padding does - but anything
   * interactive put inside it is.
   */
  pointer-events: none;
}

.kv-input-group__addon > * {
  pointer-events: auto;
}

.kv-input-group__addon--start {
  order: -1;
  padding-inline-start: var(--kv-ig-addon-pad);
  padding-inline-end: 0;
}

.kv-input-group__addon--end {
  order: 1;
  padding-inline-start: 0;
  padding-inline-end: var(--kv-ig-addon-pad);
}

/* A button inside an addon sits closer to the edge than an icon does. */
.kv-input-group__addon--start:has(.kv-input-group__button) {
  padding-inline-start: var(--kv-ig-addon-button-pad);
}

.kv-input-group__addon--end:has(.kv-input-group__button) {
  padding-inline-end: var(--kv-ig-addon-button-pad);
}

/*
 * Upstream clones each icon child with an explicit pixel size. A slot cannot
 * be cloned, so the size is a rule instead - and only where the caller has not
 * already said, which is the same escape hatch Kumo's clone leaves.
 */
.kv-input-group__addon > svg:not([width]) {
  inline-size: var(--kv-ig-icon);
  block-size: var(--kv-ig-icon);
  flex: none;
}

/* The suffix */

.kv-input-group__suffix {
  display: flex;
  align-items: center;
  min-inline-size: 0;
  flex: 1 1 auto;
  padding-inline-end: var(--kv-ig-suffix-pad);
  color: var(--kv-text-subtle);
  font-size: var(--kv-ig-font-size);
  pointer-events: none;
  user-select: none;
}

.kv-input-group__suffix-text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* The buttons */

/* Inline: inside the ring, so it must not paint one of its own. */
.kv-input-group__button--inline.kv-button {
  box-shadow: none;
  position: relative;
  z-index: 1;
}

/*
 * Attached: beside the field, sharing an edge with it. A negative margin
 * rather than a dropped border, so the border is still there to paint when the
 * button takes focus.
 */
.kv-input-group__button--attached.kv-button {
  position: relative;
  flex: none;
  block-size: 100%;
  border-radius: 0;
  box-shadow: none;
  border: 1px solid var(--kv-line);
}

.kv-input-group__button--attached.kv-button:not(:first-child) {
  margin-inline-start: -1px;
}

.kv-input-group__button--attached.kv-button:first-child {
  border-start-start-radius: var(--kv-ig-radius);
  border-end-start-radius: var(--kv-ig-radius);
}

.kv-input-group__button--attached.kv-button:last-child {
  border-start-end-radius: var(--kv-ig-radius);
  border-end-end-radius: var(--kv-ig-radius);
}

.kv-input-group__button--attached.kv-button:hover {
  z-index: 1;
}

.kv-input-group__button--attached.kv-button:focus-visible {
  z-index: 2;
  border-color: color-mix(in oklab, var(--kv-focus) 50%, transparent);
}

/* The zone is a sibling of the attached buttons and plays by the same rules. */
.kv-input-group--hybrid .kv-input-group__zone:not(:first-child) {
  margin-inline-start: -1px;
}

.kv-input-group--hybrid .kv-input-group__zone:focus-within {
  z-index: 2;
}

@media (prefers-reduced-motion: reduce) {
  .kv-input-group--container,
  .kv-input-group__zone {
    transition: none;
  }
}
</style>
