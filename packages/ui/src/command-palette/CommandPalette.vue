<!-- Ported from Cloudflare Kumo's CommandPalette (MIT). See /NOTICE. -->
<script setup>
/**
 * CommandPalette - the ⌘K overlay: a search field over a list of commands.
 *
 *   <CommandPalette v-model:open="open" :items="commands" @select="run" />
 *
 *   <CommandPalette v-model:open="open" v-model:search="query" :items="results"
 *                   ignore-filter :loading="pending">
 *     <template #footer>
 *       <span><kbd class="kv-command-palette__key">↑↓</kbd> Navigate</span>
 *       <span><kbd class="kv-command-palette__key">⌘↵</kbd> Open in new tab</span>
 *     </template>
 *   </CommandPalette>
 *
 * Built on Reka UI's Dialog and Combobox primitives, the counterparts to the
 * Base UI ones Kumo builds on: between them they own the modal, the focus
 * trap, the filtering, arrow-key navigation, and the `role="listbox"` /
 * `aria-activedescendant` contract that makes an input drive a list.
 *
 * Kumo composes fifteen components and two render props. Here the palette is
 * the `items` prop and a handful of slots, the same flattening Dropdown and
 * Select make; `items.js` has the shape of a command.
 */
import { computed, nextTick, onMounted, ref, watch } from "vue";
import {
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxRoot,
  ComboboxViewport,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "reka-ui";

import { toCommandGroups, toFlatCommands, toMatchRanges, toSegments } from "./items.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** Controlled open state. Leave unset to let the component manage it. */
  open: { type: Boolean, default: undefined },
  /** Open state on first render, for the uncontrolled case. */
  defaultOpen: { type: Boolean, default: false },
  /**
   * The commands. Accepts plain strings, command objects, or
   * `{ label, items }` groups - grouping is a shape here rather than the
   * separate Group and GroupLabel components Kumo exposes. See `items.js`.
   */
  items: { type: Array, default: () => [] },
  /** Controlled search text. Leave unset and the palette keeps its own. */
  search: { type: String, default: undefined },
  placeholder: { type: String, default: "Type a command or search…" },
  /** Shown when nothing matches. */
  emptyMessage: { type: String, default: "No results found" },
  /** Swaps the list for a spinner, for results that are still on their way. */
  loading: { type: Boolean, default: false },
  /**
   * Turn off the built-in filtering, for lists you filter yourself - a server
   * query, a fuzzy match - and `items` is rendered exactly as given.
   */
  ignoreFilter: { type: Boolean, default: false },
  /** Close the palette when a command is chosen. */
  closeOnSelect: { type: Boolean, default: true },
  /**
   * Show an arrow at the end of the highlighted row. Kumo's basic `Item` has
   * none and its `ResultItem` does; this is that choice, made once for the
   * palette. A command's own `arrow` overrides it either way.
   */
  arrows: { type: Boolean, default: false },
  /** Accessible name for the dialog. */
  label: { type: String, default: "Command palette" },
  /**
   * Writing direction. Leave unset and the palette follows the direction where
   * it was written, which is not what it would inherit from the portal.
   * @values ltr, rtl
   */
  dir: { type: String, default: undefined },
  /** Where the palette is portalled to. */
  to: { type: [String, Object], default: "body" },
});

const emit = defineEmits(["select", "highlight", "update:open", "update:search"]);

/* Open and search state */

/*
 * Both work the same way, and the same way Dropdown's do: a controlled prop
 * wins, and without one the palette keeps its own.
 */
const uncontrolledOpen = ref(props.defaultOpen);
const isOpen = computed(() => props.open ?? uncontrolledOpen.value);

const uncontrolledSearch = ref("");
const query = computed(() => props.search ?? uncontrolledSearch.value);

function setSearch(value) {
  /* Reka re-announces the field's value on mount and after a reset. Reporting
     a change that is not one would have a controlled page writing back what it
     already holds. */
  if (value === query.value) return;
  uncontrolledSearch.value = value;
  emit("update:search", value);
}

function setOpen(value) {
  uncontrolledOpen.value = value;
  emit("update:open", value);
}

/*
 * A palette that reopens still showing the last search is a palette you have to
 * clear before you can use it. Kumo's own examples reset the search by hand on
 * every select; here closing does it - and from a watcher rather than from
 * `setOpen`, so it happens however the palette was closed, including a page
 * setting `open` to false itself.
 */
