<!-- Ported from Cloudflare Kumo's Flow.Anchor (MIT). See /NOTICE. -->
<script setup>
/** Inside a `FlowNode`, the point connectors attach to in place of the node's middle. */
import { computed, inject, onBeforeUnmount, onMounted, ref } from "vue";
import { Primitive } from "reka-ui";
import { ANCHORS } from "./context.js";

const props = defineProps({
  /**
   * `start` is where the next connector leaves, `end` where the previous one arrives. Unset, it is both.
   * @values start, end
   */
  type: { type: String, default: undefined },
  as: { type: [String, Object], default: "div" },
  /** Render the single child element instead of a `<div>`. */
  asChild: { type: Boolean, default: false },
});

const anchors = inject(ANCHORS, null);
if (!anchors) throw new Error("FlowAnchor must be used within FlowNode.");

const anchorRef = ref();
const el = computed(() => anchorRef.value?.$el);
let unregister;
onMounted(() => (unregister = anchors.register(props.type ?? "both", el.value)));
onBeforeUnmount(() => unregister?.());
</script>

<template>
  <Primitive ref="anchorRef" :as="as" :as-child="asChild">
    <slot />
  </Primitive>
</template>
