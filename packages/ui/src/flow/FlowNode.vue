<!-- Ported from Cloudflare Kumo's Flow.Node (MIT). See /NOTICE. -->
<script setup>
/** A step in a `Flow`. Positioned by the diagram; `as-child` renders your own `<li>` in place of the default card. */
import { computed, onBeforeUnmount, onMounted, provide, ref, useId, watch } from "vue";
import { Primitive } from "reka-ui";
import { ANCHORS, useEntry, useFlow } from "./context.js";

const props = defineProps({
  /** Used as `data-node-id` in place of a generated id. */
  id: { type: String, default: undefined },
  /** Greys out every connector to or from this node. */
  disabled: { type: Boolean, default: false },
  /** Element to render as. */
  as: { type: [String, Object], default: "li" },
  /** Render the single child element instead of the default card. */
  asChild: { type: Boolean, default: false },
});

const flow = useFlow("FlowNode");
const generatedId = useId();
const nodeRef = ref();
const el = computed(() => nodeRef.value?.$el);
const { id, index } = useEntry("node", el, { id: props.id ?? generatedId });
const anchorOffsets = { start: undefined, end: undefined };

function report() {
  if (!el.value?.getBoundingClientRect) return;
  const { width, height } = el.value.getBoundingClientRect();
  flow.reportNode(id, { width, height, disabled: props.disabled, startAnchorOffset: anchorOffsets.start, endAnchorOffset: anchorOffsets.end });
}

let observer;
onMounted(() => {
  observer = new ResizeObserver(report);
  observer.observe(el.value);
  report();
});
watch(() => props.disabled, report);
onBeforeUnmount(() => {
  observer?.disconnect();
  flow.removeNode(id);
});

provide(ANCHORS, {
  register(type, anchorEl) {
    const write = (offset) => {
      if (type !== "end") anchorOffsets.start = offset;
      if (type !== "start") anchorOffsets.end = offset;
    };
    const measure = () => {
      if (!el.value) return;
      const anchor = anchorEl.getBoundingClientRect();
      write(anchor.top - el.value.getBoundingClientRect().top + anchor.height / 2);
      report();
    };
    measure();
    const anchorObserver = new ResizeObserver(measure);
    anchorObserver.observe(anchorEl);
    return () => {
      anchorObserver.disconnect();
      write(undefined);
      report();
    };
  },
});

const position = computed(() => flow.positions.value[id]);
const style = computed(() =>
  position.value
    ? { position: "absolute", top: `${position.value.y}px`, left: `${position.value.x}px`, cursor: "default" }
    : { opacity: 0, cursor: "default" },
);
</script>

<template>
  <Primitive
    ref="nodeRef"
    :as="as"
    :as-child="asChild"
    :class="asChild ? undefined : 'kv-flow__node'"
    :style="style"
    :data-node-index="index"
    :data-node-id="id"
    :data-testid="id"
    :aria-hidden="position ? undefined : 'true'"
    data-kumo-part="node"
  >
    <slot />
  </Primitive>
</template>