watch(isOpen, (open) => {
  if (!open && query.value) setSearch("");
});

/* Commands */

const groups = computed(() => toCommandGroups(props.items));
const flat = computed(() => toFlatCommands(groups.value));

/**
 * What the marks go around. An explicit set of ranges on the command wins -
 * that is the hook for a fuzzy or server-side match, and Kumo's only mode -
 * and otherwise the query is found in the text, which is the same substring
 * test the filter just ran.
 */
function segmentsFor(text, ranges) {
  if (props.ignoreFilter && !ranges) return [{ text, match: false }];
  return toSegments(text, ranges ?? toMatchRanges(text, query.value));
}

/* Selection */

const comboboxRef = ref();
const highlighted = ref();

/**
 * Reka reports the highlighted entry as a collection item, not as ours. The
 * index written onto the element is the way back - matching on the text would
 * pick the wrong command whenever two of them read the same.
 */
function onHighlight(entry) {
  const index = entry?.ref?.dataset?.kvIndex;
  highlighted.value = index === undefined ? undefined : flat.value[Number(index)];
  emit("highlight", highlighted.value);
}

function choose(command, newTab) {
  if (!command || command.disabled) return;
  emit("select", command, { newTab });
  if (props.closeOnSelect) setOpen(false);
}

/**
 * One handler for the mouse and for Enter alike: Reka turns Enter on the
 * highlighted row into a click, and the click is what raises this. Preventing
 * it stops Reka closing its own listbox and recording a selected value -
 * neither of which a palette wants, since a command is run rather than chosen.
 */
function onSelect(command, event) {
  event.preventDefault();
  const original = event.detail?.originalEvent;
  choose(command, Boolean(original?.metaKey || original?.ctrlKey));
}

/**
 * Cmd/Ctrl+Enter opens in a new tab. Reka deliberately ignores Enter with a
 * modifier held, which leaves the combination free for exactly this - the same
 * split Kumo makes.
 */
function onKeydown(event) {
  if (event.key !== "Enter" || !(event.metaKey || event.ctrlKey)) return;
  if (!highlighted.value) return;
  event.preventDefault();
  choose(highlighted.value, true);
}

/* Direction through the portal */

/*
 * A portalled palette hangs off the body, so a writing direction set on part of
 * the page never reaches it - the same crossing Dialog makes. Read from the
 * document rather than from a trigger, since a palette has none, and read on
 * opening rather than during render: rendering has to be the same on a server,
 * where there is no document to ask.
 *
 * It goes onto the combobox as well as the panel. Reka's combobox writes a
 * direction of its own - `ltr` unless it is told otherwise - onto the element
 * it renders between the two, which would undo the panel's.
 */
const resolvedDir = ref(props.dir);

function readDir() {
  if (props.dir) {
    resolvedDir.value = props.dir;
    return;
  }

  const declared = document.documentElement.getAttribute("dir");
  resolvedDir.value =
    declared === "rtl" || declared === "ltr"
      ? declared
      : getComputedStyle(document.documentElement).direction;
}

watch(() => props.dir, readDir);

/* Wiring that only exists once the palette is on screen */

const listRef = ref();

/**
 * Reka gives the list its id when the list first renders, which is after the
 * search field has already rendered pointing `aria-controls` at an id that
 * does not exist yet - an empty IDREF, which is invalid rather than merely
 * unhelpful. Reading it back and binding it ourselves fixes it: a fall-through
 * attribute wins over the primitive's own, and until it is read the attribute
 * is absent rather than empty.
 */
const listId = ref();

/*
 * Reka highlights the first row when the query changes, and when a combobox
 * opens - but this one is open from the moment it exists, and results that
 * arrive later do not change the query, so the first highlight has to be asked
 * for. Kumo's `autoHighlight="always"`.
 */
function sync() {
  readDir();
  nextTick(() => {
    listId.value = listRef.value?.$el?.id || undefined;
    if (isOpen.value && !props.loading) comboboxRef.value?.highlightFirstItem?.();
  });
}

onMounted(sync);
watch(() => [isOpen.value, props.loading, props.items], sync, { flush: "post" });

