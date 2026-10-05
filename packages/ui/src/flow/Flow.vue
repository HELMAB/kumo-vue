<!-- Ported from Cloudflare Kumo's Flow (MIT). See /NOTICE. -->
<script setup>
/** A directed flow diagram of `FlowNode` steps and `FlowParallel` branches, on a canvas that pans when it overflows. */
import { computed, onBeforeUnmount, onMounted, provide, reactive, ref, shallowRef, toRef, useId, watch } from "vue";
import FlowList from "./FlowList.vue";
import { buildConnectors } from "./connectors.js";
import { FLOW, toTree } from "./context.js";
import { computeDiagramRect, computeEdges, computePositions } from "./layout.js";

const props = defineProps({
  /**
   * `horizontal` runs left to right, `vertical` top to bottom.
   * @values horizontal, vertical
   */
  orientation: { type: String, default: "horizontal" },
  /**
   * Cross-axis alignment of nodes of different sizes.
   * @values start, center
   */
  align: { type: String, default: "start" },
  /** Wraps the diagram in a canvas that pans by drag and wheel when it overflows. */
  canvas: { type: Boolean, default: true },
  /** Space around the diagram inside the canvas, in pixels: `{ x, y }`. Defaults to 16 and 64. */
  padding: { type: Object, default: undefined },
});

const emit = defineEmits(["overflow-change"]);

const MIN_THUMB = 10;
const PAN_THRESHOLD = 3;

const nodes = shallowRef({});
const root = shallowRef(null);

const state = computed(() => ({
  nodes: nodes.value,
  tree: root.value ? toTree(root.value) : { kind: "list", children: [] },
  align: props.align,
  orientation: props.orientation,
}));
const edges = computed(() => computeEdges(state.value));
const positions = computed(() => computePositions(state.value));
const rect = computed(() => computeDiagramRect(positions.value, state.value));
const connectors = computed(() => buildConnectors(edges.value, positions.value, nodes.value, props.orientation));

const same = (a, b) =>
  a?.width === b.width &&
  a?.height === b.height &&
  a?.disabled === b.disabled &&
  a?.startAnchorOffset === b.startAnchorOffset &&
  a?.endAnchorOffset === b.endAnchorOffset;

provide(FLOW, {
  orientation: toRef(props, "orientation"),
  positions,
  setRoot: (group) => (root.value = group),
  reportNode(id, data) {
    if (!same(nodes.value[id], data)) nodes.value = { ...nodes.value, [id]: data };
  },
  removeNode(id) {
    if (!(id in nodes.value)) return;
    const { [id]: _, ...rest } = nodes.value;
    nodes.value = rest;
  },
});

const markerId = useId();
const wrapper = ref();
const content = ref();
const pad = computed(() => ({ x: props.padding?.x ?? 16, y: props.padding?.y ?? 64 }));
const pan = reactive({ x: 0, y: 0 });
const bounds = ref(null);
const dims = ref(null);
const canPan = ref(false);
const isPanning = ref(false);
let overflow = null;

function measure() {
  if (!props.canvas || !wrapper.value || !content.value) return;
  const outer = wrapper.value.getBoundingClientRect();
  const inner = content.value.getBoundingClientRect();
  const viewportWidth = outer.width - pad.value.x * 2;
  const viewportHeight = outer.height - pad.value.y * 2;
  bounds.value = { x: Math.min(0, viewportWidth - inner.width), y: Math.min(0, viewportHeight - inner.height) };
  dims.value = { viewportWidth, viewportHeight, contentWidth: inner.width, contentHeight: inner.height };
  const next = { x: inner.width > viewportWidth, y: inner.height > viewportHeight };
  canPan.value = next.x || next.y;
  if (overflow?.x !== next.x || overflow?.y !== next.y) {
    overflow = next;
    emit("overflow-change", next);
  }
}

let resizeObserver;
onMounted(() => {
  resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(wrapper.value);
  resizeObserver.observe(content.value);
  measure();
  wrapper.value.addEventListener("wheel", onWheel, { passive: false });
});
watch([pad, () => props.canvas], measure);

watch(bounds, (value) => {
  if (!value) return;
  pan.x = Math.max(pan.x, value.x);
  pan.y = Math.max(pan.y, value.y);
});

const clamp = (value, min) => Math.max(min, Math.min(0, value));

function onWheel(event) {
  if (!props.canvas || !bounds.value) return;
  const { x, y } = bounds.value;
  if (x === 0 && y === 0) return;
  event.preventDefault();
  if (y < 0) pan.y = clamp(pan.y - event.deltaY, y);
  if (x < 0) pan.x = clamp(pan.x - event.deltaX, x);
}

let pointer = null;

function setBodyDragging(dragging) {
  document.body.style.cursor = dragging ? "grabbing" : "";
  document.body.style.userSelect = dragging ? "none" : "";
}

function onPointerDown(event) {
  if (!props.canvas || event.button !== 0 || event.target.closest?.("[data-node-id]")) return;
  pointer = { startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastY: event.clientY };
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
}

function onPointerMove(event) {
  if (!pointer) return;
  if (!isPanning.value && Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) > PAN_THRESHOLD) {
    isPanning.value = true;
    setBodyDragging(true);
  }
  if (isPanning.value && bounds.value) {
    pan.x = clamp(pan.x + event.clientX - pointer.lastX, bounds.value.x);
    pan.y = clamp(pan.y + event.clientY - pointer.lastY, bounds.value.y);
  }
  pointer.lastX = event.clientX;
  pointer.lastY = event.clientY;
}

