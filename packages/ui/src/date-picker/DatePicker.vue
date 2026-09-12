<!-- Ported from Cloudflare Kumo's DatePicker (MIT). See /NOTICE. -->
<script setup>
/**
 * DatePicker - a calendar, for one date, several, or a range.
 *
 *   <DatePicker v-model="date" />
 *   <DatePicker v-model="dates" mode="multiple" :max="5" />
 *   <DatePicker v-model="range" mode="range" :number-of-months="2" />
 *
 * The model is plain `Date` objects throughout - one, an array, or
 * `{ from, to }` - which is the API Kumo has, because react-day-picker has it.
 *
 * Built on Reka UI's Calendar and RangeCalendar primitives. Kumo wraps
 * react-day-picker and styles its class names; there is no react-day-picker
 * for Vue, so the markup is Reka's and the design is Kumo's. Reka owns the
 * grid, the arrow-key roving focus, the range logic and the ARIA contract;
 * `dates.js` owns the translation between `Date` and the calendar values Reka
 * works in.
 */
import { computed, onMounted, ref, watch } from "vue";
import {
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarNext,
  CalendarPrev,
  CalendarRoot,
  RangeCalendarCell,
  RangeCalendarCellTrigger,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHead,
  RangeCalendarGridRow,
  RangeCalendarHeadCell,
  RangeCalendarNext,
  RangeCalendarPrev,
  RangeCalendarRoot,
} from "reka-ui";

import {
  daysBetween,
  fromCalendarValue,
  toCalendarDate,
  toCalendarValue,
  toDateMatcher,
  toJsDate,
} from "./dates.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /**
   * What a click selects.
   * @values single, multiple, range
   */
  mode: { type: String, default: "single" },
  /**
   * The selection: a `Date` for `single`, a `Date[]` for `multiple`, and
   * `{ from, to }` for `range`.
   */
  modelValue: { type: [Date, Array, Object], default: undefined },
  /** Months shown side by side. Kumo pairs `range` with two. */
  numberOfMonths: { type: Number, default: 1 },
  /** The month on show. Bind `v-model:month` to drive it from the page. */
  month: { type: Date, default: undefined },
  /**
   * Days that cannot be chosen: `true` for all of them, a list, or a
   * predicate taking a `Date`. Kumo's matcher, less the shapes
   * react-day-picker adds on top.
   */
  disabled: { type: [Boolean, Array, Function], default: false },
  /** Nothing before this day, and nothing after that one. */
  minDate: { type: Date, default: undefined },
  maxDate: { type: Date, default: undefined },
  /** `multiple`: fewest days selectable. `range`: shortest range, in nights. */
  min: { type: Number, default: undefined },
  /** `multiple`: most days selectable. `range`: longest range, in nights. */
  max: { type: Number, default: undefined },
  /** Always six rows, so the calendar does not change height month to month. */
  fixedWeeks: { type: Boolean, default: false },
  /** Draw the days either side that fill out the first and last weeks. */
  showOutsideDays: { type: Boolean, default: true },
  /** 0 is Sunday. Left unset, the locale decides. */
  weekStartsOn: { type: Number, default: undefined },
  /**
   * How the weekday headings read. Kumo's calendar shows `Su`.
   * @values narrow, short, long
   */
  weekdayFormat: { type: String, default: "short" },
  /** A BCP-47 tag. Names the months and weekdays, and orders the week. */
  locale: { type: String, default: undefined },
  /** Shows a selection without letting it be changed. */
  readonly: { type: Boolean, default: false },
  /** Accessible name for the calendar. */
  label: { type: String, default: "Calendar" },
  /** Accessible names for the two navigation controls. */
  previousLabel: { type: String, default: "Previous month" },
  nextLabel: { type: String, default: "Next month" },
  /**
   * Writing direction. Left unset it is inherited, which is usually right -
   * the calendar is not portalled.
   * @values ltr, rtl
   */
  dir: { type: String, default: undefined },
});

const emit = defineEmits(["update:modelValue", "update:month"]);

const isRange = computed(() => props.mode === "range");
const isMultiple = computed(() => props.mode === "multiple");

/*
 * The range calendar is a different primitive, not a mode of the same one, so
 * every part has a counterpart. Picking the set once keeps one template rather
 * than two that have to be kept in step.
 */
