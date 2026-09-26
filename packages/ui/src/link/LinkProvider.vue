<!-- Ported from Cloudflare Kumo's LinkProvider (MIT). See /NOTICE. -->
<script setup>
/** Sets the component every `Link` below it renders as, such as the app's router link. */
import { computed, provide } from "vue";
import { LINK_COMPONENT } from "./context.js";

const props = defineProps({
  /** The component a `Link` renders as. It receives `href` and the link's other attributes. */
  component: { type: [String, Object], default: undefined },
});

provide(LINK_COMPONENT, computed(() => props.component));
</script>

<template>
  <slot />
</template>
