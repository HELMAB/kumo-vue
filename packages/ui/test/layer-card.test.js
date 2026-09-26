import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { Fragment, h } from "vue";

import LayerCard from "../src/layer-card/LayerCard.vue";
import LayerCardPrimary from "../src/layer-card/LayerCardPrimary.vue";
import LayerCardSecondary from "../src/layer-card/LayerCardSecondary.vue";

describe("LayerCard", () => {
  it("renders a single surface for plain content", () => {
    const wrapper = mount(LayerCard, { slots: { default: "Card content" } });
    expect(wrapper.element.tagName).toBe("DIV");
    expect(wrapper.classes()).toEqual(["kv-layer-card"]);
    expect(wrapper.text()).toBe("Card content");
  });

  it("switches to the layered treatment when it has sections", () => {
    const wrapper = mount(LayerCard, {
      slots: {
        default: () => [h(LayerCardSecondary, () => "Next steps"), h(LayerCardPrimary, () => "Get started")],
      },
    });
    expect(wrapper.classes()).toContain("kv-layer-card--layered");
    expect(wrapper.find(".kv-layer-card__secondary").text()).toBe("Next steps");
    expect(wrapper.find(".kv-layer-card__primary").text()).toBe("Get started");
  });

  it("finds sections inside a fragment", () => {
    const wrapper = mount(LayerCard, {
      slots: { default: () => [h(Fragment, [h(LayerCardPrimary, () => "Body")])] },
    });
    expect(wrapper.classes()).toContain("kv-layer-card--layered");
  });

  it("renders as another element and merges classes", () => {
    const wrapper = mount(LayerCard, { props: { as: "section" }, attrs: { class: "extra" }, slots: { default: "x" } });
    expect(wrapper.element.tagName).toBe("SECTION");
    expect(wrapper.classes()).toContain("extra");
  });

  it("passes attributes through to the sections", () => {
    const wrapper = mount(LayerCardPrimary, { attrs: { "data-testid": "card-body" } });
    expect(wrapper.attributes("data-testid")).toBe("card-body");
  });
});
