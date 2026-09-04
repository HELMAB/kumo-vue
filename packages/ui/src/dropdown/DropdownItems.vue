<!-- Ported from Cloudflare Kumo's DropdownMenu (MIT). See /NOTICE. -->
<script setup>
/**
 * The entries of a menu, or of one submenu.
 *
 * Split out of Dropdown because it recurses: a submenu's contents are a menu,
 * and rendering them means reaching back into this same template. Nothing here
 * is meant to be used on its own - Dropdown owns the state, the events and the
 * styles, and hands them down through `inject`.
 */
import { inject } from "vue";
import {
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuItemIndicator,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "reka-ui";

import { DROPDOWN_CONTEXT } from "./items.js";

defineProps({
  /** Normalised entries, from `toEntries`. */
  entries: { type: Array, required: true },
});

const menu = inject(DROPDOWN_CONTEXT);

/** Item classes: the variant and the inset both ride on the base item. */
const itemClasses = (entry) => [
  "kv-dropdown__item",
  `kv-dropdown__item--${entry.variant}`,
  { "kv-dropdown__item--inset": entry.inset },
];
</script>

<template>
  <template v-for="(entry, index) in entries" :key="index">
    <DropdownMenuSeparator
      v-if="entry.kind === 'separator'"
      class="kv-dropdown__separator"
      data-kumo-part="separator"
    />

    <DropdownMenuLabel
      v-else-if="entry.kind === 'label'"
      class="kv-dropdown__label"
      :class="{ 'kv-dropdown__label--inset': entry.inset }"
      data-kumo-part="label"
    >
      {{ entry.label }}
    </DropdownMenuLabel>

    <DropdownMenuGroup v-else-if="entry.kind === 'group'" class="kv-dropdown__group">
      <DropdownMenuLabel
        v-if="entry.label"
        class="kv-dropdown__label"
        :class="{ 'kv-dropdown__label--inset': entry.inset }"
        data-kumo-part="label"
      >
        {{ entry.label }}
      </DropdownMenuLabel>
      <DropdownItems :entries="entry.entries">
        <template #item="slotProps"><slot name="item" v-bind="slotProps" /></template>
      </DropdownItems>
    </DropdownMenuGroup>

    <DropdownMenuSub v-else-if="entry.kind === 'submenu'">
      <DropdownMenuSubTrigger
        class="kv-dropdown__subtrigger"
        :class="{ 'kv-dropdown__item--inset': entry.inset }"
        data-kumo-part="submenu-trigger"
        :disabled="entry.disabled"
      >
        <component :is="entry.icon" v-if="entry.icon" class="kv-dropdown__icon" />
        <slot name="item" :entry="entry" :item="entry.raw">{{ entry.label }}</slot>
        <!-- The caret says the entry opens rather than acts. -->
        <svg
          class="kv-dropdown__caret"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          aria-hidden="true"
        >
          <path d="m6.5 4 4 4-4 4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </DropdownMenuSubTrigger>

      <DropdownMenuPortal :to="menu.to.value">
        <DropdownMenuSubContent
          class="kv-dropdown__popup"
          data-kumo-part="submenu"
          :side-offset="menu.sideOffset.value"
        >
          <DropdownItems :entries="entry.entries">
            <template #item="slotProps"><slot name="item" v-bind="slotProps" /></template>
          </DropdownItems>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>

    <DropdownMenuCheckboxItem
      v-else-if="entry.kind === 'checkbox'"
      class="kv-dropdown__checkbox-item"
      data-kumo-part="checkbox-item"
      :disabled="entry.disabled"
      :model-value="menu.state.value[entry.value] === true"
      @update:model-value="menu.setState(entry.value, $event)"
      @select="menu.onSelect(entry, $event)"
    >
      <DropdownMenuItemIndicator class="kv-dropdown__check">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path d="m3 8.5 3.5 3.5L13 5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </DropdownMenuItemIndicator>
      <slot name="item" :entry="entry" :item="entry.raw">{{ entry.label }}</slot>
    </DropdownMenuCheckboxItem>

    <DropdownMenuRadioGroup
      v-else-if="entry.kind === 'radio'"
      class="kv-dropdown__group"
      :model-value="menu.state.value[entry.value]"
      @update:model-value="menu.setState(entry.value, $event)"
    >
      <DropdownMenuRadioItem
        v-for="option in entry.options"
        :key="String(option.value)"
        class="kv-dropdown__radio-item"
        :class="{ 'kv-dropdown__item--inset': option.inset }"
        data-kumo-part="radio-item"
        :value="option.value"
        :disabled="option.disabled || entry.disabled"
        @select="menu.onSelect(option, $event)"
      >
        <component :is="option.icon" v-if="option.icon" class="kv-dropdown__icon" />
        <slot name="item" :entry="option" :item="option.raw">{{ option.label }}</slot>
        <DropdownMenuItemIndicator class="kv-dropdown__indicator">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="m3 8.5 3.5 3.5L13 5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </DropdownMenuItemIndicator>
      </DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>

    <DropdownMenuItem
      v-else
      :class="itemClasses(entry)"
      :data-kumo-part="entry.kind === 'link' ? 'link-item' : 'item'"
      :as="entry.kind === 'link' ? 'a' : undefined"
      :href="entry.href"
      :target="entry.target"
      :rel="entry.rel"
      :disabled="entry.disabled"
      :text-value="entry.label"
      @select="menu.onSelect(entry, $event)"
    >
      <component :is="entry.icon" v-if="entry.icon" class="kv-dropdown__icon" />
      <slot name="item" :entry="entry" :item="entry.raw">{{ entry.label }}</slot>
      <span v-if="entry.shortcut" class="kv-dropdown__shortcut">{{ entry.shortcut }}</span>
      <span v-if="entry.selected" class="kv-dropdown__selected" aria-hidden="true">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="m3 8.5 3.5 3.5L13 5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    </DropdownMenuItem>
  </template>
</template>
