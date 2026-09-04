<!-- Ported from Cloudflare Kumo's DropdownMenu (MIT). See /NOTICE. -->
<script setup>
/**
 * Dropdown - a menu of actions anchored to a trigger.
 *
 *   <Dropdown :items="['Worker', 'Pages', 'KV Namespace']" @select="create">
 *     <template #trigger><Button>Add</Button></template>
 *   </Dropdown>
 *
 *   <Dropdown v-model="prefs" :items="items">
 *     <template #trigger><Button>Account</Button></template>
 *   </Dropdown>
 *
 * Built on Reka UI's DropdownMenu primitive, the counterpart to the Base UI one
 * Kumo builds on: it owns the portal, the positioning, typeahead, arrow-key
 * navigation between items and into submenus, and the `role="menu"` /
 * `role="menuitem"` / `aria-checked` contract.
 *
 * Kumo composes a menu from thirteen components - `.Item`, `.LinkItem`,
 * `.CheckboxItem`, `.RadioGroup`, `.Sub`, `.Separator` and the rest. Here the
 * menu is the `items` prop, the same flattening Select and Tabs make, and the
 * shape of an entry says which of those it renders as. `items.js` has the
 * table.
 *
 * State that outlives a click - what a checkbox is set to, which radio item is
 * chosen - is one `v-model` object keyed by each entry's `value`, so a menu
 * with several toggles and several radio groups still needs one binding.
 */
import { computed, provide, ref, toRef } from "vue";
import {
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from "reka-ui";

import DropdownItems from "./DropdownItems.vue";
import { DROPDOWN_CONTEXT, toDefaultState, toEntries } from "./items.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /**
   * The menu. Accepts plain strings and objects; `type` - or the shape, for
   * the common cases - says what each entry is. See `items.js`.
   */
  items: { type: Array, default: () => [] },
  /**
   * State for the entries that hold some: `{ [value]: boolean }` for a
   * checkbox, `{ [value]: chosen }` for a radio group. Leave unset and the
   * menu keeps its own, seeded from the items.
   */
  modelValue: { type: Object, default: undefined },
  /** Controlled open state. Leave unset to let the component manage it. */
  open: { type: Boolean, default: undefined },
  /** Open state on first render, for the uncontrolled case. */
  defaultOpen: { type: Boolean, default: false },
  /**
   * Which side of the trigger the menu opens on.
   * @values top, right, bottom, left
   */
  side: { type: String, default: "bottom" },
  /**
   * How the menu lines up with the trigger.
   * @values start, center, end
   */
  align: { type: String, default: "center" },
  /** Gap between the trigger and the menu, in pixels. Kumo's default is 8. */
  sideOffset: { type: Number, default: 8 },
  /** Keep the page behind the menu inert while it is open. */
  modal: { type: Boolean, default: true },
  /** Wrap from the last item back to the first with the arrow keys. */
  loop: { type: Boolean, default: false },
  /**
   * Writing direction. Leave unset and the menu follows the direction where
   * it was written, which is not what it would inherit from the portal.
   * @values ltr, rtl
   */
  dir: { type: String, default: undefined },
  /** Where the menu is portalled to. */
  to: { type: [String, Object], default: "body" },
});

const emit = defineEmits(["select", "update:modelValue", "update:open"]);

const entries = computed(() => toEntries(props.items));

/*
 * Reka's DropdownMenu is controlled through `open` alone, so the state lives
 * here: a controlled `open` prop wins, and without one the menu keeps its own.
 */
const uncontrolledOpen = ref(props.defaultOpen);
const isOpen = computed(() => props.open ?? uncontrolledOpen.value);

const setOpen = (value) => {
  uncontrolledOpen.value = value;
  emit("update:open", value);
};

/*
 * Checkbox and radio state. The items seed it, a `modelValue` overrides what
 * it names, and anything the model leaves out keeps the seeded value - so a
 * page can track one toggle without having to declare every other.
 */
const uncontrolledState = ref({});

const state = computed(() => ({
  ...toDefaultState(entries.value),
  ...uncontrolledState.value,
  ...props.modelValue,
}));

const setState = (key, value) => {
  const next = { ...state.value, [key]: value };
  uncontrolledState.value = next;
  emit("update:modelValue", next);
};

/**
 * Kumo closes the menu after an action and leaves it open after a toggle -
 * `closeOnClick` defaults to `true` on an item and `false` on a checkbox or a
 * radio item. Reka spells "stay open" as preventing its `select` event.
 */
