<!-- Ported from Cloudflare Kumo's Collapsible (MIT). See /NOTICE. -->
<script setup>
/**
 * Collapsible - a disclosure: a label that shows and hides the content below it.
 *
 *   <Collapsible title="What is Kumo?">
 *     <Text>Kumo is Cloudflare's design system.</Text>
 *   </Collapsible>
 *
 *   <Collapsible v-model:open="open" variant="plain">
 *     <template #trigger="{ open }">
 *       <Button variant="secondary" size="sm">{{ open ? "Hide" : "Show" }} details</Button>
 *     </template>
 *     <p>Whatever you like, styled however you like.</p>
 *   </Collapsible>
 *
 * Built on Reka UI's Collapsible primitive, the counterpart to the Base UI one
 * Kumo builds on: it owns the button semantics on the trigger, the measured
 * height the panel animates to, and keeping the panel findable by the browser's
 * own find-in-page when `keepMounted` is set.
 *
 * Kumo composes five components - `.Root`, `.Trigger`, `.Panel` and the
 * pre-styled `.DefaultTrigger` and `.DefaultPanel`. Here those are one
 * component: the default styling is what you get, the `trigger` slot replaces
 * the trigger, and `variant="plain"` strips the panel back. The same
 * flattening Dialog and Dropdown make.
 */
import { computed, onMounted, ref } from "vue";
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from "reka-ui";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** Controlled open state. Leave unset to let the component manage it. */
  open: { type: Boolean, default: undefined },
  /** Open state on first render, for the uncontrolled case. */
  defaultOpen: { type: Boolean, default: false },
  /** Label for the default trigger. Ignored when the `trigger` slot is used. */
  title: { type: String, default: "" },
  /**
   * Panel presentation. `default` is Kumo's accented panel; `plain` strips the
   * rule, the spacing and the rhythm between children, leaving the animation.
   * @values default, plain
   */
  variant: { type: String, default: "default" },
  /** Refuses to open, and marks the trigger disabled. */
  disabled: { type: Boolean, default: false },
  /**
   * Keeps the content in the DOM while closed, so what is inside it - a
   * half-filled form, a scroll position - survives being hidden.
   */
  keepMounted: { type: Boolean, default: false },
});

const emit = defineEmits(["update:open"]);

/*
 * Reka's Collapsible is controlled through `open` alone, so the state lives
 * here: a controlled `open` prop wins, and without one the disclosure keeps
 * its own - the same arrangement Dropdown makes.
 */
const uncontrolledOpen = ref(props.defaultOpen);
const isOpen = computed(() => props.open ?? uncontrolledOpen.value);

function setOpen(value) {
  uncontrolledOpen.value = value;
  emit("update:open", value);
}

/** Handed to the slots, so a control inside the panel can close it. */
function toggle() {
  if (props.disabled) return;
  setOpen(!isOpen.value);
}

/*
 * Reka gives the panel its id when the panel first renders, which is after the
 * trigger has already rendered pointing `aria-controls` at an id that does not
 * exist yet - an empty IDREF, which is invalid, and which nothing corrects
 * until something re-renders the trigger. Reading the id back once and binding
 * it ourselves fixes it: a fall-through attribute wins over the primitive's
 * own, and before it is read the attribute is absent rather than empty.
 */
const panelRef = ref();
const panelId = ref();

onMounted(() => {
  panelId.value = panelRef.value?.$el?.id || undefined;
});

const classes = computed(() => ["kv-collapsible", `kv-collapsible--${props.variant}`]);
</script>

<template>
  <CollapsibleRoot
    v-bind="$attrs"
    :class="classes"
    data-kumo-component="Collapsible"
    :open="isOpen"
    :disabled="disabled"
    :unmount-on-hide="!keepMounted"
    @update:open="setOpen"
  >
    <!--
      The slot replaces the trigger rather than filling it, which is what
      Kumo's `<Collapsible.Trigger render={<Button />}>` does. Reka puts the
      button semantics - `aria-expanded`, `aria-controls`, the toggle - onto
      whatever comes out of it.
    -->
    <CollapsibleTrigger v-if="$slots.trigger" as-child :aria-controls="panelId">
      <slot name="trigger" :open="isOpen" :toggle="toggle" />
    </CollapsibleTrigger>

    <CollapsibleTrigger
      v-else
      class="kv-collapsible__trigger"
      data-kumo-part="trigger"
      :aria-controls="panelId"
    >
      <span class="kv-collapsible__label">
        <slot name="title" :open="isOpen">{{ title }}</slot>
      </span>

      <span class="kv-collapsible__caret" aria-hidden="true">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" focusable="false">
          <path d="m4 6.5 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    </CollapsibleTrigger>

    <CollapsibleContent ref="panelRef" class="kv-collapsible__panel" data-kumo-part="panel">
      <!--
        The panel clips and animates its height; the content sits in a box of
        its own, so the margins and padding that give it room are measured as
        part of that height rather than collapsing out of it. Kumo's split.
      -->
      <div class="kv-collapsible__body">
        <slot :open="isOpen" :toggle="toggle" />
      </div>
    </CollapsibleContent>
  </CollapsibleRoot>
