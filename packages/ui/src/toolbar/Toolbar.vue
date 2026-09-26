<!-- Ported from Cloudflare Kumo's Toolbar (MIT). See /NOTICE. -->
<script setup>
/** Groups controls into one compact card, with arrow-key navigation between them. */
import { computed, onMounted, onUpdated, provide, ref } from "vue";
import { TOOLBAR, TOOLBAR_ITEM, keepsCaret } from "../shared/toolbar.js";

const props = defineProps({
  /**
   * Deprecated upstream: omit it for the default base size.
   * @values xs, sm, base, lg
   */
  size: { type: String, default: "base" },
  /**
   * Direction the arrow keys move along.
   * @values horizontal, vertical
   */
  orientation: { type: String, default: "horizontal" },
  /** Wraps focus from the last item back to the first. */
  loop: { type: Boolean, default: true },
});

const size = computed(() => (["xs", "sm", "base", "lg"].includes(props.size) ? props.size : "base"));
provide(TOOLBAR, { size });

const root = ref();
let active = null;

const items = () =>
  [...(root.value?.querySelectorAll(`[${TOOLBAR_ITEM}]`) ?? [])].filter(
    (el) => el.closest('[role="toolbar"]') === root.value && !el.disabled,
  );

// One item is the tab stop: the last one focused, or the first.
function syncTabStops() {
  const list = items();
  if (!list.includes(active)) active = list[0] ?? null;
  for (const el of list) el.tabIndex = el === active ? 0 : -1;
}

onMounted(syncTabStops);
onUpdated(syncTabStops);

function onFocusin(event) {
  const item = event.target.closest?.(`[${TOOLBAR_ITEM}]`);
  if (item && items().includes(item)) {
    active = item;
    syncTabStops();
  }
}

function onKeydown(event) {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const list = items();
  const current = list.indexOf(event.target.closest?.(`[${TOOLBAR_ITEM}]`));
  if (current === -1) return;

  const rtl = getComputedStyle(root.value).direction === "rtl";
  const vertical = props.orientation === "vertical";
  const forward = vertical ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
  const backward = vertical ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";

  let next;
  if (event.key === forward) next = current + 1;
  else if (event.key === backward) next = current - 1;
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = list.length - 1;
  else return;

  if (keepsCaret(event, forward, backward)) return;
  if (props.loop) next = (next + list.length) % list.length;
  else next = Math.min(Math.max(next, 0), list.length - 1);

  event.preventDefault();
  list[next]?.focus();
}
</script>

<template>
  <div
    ref="root"
    role="toolbar"
    :aria-orientation="orientation"
    :data-orientation="orientation"
    :class="['kv-toolbar', `kv-toolbar--size-${size}`]"
    data-kumo-component="Toolbar"
    @focusin="onFocusin"
    @keydown="onKeydown"
  >
    <slot />
  </div>
</template>

<style>
.kv-toolbar {
  display: inline-flex;
  align-items: stretch;
  inline-size: fit-content;
  border-radius: var(--kv-radius-lg);
  background-color: var(--kv-surface-control);
  box-shadow:
    0 0 0 1px var(--kv-line),
    0 1px 2px 0 rgb(0 0 0 / 0.05);
  font-size: var(--kv-text-base);
  line-height: 1.5;
}

.kv-toolbar--size-xs,
.kv-toolbar--size-sm {
  font-size: var(--kv-text-xs);
  line-height: calc(1 / 0.75);
}

.kv-toolbar > :first-child {
  border-start-start-radius: var(--kv-radius-lg);
  border-end-start-radius: var(--kv-radius-lg);
}

.kv-toolbar > :not([aria-hidden="true"]):not([type="hidden"]):not(:has(~ :not([aria-hidden="true"]):not([type="hidden"]))) {
  border-start-end-radius: var(--kv-radius-lg);
  border-end-end-radius: var(--kv-radius-lg);
}

.kv-toolbar > * [data-kumo-toolbar-input]:focus {
  border-radius: inherit;
}

.kv-toolbar > :not([aria-hidden="true"]):not(:first-child) {
  border-inline-start: 1px solid var(--kv-line);
}

/* Items: flat, square and ringless inside the card; the focused one lifts above its neighbours. */
.kv-toolbar__control {
  position: relative;
  min-inline-size: 0;
}

.kv-toolbar__control:is(:focus, :focus-within, :focus-visible, :has(:focus-visible)) {
  z-index: 2;
}

.kv-toolbar__control.kv-button {
  --kv-button-radius: 0;
  --kv-button-drop: 0 0 #0000;

  border: 0;
  background-color: transparent;
}

.kv-toolbar__control.kv-button:not(:focus-visible) {
  --kv-button-ring-width: 0px;
}

.kv-toolbar__control.kv-input {
  --kv-input-radius: 0;

  border: 0;
  background-color: transparent;
}

.kv-toolbar__control.kv-input:not(:focus) {
  --kv-input-ring-width: 0px;
}

.kv-toolbar__group {
  display: flex;
}

.kv-toolbar__group > .kv-input-field {
  border-radius: inherit;
}

.kv-toolbar__group .kv-input-group {
  flex: 1;
  min-inline-size: 0;
  block-size: auto;
  min-block-size: var(--kv-ig-height);
  border-radius: inherit;
  background-color: transparent;
}

.kv-toolbar__group .kv-input-group:not(:focus-within) {
  --kv-ig-ring-width: 0px;
}
</style>
