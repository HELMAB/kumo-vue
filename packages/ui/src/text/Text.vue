<!-- Ported from Cloudflare Kumo's Text (MIT). See /NOTICE. -->
<script setup>
/**
 * Text - typography, in the sizes and weights the design system knows about.
 *
 *   <Text>Body copy.</Text>
 *   <Text variant="heading" size="lg" as="h1">Page title</Text>
 *   <Text variant="secondary" size="sm">Helper text</Text>
 *   <Text variant="mono">console.log("code")</Text>
 *
 * `variant` is presentation and `as` is meaning, and the two are deliberately
 * kept apart: a heading variant renders a `<span>` until you say otherwise, so
 * heading-shaped text never wanders into the document outline by accident.
 */
import { computed, useSlots, watchEffect } from "vue";
import { Primitive } from "reka-ui";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /**
   * Presentation: colour, family and weight.
   *
   * `heading1` `heading2` `heading3` are deprecated upstream and here - use
   * `heading` with a `size` and an `as`.
   * @values heading, body, secondary, success, error, mono, mono-secondary, heading1, heading2, heading3
   */
  variant: { type: String, default: "body" },
  /**
   * Size within the variant. What each step means depends on the variant:
   * copy runs 12 / 13 / 14 / 16px, a heading is 16px or 20px at `lg`, and
   * monospace is 13px or 14px at `lg`.
   * @values xs, sm, base, lg
   */
  size: { type: String, default: "base" },
  /** Heavier weight. Copy variants only, as in Kumo. */
  bold: { type: Boolean, default: false },
  /** Cut overflowing text off with an ellipsis, on one line. */
  truncate: { type: Boolean, default: false },
  /** Element to render. Copy defaults to `p`, everything else to `span`. */
  as: { type: [String, Object], default: undefined },
  /** Render the single child element instead of an element of our own. */
  asChild: { type: Boolean, default: false },
});

const slots = useSlots();

const COPY_VARIANTS = new Set(["body", "secondary", "success", "error"]);
const DEPRECATED_HEADINGS = new Set(["heading1", "heading2", "heading3"]);

/**
 * Elements this is meant to render as. Kumo enforces the list through its prop
 * types; without TypeScript the equivalent is a development-time warning.
 */
const TEXT_ELEMENTS = new Set([
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "span", "label", "dt", "dd", "li",
  "figcaption", "legend", "pre", "code",
  "em", "strong", "small", "abbr", "time",
]);

const isCopy = computed(() => COPY_VARIANTS.has(props.variant));

/*
 * Copy reads as a paragraph; a heading is presentational until `as` says
 * otherwise, and monospace is usually a fragment inside a sentence.
 */
const element = computed(() => {
  if (props.as) return props.as;
  return isCopy.value ? "p" : "span";
});

const classes = computed(() => [
  "kv-text",
  `kv-text--${props.variant}`,
  `kv-text--size-${props.size}`,
  {
    /* The size scale applies to copy alone; the others take their own steps. */
    "kv-text--copy": isCopy.value,
    "kv-text--bold": props.bold && isCopy.value,
    "kv-text--truncate": props.truncate,
  },
]);

if (import.meta.env?.DEV) {
  watchEffect(() => {
    if (DEPRECATED_HEADINGS.has(props.variant)) {
      console.warn(
        `[kumo-vue] Text variant="${props.variant}" is deprecated. ` +
          'Use variant="heading" with an explicit size and as.',
      );
    }

    /* `bold` and a size other than `lg` are meaningless outside copy. */
    if (props.bold && !isCopy.value) {
      console.warn(
        `[kumo-vue] Text bold has no effect on variant="${props.variant}". ` +
          "It applies to body, secondary, success and error.",
      );
    }

    if (typeof props.as === "string" && !TEXT_ELEMENTS.has(props.as)) {
      console.warn(
        `[kumo-vue] Text as="${props.as}" is not a text element. ` +
          `Expected one of: ${[...TEXT_ELEMENTS].join(", ")}.`,
      );
    }

    if (!props.asChild && !slots.default) {
      console.warn("[kumo-vue] Text has no content.");
    }
  });
}
</script>

