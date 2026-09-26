<!-- Ported from Cloudflare Kumo's Link (MIT). See /NOTICE. -->
<script setup>
/**
 * An inline text link. Routing belongs to the app: pass a router link through `as`,
 * or set one app-wide with `LinkProvider`.
 */
import { computed, inject, useAttrs, watchEffect } from "vue";
import { Primitive } from "reka-ui";
import { LINK_COMPONENT } from "./context.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /**
   * `inline` is underlined in the link colour, `current` inherits it, `plain` drops the underline.
   * @values inline, current, plain
   */
  variant: { type: String, default: "inline" },
  /** Element or component to render as. Defaults to the `LinkProvider` component, or `a`. */
  as: { type: [String, Object], default: undefined },
  /** Render the single child element instead of an element of our own. */
  asChild: { type: Boolean, default: false },
});

const attrs = useAttrs();
const provided = inject(LINK_COMPONENT, null);

const VARIANTS = ["inline", "current", "plain"];
const variant = computed(() => (VARIANTS.includes(props.variant) ? props.variant : "inline"));
const element = computed(() => props.as ?? provided?.value ?? "a");

const bindings = computed(() => {
  if (element.value !== "a" || attrs.to === undefined) return attrs;
  const { to, ...rest } = attrs;
  return { ...rest, href: attrs.href ?? to };
});

if (import.meta.env?.DEV) {
  watchEffect(() => {
    if (element.value === "a" && attrs.to !== undefined) {
      console.warn("[kumo-vue] Link: `to` on a plain anchor is deprecated. Use `href`, or pass a router link through `as`.");
    }
  });
}
</script>

<template>
  <Primitive
    v-bind="bindings"
    :as="element"
    :as-child="asChild"
    :class="['kv-link', `kv-link--${variant}`]"
    data-kumo-component="Link"
  >
    <slot />
  </Primitive>
</template>

<style>
.kv-link {
  --kv-link-decoration: 35%;

  display: inline-flex;
  align-items: center;
  gap: 0.1875em;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke;
  transition-duration: 100ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .kv-link {
    --kv-link-decoration: 65%;
  }
}

[data-theme="dark"] .kv-link {
  --kv-link-decoration: 65%;
}

.kv-link:has(> [data-kumo-component="Badge"]) {
  border-radius: var(--kv-radius-full);
}

.kv-link--inline,
.kv-link--current {
  text-decoration-line: underline;
  text-decoration-thickness: 0.0625em;
  text-decoration-color: color-mix(in oklch, currentColor var(--kv-link-decoration), transparent);
  text-underline-offset: 0.15em;
}

.kv-link--inline:hover,
.kv-link--current:hover {
  text-decoration-color: currentColor;
}

.kv-link--inline,
.kv-link--plain {
  color: var(--kv-text-link);
}

.kv-link--current {
  color: currentColor;
}

.kv-link--plain {
  text-decoration-line: none;
}

@media (hover: hover) {
  .kv-link--plain:hover {
    color: color-mix(in oklab, var(--kv-text-link) 70%, transparent);
  }
}
</style>
