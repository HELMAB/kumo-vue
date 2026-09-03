<!-- Ported from Cloudflare Kumo's Tabs (MIT). See /NOTICE. -->
<script setup>
/**
 * Tabs - a bar of tabs in the segmented or underline style.
 *
 *   <Tabs v-model="tab" :items="['Overview', 'Settings']" />
 *   <Tabs v-model="tab" :items="tabs" variant="underline" size="sm" />
 *
 * Built on Reka UI's Tabs primitive, the counterpart to the Base UI one Kumo
 * builds on: it owns the `role="tablist"` / `role="tab"` contract, arrow-key
 * navigation, and the measurements the active indicator slides between.
 *
 * The bar renders no panels, as Kumo's does not - a tab here selects a value
 * and the page decides what that means. Reka only points a tab at a panel that
 * actually exists, so nothing is left with a dangling `aria-controls`.
 */
import { computed, onMounted, ref, watch } from "vue";
import { TabsIndicator, TabsList, TabsRoot, TabsTrigger } from "reka-ui";

import { toOption } from "../shared/items.js";
import { useTabsScroll } from "./useTabsScroll.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** Selected tab's value. */
  modelValue: { type: [String, Number], default: undefined },
  /** Selected tab before anything is chosen. Kumo calls this `selectedValue`. */
  defaultValue: { type: [String, Number], default: undefined },
  /**
   * The tabs. Accepts plain strings or `{ label, value, disabled, href }`
   * objects - Kumo calls this prop `tabs`; it is `items` here, as on every
   * other component that takes a list.
   */
  items: { type: Array, default: () => [] },
  /**
   * `segmented` is a pill on a filled track; `underline` is a rule beneath
   * the bar with a brand-coloured marker.
   * @values segmented, underline
   */
  variant: { type: String, default: "segmented" },
  /**
   * @values base, sm
   */
  size: { type: String, default: "base" },
  /**
   * Select a tab as soon as the arrow keys reach it. Off by default, as in
   * Kumo, so arrow keys move focus and Enter or Space commits.
   */
  activateOnFocus: { type: Boolean, default: false },
  /** Element or component to render a tab with an `href` as. */
  linkAs: { type: [String, Object], default: "a" },
  /**
   * Writing direction. Leave unset and the bar follows the direction it
   * inherits.
   * @values ltr, rtl
   */
  dir: { type: String, default: undefined },
  /** Accessible name for the tab list. */
  label: { type: String, default: undefined },
  /** Accessible name for the scroll-towards-the-start control. */
  scrollStartLabel: { type: String, default: "Scroll tabs to the start" },
  /** Accessible name for the scroll-towards-the-end control. */
  scrollEndLabel: { type: String, default: "Scroll tabs to the end" },
});

defineEmits(["update:modelValue"]);

const options = computed(() => props.items.map(toOption));

const root = ref();
const list = ref();

/*
 * Reka asks for the direction rather than reading it, and falls back to `ltr`
 * - which it then writes onto the element, overriding an `rtl` inherited from
 * the page and flipping the whole bar back the other way. The inherited
 * direction is read here instead, so RTL needs no configuration, and an
 * explicit `dir` still wins.
 */
const dir = ref(props.dir);

function readDir() {
  if (props.dir) {
    dir.value = props.dir;
    return;
  }
  /*
   * The parent, not the element: Reka has already written its own `dir` onto
   * the element by now, so asking the element would only read that back.
   *
   * The nearest `dir` attribute answers first - it is how HTML says to set
   * direction, and it survives environments with no cascade to compute. A CSS
   * `direction` property, or a `dir="auto"` that only the browser can resolve,
   * falls through to the computed value.
   */
  const parent = root.value?.$el?.parentElement;
  if (!parent) return;

  const declared = parent.closest("[dir]")?.getAttribute("dir");
  dir.value =
    declared === "rtl" || declared === "ltr" ? declared : getComputedStyle(parent).direction;
}

onMounted(readDir);
watch(() => props.dir, readDir);

