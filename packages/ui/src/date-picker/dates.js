/**
 * The translation between the dates a page holds and the dates Reka's calendar
 * works in, for DatePicker.
 *
 * Kumo's DatePicker speaks plain `Date` objects, because react-day-picker
 * does. Reka's calendar speaks `DateValue` from `@internationalized/date`,
 * which is what gives it calendar systems other than the Gregorian one and
 * arithmetic that does not drift. Keeping the public API in `Date` means a
 * page never has to know that - the conversion lives here.
 *
 * It goes through the year, month and day a `Date` reads in the local zone,
 * never through an instant. A calendar date is a label on a wall, not a point
 * in time: converting through UTC is what makes a date picker hand back
 * yesterday to somebody in Auckland.
 *
 * Kept out of the component because it is pure, and testable without
 * rendering a calendar first.
 *
 * Derived from Cloudflare Kumo's DatePicker (MIT). See /NOTICE.
 */

import { CalendarDate } from "@internationalized/date";

/** A `Date` as the calendar day it reads as locally. */
export function toCalendarDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return undefined;
  return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/** A calendar day as a `Date` at local midnight. */
export function toJsDate(value) {
  if (!value) return undefined;
  return new Date(value.year, value.month - 1, value.day);
}

/** Whether two `Date`s fall on the same calendar day, locally. */
export function isSameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * What a page holds, as what Reka's calendar takes.
 *
 * `undefined` rather than `null` throughout: Reka reads an explicit `null` as
 * a value and clears its placeholder with it.
 */
export function toCalendarValue(mode, value) {
  if (mode === "range") {
    const { from, to } = value ?? {};
    /* A range is always an object: Reka reads `undefined` as "not a range at
       all" and refuses to start one. */
    return { start: toCalendarDate(from), end: toCalendarDate(to) };
  }

  if (mode === "multiple") {
    return (Array.isArray(value) ? value : []).map(toCalendarDate).filter(Boolean);
  }

  return toCalendarDate(value);
}

/** What Reka's calendar hands back, as what a page holds. */
export function fromCalendarValue(mode, value) {
  if (mode === "range") {
    const from = toJsDate(value?.start);
    const to = toJsDate(value?.end);
    /* Nothing chosen is nothing, not a pair of holes - so `v-if="range"` in a
       page reads the way it looks. */
    return from || to ? { from, to } : undefined;
  }

  if (mode === "multiple") {
    const dates = (Array.isArray(value) ? value : []).map(toJsDate).filter(Boolean);
    return dates.length ? dates : undefined;
  }

  return toJsDate(value);
}

/**
 * Kumo's `disabled` is react-day-picker's matcher: `true` for the whole
 * calendar, a list of days, or a predicate. All three become the one predicate
 * over calendar days that Reka asks for.
 *
 * @param {boolean | Date[] | ((date: Date) => boolean)} disabled
 * @returns {((value: import("@internationalized/date").DateValue) => boolean) | undefined}
 */
export function toDateMatcher(disabled) {
  if (!disabled || disabled === true) return undefined;

  if (typeof disabled === "function") {
    return (value) => Boolean(disabled(toJsDate(value)));
  }

  if (Array.isArray(disabled)) {
    /* Compared on the calendar day rather than the instant, so a list built
       from `new Date()` matches whatever time of day it was built at. */
    const days = new Set(
      disabled
        .map(toCalendarDate)
        .filter(Boolean)
        .map((date) => `${date.year}-${date.month}-${date.day}`),
    );
    return (value) => days.has(`${value.year}-${value.month}-${value.day}`);
  }

  return undefined;
}

/** Whole days from `a` to `b`, signed. */
export function daysBetween(a, b) {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const from = Date.UTC(a.year, a.month - 1, a.day);
  const to = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((to - from) / MS_PER_DAY);
}