<template>
  <Primitive
    v-bind="$attrs"
    :as="element"
    :as-child="asChild"
    :class="classes"
    data-kumo-component="Text"
  >
    <slot />
  </Primitive>
</template>

<style>
/*
 * Every rule here is font, colour and flow - no box. Text is the one component
 * that has to sit inside anything without changing its shape.
 */
.kv-text {
  margin: 0;
  font-family: var(--kv-font-sans);
  font-size: var(--kv-text-base);
  font-weight: 400;
  color: var(--kv-text-default);
}

/* Copy */

.kv-text--body {
  color: var(--kv-text-default);
}

.kv-text--secondary {
  color: var(--kv-text-subtle);
}

/*
 * Kumo's `success` text is the link colour, not a green - see the README. The
 * variant is matched rather than corrected; override `--kv-text-link` here, or
 * point this at `--kv-text-success`, if you want the green.
 */
.kv-text--success {
  color: var(--kv-text-link);
}

.kv-text--error {
  color: var(--kv-text-danger);
}

.kv-text--copy {
  /*
   * Kumo inherits the line height at every copy size. That composes nicely and
   * falls back to the browser's `normal` - about 1.2 - when nothing above sets
   * one, which clips Khmer subscripts, Thai vowel marks and Devanagari matras.
   * The scale this project ships is floored at 1.4 for exactly that reason, so
   * copy gets a line height rather than inheriting whatever it lands in.
   */
  line-height: var(--kv-leading-normal);
}

.kv-text--bold {
  font-weight: 500;
}

.kv-text--copy.kv-text--size-xs { font-size: var(--kv-text-xs); }
.kv-text--copy.kv-text--size-sm { font-size: var(--kv-text-sm); }
.kv-text--copy.kv-text--size-base { font-size: var(--kv-text-base); }
.kv-text--copy.kv-text--size-lg { font-size: var(--kv-text-lg); }

/* Headings */

/*
 * A heading takes one of two sizes, and ignores the copy scale: `lg` is the
 * 20px step and anything else is 16px. Kumo does the same, which is why
 * `size="sm"` on a heading is not a smaller heading.
 */
.kv-text--heading {
  font-size: var(--kv-text-lg);
  font-weight: 600;
  line-height: var(--kv-leading-tight);
  color: var(--kv-text-default);
}

.kv-text--heading.kv-text--size-lg {
  font-size: var(--kv-text-xl);
}

/* Deprecated, and fixed at one size each - as upstream. */
.kv-text--heading1,
.kv-text--heading2,
.kv-text--heading3 {
  font-weight: 600;
  line-height: var(--kv-leading-tight);
  color: var(--kv-text-default);
}

.kv-text--heading1 { font-size: var(--kv-text-3xl); }
.kv-text--heading2 { font-size: var(--kv-text-2xl); }
.kv-text--heading3 { font-size: var(--kv-text-lg); }

/* Monospace */

/*
 * A monospace face at the same nominal size reads larger than the sans one
 * beside it, so it is set one step down - Kumo's adjustment, kept.
 */
.kv-text--mono,
.kv-text--mono-secondary {
  font-family: var(--kv-font-mono);
  font-size: var(--kv-text-sm);
  line-height: var(--kv-leading-normal);
}

.kv-text--mono {
  color: var(--kv-text-default);
}

.kv-text--mono-secondary {
  color: var(--kv-text-subtle);
}

.kv-text--mono.kv-text--size-lg,
.kv-text--mono-secondary.kv-text--size-lg {
  font-size: var(--kv-text-base);
}

/* Truncation */

/*
 * `min-inline-size: 0` is what lets this shrink inside a flex or grid parent,
 * whose items refuse to go below their content width without it.
 */
.kv-text--truncate {
  display: block;
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* An inline element cannot be given a size, so truncating one needs a box. */
span.kv-text--truncate,
code.kv-text--truncate,
em.kv-text--truncate,
strong.kv-text--truncate,
small.kv-text--truncate,
abbr.kv-text--truncate,
time.kv-text--truncate,
label.kv-text--truncate {
  display: inline-block;
  max-inline-size: 100%;
  vertical-align: bottom;
}
</style>