/**
 * Reka's combobox closes itself on a dismissal - Escape, or a pointer outside
 * the panel. The listbox has nowhere to go, so what that means here is that
 * the dialog should close.
 */
function onComboboxOpenChange(value) {
  if (!value) setOpen(false);
}

/**
 * The dialog would otherwise focus the first thing it finds; in a palette that
 * is the search field, always, and saying so is cheaper than relying on the
 * field staying first.
 */
const inputRef = ref();

function onOpenAutoFocus(event) {
  event.preventDefault();
  nextTick(() => inputRef.value?.$el?.focus?.());
}

/**
 * Reka points `aria-describedby` at a description id whether or not a
 * description was rendered. There is never one here, so the binding is dropped
 * rather than left dangling - the same `null` Dialog uses.
 */
const describedByAttrs = { "aria-describedby": null };
</script>

<template>
  <DialogRoot :open="isOpen" modal @update:open="setOpen">
    <DialogPortal :to="to">
      <DialogOverlay class="kv-command-palette__backdrop" data-kumo-part="backdrop" />

      <DialogContent
        v-bind="{ ...describedByAttrs, ...$attrs }"
        class="kv-command-palette"
        data-kumo-component="CommandPalette"
        :dir="resolvedDir"
        @open-auto-focus="onOpenAutoFocus"
      >
        <!--
          Everything lives inside the combobox, footer included. Reka hides the
          rest of the page from assistive tech relative to this element, and
          treats a pointer press outside it as a dismissal - so a part of the
          panel left outside would be both unreadable and a way to close the
          palette by clicking it.
        -->
        <ComboboxRoot
          ref="comboboxRef"
          class="kv-command-palette__combobox"
          :open="true"
          :dir="resolvedDir"
          :ignore-filter="ignoreFilter"
          @update:open="onComboboxOpenChange"
          @highlight="onHighlight"
        >
          <!--
            Inside the combobox, not beside it: Reka marks everything outside
            this element `aria-hidden`, and the dialog's name has to be readable
            to be a name.
          -->
          <DialogTitle class="kv-command-palette__title">{{ label }}</DialogTitle>

          <div class="kv-command-palette__header" data-kumo-part="header">
            <slot name="leading">
              <svg
                class="kv-command-palette__search-icon"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                aria-hidden="true"
                focusable="false"
              >
                <circle cx="7" cy="7" r="4.25" />
                <path d="m10.25 10.25 3 3" stroke-linecap="round" />
              </svg>
            </slot>

            <ComboboxInput
              ref="inputRef"
              :model-value="query"
              class="kv-command-palette__input"
              :placeholder="placeholder"
              :aria-controls="listId"
              auto-complete="off"
              auto-correct="off"
              auto-capitalize="none"
              :spellcheck="false"
              data-1p-ignore="true"
              data-lpignore="true"
              data-form-type="other"
              @update:model-value="setSearch"
              @keydown="onKeydown"
            />

            <slot name="trailing" />
          </div>

          <div v-if="loading" class="kv-command-palette__loading" data-kumo-part="loading">
            <slot name="loading">
              <svg
                class="kv-command-palette__spinner"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.25" />
                <path
                  d="M12 2.5a9.5 9.5 0 0 1 9.5 9.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                />
              </svg>
            </slot>
          </div>

          <ComboboxContent v-else ref="listRef" class="kv-command-palette__list" data-kumo-part="list">
            <ComboboxViewport class="kv-command-palette__viewport">
              <ComboboxEmpty v-if="emptyMessage || $slots.empty" class="kv-command-palette__empty">
                <slot name="empty">{{ emptyMessage }}</slot>
              </ComboboxEmpty>

              <ComboboxGroup
                v-for="(group, index) in groups"
                :key="group.label || index"
                class="kv-command-palette__group"
              >
                <ComboboxLabel v-if="group.label" class="kv-command-palette__group-label">
                  {{ group.label }}
                </ComboboxLabel>

                <ComboboxItem
                  v-for="command in group.commands"
                  :key="command.index"
                  class="kv-command-palette__item"
                  data-kumo-part="item"
                  :data-kv-index="command.index"
                  :value="command.search"
                  :disabled="command.disabled"
                  @select="onSelect(command, $event)"
                >
                  <slot name="item" :command="command" :item="command.raw">
                    <span v-if="command.icon" class="kv-command-palette__icon">
                      <component :is="command.icon" />
                    </span>

                    <span class="kv-command-palette__body">
                      <!--
                        The trail and the title read as one line, with the
                        carets between them turning with the reading direction.
                      -->
                      <template v-for="(crumb, at) in command.breadcrumbs" :key="at">
                        <span class="kv-command-palette__crumb">
                          <template
                            v-for="(segment, part) in segmentsFor(crumb, command.breadcrumbHighlights?.[at])"
                            :key="part"
                          >
                            <mark v-if="segment.match" class="kv-command-palette__mark">{{ segment.text }}</mark>
                            <template v-else>{{ segment.text }}</template>
                          </template>
                        </span>
                        <svg
                          class="kv-command-palette__crumb-caret"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <path d="m6.5 4 4 4-4 4" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                      </template>

                      <span class="kv-command-palette__label">
                        <template
                          v-for="(segment, part) in segmentsFor(command.label, command.highlights)"
                          :key="part"
                        >
                          <mark v-if="segment.match" class="kv-command-palette__mark">{{ segment.text }}</mark>
                          <template v-else>{{ segment.text }}</template>
                        </template>
                      </span>

                      <svg
                        v-if="command.external"
                        class="kv-command-palette__external"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path d="M6.5 3.5h-3v9h9v-3M9.5 3.5h3v3M12.5 3.5 7 9" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>

                      <span v-if="command.description" class="kv-command-palette__description">
                        <span aria-hidden="true">—</span> {{ command.description }}
                      </span>
                    </span>

                    <svg
                      v-if="(command.arrow ?? arrows) && !command.external && !command.disabled"
                      class="kv-command-palette__arrow"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.75"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M3 8h10M9.5 4.5 13 8l-3.5 3.5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </slot>
                </ComboboxItem>
              </ComboboxGroup>
            </ComboboxViewport>
          </ComboboxContent>

          <div v-if="$slots.footer" class="kv-command-palette__footer" data-kumo-part="footer">
            <slot name="footer" />
          </div>
        </ComboboxRoot>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style>