const onSelect = (entry, event) => {
  const stateful = entry.kind === "checkbox" || entry.kind === "radio-item";
  const closes = entry.closeOnClick ?? !stateful;
  if (!closes) event?.preventDefault();
  emit("select", entry, event);
};

/*
 * A menu recurses, and the parts of it that entries need reach several levels
 * down. Refs go across rather than values, so a submenu three levels in still
 * sees the current state.
 */
provide(DROPDOWN_CONTEXT, {
  state,
  setState,
  onSelect,
  to: toRef(props, "to"),
  sideOffset: toRef(props, "sideOffset"),
});
</script>

<template>
  <DropdownMenuRoot
    :open="isOpen"
    :modal="modal"
    :dir="dir"
    @update:open="setOpen"
  >
    <DropdownMenuTrigger as-child>
      <slot name="trigger" />
    </DropdownMenuTrigger>

    <DropdownMenuPortal :to="to">
      <DropdownMenuContent
        v-bind="$attrs"
        class="kv-dropdown__popup"
        data-kumo-component="DropdownMenu"
        :side="side"
        :align="align"
        :side-offset="sideOffset"
        :loop="loop"
      >
        <DropdownItems :entries="entries">
          <template #item="slotProps"><slot name="item" v-bind="slotProps" /></template>
        </DropdownItems>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<style>
/*
 * The menu is portalled, so these are not scoped to the component's element -
 * as with every other popup in this library. DropdownItems draws the entries
 * and carries no styles of its own; they all live here.
 */

/* Popup */

.kv-dropdown__popup {
  z-index: 50;
  overflow: hidden;
  overflow-y: auto;
  overscroll-behavior: none;

  min-inline-size: 9rem;
  max-block-size: var(--reka-dropdown-menu-content-available-height);
  padding: var(--kv-space-1-5);

  /* The width is the popup's, padding included, as it is under Tailwind's
     preflight - which this library does not assume is present. */
  box-sizing: border-box;

  background-color: var(--kv-surface-control);
  color: var(--kv-text-default);
  border-radius: var(--kv-radius-lg);
  box-shadow:
    0 0 0 1px var(--kv-line),
    0 10px 15px -3px var(--kv-shadow-elevated),
    0 4px 6px -4px var(--kv-shadow-elevated);
  font-family: var(--kv-font-sans);
}

/*
 * The menu slides in from the trigger it is anchored to, so the direction
 * depends on which side it landed on - which is only known once Reka has
 * placed it, and is written onto the element as `data-side`.
 */
.kv-dropdown__popup {
  --kv-dropdown-slide-x: 0;
  --kv-dropdown-slide-y: 0;
}

.kv-dropdown__popup[data-side="bottom"] { --kv-dropdown-slide-y: -0.5rem; }
.kv-dropdown__popup[data-side="top"] { --kv-dropdown-slide-y: 0.5rem; }
.kv-dropdown__popup[data-side="left"] { --kv-dropdown-slide-x: 0.5rem; }
.kv-dropdown__popup[data-side="right"] { --kv-dropdown-slide-x: -0.5rem; }

.kv-dropdown__popup[data-state="open"] {
  animation: kv-dropdown-in 150ms ease;
}

.kv-dropdown__popup[data-state="closed"] {
  animation: kv-dropdown-out 120ms ease;
}

