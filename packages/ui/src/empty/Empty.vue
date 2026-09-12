<!-- Ported from Cloudflare Kumo's Empty (MIT). See /NOTICE. -->
<script setup>
/**
 * Empty - the placeholder a list, table or page shows when it has nothing in it.
 *
 *   <Empty title="No results found" description="Try adjusting your search." />
 *
 *   <Empty title="No packages found"
 *          description="Get started by installing your first package."
 *          command-line="npm install @cloudflare/kumo">
 *     <template #icon><PackageIcon /></template>
 *     <Button variant="brand">Browse the registry</Button>
 *   </Empty>
 *
 * `title` and `description` are props rather than slots so they can take
 * translated strings directly, as in Kumo and as in Banner. Kumo's `icon` and
 * `contents` props are the `icon` and default slots here, which is how a Vue
 * caller passes markup.
 */
import { computed, useSlots, watchEffect } from "vue";
import { Primitive } from "reka-ui";

import { ClipboardText } from "../clipboard-text/index.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** Primary heading. Required unless the `title` slot supplies one. */
  title: { type: String, default: "" },
  /** Secondary line below the title. */
  description: { type: String, default: "" },
  /** A shell command, shown in a copyable field. */
  commandLine: { type: String, default: "" },
  /**
   * Padding and the gaps between the rows.
   * @values sm, base, lg
   */
  size: { type: String, default: "base" },
  /**
   * The heading element the title renders as.
   *
   * Kumo hardcodes `h2`. That is right for an empty state filling a page under
   * an `h1` and wrong for one inside a card that is already under an `h3`, so
   * the level is the caller's to set. `p` is there for the case where the
   * placeholder should stay out of the outline entirely.
   * @values h1, h2, h3, h4, h5, h6, p
   */
  titleAs: { type: String, default: "h2" },
  /** Element to render as. */
  as: { type: [String, Object], default: "div" },
  /** Accessible name for the command's copy button. */
  copyLabel: { type: String, default: "Copy command" },
  /** Announced once the command is on the clipboard. */
  copiedLabel: { type: String, default: "Copied" },
});

const emit = defineEmits(["copy"]);

const slots = useSlots();

const SIZES = new Set(["sm", "base", "lg"]);

/** An unknown size falls back to the default, as Kumo's `resolveVariant` does. */
const size = computed(() => (SIZES.has(props.size) ? props.size : "base"));

const classes = computed(() => ["kv-empty", `kv-empty--size-${size.value}`]);

const hasDescription = computed(() => Boolean(props.description || slots.description));

/*
 * The heading is the whole point of the component - it is what tells a screen
 * reader why the region it landed in is blank - so a placeholder without one
 * is a mistake worth saying out loud. Kumo makes `title` required in its prop
 * types; without TypeScript the equivalent is a development-time warning.
 */
if (import.meta.env?.DEV) {
  watchEffect(() => {
    if (!props.title && !slots.title) {
      console.warn(
        "[kumo-vue] <Empty> needs a title, as a prop or as the title slot: " +
          "an empty state with no heading says nothing about why it is empty.",
      );
    }
  });
}
</script>

<template>
  <Primitive
    v-bind="$attrs"
    :as="as"
    :class="classes"
    data-kumo-component="Empty"
  >
    <!-- Decorative: the heading below it already carries the meaning. -->
    <span v-if="$slots.icon" class="kv-empty__icon" aria-hidden="true">
      <slot name="icon" />
    </span>

    <component :is="titleAs" class="kv-empty__title" data-kumo-part="title">
      <slot name="title">{{ title }}</slot>
    </component>

    <p v-if="hasDescription" class="kv-empty__description" data-kumo-part="description">
      <slot name="description">{{ description }}</slot>
    </p>

    <!--
      The command is a ClipboardText wearing Kumo's Empty styling. Upstream
      inlines a second copy button here; this one already has the secure-context
      fallback and the announcement, so the styling is all that is left to do.
    -->
    <ClipboardText
      v-if="commandLine"
      class="kv-empty__command"
      data-kumo-part="command"
      :text="commandLine"
      :copy-label="copyLabel"
      :copied-label="copiedLabel"
      @copy="emit('copy', $event)"
    />

    <div v-if="$slots.default" class="kv-empty__actions" data-kumo-part="actions">
      <slot />
    </div>
  </Primitive>
</template>

<style>
/*
 * A centred column on a control surface inside a card border, at Kumo's three
 * paddings. Logical properties throughout, so it needs no second stylesheet
 * under `dir="rtl"`.
 */
.kv-empty {
  --kv-empty-padding-inline: var(--kv-space-10);
  --kv-empty-padding-block: var(--kv-space-16);
  --kv-empty-gap: var(--kv-space-6);

  display: flex;
  box-sizing: border-box;
  inline-size: 100%;
  flex-direction: column;
  align-items: center;
  gap: var(--kv-empty-gap);

  padding-inline: var(--kv-empty-padding-inline);
  padding-block: var(--kv-empty-padding-block);

  background-color: var(--kv-surface-control);
  color: var(--kv-text-default);
  border: 1px solid var(--kv-fill);
  border-radius: var(--kv-radius-xl);

  font-family: var(--kv-font-sans);
  font-size: var(--kv-text-base);
  line-height: var(--kv-leading-normal);
}

/* Sizes. `base` is set above; these are the other two. */