</template>

<style>
/*
 * Logical properties throughout, so the accent rule sits on the reading side
 * and the panel mirrors under `dir="rtl"` with no second stylesheet.
 */

/* Trigger */

.kv-collapsible__trigger {
  /*
   * Kumo calls these defensive resets, and they are: a page's own `button`
   * styles would otherwise reach in and put a border and a background around
   * what is meant to read as a heading.
   */
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
  appearance: none;

  display: flex;
  align-items: center;
  gap: var(--kv-space-1);

  color: var(--kv-text-default);
  font-family: inherit;
  font-size: var(--kv-text-base);
  font-weight: 500;
  line-height: var(--kv-leading-normal);
  cursor: pointer;
  user-select: none;
}

/*
 * Kumo leaves the browser's own focus ring here. This is the ring every other
 * control in this library draws, so a disclosure focused from the keyboard
 * looks like everything else focused from the keyboard.
 */
.kv-collapsible__trigger:focus-visible {
  outline: 2px solid var(--kv-brand);
  outline-offset: 2px;
  border-radius: var(--kv-radius-sm);
}

.kv-collapsible__trigger:disabled {
  cursor: not-allowed;
  color: var(--kv-text-subtle);
  opacity: 0.5;
}

.kv-collapsible__caret {
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  inline-size: 1rem;
}

/*
 * The caret turns over rather than around, so there is nothing to mirror in
 * RTL - which is why it points down rather than along the reading direction.
 */
.kv-collapsible__caret > svg {
  inline-size: 0.75rem;
  block-size: 0.75rem;
  transform-origin: center;
  transition: transform 100ms ease-out;
}

.kv-collapsible__trigger[data-state="open"] .kv-collapsible__caret > svg {
  transform: rotate(180deg);
}

/* Panel */

/*
 * Reka measures the content and writes the height onto the panel as
 * `--reka-collapsible-content-height`, which is the only way to animate to a
 * height the stylesheet cannot know. It has to be an animation rather than a
 * transition: the panel is removed once it has closed, and what Reka waits for
 * before removing it is the animation ending.
 */
.kv-collapsible__panel {
  overflow: hidden;
}

.kv-collapsible__panel[data-state="open"] {
  animation: kv-collapsible-open 100ms ease-out;
}

.kv-collapsible__panel[data-state="closed"] {
  animation: kv-collapsible-close 100ms ease-out;
}

@keyframes kv-collapsible-open {
  from {
    block-size: 0;
    opacity: 0;
  }
  to {
    block-size: var(--reka-collapsible-content-height);
    opacity: 1;
  }
}

@keyframes kv-collapsible-close {
  from {
    block-size: var(--reka-collapsible-content-height);
    opacity: 1;
  }
  to {
    block-size: 0;
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .kv-collapsible__panel[data-state="open"],
  .kv-collapsible__panel[data-state="closed"] {
    animation: none;
  }

  .kv-collapsible__caret > svg {
    transition: none;
  }
}

/* Body */

/*
 * The accent rule and the room around it. The padding is not decoration: the
 * panel clips, and without it a focus ring on the first or last control inside
 * would be cut off by the edge it is animating against.
 */
.kv-collapsible--default .kv-collapsible__body {
  margin-block: var(--kv-space-2);
  padding-block: var(--kv-space-1);
  padding-inline-start: var(--kv-space-4);
  padding-inline-end: var(--kv-space-1);
  border-inline-start: 2px solid var(--kv-fill);
}

/* Kumo's `space-y-4`: rhythm between the children, nothing above the first. */
.kv-collapsible--default .kv-collapsible__body > * + * {
  margin-block-start: var(--kv-space-4);
}
</style>
