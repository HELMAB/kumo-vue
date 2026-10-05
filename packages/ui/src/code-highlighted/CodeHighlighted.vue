<!-- Ported from Cloudflare Kumo's CodeHighlighted (MIT). See /NOTICE. -->
<script setup>
/** Syntax-highlighted code from the nearest `ShikiProvider`; plain text while Shiki loads, so nothing shifts. */
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { Button } from "../button/index.js";
import { useShikiHighlighter } from "./context.js";

const props = defineProps({
  code: { type: String, required: true },
  /** A language name or alias that the provider loaded. */
  lang: { type: String, required: true },
  /**
   * `plain` drops the border, background and padding, for code inside another surface.
   * @values default, plain
   */
  variant: { type: String, default: "default" },
  showLineNumbers: { type: Boolean, default: false },
  /** Lines to emphasise, 1-indexed. */
  highlightLines: { type: Array, default: undefined },
  showCopyButton: { type: Boolean, default: false },
  /** Overrides the provider's `{ copy, copied }` for this block. */
  labels: { type: Object, default: undefined },
});

const { highlight, isLoading, error, labels: providerLabels } = useShikiHighlighter();
const labels = computed(() => ({ ...providerLabels.value, ...props.labels }));

const html = computed(() => {
  const output = isLoading.value ? null : highlight(props.code, props.lang);
  if (!output || !props.highlightLines?.length) return output;
  const lines = new Set(props.highlightLines);
  let line = 0;
  return output.replace(/<span class="line">/g, () => (lines.has(++line) ? '<span class="line line-highlighted">' : '<span class="line">'));
});

const lineCount = computed(() => props.code.split("\n").length);
const isSingleLine = computed(() => lineCount.value === 1);
const showNumbers = computed(() => props.showLineNumbers && !isSingleLine.value);
const isPlain = computed(() => props.variant === "plain");

watch(error, (value) => value && console.error("[kumo-vue CodeHighlighted] Shiki initialization error:", value), { immediate: true });

const copied = ref(false);
let resetTimer;

async function copy() {
  clearTimeout(resetTimer);
  try {
    await navigator.clipboard.writeText(props.code);
    copied.value = true;
    resetTimer = setTimeout(() => (copied.value = false), 2000);
  } catch (caught) {
    copied.value = false;
    console.error("[kumo-vue CodeHighlighted] Failed to copy to clipboard:", caught);
  }
}

onBeforeUnmount(() => clearTimeout(resetTimer));
</script>

<template>
  <div
    class="kv-code"
    :class="{ 'kv-code--plain': isPlain, 'kv-code--inline-copy': showCopyButton && isSingleLine }"
    data-kumo-component="CodeHighlighted"
  >
    <div :class="showNumbers ? 'kv-code__numbered' : 'kv-code__scroll'">
      <div v-if="showNumbers" class="kv-code__line-numbers" aria-hidden="true">
        <div v-for="n in lineCount" :key="n">{{ n }}</div>
      </div>
      <div v-if="html" :class="showNumbers && 'kv-code__scroll kv-code__scroll--numbered'">
        <!-- eslint-disable-next-line vue/no-v-html -- Shiki output escapes the code it is given -->
        <div class="kv-code__shiki" v-html="html" />
      </div>
      <pre v-else class="kv-code__fallback"><code>{{ code }}</code></pre>
    </div>

    <div
      v-if="showCopyButton"
      class="kv-code__copy"
      :class="{ 'kv-code__copy--inline': isSingleLine, 'kv-code__copy--shown': copied }"
    >
      <Button variant="secondary" size="sm" :aria-label="copied ? labels.copied : labels.copy" @click="copy">
        {{ copied ? labels.copied : labels.copy }}
      </Button>
    </div>
  </div>
</template>

<style>
.kv-code {
  --kv-code-padding: var(--kv-space-4);
  --kumo-code-highlight-bg: rgb(0 0 0 / 0.05);

  position: relative;
  box-sizing: border-box;
  inline-size: 100%;
  min-inline-size: 0;
  margin: 0;
  padding: 0;
  border: 1px solid var(--kv-fill);
  border-radius: var(--kv-radius-md);
  background-color: var(--kv-surface-base);
}

.kv-code--plain {
  --kv-code-padding: 0;

  border: 0;
  border-radius: 0;
  background-color: transparent;
}

.kv-code--inline-copy {
  display: flex;
  align-items: center;
}

.kv-code__scroll {
  overflow-x: auto;
}

.kv-code--inline-copy > .kv-code__scroll {
  flex: 1;
  min-inline-size: 0;
}

.kv-code__numbered {
  display: flex;
  inline-size: 100%;
}

.kv-code__scroll--numbered {
  flex: 1;
  min-inline-size: 0;
}

.kv-code__line-numbers {
  flex-shrink: 0;
  padding-block: var(--kv-code-padding);
  padding-inline: 0.75rem var(--kv-space-4);
  font-family: var(--kv-font-mono);
  font-size: var(--kv-text-sm);
  line-height: 1.625;
  text-align: end;
  opacity: 0.4;
  user-select: none;
}

.kv-code__fallback,
.kv-code__shiki > pre {
  margin: 0;
  padding: var(--kv-code-padding);
  border: 0;
  border-radius: 0;
  background-color: transparent !important;
  font-family: var(--kv-font-mono);
  font-size: var(--kv-text-sm);
  line-height: 1.625;
}

.kv-code__fallback {
  flex: 1;
  min-inline-size: 0;
  overflow-x: auto;
  color: var(--kv-text-subtle);
}

.kv-code__fallback > code {
  margin: 0;
  padding: 0;
}

.kv-code__shiki code {
  display: block;
  inline-size: fit-content;
  box-sizing: border-box;
  min-inline-size: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
}

.kv-code__shiki .line.line-highlighted {
  display: inline-block;
  box-sizing: border-box;
  inline-size: calc(100% + 2rem);
  margin-inline: -1rem;
  padding-inline: 1rem;
  background-color: var(--kumo-code-highlight-bg);
}

.kv-code--plain .kv-code__shiki .line.line-highlighted {
  inline-size: 100%;
  margin: 0;
  padding-inline: 0;
}

.kv-code__copy {
  position: absolute;
  inset-block-start: var(--kv-space-2);
  inset-inline-end: var(--kv-space-2);
  opacity: 0;
  transition: opacity 150ms ease;
}

.kv-code--plain .kv-code__copy {
  inset-block-start: 0;
  inset-inline-end: 0;
}

.kv-code .kv-code__copy--inline {
  position: static;
  flex-shrink: 0;
  padding-inline: var(--kv-space-2);
}

.kv-code:hover .kv-code__copy,
.kv-code__copy:focus-within,
.kv-code__copy--shown {
  opacity: 1;
}

.kv-code__copy--shown {
  transition: none;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .kv-code {
    --kumo-code-highlight-bg: rgb(255 255 255 / 0.08);
  }

  :root:not([data-theme="light"]) .kv-code__shiki span:not(.line-highlighted) {
    color: var(--shiki-dark) !important;
    background-color: transparent !important;
  }

  :root:not([data-theme="light"]) .kv-code__shiki .line-highlighted {
    color: var(--shiki-dark) !important;
  }
}

[data-theme="dark"] .kv-code {
  --kumo-code-highlight-bg: rgb(255 255 255 / 0.08);
}

[data-theme="dark"] .kv-code__shiki span:not(.line-highlighted) {
  color: var(--shiki-dark) !important;
  background-color: transparent !important;
}

[data-theme="dark"] .kv-code__shiki .line-highlighted {
  color: var(--shiki-dark) !important;
}
</style>