.kv-empty--size-sm {
  --kv-empty-padding-inline: var(--kv-space-6);
  --kv-empty-padding-block: var(--kv-space-8);
  --kv-empty-gap: var(--kv-space-4);
}

.kv-empty--size-lg {
  --kv-empty-padding-inline: var(--kv-space-12);
  --kv-empty-padding-block: var(--kv-space-20);
  --kv-empty-gap: var(--kv-space-8);
}

/* The icon */

.kv-empty__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--kv-text-inactive);
}

/*
 * Kumo's demos pass a 48px icon and rely on the caller to size it. An SVG with
 * no dimensions of its own would otherwise render at whatever the UA decides,
 * so one is given here - and only where the caller has not already said.
 */
.kv-empty__icon > svg:not([width]) {
  inline-size: 3rem;
  block-size: 3rem;
}

/* The heading */

.kv-empty__title {
  margin: 0;
  font-size: var(--kv-text-2xl);
  font-weight: 600;
  /* Snug for a short heading; still clears stacked diacritics. */
  line-height: var(--kv-leading-tight);
  text-align: center;
  /* The element varies with `titleAs`; the appearance must not. */
  color: var(--kv-text-default);
}

/* The description */

.kv-empty__description {
  margin: 0;
  /* Kumo's `max-w-140`: a measure that keeps the line readable in a wide
     container, rather than running the full width of the card. */
  max-inline-size: 35rem;
  color: var(--kv-text-subtle);
  text-align: center;
}

/* The command */

/*
 * Compound with `.kv-clipboard-text` throughout: every declaration here
 * overrides one that component sets on itself, and matching its specificity
 * would leave the winner up to whichever stylesheet the bundler emitted first.
 */
.kv-empty__command.kv-clipboard-text {
  /* A ClipboardText on its own fills its container; centred in this column it
     already shrinks to its content, so all that is needed is a ceiling. */
  max-inline-size: 80%;

  background-color: var(--kv-surface-overlay);
  box-shadow:
    0 0 0 1px var(--kv-fill),
    0 1px 2px 0 var(--kv-shadow-drop);
  transition:
    box-shadow 300ms ease,
    background-color 300ms ease;
}

.kv-empty__command.kv-clipboard-text:hover {
  box-shadow:
    0 0 0 1px var(--kv-interact),
    0 4px 6px -1px var(--kv-shadow-elevated),
    0 2px 4px -2px var(--kv-shadow-elevated);
}

@media (prefers-reduced-motion: reduce) {
  .kv-empty__command.kv-clipboard-text {
    transition: none;
  }
}

/*
 * The shell prompt, as an item of the field rather than generated content
 * inside the value. Upstream's Empty makes it a sibling of the command for a
 * reason that only shows up once the command can scroll: a prompt that lives
 * inside the scrolling box scrolls out of the field with it. Still generated
 * content, so still outside the copied string and outside a selection - which
 * is what Kumo's `select-none` span buys, without the span.
 */
.kv-empty__command.kv-clipboard-text::before {
  content: "$";
  flex: none;
  padding-inline-start: var(--kv-space-3);
  font-size: var(--kv-text-xs);
  line-height: 1;
  color: var(--kv-text-inactive);
}

/* The command reads as a command: Kumo colours it with the brand hue. */
.kv-empty__command .kv-clipboard-text__value {
  /* The prompt now carries the field's leading padding; this is the gap
     between the two, which is Kumo's `gap-2`. */
  padding-inline-start: var(--kv-space-2);
  /* Kumo runs the command a step larger than the field's own type. */
  font-size: var(--kv-text-base);
  color: var(--kv-text-brand);

  /*
   * A long command scrolls rather than being cut off. ClipboardText truncates,
   * which is right for a field showing a value you only need to recognise and
   * wrong for one showing a command you need to read: the tail of
   * `npm install @scope/package` is the part that matters, and an ellipsis
   * puts it out of reach of a mouse as well as of the eye. `clip` because a
   * scrolled tail must not also be elided.
   */
  overflow-x: auto;
  overflow-y: hidden;
  text-overflow: clip;
  /* Upstream's `no-scrollbar`: the field is 2.5rem tall and a scrollbar inside
     it would sit on the command. The content still scrolls by wheel, trackpad,
     touch and keyboard. */
  scrollbar-width: none;
}

.kv-empty__command .kv-clipboard-text__value::-webkit-scrollbar {
  display: none;
}

/* No rule between the command and its button; the field is one piece here. */
.kv-empty__command .kv-clipboard-text__copy.kv-button {
  border-inline-start: 0;
  padding-inline: var(--kv-space-2);
  color: var(--kv-text-inactive);
}

.kv-empty__command .kv-clipboard-text__copy.kv-button:hover {
  color: var(--kv-text-brand);
}

/*
 * The confirmation tick, in the success colour. ClipboardText leaves the tick
 * the button's own colour, as its upstream does; that works there and not here,
 * because the rule above repaints the button inactive - so the one moment the
 * field has something to say would look exactly like every moment before it.
 * Kumo's Empty colours its tick `text-kumo-success` for the same reason.
 *
 * Set on the icon rather than the button so it holds through the hover rule
 * above: an inherited colour never beats a declared one.
 */
.kv-empty__command .kv-clipboard-text__icon--check {
  color: var(--kv-text-success);
}

/* Actions */

.kv-empty__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--kv-space-3);
}
</style>