const parts = computed(() =>
  isRange.value
    ? {
        Root: RangeCalendarRoot,
        Prev: RangeCalendarPrev,
        Next: RangeCalendarNext,
        Grid: RangeCalendarGrid,
        GridHead: RangeCalendarGridHead,
        GridBody: RangeCalendarGridBody,
        GridRow: RangeCalendarGridRow,
        HeadCell: RangeCalendarHeadCell,
        Cell: RangeCalendarCell,
        CellTrigger: RangeCalendarCellTrigger,
      }
    : {
        Root: CalendarRoot,
        Prev: CalendarPrev,
        Next: CalendarNext,
        Grid: CalendarGrid,
        GridHead: CalendarGridHead,
        GridBody: CalendarGridBody,
        GridRow: CalendarGridRow,
        HeadCell: CalendarHeadCell,
        Cell: CalendarCell,
        CellTrigger: CalendarCellTrigger,
      },
);

/* Selection */

/*
 * A `modelValue` wins, and without one the calendar keeps its own - the same
 * arrangement every other component here makes. Kumo's is controlled only,
 * which means a picker with nothing bound to it cannot hold a selection at
 * all.
 */
const uncontrolled = ref(toCalendarValue(props.mode, props.modelValue));

const calendarValue = computed(() =>
  props.modelValue === undefined
    ? uncontrolled.value
    : toCalendarValue(props.mode, props.modelValue),
);

/* Switching modes changes the shape of the thing being held, not just its value. */
watch(
  () => props.mode,
  (mode) => {
    uncontrolled.value = toCalendarValue(mode, undefined);
  },
);

function onValueChange(value) {
  uncontrolled.value = value;
  emit("update:modelValue", fromCalendarValue(props.mode, value));
}

/* The month on show */

/*
 * Reka calls it the placeholder: the month the grid is built around, which
 * moves when the arrows are used and when a selection lands outside it. A
 * `month` prop drives it; without one the calendar keeps its own.
 */
const uncontrolledMonth = ref(toCalendarDate(props.month));
const placeholder = computed(() => uncontrolledMonth.value);

watch(
  () => props.month,
  (month) => {
    if (month) uncontrolledMonth.value = toCalendarDate(month);
  },
);

function onPlaceholderChange(value) {
  uncontrolledMonth.value = value;
  emit("update:month", toJsDate(value));
}

/* What cannot be chosen */

const matcher = computed(() => toDateMatcher(props.disabled));

/**
 * A range shorter than `min` is refused by disabling the days too close to the
 * one already picked, which is how react-day-picker does it too. Reka has a
 * `maximumDays` but no minimum, and it is only ever asked while a range is
 * half-made - `start` set, `end` still open.
 */
const started = computed(() => {
  if (!isRange.value || !props.min) return undefined;
  const { start, end } = calendarValue.value ?? {};
  return start && !end ? start : undefined;
});

/*
 * `multiple` has no cap in Reka, so the one Kumo takes is applied here. A day
 * already chosen stays clickable whatever the count - that is how it is
 * un-chosen; the cap only closes the door on new ones.
 */
const atLimit = computed(
  () => isMultiple.value && props.max !== undefined && chosenCount.value >= props.max,
);

function isChosen(value) {
  return (
    Array.isArray(calendarValue.value) &&
    calendarValue.value.some(
      (chosen) =>
        chosen.year === value.year && chosen.month === value.month && chosen.day === value.day,
    )
  );
}

/**
 * Everything that puts a day out of reach, as the one predicate Reka asks for.
 *
 * One function, not a computed that makes a new one: Reka reads this off the
 * props once, when the calendar is set up, and keeps the reference. A fresh
 * function would never be seen. Reading the refs inside instead means the
 * answer still moves - it is the identity that has to hold still, and Reka's
 * own computed picks up whatever this touches.
 */
function isDateDisabled(value) {
  if (matcher.value?.(value)) return true;
  if (atLimit.value && !isChosen(value)) return true;

  const from = started.value;
  if (from) {
    const nights = Math.abs(daysBetween(from, value));
    if (nights > 0 && nights < props.min) return true;
  }

  return false;
}

/* Writing direction */

/*
 * Reka's calendar writes a direction onto the element it renders - `ltr`
 * unless it is told otherwise - so a calendar sitting inside an RTL page comes
 * out left to right while everything around it is the other way. The direction
 * is read from whatever the calendar was written inside, and handed back to it.
 */
