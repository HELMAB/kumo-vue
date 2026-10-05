<!-- Ported from Cloudflare Kumo's ShikiProvider (MIT). See /NOTICE. -->
<script setup>
/** Loads Shiki once, lazily, for every `CodeHighlighted` inside it. Themes are `github-light` and `vesper`. */
import { computed, onBeforeUnmount, provide, shallowRef, watch } from "vue";
import { SHIKI } from "./context.js";
import { BUNDLED_LANGS, normalizeLanguage } from "./languages.js";

const props = defineProps({
  /**
   * `javascript` is smaller (~50KB); `wasm` is larger (~180KB) and VS Code-accurate.
   * @values javascript, wasm
   */
  engine: { type: String, required: true },
  /** Languages to load, by name or alias, e.g. `['tsx', 'bash', 'json']`. Only these are downloaded. */
  languages: { type: Array, required: true },
  /** Copy button text for every block inside: `{ copy, copied }`. */
  labels: { type: Object, default: undefined },
});

const highlighter = shallowRef(null);
const isLoading = shallowRef(true);
const error = shallowRef(null);
const loaded = shallowRef([]);

// Equivalent inline arrays must not re-create the highlighter.
const languageKey = computed(() =>
  [...new Set(props.languages.map(normalizeLanguage).filter(Boolean))].sort().join(","),
);

let generation = 0;

async function load(engine, key) {
  const current = ++generation;
  highlighter.value?.dispose();
  highlighter.value = null;
  isLoading.value = true;
  error.value = null;
  const languages = key ? key.split(",") : [];
  try {
    const { createHighlighterCore } = await import("shiki/core");
    const engineInstance =
      engine === "wasm"
        ? await import("shiki/engine/oniguruma").then((m) => m.createOnigurumaEngine(import("shiki/wasm")))
        : await import("shiki/engine/javascript").then((m) => m.createJavaScriptRegexEngine());
    const [light, dark, ...langs] = await Promise.all([
      import("@shikijs/themes/github-light"),
      import("@shikijs/themes/vesper"),
      ...languages.map((lang) => BUNDLED_LANGS[lang]()),
    ]);
    const instance = await createHighlighterCore({
      themes: [light.default, dark.default],
      langs: langs.map((m) => m.default),
      engine: engineInstance,
    });
    if (current !== generation) {
      instance.dispose();
      return;
    }
    highlighter.value = instance;
    loaded.value = languages;
  } catch (caught) {
    if (current !== generation) return;
    error.value = caught instanceof Error ? caught : new Error("Failed to load Shiki");
  }
  isLoading.value = false;
}

watch([() => props.engine, languageKey], ([engine, key]) => load(engine, key), { immediate: true });

onBeforeUnmount(() => {
  generation++;
  highlighter.value?.dispose();
});

provide(SHIKI, {
  highlighter,
  isLoading,
  error,
  languages: loaded,
  labels: computed(() => ({ copy: "Copy", copied: "Copied!", ...props.labels })),
});
</script>

<template>
  <slot />
</template>
