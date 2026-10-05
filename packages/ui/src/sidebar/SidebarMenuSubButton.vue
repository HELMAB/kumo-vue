<!-- Ported from Cloudflare Kumo's Sidebar.MenuSubButton (MIT). See /NOTICE. -->
<script setup>
/** A sub-menu item: a button, or a link with `href`. Wraps itself in a list item. */
import { computed, inject } from "vue";
import { LINK_COMPONENT } from "../link/context.js";
import { LabelNodes, MENU_SUB_ITEM, Passthrough } from "./context.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** Marks the current page. */
  active: { type: Boolean, default: false },
  /** Renders a link, through `LinkProvider` when one is set. */
  href: { type: String, default: undefined },
  target: { type: String, default: undefined },
});

const insideItem = inject(MENU_SUB_ITEM, false);
const linkComponent = inject(LINK_COMPONENT, null);

const element = computed(() => (props.href ? (linkComponent?.value ?? "a") : "button"));
const elementProps = computed(() =>
  props.href
    ? { href: props.href, to: props.href, target: props.target, "data-kumo-part": "menu-sub-button-link" }
    : { type: "button", "data-kumo-part": "menu-sub-button" },
);
</script>

<template>
  <component :is="insideItem ? Passthrough : 'li'" v-bind="insideItem ? {} : { class: 'kv-sidebar__menu-sub-item', 'data-sidebar': 'menu-sub-item' }">
    <component
      :is="element"
      v-bind="{ ...elementProps, ...$attrs }"
      class="kv-sidebar__menu-sub-button"
      :class="{ 'kv-sidebar__menu-button--active': active }"
      :data-active="active || undefined"
      data-sidebar="menu-sub-button"
      data-kumo-component="Sidebar"
    >
      <span class="kv-sidebar__menu-label"><LabelNodes><slot /></LabelNodes></span>
    </component>
  </component>
</template>