/*
 * The palette is portalled, so none of this is scoped to the component's
 * element - as with every other overlay in this library. Logical properties
 * throughout, so the icons and the trail mirror under `dir="rtl"`.
 */

.kv-command-palette__backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  /*
   * The recessed surface at 80%, the same scrim the Dialog draws - so the two
   * overlays dim the page identically, and it lightens in light mode as Kumo's
   * does. Upstream names `bg-kumo-overlay` here, but `overlay` in this port's
   * token vocabulary is the wash under a highlighted row, which at 80% over a
   * light page is no scrim at all.
   */
  background-color: color-mix(in oklch, var(--kv-surface-recessed) 80%, transparent);
  animation: kv-command-palette-backdrop-in 150ms ease;
}

.kv-command-palette__backdrop[data-state="closed"] {
  animation: kv-command-palette-backdrop-out 120ms ease;
}

/* Panel */

.kv-command-palette {
  position: fixed;
  z-index: 51;

  /*
   * A tenth of the way down, as Kumo has it: high enough that the list grows
   * into space the eye is already on. The horizontal centring is `inset-inline`
   * plus `margin-inline: auto` rather than Kumo's `left-1/2 -translate-x-1/2`,
   * which is physical - in RTL that translate would drag the panel a whole
   * width off-centre.
   */
  inset-block-start: 10vh;
  inset-inline: 0;
  margin-inline: auto;
  inline-size: calc(100% - var(--kv-space-8));
  max-inline-size: 42rem;
  /* Kumo's `max-h-[60vh]`, measured against the viewport that is actually
     there - `dvh` rather than `vh`, so a phone's address bar cannot cut the
     list off. */
  max-block-size: 60dvh;

  display: flex;
  flex-direction: column;
  overflow: hidden;

  /* The width is the panel's, border included, as it is under Tailwind's
     preflight - which this library does not assume is present. */
  box-sizing: border-box;

  background-color: var(--kv-surface-elevated);
  color: var(--kv-text-default);
  border-radius: var(--kv-radius-lg);
  /*
   * A hairline and the resting 1px drop - Kumo's `ring-kumo-line shadow-xs`,
   * not the elevated float a Dialog gets. The palette sits close to the page.
   */
  box-shadow:
    0 0 0 1px var(--kv-line),
    0 1px 2px 0 var(--kv-shadow-drop);
  font-family: var(--kv-font-sans);
  outline: none;

  animation: kv-command-palette-in 150ms ease;
}