const { isOverflowing, canScrollStart, canScrollEnd, dragHandlers, scrollBy, revealTab } =
  useTabsScroll(
    () => list.value?.$el,
    computed(() => options.value.map((option) => option.value).join("|")),
  );

const rootClasses = computed(() => [
  "kv-tabs",
  `kv-tabs--${props.variant}`,
  `kv-tabs--size-${props.size}`,
]);

/**
 * Reka drives selection on focus with an activation mode; Kumo names the same
 * choice after what it does. The Kumo name is the one kept.
 */
const activationMode = computed(() => (props.activateOnFocus ? "automatic" : "manual"));

/** A tab with an `href` is a link, and gets the link component. */
const tabAs = (option) => (option.raw?.href ? props.linkAs : "button");

const tabProps = (option) => {
  const href = option.raw?.href;
  if (!href) return {};
  return props.linkAs === "a" ? { href } : { to: href };
};
</script>

<template>
  <TabsRoot
    ref="root"
    v-bind="$attrs"
    :class="rootClasses"
    :dir="dir"
    data-kumo-component="Tabs"
    :model-value="modelValue"
    :default-value="defaultValue"
    :activation-mode="activationMode"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <TabsList
      ref="list"
      class="kv-tabs__list"
      :aria-label="label"
      :data-overflowing="isOverflowing ? '' : undefined"
      :data-overflow-start="canScrollStart ? '' : undefined"
      :data-overflow-end="canScrollEnd ? '' : undefined"
      v-bind="dragHandlers"
    >
      <TabsTrigger
        v-for="(option, index) in options"
        :key="String(option.value)"
        class="kv-tabs__tab"
        data-kumo-part="tab"
        :value="option.value"
        :disabled="option.disabled"
        :as="tabAs(option)"
        v-bind="tabProps(option)"
        @click="revealTab($event.currentTarget)"
      >
        <slot name="tab" :item="option.raw" :option="option" :index="index">
          {{ option.label }}
        </slot>
      </TabsTrigger>

      <TabsIndicator class="kv-tabs__indicator" />
    </TabsList>

    <!--
      Kumo renders these for the segmented variant only, though its own control
      carries styling for the other; an underline bar overflows just the same,
      so both get them here.
    -->
    <button
      v-for="side in ['start', 'end']"
      :key="side"
      type="button"
      class="kv-tabs__scroll"
      :class="[
        `kv-tabs__scroll--${side}`,
        { 'kv-tabs__scroll--idle': !(side === 'start' ? canScrollStart : canScrollEnd) },
      ]"
      data-kumo-part="overflow-control"
      :data-side="side"
      :aria-label="side === 'start' ? scrollStartLabel : scrollEndLabel"
      :aria-hidden="(side === 'start' ? canScrollStart : canScrollEnd) ? undefined : 'true'"
      :tabindex="(side === 'start' ? canScrollStart : canScrollEnd) ? 0 : -1"
      @click="scrollBy(side)"
    >
      <span class="kv-tabs__scroll-icon">
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            :d="side === 'start' ? 'M9.25 4.25 5.75 8l3.5 3.75' : 'M6.75 4.25 10.25 8l-3.5 3.75'"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </button>
  </TabsRoot>
</template>

<style>
/*
 * Logical properties throughout, so the bar and its scroll controls mirror
 * under dir="rtl" without a second stylesheet.
 */
.kv-tabs {
  --kv-tabs-height: 2.25rem;
  --kv-tabs-radius: var(--kv-radius-lg);
  --kv-tabs-tab-radius: var(--kv-radius-md);
  --kv-tabs-tab-padding: 0.625rem;
  --kv-tabs-font-size: var(--kv-text-base);
  --kv-tabs-control-size: 2.5rem;

  position: relative;
  /* The indicator sits behind the labels; isolation keeps that local. */
  isolation: isolate;
  min-inline-size: 0;
  font-family: var(--kv-font-sans);
  font-weight: 500;
  line-height: var(--kv-leading-normal);
}

