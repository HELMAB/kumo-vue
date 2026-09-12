/**
 * Behavioural contract for DatePicker.
 *
 * Reka owns the grid, the roving focus and the range logic; what is pinned
 * here is everything around them - the translation between the `Date` objects
 * a page holds and the calendar values Reka works in, the limits Kumo takes
 * that Reka has no prop for, and which day carries which mark.
 */

import { afterEach, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { h, nextTick } from "vue";
import { CalendarDate } from "@internationalized/date";

import DatePicker from "../src/date-picker/DatePicker.vue";
import {
  daysBetween,
  fromCalendarValue,
  isSameDay,
  toCalendarDate,
  toCalendarValue,
  toDateMatcher,
  toJsDate,
} from "../src/date-picker/dates.js";

const flush = async () => {
  for (let i = 0; i < 8; i += 1) await nextTick();
};

/** September 2026: starts on a Tuesday, ends on a Wednesday, five weeks. */
const SEPTEMBER = new Date(2026, 8, 1);
const on = (day) => new Date(2026, 8, day);

const mountPicker = (props = {}, options = {}) =>
  mount(DatePicker, {
    props: { month: SEPTEMBER, ...props },
    attachTo: document.body,
    ...options,
  });

const days = (wrapper) => wrapper.findAll('[data-kumo-part="day"]');
/*
 * A present boolean attribute reads as "", which is falsy - so the absent ones
 * have to be picked out by identity rather than by truthiness.
 */
const inMonth = (wrapper) =>
  days(wrapper).filter((day) => day.attributes("data-outside-view") === undefined);
/** The button for a day of September, by its number - found by date, not by
    the text, which a `day` slot is free to replace. */
const day = (wrapper, number) =>
  wrapper.find(`[data-value="2026-09-${String(number).padStart(2, "0")}"]`);
const captions = (wrapper) =>
  wrapper.findAll('[data-kumo-part="caption"]').map((node) => node.text());

/**
 * Click a day the way a pointer does. Reka completes a range on the second
 * press only once that day is under the cursor - it listens for `mouseenter`
 * and `focusin`, neither of which a bare `click` implies.
 */
const press = async (wrapper, number) => {
  const button = day(wrapper, number);
  await button.trigger("mouseenter");
  await button.trigger("click");
  await flush();
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("translating dates", () => {
  /* Through the year, month and day a Date reads locally - never through an
     instant, which is what hands somebody in Auckland yesterday. */
  it("round-trips a date through the calendar and back", () => {
    const date = new Date(2026, 8, 11, 23, 45);
    const calendar = toCalendarDate(date);

    expect([calendar.year, calendar.month, calendar.day]).toEqual([2026, 9, 11]);
    expect(toJsDate(calendar)).toEqual(new Date(2026, 8, 11));
  });

  it("ignores what is not a date", () => {
    expect(toCalendarDate(undefined)).toBeUndefined();
    expect(toCalendarDate(new Date("nonsense"))).toBeUndefined();
    expect(toJsDate(undefined)).toBeUndefined();
  });

  it("compares on the calendar day, not the clock", () => {
    expect(isSameDay(new Date(2026, 8, 11, 1), new Date(2026, 8, 11, 23))).toBe(true);
    expect(isSameDay(new Date(2026, 8, 11), new Date(2026, 8, 12))).toBe(false);
    expect(isSameDay(undefined, new Date())).toBe(false);
  });

  it("carries each mode's shape both ways", () => {
    expect(toCalendarValue("single", on(11))).toMatchObject({ year: 2026, month: 9, day: 11 });
    expect(toCalendarValue("multiple", [on(1), on(2)])).toHaveLength(2);
    expect(toCalendarValue("range", { from: on(1), to: on(5) })).toMatchObject({
      start: { day: 1 },
      end: { day: 5 },
    });

    expect(fromCalendarValue("single", new CalendarDate(2026, 9, 11))).toEqual(on(11));
    expect(fromCalendarValue("multiple", [new CalendarDate(2026, 9, 1)])).toEqual([on(1)]);
    expect(
      fromCalendarValue("range", { start: new CalendarDate(2026, 9, 1), end: undefined }),
    ).toEqual({ from: on(1), to: undefined });
  });

  /* Nothing chosen should read as nothing, so `v-if="range"` in a page works. */
  it("reports an empty selection as nothing at all", () => {
    expect(fromCalendarValue("range", { start: undefined, end: undefined })).toBeUndefined();
    expect(fromCalendarValue("multiple", [])).toBeUndefined();
    expect(fromCalendarValue("single", undefined)).toBeUndefined();
  });

  /* Reka reads `undefined` as "not a range at all" and refuses to start one. */
  it("always hands the range calendar a pair, even an empty one", () => {
    expect(toCalendarValue("range", undefined)).toEqual({ start: undefined, end: undefined });
  });

  describe("the disabled matcher", () => {
    it("takes a list of days, whatever time they were built at", () => {
      const matches = toDateMatcher([new Date(2026, 8, 11, 13, 30)]);

      expect(matches(new CalendarDate(2026, 9, 11))).toBe(true);
      expect(matches(new CalendarDate(2026, 9, 12))).toBe(false);
    });

    it("takes a predicate, and hands it a Date", () => {
      const matches = toDateMatcher((date) => date.getDay() === 0);

      expect(matches(new CalendarDate(2026, 9, 6))).toBe(true);
      expect(matches(new CalendarDate(2026, 9, 7))).toBe(false);
    });

    /* `true` disables the calendar rather than any particular day, so there is
       no per-day matcher to make. */
    it("makes no matcher for true or false", () => {
      expect(toDateMatcher(true)).toBeUndefined();
      expect(toDateMatcher(false)).toBeUndefined();
    });
  });

  it("counts whole days between two calendar days", () => {
    expect(daysBetween(new CalendarDate(2026, 9, 1), new CalendarDate(2026, 9, 8))).toBe(7);
    expect(daysBetween(new CalendarDate(2026, 9, 8), new CalendarDate(2026, 9, 1))).toBe(-7);
  });
});

describe("rendering", () => {
  it("draws the month, its weekdays and its days", () => {
    const wrapper = mountPicker();

    expect(captions(wrapper)).toEqual(["September 2026"]);
    expect(wrapper.findAll(".kv-date-picker__weekday")).toHaveLength(7);
    /* September 2026 runs Tuesday to Wednesday: five weeks, padded either end. */
    expect(days(wrapper)).toHaveLength(35);
    expect(inMonth(wrapper)).toHaveLength(30);
    expect(wrapper.attributes("data-kumo-component")).toBe("DatePicker");
  });

  /* A day is a real button, as it is upstream - not a div wearing the role. */
  it("renders each day as a button", () => {
    const first = days(mountPicker())[0];

    expect(first.element.tagName).toBe("BUTTON");
    expect(first.attributes("type")).toBe("button");
  });

  it("marks the days either side of the month, and can hide them", () => {
    const wrapper = mountPicker();
    expect(days(wrapper).length - inMonth(wrapper).length).toBe(5);

    expect(mountPicker({ showOutsideDays: false }).classes()).toContain(
      "kv-date-picker--hide-outside",
    );
  });

  it("shows two months side by side when asked", () => {
    const wrapper = mountPicker({ numberOfMonths: 2 });

    expect(captions(wrapper)).toEqual(["September 2026", "October 2026"]);
  });

  /* Six rows always, so a calendar does not change height from month to month. */
  it("pads to six weeks with fixedWeeks", () => {
    expect(days(mountPicker({ fixedWeeks: true }))).toHaveLength(42);
  });

  it("names the months and weekdays in the locale it is given", () => {
    const wrapper = mountPicker({ locale: "fr-FR" });

    expect(captions(wrapper)[0]).toBe("septembre 2026");
  });

  it("renders a footer only when given one, and a day slot in place of the number", () => {
    expect(mountPicker().find('[data-kumo-part="footer"]').exists()).toBe(false);

    const wrapper = mountPicker(
      {},
      {
        slots: {
          footer: () => h("p", "3 of 5 days"),
          day: ({ day: number }) => h("span", { class: "custom" }, `·${number}`),
        },
      },
    );

    expect(wrapper.find('[data-kumo-part="footer"]').text()).toBe("3 of 5 days");
    expect(day(wrapper, 11).find(".custom").text()).toBe("·11");
  });

  it("names the calendar and its controls", () => {
    const wrapper = mountPicker({
      label: "Choisir une date",
      previousLabel: "Mois précédent",
      nextLabel: "Mois suivant",
    });

    expect(wrapper.text()).toContain("Choisir une date");
    expect(wrapper.find('[aria-label="Mois précédent"]').exists()).toBe(true);
    expect(wrapper.find('[aria-label="Mois suivant"]').exists()).toBe(true);
  });
});

describe("choosing one date", () => {
  it("marks the selected day", () => {
    const wrapper = mountPicker({ modelValue: on(11) });

    expect(day(wrapper, 11).attributes("data-selected")).toBeDefined();
    expect(day(wrapper, 12).attributes("data-selected")).toBeUndefined();
  });

  it("reports a plain Date when a day is clicked", async () => {
    const wrapper = mountPicker();

    await press(wrapper, 11);

    const [chosen] = wrapper.emitted("update:modelValue").at(-1);
    expect(chosen).toBeInstanceOf(Date);
    expect(isSameDay(chosen, on(11))).toBe(true);
  });

  it("opens on the month holding the selection", () => {
    const wrapper = mountPicker({ month: undefined, modelValue: new Date(2026, 11, 25) });

    expect(captions(wrapper)).toEqual(["December 2026"]);
  });
});

describe("choosing several", () => {
  it("marks every chosen day and reports an array", async () => {
    const wrapper = mountPicker({ mode: "multiple", modelValue: [on(1), on(2)] });

    expect(
      inMonth(wrapper)
        .filter((node) => node.attributes("data-selected") !== undefined)
        .map((node) => node.text()),
    ).toEqual(["1", "2"]);

    await press(wrapper, 3);

    const [chosen] = wrapper.emitted("update:modelValue").at(-1);
    expect(chosen.map((date) => date.getDate())).toEqual([1, 2, 3]);
  });

  /*
   * Reka has no cap of its own, so Kumo's `max` is applied by putting the days
   * that would exceed it out of reach - while the ones already chosen stay
   * clickable, since clicking one is how it is un-chosen.
   */
  it("stops at max without locking in what is already chosen", () => {
    const wrapper = mountPicker({ mode: "multiple", max: 2, modelValue: [on(1), on(2)] });

    expect(day(wrapper, 1).attributes("data-disabled")).toBeUndefined();
    expect(day(wrapper, 2).attributes("data-disabled")).toBeUndefined();
    expect(day(wrapper, 3).attributes("data-disabled")).toBeDefined();
  });

  it("lets every day through while under the limit", () => {
    const wrapper = mountPicker({ mode: "multiple", max: 3, modelValue: [on(1)] });

    expect(day(wrapper, 3).attributes("data-disabled")).toBeUndefined();
  });
});

describe("choosing a range", () => {
  it("marks the ends and everything between them", () => {
    const wrapper = mountPicker({
      mode: "range",
      modelValue: { from: on(8), to: on(11) },
    });

    expect(day(wrapper, 8).attributes("data-selection-start")).toBeDefined();
    expect(day(wrapper, 11).attributes("data-selection-end")).toBeDefined();
    expect(day(wrapper, 9).attributes("data-selected")).toBeDefined();
    expect(day(wrapper, 12).attributes("data-selected")).toBeUndefined();
  });

  it("reports a from and a to", async () => {
    const wrapper = mountPicker({ mode: "range" });

    await press(wrapper, 8);
    await press(wrapper, 11);

    const [range] = wrapper.emitted("update:modelValue").at(-1);
    expect(isSameDay(range.from, on(8))).toBe(true);
    expect(isSameDay(range.to, on(11))).toBe(true);
  });

  /*
   * Reka has a maximum but no minimum, so a range shorter than `min` is
   * refused by putting the days too close to the one already picked out of
   * reach - which is how react-day-picker does it too.
   */
  it("refuses a range shorter than min, once one end is down", async () => {
    const wrapper = mountPicker({ mode: "range", min: 3 });

    expect(day(wrapper, 9).attributes("data-disabled")).toBeUndefined();

    await press(wrapper, 8);

    expect(day(wrapper, 9).attributes("data-disabled")).toBeDefined();
    expect(day(wrapper, 10).attributes("data-disabled")).toBeDefined();
    expect(day(wrapper, 11).attributes("data-disabled")).toBeUndefined();
    /* The day itself stays open, so a one-day range is still reachable. */
    expect(day(wrapper, 8).attributes("data-disabled")).toBeUndefined();
  });
});

describe("days out of reach", () => {
  it("takes a list of days", () => {
    const wrapper = mountPicker({ disabled: [on(5), on(12)] });

    expect(day(wrapper, 5).attributes("data-disabled")).toBeDefined();
    expect(day(wrapper, 12).attributes("data-disabled")).toBeDefined();
    expect(day(wrapper, 6).attributes("data-disabled")).toBeUndefined();
  });

  it("takes a predicate", () => {
    const wrapper = mountPicker({ disabled: (date) => date.getDay() === 0 });

    /* 6 September 2026 is a Sunday. */
    expect(day(wrapper, 6).attributes("data-disabled")).toBeDefined();
    expect(day(wrapper, 7).attributes("data-disabled")).toBeUndefined();
  });

  it("takes a bare true for the whole calendar", () => {
    const wrapper = mountPicker({ disabled: true });

    expect(day(wrapper, 11).attributes("data-disabled")).toBeDefined();
  });

  it("takes a first and a last day", () => {
    const wrapper = mountPicker({ minDate: on(10), maxDate: on(20) });

    expect(day(wrapper, 9).attributes("data-disabled")).toBeDefined();
    expect(day(wrapper, 10).attributes("data-disabled")).toBeUndefined();
    expect(day(wrapper, 20).attributes("data-disabled")).toBeUndefined();
    expect(day(wrapper, 21).attributes("data-disabled")).toBeDefined();
  });
});

describe("the month on show", () => {
  it("moves with the arrows, and says where it went", async () => {
    const wrapper = mountPicker();

    await wrapper.find('[aria-label="Next month"]').trigger("click");
    await flush();

    expect(captions(wrapper)).toEqual(["October 2026"]);
    const [month] = wrapper.emitted("update:month").at(-1);
    expect([month.getFullYear(), month.getMonth()]).toEqual([2026, 9]);
  });

  it("follows the month prop", async () => {
    const wrapper = mountPicker();
    expect(captions(wrapper)).toEqual(["September 2026"]);

    await wrapper.setProps({ month: new Date(2027, 0, 1) });
    await flush();

    expect(captions(wrapper)).toEqual(["January 2027"]);
  });
});
