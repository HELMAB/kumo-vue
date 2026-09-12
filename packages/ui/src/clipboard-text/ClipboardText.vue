<!-- Ported from Cloudflare Kumo's ClipboardText (MIT). See /NOTICE. -->
<script setup>
/**
 * ClipboardText - a read-only field with a one-click copy button.
 *
 *   <ClipboardText text="0c239dd2" />
 *   <ClipboardText text="sk_live_***********" text-to-copy="sk_live_51H8_abc123" />
 *   <ClipboardText text="npx kumo-vue add button" tooltip size="sm" />
 *
 * The value shown is the value copied, unless `textToCopy` says otherwise -
 * which is how a masked secret is displayed without masking what lands on the
 * clipboard.
 *
 * Ported from Cloudflare Kumo's React ClipboardText. The size scale, the
 * `text` / `textToCopy` split and the 1.5s confirmation are Kumo's; see the
 * README for where the two deliberately differ.
 */
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import {
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from "reka-ui";

import { Button } from "../button/index.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** The value to show, and - unless `textToCopy` says otherwise - to copy. */
  text: { type: String, required: true },
  /** Copied in place of `text`. For a masked secret shown as asterisks. */
  textToCopy: { type: String, default: undefined },
  /**
   * Field height and type size. Kumo's default is the largest of the three.
   * @values sm, base, lg
   */
  size: { type: String, default: "lg" },
  /**
   * The bubble over the button: `Copy` on hover, the confirmation on click.
   *
   * `tooltip` on its own takes the defaults, a string sets the hover text, and
   * an object `{ text, copiedText, side }` sets all three. Off by default, as
   * it is upstream.
   */
  tooltip: { type: [Boolean, String, Object], default: false },
  /** Accessible name for the copy button. */
  copyLabel: { type: String, default: "Copy to clipboard" },
  /** Announced once the value is on the clipboard, and shown in the bubble. */
  copiedLabel: { type: String, default: "Copied" },
  /**
   * Writing direction for the bubble. Leave unset and it follows the direction
   * where the field was written, which is not what it would inherit from the
   * portal.
   * @values ltr, rtl
   */
  dir: { type: String, default: undefined },
  /** Where the bubble is portalled to. */
  to: { type: [String, Object], default: "body" },
});

const emit = defineEmits(["copy"]);

/** How long the tick, the bubble and the announcement stay up. Kumo's. */
const COPIED_FEEDBACK_MS = 1500;

/*
 * Base UI opens a tooltip after 600ms; Reka's provider waits 700. The shorter
 * one is upstream's, and on a control whose whole job is one click it is the
 * one that feels right.
 */
const HOVER_DELAY_MS = 600;

const SIZES = new Set(["sm", "base", "lg"]);

/** An unknown size falls back to the default, as Kumo's `resolveVariant` does. */
const size = computed(() => (SIZES.has(props.size) ? props.size : "lg"));

const classes = computed(() => ["kv-clipboard-text", `kv-clipboard-text--${size.value}`]);

/*
 * The bubble. `tooltip` is both the switch and the configuration: absent, there
 * is no bubble at all and the tick in the button is the only confirmation.
 */
const tooltipConfig = computed(() => {
  const value = props.tooltip;
  if (!value) return null;

  const given = typeof value === "string" ? { text: value } : value === true ? {} : value;

  return {
    text: given.text ?? "Copy",
    copiedText: given.copiedText ?? props.copiedLabel,
    side: given.side ?? "top",
  };
});

const hasTooltip = computed(() => tooltipConfig.value !== null);

/* Copy state */

const copied = ref(false);

/**
 * Counts confirmations rather than recording one. Clicking a second time while
 * the bubble is still up has nothing to animate - the text has not changed -
 * so the label is keyed on this and re-created, which replays the bump. Kumo
 * keys its toast on an update counter for the same reason.
 */
const bump = ref(0);

let resetTimer;

onUnmounted(() => clearTimeout(resetTimer));

/**
 * `navigator.clipboard` needs a secure context, which an app served over plain
 * HTTP - a LAN preview, an internal tool behind a proxy - does not have. Kumo
 * keeps the deprecated `execCommand` path for exactly that case, and puts the
 * user's own selection back afterwards; both are carried over here.
 */