.kv-command-palette[data-state="closed"] {
  animation: kv-command-palette-out 120ms ease;
}

@keyframes kv-command-palette-backdrop-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes kv-command-palette-backdrop-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes kv-command-palette-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes kv-command-palette-out {
  from {
    opacity: 1;
    transform: none;
  }
  to {
    opacity: 0;
    transform: scale(0.9);
  }
}

@media (prefers-reduced-motion: reduce) {
  .kv-command-palette,
  .kv-command-palette[data-state="closed"],
  .kv-command-palette__backdrop,
  .kv-command-palette__backdrop[data-state="closed"] {
    animation: none;
  }
}

/* The dialog's name, which is never drawn. */
.kv-command-palette__title {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/*
 * Reka's combobox renders an element of its own between the panel and its
 * parts, so the column has to pass through it.
 */
.kv-command-palette__combobox {
  display: flex;
  flex-direction: column;
  min-block-size: 0;
  flex: 1;
}

/* Search header */

.kv-command-palette__header {
  display: flex;
  align-items: center;
  flex: none;
  gap: var(--kv-space-3);
  padding-block: var(--kv-space-3);
  padding-inline: var(--kv-space-4);
  background-color: var(--kv-surface-base);
}

/*
 * Kumo rings the whole header while the field inside it has focus - which, in
 * an open palette, is always. The ring is outset and the panel clips, so what
 * survives is a 2px brand line beneath the search row. That is what upstream
 * renders, and it is the separator between the field and the results.
 */
.kv-command-palette__header:focus-within {
  box-shadow: 0 0 0 2px var(--kv-brand);
}

.kv-command-palette__search-icon {
  flex: none;
  inline-size: 1rem;
  block-size: 1rem;
  color: var(--kv-text-subtle);
}

.kv-command-palette__input {
  flex: 1;
  min-inline-size: 0;
  margin: 0;
  padding: 0;
  border: 0;
  background-color: transparent;
  color: var(--kv-text-default);
  font-family: inherit;
  font-size: var(--kv-text-base);
  line-height: var(--kv-leading-normal);
  outline: none;
}

.kv-command-palette__input::placeholder {
  color: var(--kv-text-placeholder);
  opacity: 1;
}

/* Results */

.kv-command-palette__list {
  /* Reka sets `display: flex; flex-direction: column` inline on this element,
     so only what it does not set belongs here. */
  min-block-size: 0;
  flex: 1;
  background-color: var(--kv-surface-base);
  /*
   * Outset, so the panel clips it to the one edge that is not against the
   * panel's own - a hairline between the search row and the results, which is
   * what upstream's `ring-1 ring-kumo-hairline` comes out as.
   */
  box-shadow: 0 0 0 1px var(--kv-hairline);
}

.kv-command-palette__viewport {
  min-block-size: 0;
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: var(--kv-space-2);
  /* Keeps a row from stopping flush against the clipped edge when the arrow
     keys scroll it into view. */
  scroll-padding-block: var(--kv-space-2);
}

/* Groups */

.kv-command-palette__group + .kv-command-palette__group {
  margin-block-start: var(--kv-space-3);
}

.kv-command-palette__group-label {
  display: block;
  margin-block-end: var(--kv-space-2);
  padding-block-start: var(--kv-space-1);
  padding-inline: var(--kv-space-2);
  color: var(--kv-text-subtle);
  font-size: var(--kv-text-xs);
  font-weight: 600;
}

/* Rows */

.kv-command-palette__item {
  display: flex;
  align-items: center;
  gap: var(--kv-space-3);
  inline-size: 100%;
  box-sizing: border-box;

  padding-block: var(--kv-space-1-5);
  padding-inline: var(--kv-space-2);

  border-radius: var(--kv-radius-lg);
  font-size: var(--kv-text-base);
  line-height: var(--kv-leading-normal);
  text-align: start;
  cursor: pointer;
  outline: none;
  transition: background-color 100ms ease;
}

.kv-command-palette__item + .kv-command-palette__item {
  margin-block-start: var(--kv-space-0-5);
}

/*
 * The highlight is the affordance, as it is upstream. Reka points at the row
 * with `aria-activedescendant` and leaves DOM focus in the search field, which
 * is what lets you keep typing while you walk the list.
 */
.kv-command-palette__item[data-highlighted] {
  background-color: var(--kv-surface-overlay);
}

.kv-command-palette__item[data-disabled] {
  cursor: default;
  opacity: 0.5;
}

.kv-command-palette__icon {
  display: flex;
  align-items: center;
  flex: none;
  inline-size: 1rem;
  block-size: 1rem;
  color: var(--kv-text-subtle);
}

.kv-command-palette__icon > svg {
  inline-size: 100%;
  block-size: 100%;
}

/*
 * The trail, the title and anything after it are one line that runs out of
 * room together, rather than a title that truncates while the trail keeps its
 * width.
 */
.kv-command-palette__body {
  display: flex;
  align-items: center;
  gap: var(--kv-space-2);
  flex: 1;
  min-inline-size: 0;
  overflow: hidden;
  white-space: nowrap;
}

.kv-command-palette__crumb {
  flex: none;
  color: var(--kv-text-default);
}

.kv-command-palette__crumb-caret {
  flex: none;
  inline-size: 0.75rem;
  block-size: 0.75rem;
  color: var(--kv-text-subtle);
  /* The caret points along the reading direction, so it turns with it. */
  margin-inline-start: calc(var(--kv-space-2) * -1);
}

[dir="rtl"] .kv-command-palette__crumb-caret {
  transform: scaleX(-1);
}

.kv-command-palette__label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.kv-command-palette__external {
  flex: none;
  inline-size: 0.875rem;
  block-size: 0.875rem;
  color: var(--kv-text-subtle);
}

.kv-command-palette__description {
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--kv-text-subtle);
  font-size: var(--kv-text-sm);
}

