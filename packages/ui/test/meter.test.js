import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import Meter from "../src/meter/Meter.vue";

const mountMeter = (props = {}) => mount(Meter, { props: { label: "Storage used", value: 65, ...props } });

describe("Meter", () => {
  it("is a labelled meter with the range in ARIA", () => {
    const wrapper = mountMeter();
    const label = wrapper.find(".kv-meter__label");
    expect(wrapper.attributes("role")).toBe("meter");
    expect(wrapper.attributes("aria-labelledby")).toBe(label.attributes("id"));
    expect(label.text()).toBe("Storage used");
    expect(wrapper.attributes("aria-valuemin")).toBe("0");
    expect(wrapper.attributes("aria-valuemax")).toBe("100");
    expect(wrapper.attributes("aria-valuenow")).toBe("65");
    expect(wrapper.attributes("aria-valuetext")).toBe("65%");
  });

  it("shows the percentage and fills the indicator", () => {
    const wrapper = mountMeter();
    expect(wrapper.find(".kv-meter__value").text()).toBe("65%");
    expect(wrapper.find(".kv-meter__indicator").attributes("style")).toContain("width: 65%");
  });

  it("shows a custom value instead of the percentage", () => {
    const wrapper = mountMeter({ value: 75, customValue: "750 / 1,000" });
    expect(wrapper.find(".kv-meter__value").text()).toBe("750 / 1,000");
  });

  it("hides the value", () => {
    expect(mountMeter({ showValue: false }).find(".kv-meter__value").exists()).toBe(false);
  });

  it("clamps out-of-range values and scales to min and max", () => {
    const over = mountMeter({ value: 150 });
    expect(over.attributes("aria-valuenow")).toBe("100");
    expect(over.find(".kv-meter__indicator").attributes("style")).toContain("width: 100%");

    const scaled = mountMeter({ value: 5, min: 0, max: 20 });
    expect(scaled.attributes("aria-valuetext")).toBe("25%");
  });

  it("formats with Intl options and a custom announcement", () => {
    const wrapper = mountMeter({
      value: 3,
      max: 10,
      format: { style: "unit", unit: "gigabyte" },
      locale: "en-US",
      getAriaValueText: (formatted) => `${formatted} of 10 GB`,
    });
    expect(wrapper.find(".kv-meter__value").text()).toBe("3 GB");
    expect(wrapper.attributes("aria-valuetext")).toBe("3 GB of 10 GB");
  });

  it("adds classes to the track and indicator", () => {
    const wrapper = mountMeter({ trackClass: "t", indicatorClass: "i" });
    expect(wrapper.find(".kv-meter__track").classes()).toContain("t");
    expect(wrapper.find(".kv-meter__indicator").classes()).toContain("i");
  });
});