.kv-tabs--size-sm {
  --kv-tabs-height: 1.625rem;
  --kv-tabs-radius: var(--kv-radius-md);
  --kv-tabs-tab-radius: var(--kv-radius-sm);
  --kv-tabs-tab-padding: var(--kv-space-2);
  --kv-tabs-font-size: var(--kv-text-xs);
  --kv-tabs-control-size: 2rem;
}

/* ---- The list ---------------------------------------------------------- */

.kv-tabs__list {
  position: relative;
  display: flex;
  align-items: stretch;
  min-inline-size: 0;
  block-size: var(--kv-tabs-height);

  overflow-x: auto;
  overflow-y: hidden;
  /* The controls sit over the ends, so scroll a tab clear of them. */
  scroll-padding-inline: var(--kv-tabs-control-size);
  scrollbar-width: none;
}

.kv-tabs__list::-webkit-scrollbar {
  display: none;
}

.kv-tabs__list[data-overflowing] {
  cursor: grab;
}

.kv-tabs__list[data-overflowing]:active {
  cursor: grabbing;
}

/* ---- A tab ------------------------------------------------------------- */

.kv-tabs__tab {
  position: relative;
  /* Above the indicator, which slides underneath the labels. */
  z-index: 2;
  display: flex;
  align-items: center;
  flex: none;

  padding-block: 0;
  padding-inline: var(--kv-tabs-tab-padding);
  border: 0;
  border-radius: var(--kv-tabs-tab-radius);

  background-color: transparent;
  color: var(--kv-text-subtle);
  font-family: inherit;
  font-size: var(--kv-tabs-font-size);
  font-weight: inherit;
  line-height: inherit;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  outline: none;
  transition: color 100ms ease;
}

.kv-tabs__list[data-overflowing] .kv-tabs__tab {
  cursor: grab;
}

.kv-tabs__tab:hover {
  color: var(--kv-text-default);
}

.kv-tabs__tab[data-state="active"] {
  color: var(--kv-text-default);
}

.kv-tabs__tab:focus-visible {
  box-shadow: inset 0 0 0 2px var(--kv-brand);
}

.kv-tabs__tab[data-disabled] {
  pointer-events: none;
  cursor: not-allowed;
  opacity: 0.5;
}

@media (prefers-reduced-motion: reduce) {
  .kv-tabs__tab {
    transition: none;
  }
}

/* ---- The indicator ----------------------------------------------------- */

/*
 * Reka measures the active tab and hands over its width, height and offset;
 * translating rather than moving the box keeps the slide on the compositor.
 *
 * The offset it reports is `offsetLeft` - a physical distance from the left
 * edge, in both writing directions - so this is the one place that anchors
 * physically rather than logically. Mirroring it would put the indicator
 * under the wrong tab in RTL.
 */
.kv-tabs__indicator {
  position: absolute;
  z-index: 1;
  left: 0;
  inline-size: var(--reka-tabs-indicator-size);
  transform: translateX(var(--reka-tabs-indicator-position));
  transition: transform 200ms ease, inline-size 200ms ease;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .kv-tabs__indicator {
    transition: none;
  }
}

/* ---- Segmented --------------------------------------------------------- */

.kv-tabs--segmented {
  --kv-tabs-fade: var(--kv-surface-recessed);

  border-radius: var(--kv-tabs-radius);
  box-shadow: 0 0 0 1px color-mix(in oklch, var(--kv-hairline) 70%, transparent);
}

.kv-tabs--segmented .kv-tabs__list {
  padding-inline: 0.125rem;
  border-radius: var(--kv-tabs-radius);
  background-color: var(--kv-surface-recessed);
}

.kv-tabs--segmented .kv-tabs__tab {
  margin-block: 0.125rem;
}

.kv-tabs--segmented .kv-tabs__indicator {
  inset-block: 0.125rem;
  border-radius: var(--kv-tabs-tab-radius);
  background-color: var(--kv-surface-base);
  box-shadow:
    0 0 0 1px var(--kv-line),
    0 1px 2px 0 var(--kv-shadow-drop);
}

/* ---- Underline --------------------------------------------------------- */

