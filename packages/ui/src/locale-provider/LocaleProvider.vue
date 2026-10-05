<!-- Ported from Cloudflare Kumo's KumoLocaleProvider (MIT). See /NOTICE. -->
<script setup>
/** Sets the strings components render on their own, app-wide. Explicit props on a component still win. */
import { computed, inject, provide } from "vue";
import { LOCALE } from "./context.js";

const props = defineProps({
  /** Strings by component, e.g. `{ layerDialog: { close: "Schließen", cancel: "Abbrechen" } }`. Merges over any outer provider. */
  translations: { type: Object, default: () => ({}) },
});

const outer = inject(LOCALE, null);

provide(
  LOCALE,
  computed(() => {
    const merged = { ...outer?.value };
    for (const [section, strings] of Object.entries(props.translations)) merged[section] = { ...merged[section], ...strings };
    return merged;
  }),
);
</script>

<template>
  <slot />
</template>
