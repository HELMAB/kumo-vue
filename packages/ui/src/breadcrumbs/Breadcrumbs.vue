<!-- Ported from Cloudflare Kumo's Breadcrumbs (MIT). See /NOTICE. -->
<script setup>
/**
 * Breadcrumbs - the trail showing where the current page sits in a hierarchy.
 *
 *   <Breadcrumbs :items="[
 *     { label: 'Home', href: '/' },
 *     { label: 'Docs', href: '/docs' },
 *     { label: 'Breadcrumbs' },
 *   ]" />
 *
 *   <Breadcrumbs :items="trail" clipboard="https://example.com/here" loading>
 *     <template #icon="{ index }"><HomeIcon v-if="index === 0" /></template>
 *   </Breadcrumbs>
 *
 * A trail is a list, so this is `nav > ol > li` rather than the flat run of
 * divs Kumo renders. The last crumb - or any crumb marked `current` - is the
 * current page: it carries `aria-current="page"`, is the only crumb allowed to
 * truncate, and is the one `loading` applies to.
 */
import { computed, onUnmounted, ref } from "vue";

import { Button } from "../button/index.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /**
   * The trail, root first. Accepts plain strings or
   * `{ label, href, icon, current }` objects. A crumb with an `href` that is
   * not the current page renders as a link; anything else renders as text.
   */
  items: { type: Array, default: () => [] },
  /**
   * Row height and type scale.
   * @values sm, base
   */
  size: { type: String, default: "base" },
  /** Shows a shimmer in place of the current crumb's label. */
  loading: { type: Boolean, default: false },
  /** Deeplink to copy. Renders a copy button at the end of the trail. */
  clipboard: { type: String, default: "" },
  /** Element or component to render links as - `RouterLink`, say. */
  linkAs: { type: [String, Object], default: "a" },
  /** Accessible name for the navigation landmark. */
  label: { type: String, default: "Breadcrumb" },
  /** Accessible name for the copy button. */
  copyLabel: { type: String, default: "Copy link" },
  /** Announced once the deeplink is on the clipboard. */
  copiedLabel: { type: String, default: "Copied" },
});

const emit = defineEmits(["copy"]);

/**
 * Normalise the trail into `{ label, href, icon, current, raw }`.
 *
 * `current` is explicit when an item sets it and otherwise falls to the last
 * crumb, which is what a trail means: the page you are on is where it ends.
 */
const crumbs = computed(() => {
  const items = props.items.map((item, index) => {
    const source = typeof item === "object" && item !== null ? item : { label: item };
    return {
      label: String(source.label ?? ""),
      href: source.href,
      icon: source.icon,
      current: Boolean(source.current),
      index,
      raw: item,
    };
  });

  if (items.length && !items.some((crumb) => crumb.current)) {
    items[items.length - 1].current = true;
  }
  return items;
});

/**
 * Kumo drops everything but the last two crumbs on a narrow viewport, and
 * leaves an ellipsis in their place. It does that by rebuilding the child list
 * in JavaScript; here the whole trail is rendered once and CSS hides the
 * middle, so the markup does not change with the viewport and there is nothing
 * to re-run on resize. The ellipsis is only in the DOM when there is something
 * for it to stand in for.
 */
const isCollapsible = computed(() => crumbs.value.length > 2);

const rootClasses = computed(() => [
  "kv-breadcrumbs",
  `kv-breadcrumbs--size-${props.size}`,
]);

const isLink = (crumb) => Boolean(crumb.href) && !crumb.current;

/**
 * Routers take a `to`; a plain anchor takes an `href`. Kumo hands its link
 * component both and lets it pick, which quietly puts a stale `href` on a
 * router link. One or the other is bound here instead.
 */
const linkProps = (crumb) =>
  props.linkAs === "a" ? { href: crumb.href } : { to: crumb.href };

/* ---- Clipboard --------------------------------------------------------- */

const isCopied = ref(false);
let resetTimer;

onUnmounted(() => clearTimeout(resetTimer));

async function copy() {
  if (!props.clipboard) return;

  try {
    await navigator.clipboard.writeText(props.clipboard);
    isCopied.value = true;
    emit("copy", props.clipboard);

    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  } catch (error) {
    console.error("Failed to copy deeplink:", error);
  }
}
</script>