.kv-tabs--underline {
  --kv-tabs-fade: var(--kv-surface-base);
  --kv-tabs-height: 1.875rem;
  --kv-tabs-tab-padding: var(--kv-space-2);
  --kv-tabs-control-size: 2rem;
}

.kv-tabs--underline.kv-tabs--size-sm {
  --kv-tabs-height: 1.625rem;
  --kv-tabs-tab-padding: var(--kv-space-1-5);
}

.kv-tabs--underline .kv-tabs__list {
  gap: var(--kv-space-4);
  padding-block-end: var(--kv-space-2);
  /*
   * The rule belongs to the bar, not the scrolling content, so it stays put
   * while the tabs move under it.
   */
  box-shadow: inset 0 -1px 0 0 var(--kv-hairline);
  block-size: calc(var(--kv-tabs-height) + var(--kv-space-2));
}

.kv-tabs--underline .kv-tabs__tab:hover {
  background-color: var(--kv-surface-tint);
}

.kv-tabs--underline .kv-tabs__indicator {
  inset-block-end: 0;
  block-size: 0.125rem;
  border-radius: var(--kv-radius-full);
  background-color: var(--kv-brand);
}

/* ---- Scroll controls --------------------------------------------------- */

/*
 * A gradient rather than a solid button, so the tab underneath fades out
 * instead of being cut off - the cue that there is more to scroll to.
 */
.kv-tabs__scroll {
  position: absolute;
  transition: opacity 150ms ease;
  z-index: 3;
  inset-block: 0;
  inline-size: var(--kv-tabs-control-size);

  display: flex;
  align-items: center;
  padding: 0;
  border: 0;
  border-radius: var(--kv-tabs-radius);
  background-color: transparent;
  cursor: pointer;
  outline: none;
}

.kv-tabs__scroll--start {
  inset-inline-start: 0;
  justify-content: flex-start;
  padding-inline-start: var(--kv-space-1);
}

.kv-tabs__scroll--end {
  inset-inline-end: 0;
  justify-content: flex-end;
  padding-inline-end: var(--kv-space-1);
}

.kv-tabs__scroll--start {
  background-image: linear-gradient(to right, var(--kv-tabs-fade) 60%, transparent);
}

.kv-tabs__scroll--end {
  background-image: linear-gradient(to left, var(--kv-tabs-fade) 60%, transparent);
}

/* The fade runs towards the tabs, so it turns with the writing direction. */
[dir="rtl"] .kv-tabs__scroll--start {
  background-image: linear-gradient(to left, var(--kv-tabs-fade) 60%, transparent);
}

[dir="rtl"] .kv-tabs__scroll--end {
  background-image: linear-gradient(to right, var(--kv-tabs-fade) 60%, transparent);
}

/* Nothing to scroll towards on this side: faded out, and out of the way. */
.kv-tabs__scroll--idle {
  opacity: 0;
  pointer-events: none;
}

.kv-tabs__scroll-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  inline-size: 1.5rem;
  block-size: 1.5rem;
  border-radius: var(--kv-tabs-tab-radius);
  color: var(--kv-text-subtle);
  transition: color 100ms ease;
}

.kv-tabs--size-sm .kv-tabs__scroll-icon {
  inline-size: 1.25rem;
  block-size: 1.25rem;
}

.kv-tabs__scroll:hover .kv-tabs__scroll-icon {
  color: var(--kv-text-default);
}

.kv-tabs__scroll:focus-visible .kv-tabs__scroll-icon {
  box-shadow: 0 0 0 2px var(--kv-brand);
}

.kv-tabs__scroll-icon > svg {
  inline-size: 0.875rem;
  block-size: 0.875rem;
}

/* The chevron points along the reading direction, so it turns with it. */
[dir="rtl"] .kv-tabs__scroll-icon > svg {
  transform: scaleX(-1);
}

@media (prefers-reduced-motion: reduce) {
  .kv-tabs__scroll,
  .kv-tabs__scroll-icon {
    transition: none;
  }
}
</style>