const rootRef = ref();
const resolvedDir = ref(props.dir);

function readDir() {
  if (props.dir) {
    resolvedDir.value = props.dir;
    return;
  }

  /* The calendar's own element already carries Reka's answer, so the question
     has to be put to its parent. */
  const parent = rootRef.value?.$el?.parentElement;
  if (!parent) return;

  const declared = parent.closest("[dir]")?.getAttribute("dir");
  resolvedDir.value =
    declared === "rtl" || declared === "ltr" ? declared : getComputedStyle(parent).direction;
}

onMounted(readDir);
watch(() => props.dir, readDir);

/* Everything the chosen root takes, in the spelling it takes it. */
const rootProps = computed(() => ({
  modelValue: calendarValue.value,
  placeholder: placeholder.value,
  numberOfMonths: props.numberOfMonths,
  fixedWeeks: props.fixedWeeks,
  weekdayFormat: props.weekdayFormat,
  weekStartsOn: props.weekStartsOn,
  locale: props.locale,
  calendarLabel: props.label,
  /* Kumo's `disabled={true}` puts the whole calendar out of reach. */
  disabled: props.disabled === true,
  readonly: props.readonly,
  dir: resolvedDir.value,
  minValue: toCalendarDate(props.minDate),
  maxValue: toCalendarDate(props.maxDate),
  isDateDisabled,
  ...(isRange.value
    ? { maximumDays: props.max }
    : { multiple: isMultiple.value }),
}));

const chosenCount = computed(() =>
  isMultiple.value && Array.isArray(props.modelValue) ? props.modelValue.length : 0,
);

const classes = computed(() => [
  "kv-date-picker",
  `kv-date-picker--${props.mode}`,
  { "kv-date-picker--hide-outside": !props.showOutsideDays },
]);

/** The month a caption reads, in the calendar's own language. */
function captionFor(value) {
  return new Intl.DateTimeFormat(props.locale || undefined, {
    month: "long",
    year: "numeric",
  }).format(toJsDate(value));
}

</script>

<template>
  <component
    :is="parts.Root"
    ref="rootRef"
    v-bind="{ ...rootProps, ...$attrs }"
    :class="classes"
    data-kumo-component="DatePicker"
    @update:model-value="onValueChange"
    @update:placeholder="onPlaceholderChange"
  >
    <template #default="{ grid, weekDays }">
      <!--
        The months sit in a positioned box because the arrows are lifted out of
        the flow and pinned to its top corner - Kumo's arrangement, which keeps
        them level with the first month's caption however many months there are.
      -->
      <div class="kv-date-picker__months">
        <div class="kv-date-picker__nav">
          <component :is="parts.Prev" class="kv-date-picker__nav-button" :aria-label="previousLabel">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true" focusable="false">
              <path d="m9.5 4-4 4 4 4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </component>

          <component :is="parts.Next" class="kv-date-picker__nav-button" :aria-label="nextLabel">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true" focusable="false">
              <path d="m6.5 4 4 4-4 4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </component>
        </div>

        <div v-for="month in grid" :key="month.value.toString()" class="kv-date-picker__month">
          <div class="kv-date-picker__caption" data-kumo-part="caption">
            <slot name="caption" :month="toJsDate(month.value)" :label="captionFor(month.value)">
              {{ captionFor(month.value) }}
            </slot>
          </div>

          <component :is="parts.Grid" class="kv-date-picker__grid" :aria-label="captionFor(month.value)">
            <component :is="parts.GridHead">
              <component :is="parts.GridRow" class="kv-date-picker__week">
                <component
                  :is="parts.HeadCell"
                  v-for="day in weekDays"
                  :key="day"
                  class="kv-date-picker__weekday"
                >
                  {{ day }}
                </component>
              </component>
            </component>

            <component :is="parts.GridBody">
              <component
                :is="parts.GridRow"
                v-for="(week, index) in month.rows"
                :key="`week-${index}`"
                class="kv-date-picker__week"
              >
                <component
                  :is="parts.Cell"
                  v-for="date in week"
                  :key="date.toString()"
                  class="kv-date-picker__cell"
                  data-kumo-part="cell"
                  :date="date"
                >
                  <component
                    :is="parts.CellTrigger"
                    class="kv-date-picker__day"
                    data-kumo-part="day"
                    as="button"
                    type="button"
                    :day="date"
                    :month="month.value"
                  >
                    <slot name="day" :date="toJsDate(date)" :day="date.day">{{ date.day }}</slot>
                  </component>
                </component>
              </component>
            </component>
          </component>
        </div>
      </div>

      <!--
        Zero-width but full-width: the footer says what it has to say without
        any of it deciding how wide the calendar is. Kumo's trick.
      -->
      <div v-if="$slots.footer" class="kv-date-picker__footer" data-kumo-part="footer">
        <slot name="footer" />
      </div>
    </template>
  </component>