async function writeToClipboard(value) {
  if (typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function") {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("No clipboard available");
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  /* Off the side of the page rather than hidden: what is not rendered cannot
     be selected, and `execCommand` copies the selection. */
  textarea.style.position = "absolute";
  textarea.style.insetInlineStart = "-9999px";
  document.body.append(textarea);

  const selection = document.getSelection();
  const previous = selection?.rangeCount ? selection.getRangeAt(0) : null;

  textarea.select();
  try {
    document.execCommand("copy");
  } finally {
    textarea.remove();
    if (previous) {
      selection.removeAllRanges();
      selection.addRange(previous);
    }
  }
}

async function copy() {
  const value = props.textToCopy ?? props.text;

  try {
    await writeToClipboard(value);
  } catch (error) {
    /* A denied permission or a missing clipboard is not the page's fault and
       not worth throwing over; Kumo warns and carries on. */
    console.warn("[kumo-vue] Clipboard copy failed", error);
    return;
  }

  copied.value = true;
  bump.value += 1;

  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    copied.value = false;
  }, COPIED_FEEDBACK_MS);

  emit("copy", value);
}

/* The bubble's open state */

/*
 * Reka drives a tooltip from the pointer and the keyboard; the confirmation
 * has to outlast both, so the two are held apart and the bubble is open when
 * either wants it. A click no longer closes it - `disableClosingTrigger` -
 * which is the same cancellation Kumo makes on Base UI's `trigger-press`.
 */
const hovered = ref(false);
const bubbleOpen = computed(() => hasTooltip.value && (copied.value || hovered.value));
const bubbleText = computed(() =>
  copied.value ? tooltipConfig.value?.copiedText : tooltipConfig.value?.text,
);

/* Direction through the portal */

/*
 * A portalled bubble hangs off the body, so a writing direction set on part of
 * the page never reaches it. The direction is read from the field, where the
 * bubble was written, and carried across - the same crossing Dialog makes.
 */
const rootRef = ref();
const resolvedDir = ref(props.dir);

function readDir() {
  if (props.dir) {
    resolvedDir.value = props.dir;
    return;
  }

  const anchor = rootRef.value;
  if (!anchor?.closest) return;

  /*
   * The nearest `dir` attribute answers first - it is how HTML says to set
   * direction, and it survives environments with no cascade to compute. A CSS
   * `direction`, or a `dir="auto"` only the browser can resolve, falls through
   * to the computed value.
   */
  const declared = anchor.closest("[dir]")?.getAttribute("dir");
  resolvedDir.value =
    declared === "rtl" || declared === "ltr" ? declared : getComputedStyle(anchor).direction;
}

onMounted(readDir);
watch(() => props.dir, readDir);
</script>

<template>
  <div
    ref="rootRef"
    v-bind="$attrs"
    :class="classes"
    data-kumo-component="ClipboardText"
  >
    <span class="kv-clipboard-text__value" data-kumo-part="text">{{ text }}</span>

    <TooltipProvider :delay-duration="HOVER_DELAY_MS" disable-hoverable-content>
      <TooltipRoot
        :open="bubbleOpen"
        :disabled="!hasTooltip"
        disable-closing-trigger
        @update:open="hovered = $event"
      >
        <TooltipTrigger as-child>
          <Button
            class="kv-clipboard-text__copy"
            data-kumo-part="copy"
            variant="ghost"
            :size="size"
            :aria-label="copyLabel"
            @click="copy"
          >
            <!--
              Exactly one icon is in flow at a time: the other is taken out of
              it and slid past the button's clipped edge, so the two swap
              without the button changing width. Kumo's arrangement.
            -->
            <span
              class="kv-clipboard-text__icon kv-clipboard-text__icon--check"
              :data-state="copied ? 'in' : 'out'"
              aria-hidden="true"
            >
              <svg viewBox="0 0 16 16" fill="none" focusable="false">
                <path
                  d="m3 8.5 3.5 3.5L13 5"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>

            <span
              class="kv-clipboard-text__icon kv-clipboard-text__icon--copy"
              :data-state="copied ? 'out' : 'in'"
              aria-hidden="true"
            >
              <svg viewBox="0 0 16 16" fill="none" focusable="false">
                <rect
                  x="5.75"
                  y="5.75"
                  width="8.5"
                  height="8.5"
                  rx="2"
                  stroke="currentColor"
                  stroke-width="1.5"
                />
                <path
                  d="M10.25 5.5v-1.5a2 2 0 0 0-2-2h-4.5a2 2 0 0 0-2 2v4.5a2 2 0 0 0 2 2h1.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </span>
          </Button>
        </TooltipTrigger>

        <TooltipPortal v-if="hasTooltip" :to="to">
          <TooltipContent
            class="kv-clipboard-text__bubble"
            data-kumo-part="bubble"
            :side="tooltipConfig.side"
            :side-offset="8"
            :collision-padding="8"
            :dir="resolvedDir"
            :data-copied="copied || undefined"
            :aria-label="tooltipConfig.text"
          >
            <span :key="bump" class="kv-clipboard-text__bubble-label">{{ bubbleText }}</span>
          </TooltipContent>
        </TooltipPortal>
      </TooltipRoot>
    </TooltipProvider>

    <!--
      The tick is the confirmation for anyone who can see it. This is the same
      confirmation for anyone who cannot. It stays a live region rather than
      renaming the button, which would announce the change twice for a keyboard
      user sitting on it.
    -->
    <span class="kv-clipboard-text__status" role="status" aria-live="polite">
      {{ copied ? copiedLabel : "" }}
    </span>
  </div>