<template>
  <nav
    v-bind="$attrs"
    :class="rootClasses"
    :aria-label="label"
    data-kumo-component="Breadcrumbs"
  >
    <ol class="kv-breadcrumbs__list">
      <li v-if="isCollapsible" class="kv-breadcrumbs__crumb kv-breadcrumbs__crumb--ellipsis">
        <span class="kv-breadcrumbs__ellipsis" aria-hidden="true">…</span>
        <span class="kv-breadcrumbs__separator" aria-hidden="true">
          <slot name="separator">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M10.75 8.75 14.25 12l-3.5 3.25"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </slot>
        </span>
      </li>

      <li
        v-for="crumb in crumbs"
        :key="crumb.index"
        class="kv-breadcrumbs__crumb"
        :class="{ 'kv-breadcrumbs__crumb--current': crumb.current }"
      >
        <component
          :is="isLink(crumb) ? linkAs : 'span'"
          v-bind="isLink(crumb) ? linkProps(crumb) : {}"
          class="kv-breadcrumbs__item"
          :data-kumo-part="isLink(crumb) ? 'link' : 'current'"
          :aria-current="crumb.current ? 'page' : undefined"
          :aria-busy="crumb.current && loading ? 'true' : undefined"
        >
          <span v-if="$slots.icon || crumb.icon" class="kv-breadcrumbs__icon">
            <slot name="icon" :item="crumb.raw" :crumb="crumb" :index="crumb.index">
              <component :is="crumb.icon" v-if="crumb.icon" />
            </slot>
          </span>

          <span
            v-if="crumb.current && loading"
            class="kv-breadcrumbs__skeleton"
            aria-hidden="true"
          />
          <span v-else class="kv-breadcrumbs__label">
            <slot name="item" :item="crumb.raw" :crumb="crumb" :index="crumb.index">
              {{ crumb.label }}
            </slot>
          </span>
        </component>

        <span
          v-if="crumb.index < crumbs.length - 1"
          class="kv-breadcrumbs__separator"
          aria-hidden="true"
        >
          <slot name="separator">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M10.75 8.75 14.25 12l-3.5 3.25"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </slot>
        </span>
      </li>

      <li v-if="clipboard" class="kv-breadcrumbs__crumb kv-breadcrumbs__crumb--clipboard">
        <Button
          variant="ghost"
          shape="square"
          size="sm"
          class="kv-breadcrumbs__copy"
          :aria-label="isCopied ? copiedLabel : copyLabel"
          :title="copyLabel"
          @click="copy"
        >
          <template #icon>
            <svg v-if="isCopied" class="kv-breadcrumbs__copied" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="m3 8.5 3.5 3.5L13 5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <svg v-else viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="5.75" y="5.75" width="8.5" height="8.5" rx="2" stroke="currentColor" stroke-width="1.5" />
              <path
                d="M10.25 5.5v-1.5a2 2 0 0 0-2-2h-4.5a2 2 0 0 0-2 2v4.5a2 2 0 0 0 2 2h1.5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </template>
        </Button>
      </li>
    </ol>
  </nav>
</template>

<style>
/*
 * Logical properties throughout, so the trail mirrors under dir="rtl" without
 * a second stylesheet - the separator chevron included, which is flipped below
 * rather than swapped for a mirrored glyph.
 */
.kv-breadcrumbs {
  --kv-breadcrumbs-height: 3rem;
  --kv-breadcrumbs-gap: var(--kv-space-1);
  --kv-breadcrumbs-font-size: var(--kv-text-base);
  --kv-breadcrumbs-icon: 1rem;

  display: flex;
  align-items: center;
  min-inline-size: 0;
  flex-grow: 1;
  margin-inline-end: var(--kv-space-4);
  overflow: hidden;

  block-size: var(--kv-breadcrumbs-height);
  font-family: var(--kv-font-sans);
  font-size: var(--kv-breadcrumbs-font-size);
  line-height: var(--kv-leading-normal);
  white-space: nowrap;
}

.kv-breadcrumbs--size-sm {
  --kv-breadcrumbs-height: 2.5rem;
  --kv-breadcrumbs-gap: var(--kv-space-0-5);
  --kv-breadcrumbs-font-size: var(--kv-text-sm);
  --kv-breadcrumbs-icon: 0.875rem;
}

.kv-breadcrumbs__list {
  display: flex;
  align-items: center;
  min-inline-size: 0;
  gap: var(--kv-breadcrumbs-gap);
  margin: 0;
  padding: 0;
  list-style: none;
}