function onPointerUp() {
  pointer = null;
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
  window.removeEventListener("pointercancel", onPointerUp);
  if (!isPanning.value) return;
  isPanning.value = false;
  setBodyDragging(false);
}

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  wrapper.value?.removeEventListener("wheel", onWheel);
  onPointerUp();
  setBodyDragging(false);
});

const canScrollX = computed(() => bounds.value && bounds.value.x < 0);
const canScrollY = computed(() => bounds.value && bounds.value.y < 0);
const thumbWidth = computed(() =>
  dims.value?.contentWidth > 0 && dims.value.viewportWidth > 0 ? Math.max(MIN_THUMB, (dims.value.viewportWidth / dims.value.contentWidth) * 100) : 0,
);
const thumbHeight = computed(() =>
  dims.value?.contentHeight > 0 && dims.value.viewportHeight > 0 ? Math.max(MIN_THUMB, (dims.value.viewportHeight / dims.value.contentHeight) * 100) : 0,
);
const thumbLeft = computed(() => (bounds.value?.x ? (pan.x / bounds.value.x) * (100 - thumbWidth.value) : 0));
const thumbTop = computed(() => (bounds.value?.y ? (pan.y / bounds.value.y) * (100 - thumbHeight.value) : 0));

const wrapperStyle = computed(() => ({
  padding: `${pad.value.y}px ${pad.value.x}px`,
  cursor: props.canvas && canPan.value && !isPanning.value ? "grab" : undefined,
}));

const contentStyle = computed(() => ({
  transform: pan.x || pan.y ? `translateX(${pan.x}px) translateY(${pan.y}px)` : undefined,
  width: rect.value.width ? `${rect.value.width}px` : undefined,
  height: rect.value.height ? `${rect.value.height}px` : undefined,
}));
</script>

<template>
  <div ref="wrapper" class="kv-flow" :style="wrapperStyle" data-kumo-component="Flow" @pointerdown="onPointerDown">
    <div ref="content" class="kv-flow__content" :style="contentStyle" data-testid="flow-contents">
      <FlowList><slot /></FlowList>
      <div class="kv-flow__connectors">
        <svg width="100%" height="100%" overflow="visible" aria-hidden="true">
          <defs>
            <marker :id="markerId" markerWidth="8" markerHeight="8" refX="0" refY="4" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M 0,1.5 Q 0,0 1.5,0 Q 3.5,1 5.8,3.2 Q 6.5,4 5.8,4.8 Q 3.5,7 1.5,8 Q 0,8 0,6.5 Z" fill="currentColor" stroke="none" />
            </marker>
          </defs>
          <g v-for="(connector, index) in connectors" :key="connector.id" :class="{ 'kv-flow__connector--disabled': connector.disabled }">
            <path
              :d="connector.path"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              :marker-end="`url(#${markerId})`"
              :data-index="index"
              :data-testid="connector.id"
            />
          </g>
        </svg>
      </div>
    </div>

    <div v-if="canScrollY" class="kv-flow__scrollbar kv-flow__scrollbar--y">
      <div class="kv-flow__thumb" :style="{ height: `${thumbHeight}%`, top: `${thumbTop}%` }" />
    </div>
    <div v-if="canScrollX" class="kv-flow__scrollbar kv-flow__scrollbar--x">
      <div class="kv-flow__thumb" :style="{ width: `${thumbWidth}%`, left: `${thumbLeft}%` }" />
    </div>
  </div>
</template>

<style>
.kv-flow {
  --kv-flow-connector: var(--kv-color-neutral-400);

  position: relative;
  box-sizing: border-box;
  flex-grow: 1;
  isolation: isolate;
  overflow: hidden;
}

.kv-flow__content {
  position: relative;
  margin-inline: auto;
}

.kv-flow__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.kv-flow__list--vertical {
  display: flex;
  flex-direction: column;
}

.kv-flow__node {
  position: absolute;
  padding: var(--kv-space-2) var(--kv-space-3);
  border-radius: var(--kv-radius-md);
  background-color: var(--kv-surface-base);
  box-shadow:
    0 0 0 1px var(--kv-line),
    0 1px 3px 0 rgb(0 0 0 / 0.1),
    0 1px 2px -1px rgb(0 0 0 / 0.1);
  cursor: default;
}

.kv-flow__connectors {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.kv-flow__connectors > svg {
  overflow: visible;
  color: var(--kv-flow-connector);
}

.kv-flow__connector--disabled {
  opacity: 0.4;
}

.kv-flow__scrollbar {
  position: absolute;
  border-radius: var(--kv-radius-full);
  background-color: color-mix(in oklab, var(--kv-hairline) 50%, transparent);
  opacity: 0;
}

.kv-flow:hover > .kv-flow__scrollbar {
  opacity: 1;
}

.kv-flow__scrollbar--y {
  inset-block: var(--kv-space-1);
  right: var(--kv-space-1);
  inline-size: var(--kv-space-1-5);
}

.kv-flow__scrollbar--x {
  inset-inline: var(--kv-space-1);
  bottom: var(--kv-space-1);
  block-size: var(--kv-space-1-5);
}

.kv-flow__thumb {
  position: absolute;
  border-radius: var(--kv-radius-full);
  background-color: var(--kv-fill);
}

.kv-flow__scrollbar--y > .kv-flow__thumb {
  inline-size: 100%;
}

.kv-flow__scrollbar--x > .kv-flow__thumb {
  block-size: 100%;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .kv-flow {
    --kv-flow-connector: var(--kv-color-neutral-500);
  }
}

[data-theme="dark"] .kv-flow {
  --kv-flow-connector: var(--kv-color-neutral-500);
}
</style>
