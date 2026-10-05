<!-- Ported from Cloudflare Kumo's Table (MIT). See /NOTICE. -->
<script setup>
/** A semantic table with striped rows, compact and sticky headers, sticky columns and row selection. */
defineProps({
  /**
   * `auto` sizes columns to their content; `fixed` takes widths from a `<colgroup>`.
   * @values auto, fixed
   */
  layout: { type: String, default: "auto" },
});
</script>

<template>
  <table class="kv-table" :class="{ 'kv-table--fixed': layout === 'fixed' }" data-kumo-component="Table">
    <slot />
  </table>
</template>

<style>
.kv-table {
  isolation: isolate;
  inline-size: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  text-align: start;
  text-indent: 0;
  font-family: var(--kv-font-sans);
  font-size: var(--kv-text-base);
  line-height: var(--kv-leading-normal);
  color: var(--kv-text-default);
}

.kv-table--fixed {
  table-layout: fixed;
}

.kv-table td {
  padding: var(--kv-space-3);
}

.kv-table th {
  padding: var(--kv-space-3);
  border-block-end: 1px solid var(--kv-fill);
  background-color: var(--kv-surface-base);
  font-size: var(--kv-text-base);
  font-weight: 600;
  text-align: inherit;
}

.kv-table__header--compact {
  font-size: var(--kv-text-xs);
  color: var(--kv-text-strong);
}

.kv-table__header--compact th {
  padding-block: var(--kv-space-2);
  background-color: var(--kv-surface-elevated);
}

.kv-table__header--sticky th {
  position: sticky;
  inset-block-start: 0;
  z-index: 1;
}

.kv-table__head {
  position: relative;
}

.kv-table__row {
  --kv-table-row-bg: var(--kv-surface-base);
}

.kv-table__row:nth-child(even) {
  --kv-table-row-bg: var(--kv-surface-elevated);

  background-color: var(--kv-surface-elevated);
}

.kv-table__row--selected,
.kv-table__row--selected:nth-child(even) {
  --kv-table-row-bg: var(--kv-surface-tint);

  background-color: var(--kv-surface-tint);
}

.kv-table__sticky {
  --kv-table-sticky-bg: var(--kv-table-row-bg);

  position: sticky;
  z-index: 1;
  background-color: var(--kv-table-sticky-bg);
}

.kv-table th.kv-table__sticky {
  --kv-table-sticky-bg: var(--kv-surface-base);

  z-index: 2;
  background-color: var(--kv-table-sticky-bg);
}

.kv-table__header--compact th.kv-table__sticky {
  --kv-table-sticky-bg: var(--kv-surface-elevated);
}

.kv-table__sticky::before {
  content: "";
  position: absolute;
  inset-block: 0;
  inline-size: var(--kv-space-6);
  pointer-events: none;
}

.kv-table__sticky--left {
  left: 0;
}

.kv-table__sticky--left::before {
  right: calc(var(--kv-space-6) * -1);
  background-image: linear-gradient(to left, transparent, var(--kv-table-sticky-bg));
}

.kv-table__sticky--right {
  right: 0;
}

.kv-table__sticky--right::before {
  left: calc(var(--kv-space-6) * -1);
  background-image: linear-gradient(to right, transparent, var(--kv-table-sticky-bg));
}

.kv-table__resize {
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  block-size: 100%;
  inline-size: 10px;
  margin: 0;
  padding: 0;
  border: 0;
  background-color: var(--kv-surface-base);
  cursor: col-resize;
  touch-action: none;
  user-select: none;
  visibility: hidden;
  outline: none;
}

.kv-table__head:hover > .kv-table__resize,
.kv-table__resize:focus-visible {
  visibility: visible;
}

.kv-table__resize:focus-visible {
  box-shadow: 0 0 0 2px var(--kv-brand);
}

.kv-table__resize-bar {
  block-size: 1.25rem;
  inline-size: 2px;
  border-radius: var(--kv-radius-sm);
  background-color: var(--kv-hairline);
}

.kv-table__check {
  inline-size: 2.5rem;
  line-height: 1;
}

.kv-table__check-control {
  position: relative;
}

.kv-table__check-control::before {
  content: "";
  position: absolute;
  inset: calc(var(--kv-space-3) * -1);
}
</style>
