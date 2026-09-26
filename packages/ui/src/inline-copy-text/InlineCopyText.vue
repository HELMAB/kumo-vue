<!-- Ported from Cloudflare Kumo's InlineCopyText (MIT). See /NOTICE. -->
<script setup>
/**
 * Compact, borderless copy control for IDs and other short values shown inline
 * or in dense table cells. The icon appears on hover, focus, or a hovered `.group` ancestor.
 */
import { Text as TextNode, computed, onUnmounted, ref, useAttrs, useSlots } from "vue";
import { Text } from "../text/index.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** The value to copy. Required when the content is not plain text. */
  value: { type: String, default: undefined },
  /**
   * Text variant of the content. Heading variants are not supported.
   * @values mono-secondary, mono, body, secondary, success, error
   */
  variant: { type: String, default: "mono-secondary" },
  /**
   * Text size. Monospace variants only take `lg`.
   * @values xs, sm, base, lg
   */
  size: { type: String, default: undefined },
  /** Heavier weight. Copy variants only. */
  bold: { type: Boolean, default: false },
  /** Cut overflowing text off with an ellipsis. */
  truncate: { type: Boolean, default: true },
  /** Element the content renders as. */
  as: { type: String, default: "span" },
  /** Accessible labels, for localisation: `{ copyAction, copied }`. */
  labels: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["copy"]);
const attrs = useAttrs();
const slots = useSlots();

const COPIED_FEEDBACK_MS = 1500;

const copied = ref(false);
let resetTimer = null;
onUnmounted(() => clearTimeout(resetTimer));

const copyAction = computed(() => props.labels.copyAction ?? "Copy to clipboard");
const copiedLabel = computed(() => props.labels.copied ?? "Copied");
const isMono = computed(() => props.variant === "mono" || props.variant === "mono-secondary");

const buttonAttrs = computed(() => {
  const { onClick, ...rest } = attrs;
  return rest;
});

let valueToCopy = "";
const Content = () => {
  const nodes = slots.default?.() ?? [];
  if (props.value !== undefined) valueToCopy = props.value;
  else if (nodes.every((node) => node.type === TextNode)) valueToCopy = nodes.map((node) => node.children).join("").trim();
  else throw new Error("InlineCopyText requires a value prop when its content is not a string.");
  return nodes;
};

async function copy(text) {
  clearTimeout(resetTimer);
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    resetTimer = setTimeout(() => {
      copied.value = false;
      resetTimer = null;
    }, COPIED_FEEDBACK_MS);
    emit("copy");
  } catch (error) {
    copied.value = false;
    console.warn("Clipboard copy failed", error);
  }
}

function onClick(event) {
  [attrs.onClick].flat().forEach((handler) => handler?.(event));
  if (!event.defaultPrevented) copy(valueToCopy);
}
</script>

<template>
  <button
    v-bind="buttonAttrs"
    type="button"
    class="kv-inline-copy-text"
    data-kumo-component="InlineCopyText"
    :aria-label="copied ? copiedLabel : copyAction"
    @click="onClick"
  >
    <Text
      :as="as"
      :variant="variant"
      :size="isMono ? (size === 'lg' ? 'lg' : undefined) : size"
      :bold="!isMono && bold"
      :truncate="truncate"
      class="kv-inline-copy-text__text"
    >
      <Content />
    </Text>
    <svg
      v-if="copied"
      class="kv-inline-copy-text__icon"
      viewBox="0 0 256 256"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
    </svg>
    <svg
      v-else
      class="kv-inline-copy-text__icon kv-inline-copy-text__icon--copy"
      viewBox="0 0 256 256"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M184,64H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H184a8,8,0,0,0,8-8V72A8,8,0,0,0,184,64Zm-8,144H48V80H176ZM224,40V184a8,8,0,0,1-16,0V48H72a8,8,0,0,1,0-16H216A8,8,0,0,1,224,40Z" />
    </svg>
    <span class="kv-inline-copy-text__status" aria-live="polite">{{ copied ? copiedLabel : "" }}</span>
  </button>
</template>

<style>
.kv-inline-copy-text {
  display: flex;
  align-items: center;
  gap: var(--kv-space-1);
  min-inline-size: 0;
  max-inline-size: 100%;
  padding: 0;
  border: 0;
  border-radius: 0.125rem;
  background-color: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.kv-inline-copy-text:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--kv-brand);
}

.kv-inline-copy-text:focus-visible .kv-text--mono-secondary {
  color: var(--kv-text-default);
}

.kv-inline-copy-text__icon {
  flex-shrink: 0;
  inline-size: 14px;
  block-size: 14px;
}

.kv-inline-copy-text__icon--copy {
  opacity: 0;
  transition: opacity 100ms cubic-bezier(0.4, 0, 0.2, 1);
}

.kv-inline-copy-text:focus-visible .kv-inline-copy-text__icon--copy,
.group:focus-within .kv-inline-copy-text__icon--copy {
  opacity: 1;
}

@media (hover: hover) {
  .kv-inline-copy-text:hover .kv-text--mono-secondary {
    color: var(--kv-text-default);
  }

  .kv-inline-copy-text:hover .kv-inline-copy-text__icon--copy,
  .group:hover .kv-inline-copy-text__icon--copy {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .kv-inline-copy-text__icon--copy {
    transition: none;
  }
}

.kv-inline-copy-text__status {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
