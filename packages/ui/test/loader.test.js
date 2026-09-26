import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import Loader from "../src/loader/Loader.vue";

describe("Loader", () => {
  it("renders a 24px status spinner labelled Loading by default", () => {
    const wrapper = mount(Loader);
    expect(wrapper.attributes("role")).toBe("status");
    expect(wrapper.attributes("aria-label")).toBe("Loading");
    expect(wrapper.attributes("style")).toContain("height: 24px");
    expect(wrapper.attributes("style")).toContain("width: 24px");
    expect(wrapper.findAll("circle")).toHaveLength(2);
  });

  it.each([
    ["sm", 16],
    ["lg", 32],
    [40, 40],
    ["nope", 24],
  ])("sizes %s to %ipx", (size, px) => {
    expect(mount(Loader, { props: { size } }).attributes("style")).toContain(`height: ${px}px`);
  });

  it("takes a translated label and a class", () => {
    const wrapper = mount(Loader, { attrs: { "aria-label": "Chargement", class: "muted" } });
    expect(wrapper.attributes("aria-label")).toBe("Chargement");
    expect(wrapper.classes()).toContain("muted");
  });
});
