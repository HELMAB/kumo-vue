<!-- Ported from Cloudflare Kumo's Label (MIT). See /NOTICE. -->
<script setup>
/**
 * Label - the text that names a form control, with the two decorations Kumo
 * puts beside it: an "(optional)" marker and an informational tooltip.
 *
 *   <Label for="email">Email</Label>
 *   <Label show-optional>Middle name</Label>
 *   <Label tooltip="We use this to send you receipts">Email</Label>
 *
 * Input, InputArea, InputGroup and Select render their own label from a
 * `label` prop; this is the standalone one, for a control that has no such
 * prop - a native `<input type="file">`, a third-party widget, a group of
 * radios under a shared heading.
 */
import { computed, useSlots } from "vue";
import { Primitive } from "reka-ui";

import { Button } from "../button/index.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** Text, when the default slot is not used. */
  text: { type: String, default: "" },
  /** Appends a subdued "(optional)" after the label. */
  showOptional: { type: Boolean, default: false },
  /** The id of the control this labels. Ignored when `as-content`. */
  for: { type: String, default: undefined },
  /**
   * Explanatory text, shown on an info button beside the label.
   *
   * Kumo renders this in its Tooltip. There is no Tooltip component here yet,
   * so it is the native `title` attribute - the same stand-in Button makes for
   * the same reason, and the same one-line change when Tooltip lands.
   */
  tooltip: { type: String, default: "" },
  /** Accessible name for the info button. */
  tooltipLabel: { type: String, default: "More information" },
  /**
   * Renders the decorations without a `<label>` of its own, for use inside a
   * label that already carries the type styling.
   */
  asContent: { type: Boolean, default: false },
  /** Element to render as. Ignored when `as-content`. */
  as: { type: [String, Object], default: "label" },
  /** Text for the optional marker. */
  optionalText: { type: String, default: "(optional)" },
});

const slots = useSlots();

const classes = computed(() => [
  "kv-label",
  props.asContent && "kv-label--content",
]);

const hasText = computed(() => Boolean(props.text || slots.default));
</script>

<template>
  <Primitive
    v-bind="$attrs"
    :as="asContent ? 'span' : as"
    :for="asContent ? undefined : props.for"
    :class="classes"
    data-kumo-component="Label"
  >
    <slot>{{ text }}</slot>

    <span v-if="showOptional" class="kv-label__optional" data-kumo-part="optional">
      {{ optionalText }}
    </span>

    <!--
      `title` rather than a bubble, per the note on the prop. It is still a
      button and not a bare icon, so the text is reachable by keyboard focus
      as well as by hover.
    -->
    <Button
      v-if="tooltip"
      class="kv-label__info"
      data-kumo-part="tooltip"
      variant="ghost"
      size="xs"
      shape="square"
      :title="tooltip"
      :aria-label="tooltipLabel"
      type="button"
    >
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <circle cx="8" cy="8" r="6.25" />
        <path d="M8 7.25v4" stroke-linecap="round" />
        <circle cx="8" cy="4.9" r=".85" fill="currentColor" stroke="none" />
      </svg>
    </Button>
  </Primitive>
</template>

<style>
/*
 * Kumo splits this in two: `labelVariants` carries the type and only applies
 * standalone, `labelContentVariants` carries the inline layout and always
 * applies. One class with a modifier for the content-only case says the same
 * thing without a second class name in the markup.
 */
.kv-label {
  display: inline-flex;
  align-items: center;
  gap: var(--kv-space-1);

  margin: 0;
  font-family: var(--kv-font-sans);
  font-size: var(--kv-text-base);
  font-weight: 500;
  line-height: var(--kv-leading-normal);
  color: var(--kv-text-default);
  /* A double-click on a label should select the field's text, not the name
     of the field. Kumo's Field sets `select-none` for the same reason. */
  user-select: none;
}

/* Inside a label that already sets the type, only the layout is wanted. */
.kv-label--content {
  font: inherit;
  color: inherit;
}

.kv-label__optional {
  font-weight: 400;
  color: var(--kv-text-subtle);
}

/*
 * The info button sits on the text baseline row, so it must not stretch the
 * line. Kumo gets this from the button being `size-5` inside an items-center
 * flex row; the same, written as a rule the Button cannot override.
 */
.kv-label__info.kv-button {
  flex: none;
  color: var(--kv-text-subtle);
}

.kv-label__info.kv-button:hover {
  color: var(--kv-text-default);
}

.kv-label__info.kv-button > svg {
  inline-size: 1rem;
  block-size: 1rem;
}
</style>