</template>

<style>
/*
 * The field is Kumo's Input at the matching size with its padding removed and
 * the page surface behind it, which is how upstream builds this. Logical
 * properties throughout, so the value and the button swap ends under
 * `dir="rtl"` with no second stylesheet.
 */
.kv-clipboard-text {
  --kv-clipboard-text-height: 2.5rem;
  --kv-clipboard-text-radius: var(--kv-radius-lg);
  --kv-clipboard-text-font-size: var(--kv-text-sm);

  display: flex;
  align-items: center;
  overflow: hidden;

  /* The ring is drawn inside the box, so the field must measure that way -
     which it gets from Tailwind's preflight upstream, and nothing here
     assumes a preflight is loaded. */
  box-sizing: border-box;
  block-size: var(--kv-clipboard-text-height);

  background-color: var(--kv-surface-base);
  color: var(--kv-text-default);
  border: 0;
  border-radius: var(--kv-clipboard-text-radius);
  box-shadow: 0 0 0 1px var(--kv-line);

  font-family: var(--kv-font-mono);
  font-size: var(--kv-clipboard-text-font-size);
  line-height: var(--kv-leading-normal);
}

/* Sizes. `lg` is the default above; these are the other two. */

.kv-clipboard-text--sm {
  --kv-clipboard-text-height: 1.625rem;
  --kv-clipboard-text-radius: var(--kv-radius-md);
  --kv-clipboard-text-font-size: var(--kv-text-xs);
}

.kv-clipboard-text--base {
  --kv-clipboard-text-height: 2.25rem;
}

/* The value */

.kv-clipboard-text__value {
  flex-grow: 1;
  /* A flex item will not shrink below its content without this, so a long
     value would stretch the field instead of being cut off inside it. */
  min-inline-size: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding-inline-start: var(--kv-space-4);
  padding-inline-end: var(--kv-space-2);
}

/* The copy button */

/*
 * Compound with `.kv-button` on purpose: every declaration here overrides one
 * the Button sets on itself, and matching its specificity would leave which
 * one wins up to whichever stylesheet a bundler happened to emit first.
 */
.kv-clipboard-text__copy.kv-button {
  position: relative;
  isolation: isolate;
  /* The icons slide in and out through this edge. */
  overflow: hidden;
  flex-shrink: 0;

  /* The field and the button at the same size are the same height already;
     this holds if the height is overridden. */
  block-size: 100%;
  padding-inline: var(--kv-space-3);

  /* Square where it meets the value, and the field's own curve on the outside
     - `inherit` takes that from the field, so it stays right at every size. */
  border-radius: 0;
  border-start-end-radius: inherit;
  border-end-end-radius: inherit;
  border-inline-start: 1px solid var(--kv-line);
}