/*
 * The marked run of a match. Kumo tints it with the warning colour at half
 * strength, which is a highlighter pen rather than a warning.
 */
.kv-command-palette__mark {
  background-color: color-mix(in oklch, var(--kv-warning) 50%, transparent);
  color: var(--kv-text-default);
  border-radius: var(--kv-radius-sm);
}

/* The arrow appears on the row you are on, and says Enter goes there. */
.kv-command-palette__arrow {
  flex: none;
  inline-size: 1rem;
  block-size: 1rem;
  color: var(--kv-text-subtle);
  opacity: 0;
  transition: opacity 100ms ease;
}

[dir="rtl"] .kv-command-palette__arrow {
  transform: scaleX(-1);
}

.kv-command-palette__item[data-highlighted] .kv-command-palette__arrow {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .kv-command-palette__item,
  .kv-command-palette__arrow {
    transition: none;
  }
}

/* Empty and loading */

.kv-command-palette__empty,
.kv-command-palette__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--kv-space-8);
  color: var(--kv-text-subtle);
  text-align: center;
}

.kv-command-palette__loading {
  flex: 1;
  background-color: var(--kv-surface-base);
  box-shadow: 0 0 0 1px var(--kv-hairline);
}

.kv-command-palette__spinner {
  inline-size: 1.5rem;
  block-size: 1.5rem;
  animation: kv-command-palette-spin 700ms linear infinite;
}

@keyframes kv-command-palette-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .kv-command-palette__spinner {
    animation-duration: 2.4s;
  }
}

/* Footer */

.kv-command-palette__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  gap: var(--kv-space-4);
  padding-block: var(--kv-space-3);
  padding-inline: var(--kv-space-4);
  background-color: var(--kv-surface-elevated);
  color: var(--kv-text-subtle);
  font-size: var(--kv-text-xs);
}

/*
 * There are no default keyboard hints - they are words, and words are the
 * consumer's to translate. What is provided is the key cap, so writing them
 * does not mean reinventing this.
 */
.kv-command-palette__key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-inline-size: 1.5rem;
  padding-block: 0.125rem;
  padding-inline: var(--kv-space-1-5);
  border: 1px solid var(--kv-hairline);
  border-radius: var(--kv-radius-sm);
  background-color: var(--kv-surface-base);
  color: inherit;
  font-family: inherit;
  font-size: 0.625rem;
  line-height: var(--kv-leading-normal);
}
</style>