.kv-breadcrumbs__crumb {
  display: flex;
  align-items: center;
  gap: var(--kv-breadcrumbs-gap);
  /*
   * Ancestors do not shrink. Letting every crumb truncate proportionally turns
   * the whole trail into unreadable stubs ("Com… > Anal… > Acco…"); the current
   * page is the only crumb allowed to give up width.
   */
  flex-shrink: 0;
}

.kv-breadcrumbs__crumb--current {
  min-inline-size: 0;
  flex-shrink: 1;
}

.kv-breadcrumbs__item {
  display: flex;
  align-items: center;
  min-inline-size: 0;
  gap: var(--kv-space-1);
  color: var(--kv-text-subtle);
  text-decoration: none;
}

.kv-breadcrumbs__crumb--current .kv-breadcrumbs__item {
  max-inline-size: 100%;
  color: var(--kv-text-default);
  font-weight: 500;
}

/* Links are interactive, so they say so on hover - Kumo leaves them static. */
a.kv-breadcrumbs__item:hover {
  color: var(--kv-text-default);
  text-decoration: underline;
}

a.kv-breadcrumbs__item:focus-visible {
  outline: 2px solid var(--kv-focus);
  outline-offset: 2px;
  border-radius: var(--kv-radius-sm);
}

.kv-breadcrumbs__label {
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kv-breadcrumbs__icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  inline-size: var(--kv-breadcrumbs-icon);
  block-size: var(--kv-breadcrumbs-icon);
}

.kv-breadcrumbs__icon > svg {
  inline-size: 100%;
  block-size: 100%;
}

.kv-breadcrumbs__separator {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  inline-size: 1.25rem;
  block-size: 1.25rem;
  color: var(--kv-text-inactive);
}

.kv-breadcrumbs__separator > svg {
  inline-size: 100%;
  block-size: 100%;
}

/* The chevron points along the reading direction, so it turns with it. */
[dir="rtl"] .kv-breadcrumbs__separator > svg {
  transform: scaleX(-1);
}

.kv-breadcrumbs__ellipsis {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: var(--kv-text-subtle);
}

/* ---- Loading ----------------------------------------------------------- */

.kv-breadcrumbs__skeleton {
  inline-size: 7.8125rem;
  block-size: 0.75em;
  border-radius: var(--kv-radius-sm);
  background: linear-gradient(
    90deg,
    var(--kv-fill) 0%,
    var(--kv-surface-tint) 50%,
    var(--kv-fill) 100%
  );
  background-size: 200% 100%;
  animation: kv-breadcrumbs-shimmer 1.5s ease-in-out infinite;
}

@keyframes kv-breadcrumbs-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .kv-breadcrumbs__skeleton {
    animation: none;
  }
}

/* ---- Clipboard --------------------------------------------------------- */

/*
 * Kumo reveals the copy button on hover alone, which leaves it invisible to
 * anyone tabbing to it. It is revealed on keyboard focus here too, and stays
 * visible for the two seconds it is confirming a copy.
 */
.kv-breadcrumbs__copy {
  opacity: 0;
  transition: opacity 100ms ease;
}

.kv-breadcrumbs:hover .kv-breadcrumbs__copy,
.kv-breadcrumbs__copy:focus-visible {
  opacity: 1;
}

.kv-breadcrumbs__copy:has(.kv-breadcrumbs__copied) {
  opacity: 1;
}

.kv-breadcrumbs__copied {
  color: var(--kv-text-success);
}

@media (prefers-reduced-motion: reduce) {
  .kv-breadcrumbs__copy {
    transition: none;
  }
}

/* ---- Narrow viewports -------------------------------------------------- */

/*
 * Below Kumo's `sm` breakpoint only the parent and the current page survive,
 * with an ellipsis standing in for the rest.
 */
@media (max-width: 639px) {
  .kv-breadcrumbs:not(:has(.kv-breadcrumbs__crumb--clipboard))
    .kv-breadcrumbs__crumb:not(.kv-breadcrumbs__crumb--ellipsis):not(:nth-last-child(-n + 2)) {
    display: none;
  }

  /* The copy button is the last child when present, so it shifts the count. */
  .kv-breadcrumbs:has(.kv-breadcrumbs__crumb--clipboard)
    .kv-breadcrumbs__crumb:not(.kv-breadcrumbs__crumb--ellipsis):not(:nth-last-child(-n + 3)) {
    display: none;
  }
}

@media (min-width: 640px) {
  .kv-breadcrumbs__crumb--ellipsis {
    display: none;
  }
}
</style>
