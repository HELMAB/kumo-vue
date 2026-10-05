import { computed, inject } from "vue";
import { normalizeLanguage } from "./languages.js";

export const SHIKI = Symbol("kv-shiki");

/** Highlighting for a code block of your own. Must be used inside a `ShikiProvider`. */
export function useShikiHighlighter() {
  const context = inject(SHIKI, null);
  if (!context) {
    throw new Error("useShikiHighlighter must be used within a ShikiProvider. Wrap your app with <ShikiProvider> from '@kumo-vue/ui/code'.");
  }

  function highlight(code, lang) {
    const highlighter = context.highlighter.value;
    if (!highlighter) return null;
    const language = normalizeLanguage(lang);
    if (!language || !context.languages.value.includes(language)) {
      console.warn(
        `[kumo-vue CodeHighlighted] Language "${lang}" is not in the ShikiProvider's languages list. ` +
          `Add '${language || lang}' to its languages. Rendering as plain text.`,
      );
      return null;
    }
    try {
      return highlighter.codeToHtml(code, { lang: language, themes: { light: "github-light", dark: "vesper" } });
    } catch (error) {
      console.warn(`[kumo-vue CodeHighlighted] Failed to highlight code with language "${lang}":`, error);
      return null;
    }
  }

  return {
    highlight,
    isLoading: context.isLoading,
    isReady: computed(() => !context.isLoading.value && context.highlighter.value !== null),
    error: context.error,
    labels: context.labels,
  };
}