</template>

<style>
/*
 * Kumo styles react-day-picker's own class names through a stylesheet; the
 * markup here is Reka's, so the selectors are ours and the values are Kumo's.
 * Logical properties throughout, so the grid and the arrows mirror under
 * `dir="rtl"` without a second stylesheet.
 */

.kv-date-picker {
  --kv-date-picker-cell-size: 2.25rem;
  --kv-date-picker-day-size: 2rem;
  --kv-date-picker-day-radius: var(--kv-radius-md);
  --kv-date-picker-nav-height: 2.5rem;

  position: relative;
  box-sizing: border-box;
  /* A month's numbers change width otherwise, and the columns twitch. */
  font-variant-numeric: tabular-nums;
  background-color: var(--kv-surface-base);
  color: var(--kv-text-default);
  border-radius: var(--kv-radius-xl);
  font-family: var(--kv-font-sans);
  user-select: none;
}

.kv-date-picker * {
  box-sizing: border-box;
}

/* Months */

.kv-date-picker__months {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: var(--kv-space-4);
  max-inline-size: fit-content;
}

.kv-date-picker__caption {
  display: flex;
  align-items: center;
  block-size: var(--kv-date-picker-nav-height);
  font-size: var(--kv-text-lg);
  font-weight: 600;
  white-space: nowrap;
}

.kv-date-picker__grid {
  border-collapse: collapse;
  border-spacing: 0;
}

/* Navigation */

/*
 * Pinned to the top corner of the whole block rather than sitting in a row of
 * its own, so it shares the band the first caption is on - and stays there
 * when a second month is added beside it.
 */
.kv-date-picker__nav {
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: var(--kv-space-1);
  block-size: var(--kv-date-picker-nav-height);
}

.kv-date-picker__nav-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 1.5rem;
  block-size: 1.5rem;

  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  border-radius: var(--kv-date-picker-day-radius);
  /* Inset, because the calendar's own corner is only a few pixels away. */
  box-shadow: inset 0 0 0 1px var(--kv-line);
  cursor: pointer;
  outline: none;
  transition:
    background-color 150ms ease,
    box-shadow 150ms ease;
}

.kv-date-picker__nav-button > svg {
  inline-size: 1rem;
  block-size: 1rem;
}

.kv-date-picker__nav-button:hover:not([data-disabled]) {
  background-color: var(--kv-fill-hover);
}

.kv-date-picker__nav-button:focus-visible {
  box-shadow: inset 0 0 0 2px var(--kv-brand);
}

.kv-date-picker__nav-button[data-disabled] {
  cursor: not-allowed;
  opacity: 0.5;
}

/* The arrows point along the reading direction, so they turn with it. */
[dir="rtl"] .kv-date-picker__nav-button > svg {
  transform: scaleX(-1);
}

/* Weekday headings */

.kv-date-picker__weekday {
  padding-block: var(--kv-space-2);
  padding-inline: var(--kv-space-1);
  color: var(--kv-text-subtle);
  font-size: var(--kv-text-sm);
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
}

/* Days */

/*
 * A minimum rather than a width: the column is Kumo's 36px wherever the
 * weekday heading fits inside it, and grows where it does not. Arabic's short
 * weekday names are whole words and cannot be broken or squeezed - a fixed
 * column would have them running into each other or cut off mid-word, and a
 * wider calendar is the better answer than either.
 */
.kv-date-picker__cell {
  min-inline-size: var(--kv-date-picker-cell-size);
  block-size: var(--kv-date-picker-cell-size);
  padding: 2px;
  text-align: center;
}