@keyframes kv-dropdown-in {
  from {
    opacity: 0;
    transform: translate(var(--kv-dropdown-slide-x), var(--kv-dropdown-slide-y)) scale(0.95);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes kv-dropdown-out {
  from {
    opacity: 1;
    transform: none;
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}

@media (prefers-reduced-motion: reduce) {
  .kv-dropdown__popup[data-state="open"],
  .kv-dropdown__popup[data-state="closed"] {
    animation: none;
  }
}

/* Entries */

.kv-dropdown__item,
.kv-dropdown__subtrigger,
.kv-dropdown__checkbox-item,
.kv-dropdown__radio-item {
  position: relative;
  display: flex;
  align-items: center;

  padding-block: var(--kv-space-1-5);
  padding-inline: var(--kv-space-2);

  font-size: var(--kv-text-base);
  line-height: var(--kv-leading-normal);
  /*
   * Not a pointer: a menu item is not a link, and Kumo leaves the arrow as it
   * is on every one of them.
   */
  cursor: default;
  user-select: none;
  outline: none;
}

.kv-dropdown__item,
.kv-dropdown__radio-item {
  border-radius: var(--kv-radius-md);
}

.kv-dropdown__subtrigger,
.kv-dropdown__checkbox-item {
  border-radius: var(--kv-radius-sm);
}

/* Only the checkbox eases its highlight upstream; the rest switch outright. */
.kv-dropdown__checkbox-item {
  transition: background-color 150ms ease, color 150ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .kv-dropdown__checkbox-item {
    transition: none;
  }
}

/*
 * Reka moves DOM focus onto the highlighted item, where Base UI leaves focus
 * on the popup and points at the item with aria-activedescendant. Kumo's
 * source carries a `focus-visible` ring that therefore almost never fires
 * upstream; copied verbatim it would draw a ring on every mouse click. The
 * highlight is the affordance, in both implementations.
 */
.kv-dropdown__item[data-highlighted] {
  background-color: var(--kv-surface-overlay);
}

/*
 * The submenu trigger, the checkbox and the radio item highlight against the
 * tint rather than the overlay - as they do upstream, where they are the three
 * that reach for `focus:bg-kumo-tint` instead.
 */
.kv-dropdown__subtrigger[data-highlighted],
.kv-dropdown__subtrigger[data-state="open"],
.kv-dropdown__checkbox-item[data-highlighted],
.kv-dropdown__radio-item[data-highlighted] {
  background-color: var(--kv-surface-tint);
}

.kv-dropdown__item[data-disabled],
.kv-dropdown__checkbox-item[data-disabled],
.kv-dropdown__radio-item[data-disabled] {
  pointer-events: none;
  opacity: 0.5;
}

/* A link item is an item that navigates; it should not look like body copy. */
.kv-dropdown__item[href] {
  color: inherit;
  text-decoration: none;
}

/* Destructive entries. */
.kv-dropdown__item--danger {
  color: var(--kv-text-danger);
}

.kv-dropdown__item--danger[data-highlighted] {
  background-color: color-mix(in oklch, var(--kv-danger) 5%, transparent);
  color: var(--kv-text-danger);
}

/*
 * `inset` aligns an entry's label with the entries that have icons, so a menu
 * mixing the two reads as one column rather than two.
 */
.kv-dropdown__item--inset,
.kv-dropdown__checkbox-item,
.kv-dropdown__label--inset {
  padding-inline-start: 2rem;
}

/* Icons and indicators */

.kv-dropdown__icon {
  flex-shrink: 0;
  inline-size: 1rem;
  block-size: 1rem;
  margin-inline-end: var(--kv-space-2);
}

/* The checkbox's tick sits in the gutter that `pl-8` opens up. */
.kv-dropdown__check {
  position: absolute;
  inset-inline-start: var(--kv-space-2);
  display: flex;
  align-items: center;
  justify-content: center;
  inline-size: 0.875rem;
  block-size: 0.875rem;
  color: inherit;
}

.kv-dropdown__check > svg {
  inline-size: 0.75rem;
  block-size: 0.75rem;
}

.kv-dropdown__indicator {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-inline-start: auto;
  inline-size: 1rem;
  block-size: 1rem;
}

.kv-dropdown__indicator > svg,
.kv-dropdown__selected > svg,
.kv-dropdown__caret {
  inline-size: 100%;
  block-size: 100%;
}

/*
 * `selected` follows the label rather than being pushed to the end, as it does
 * upstream - it reads as part of the entry, not as a column of its own.
 */
.kv-dropdown__selected {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  inline-size: 1rem;
  block-size: 1rem;
}

.kv-dropdown__caret {
  flex-shrink: 0;
  margin-inline-start: auto;
  inline-size: 1rem;
  block-size: 1rem;
}

/* The caret points along the reading direction, so it turns with it. */
[dir="rtl"] .kv-dropdown__caret {
  transform: scaleX(-1);
}

.kv-dropdown__shortcut {
  margin-inline-start: auto;
  padding-inline-start: var(--kv-space-2);
  font-size: var(--kv-text-xs);
  letter-spacing: 0.1em;
  opacity: 0.6;
}

/* Headings and rules */

.kv-dropdown__label {
  padding-block: var(--kv-space-1-5);
  padding-inline: var(--kv-space-2);
  font-size: var(--kv-text-base);
  line-height: var(--kv-leading-normal);
  font-weight: 600;
}

/*
 * The rule runs wider than the entries, into the popup's own padding, so it
 * reads as a division of the menu rather than of the column of labels.
 */
.kv-dropdown__separator {
  block-size: 1px;
  margin-block: var(--kv-space-1);
  margin-inline: calc(var(--kv-space-1) * -1);
  background-color: var(--kv-hairline);
}
</style>
