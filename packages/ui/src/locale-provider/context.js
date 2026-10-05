import { computed, inject } from "vue";

export const LOCALE = Symbol("kv-locale");

export function useTranslations(section) {
  const translations = inject(LOCALE, null);
  return computed(() => translations?.value?.[section] ?? {});
}