/* The field clips, so the ring is drawn inside the button rather than around it. */
.kv-clipboard-text__copy.kv-button:focus-visible {
  outline-offset: -2px;
}

/* Icons */

.kv-clipboard-text__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 200ms ease,
    opacity 200ms ease;
}

.kv-clipboard-text__icon > svg {
  flex: none;
  inline-size: 1em;
  block-size: 1em;
}

/*
 * The icon on its way out leaves the flow, so the one arriving sets the
 * button's width on its own and the two never sit side by side.
 */
.kv-clipboard-text__icon[data-state="out"] {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
}

/* The tick rises into place; the copy icon leaves upwards. Vertical, so there
   is nothing to mirror in RTL. */
.kv-clipboard-text__icon--check[data-state="out"] {
  transform: translateY(100%);
}

.kv-clipboard-text__icon--copy[data-state="out"] {
  transform: translateY(-100%);
}

@media (prefers-reduced-motion: reduce) {
  .kv-clipboard-text__icon {
    transition: none;
  }
}

/* The announcement */

.kv-clipboard-text__status {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* The bubble */

/*
 * Portalled, so this is not scoped to the component's element - as with every
 * other popup in this library.
 */
.kv-clipboard-text__bubble {
  z-index: 50;
  /* A label, never a target: it must not swallow a click meant for the button
     it is sitting over. */
  pointer-events: none;
  box-sizing: border-box;

  padding-block: var(--kv-space-1-5);
  padding-inline: var(--kv-space-3);

  background-color: var(--kv-surface-base);
  color: var(--kv-text-default);
  border-radius: var(--kv-radius-md);
  box-shadow:
    0 0 0 1px var(--kv-line),
    0 4px 6px -1px var(--kv-shadow-elevated),
    0 2px 4px -2px var(--kv-shadow-elevated);

  /* The field is monospace; the label about it is not. It is portalled away
     from the field, but says so rather than relying on where it landed. */
  font-family: var(--kv-font-sans);
  font-size: var(--kv-text-xs);
  line-height: var(--kv-leading-normal);
  white-space: nowrap;
}

/*
 * The bubble grows out of the button it is anchored to, so the direction
 * depends on which side it landed on - which is only known once Reka has
 * placed it, and is written onto the element as `data-side`.
 */
.kv-clipboard-text__bubble {
  --kv-clipboard-text-slide-x: 0;
  --kv-clipboard-text-slide-y: 0;
}

.kv-clipboard-text__bubble[data-side="bottom"] { --kv-clipboard-text-slide-y: -0.25rem; }
.kv-clipboard-text__bubble[data-side="top"] { --kv-clipboard-text-slide-y: 0.25rem; }
.kv-clipboard-text__bubble[data-side="left"] { --kv-clipboard-text-slide-x: 0.25rem; }
.kv-clipboard-text__bubble[data-side="right"] { --kv-clipboard-text-slide-x: -0.25rem; }

.kv-clipboard-text__bubble[data-state="instant-open"],
.kv-clipboard-text__bubble[data-state="delayed-open"] {
  animation: kv-clipboard-text-in 120ms ease;
}

.kv-clipboard-text__bubble[data-state="closed"] {
  animation: kv-clipboard-text-out 100ms ease;
}

@keyframes kv-clipboard-text-in {
  from {
    opacity: 0;
    transform: translate(var(--kv-clipboard-text-slide-x), var(--kv-clipboard-text-slide-y))
      scale(0.96);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes kv-clipboard-text-out {
  from {
    opacity: 1;
    transform: none;
  }
  to {
    opacity: 0;
    transform: scale(0.96);
  }
}

/*
 * Confirming a copy that is already being confirmed changes nothing on screen,
 * so the label is re-created and pops instead. Kumo's curve and timing.
 */
.kv-clipboard-text__bubble[data-copied] .kv-clipboard-text__bubble-label {
  display: block;
  transform-origin: center;
  animation: kv-clipboard-text-bump 350ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes kv-clipboard-text-bump {
  0% { transform: scale(1); }
  35% { transform: scale(1.04); }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .kv-clipboard-text__bubble[data-state],
  .kv-clipboard-text__bubble[data-copied] .kv-clipboard-text__bubble-label {
    animation: none;
  }
}
</style>
