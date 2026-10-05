<!-- Ported from Cloudflare Kumo's Sidebar.MenuButton (MIT). See /NOTICE. -->
<script setup>
/** A nav item: a button, or a link with `href`. Wraps itself in a list item; shows `tooltip` while collapsed. */
import { computed, inject, onBeforeUnmount, onMounted, ref } from "vue";
import { Tooltip } from "../tooltip/index.js";
import { LINK_COMPONENT } from "../link/context.js";
import { LabelNodes, MENU_ITEM, Passthrough, useSidebar } from "./context.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** An icon component. Use the `icon` slot for anything else. */
  icon: { type: [Object, Function], default: undefined },
  /** Marks the current page. */
  active: { type: Boolean, default: false },
  /** @values base, sm */
  size: { type: String, default: "base" },
  /** Renders a link, through `LinkProvider` when one is set. */
  href: { type: String, default: undefined },
  target: { type: String, default: undefined },
  /** Shown beside the collapsed rail, unless the sidebar peeks. */
  tooltip: { type: String, default: undefined },
  /** Anchor for `useSidebar().scrollToItem(id)`. */
  itemId: { type: String, default: undefined },
});

const sidebar = useSidebar();
const insideItem = inject(MENU_ITEM, false);
const linkComponent = inject(LINK_COMPONENT, null);

const li = ref();
const interactive = ref();
const registered = () => (insideItem ? interactive.value?.$el ?? interactive.value : li.value);
onMounted(() => props.itemId && sidebar.registerItem(props.itemId, registered()));
onBeforeUnmount(() => props.itemId && sidebar.registerItem(props.itemId, null));

const element = computed(() => (props.href ? (linkComponent?.value ?? "a") : "button"));
const elementProps = computed(() =>
  props.href ? { href: props.href, to: props.href, target: props.target, "data-kumo-part": "menu-button-link" } : { type: "button", "data-kumo-part": "menu-button" },
);
const showTooltip = computed(() => sidebar.state === "collapsed" && !sidebar.peekable);
</script>

<template>
  <component
    :is="insideItem ? Passthrough : 'li'"
    v-bind="insideItem ? {} : { ref: (el) => (li = el), class: 'kv-sidebar__menu-item', 'data-sidebar': 'menu-item', 'data-sidebar-item-id': itemId }"
  >
    <component :is="tooltip ? Tooltip : Passthrough" v-bind="tooltip ? { content: tooltip, side: 'right', disabled: !showTooltip } : {}">
      <component
        :is="element"
        ref="interactive"
        v-bind="{ ...elementProps, ...$attrs }"
        class="kv-sidebar__menu-button"
        :class="[`kv-sidebar__menu-button--${size === 'sm' ? 'sm' : 'base'}`, { 'kv-sidebar__menu-button--active': active }]"
        :data-active="active || undefined"
        data-sidebar="menu-button"
        :data-sidebar-item-id="insideItem ? itemId : undefined"
        data-kumo-component="Sidebar"
        :data-size="size"
      >
        <div class="kv-sidebar__menu-button-content">
          <slot name="icon">
            <component :is="icon" v-if="icon" class="kv-sidebar__menu-icon" aria-hidden="true" />
          </slot>
          <span class="kv-sidebar__menu-label"><LabelNodes><slot /></LabelNodes></span>
        </div>
      </component>
    </component>
  </component>
</template>
