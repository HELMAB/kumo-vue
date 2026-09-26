<!-- Ported from Cloudflare Kumo's TableOfContents.Item (MIT). See /NOTICE. -->
<script setup>
/** A section link. `as` renders a router link or a button in place of the `<a>`. */
import { Primitive } from "reka-ui";

defineOptions({ inheritAttrs: false });

defineProps({
  /** Marks the currently active section. */
  active: { type: Boolean, default: false },
  /** Element or component to render as. */
  as: { type: [String, Object], default: "a" },
  /** Render the single child element instead of an element of our own. */
  asChild: { type: Boolean, default: false },
});
</script>

<template>
  <li class="kv-toc__entry">
    <Primitive
      v-bind="$attrs"
      :as="as"
      :as-child="asChild"
      :class="['kv-toc__item', { 'kv-toc__item--active': active }]"
      :aria-current="active ? 'true' : undefined"
      data-kumo-component="TableOfContents"
      data-kumo-part="item"
    >
      <span class="kv-toc__label"><slot /></span>
    </Primitive>
  </li>
</template>

<style>
.kv-toc__entry {
  margin-inline-start: -2px;
}

.kv-toc__item {
  display: block;
  box-sizing: border-box;
  inline-size: 100%;
  overflow: hidden;
  margin: 0;
  padding: var(--kv-space-0-5) 0;
  padding-inline-start: var(--kv-space-4);
  border: 0;
  border-inline-start: 2px solid transparent;
  background: none;
  font-family: inherit;
  font-size: var(--kv-text-sm);
  line-height: calc(1 / 0.85);
  text-align: start;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--kv-text-subtle);
}

@media (hover: hover) {
  .kv-toc__item:hover {
    border-inline-start-color: var(--kv-line);
    font-weight: 500;
    color: var(--kv-text-default);
  }
}

.kv-toc__item--active {
  border-inline-start-color: var(--kv-brand);
  font-weight: 500;
  color: var(--kv-text-default);
}

@media (hover: hover) {
  .kv-toc__item--active:hover {
    border-inline-start-color: var(--kv-brand);
  }
}

.kv-toc__label {
  display: block;
  min-inline-size: 0;
  line-height: 1.25rem;
}
</style>