.kv-date-picker__day {
  display: flex;
  align-items: center;
  justify-content: center;
  inline-size: var(--kv-date-picker-day-size);
  block-size: var(--kv-date-picker-day-size);

  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--kv-text-default);
  border-radius: var(--kv-date-picker-day-radius);
  font: inherit;
  font-size: var(--kv-text-sm);
  cursor: pointer;
  outline: none;
  transition:
    background-color 150ms ease,
    color 150ms ease;
}

.kv-date-picker__day:hover:not([data-disabled]):not([data-selected]) {
  background-color: var(--kv-fill-hover);
}

.kv-date-picker__day:focus-visible {
  box-shadow: inset 0 0 0 2px var(--kv-brand);
}

/* Today, until it is chosen - then being chosen is the louder thing to say. */
.kv-date-picker__day[data-today]:not([data-selected]):not([data-outside-view]) {
  color: var(--kv-text-brand);
  font-weight: 600;
}

.kv-date-picker__day[data-outside-view] {
  color: var(--kv-text-subtle);
  opacity: 0.4;
}

.kv-date-picker__day[data-disabled],
.kv-date-picker__day[data-unavailable] {
  cursor: not-allowed;
  opacity: 0.4;
}

.kv-date-picker__day[data-disabled]:hover,
.kv-date-picker__day[data-unavailable]:hover {
  background-color: transparent;
}

/* Chosen, in single and multiple selection */

.kv-date-picker__day[data-selected] {
  background-color: var(--kv-surface-contrast);
  color: var(--kv-text-inverse);
}

/*
 * A range is drawn on the cells rather than the days: the cells touch and the
 * days do not, so only the cells can carry a bar that runs unbroken across a
 * week. Kumo makes the same split.
 */

.kv-date-picker__cell:has([data-highlighted]),
.kv-date-picker__cell:has([data-selected]) {
  background-color: var(--kv-fill);
}

.kv-date-picker__cell:has([data-selection-start]),
.kv-date-picker__cell:has([data-highlighted-start]) {
  background-color: var(--kv-surface-contrast);
  border-start-start-radius: var(--kv-date-picker-day-radius);
  border-end-start-radius: var(--kv-date-picker-day-radius);
}

.kv-date-picker__cell:has([data-selection-end]),
.kv-date-picker__cell:has([data-highlighted-end]) {
  background-color: var(--kv-surface-contrast);
  border-start-end-radius: var(--kv-date-picker-day-radius);
  border-end-end-radius: var(--kv-date-picker-day-radius);
}

/*
 * In a range the day itself is see-through, so what shows is the cell beneath
 * it - which is what lets the bar run on between one day and the next.
 *
 * The colour is put back to the ordinary one at the same time. Reka marks
 * every day in the range `data-selected`, ends and middles alike, and the
 * inverse colour that gets a day read on a dark chip is near-white on the
 * light bar the middle of a range is drawn with.
 */
.kv-date-picker--range .kv-date-picker__day[data-selected],
.kv-date-picker--range .kv-date-picker__day[data-highlighted] {
  background-color: transparent;
  color: var(--kv-text-default);
}

.kv-date-picker--range .kv-date-picker__cell:has([data-selection-start]) .kv-date-picker__day,
.kv-date-picker--range .kv-date-picker__cell:has([data-selection-end]) .kv-date-picker__day,
.kv-date-picker--range .kv-date-picker__cell:has([data-highlighted-start]) .kv-date-picker__day,
.kv-date-picker--range .kv-date-picker__cell:has([data-highlighted-end]) .kv-date-picker__day {
  color: var(--kv-text-inverse);
}

.kv-date-picker--range .kv-date-picker__cell:has([data-highlighted]) .kv-date-picker__day:hover,
.kv-date-picker--range .kv-date-picker__cell:has([data-selected]) .kv-date-picker__day:hover {
  background-color: var(--kv-fill);
}

/* Days from the months either side, when they are not wanted. */

.kv-date-picker--hide-outside .kv-date-picker__day[data-outside-view] {
  visibility: hidden;
}

/* Footer */

.kv-date-picker__footer {
  inline-size: 0;
  min-inline-size: 100%;
  padding-block-start: var(--kv-space-2);
}

@media (prefers-reduced-motion: reduce) {
  .kv-date-picker__day,
  .kv-date-picker__nav-button {
    transition: none;
  }
}
</style>
