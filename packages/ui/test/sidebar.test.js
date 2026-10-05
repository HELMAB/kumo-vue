import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref } from "vue";

import Sidebar from "../src/sidebar/Sidebar.vue";
import SidebarCollapsible from "../src/sidebar/SidebarCollapsible.vue";
import SidebarCollapsibleContent from "../src/sidebar/SidebarCollapsibleContent.vue";
import SidebarCollapsibleTrigger from "../src/sidebar/SidebarCollapsibleTrigger.vue";
import SidebarContent from "../src/sidebar/SidebarContent.vue";
import SidebarFooter from "../src/sidebar/SidebarFooter.vue";
import SidebarGroup from "../src/sidebar/SidebarGroup.vue";
import SidebarGroupLabel from "../src/sidebar/SidebarGroupLabel.vue";
import SidebarLoading from "../src/sidebar/SidebarLoading.vue";
import SidebarMenu from "../src/sidebar/SidebarMenu.vue";
import SidebarMenuButton from "../src/sidebar/SidebarMenuButton.vue";
import SidebarMenuChevron from "../src/sidebar/SidebarMenuChevron.vue";
import SidebarMenuItem from "../src/sidebar/SidebarMenuItem.vue";
import SidebarMenuSub from "../src/sidebar/SidebarMenuSub.vue";
import SidebarMenuSubButton from "../src/sidebar/SidebarMenuSubButton.vue";
import SidebarProvider from "../src/sidebar/SidebarProvider.vue";
import SidebarResizeHandle from "../src/sidebar/SidebarResizeHandle.vue";
import SidebarSlidingView from "../src/sidebar/SidebarSlidingView.vue";
import SidebarSlidingViews from "../src/sidebar/SidebarSlidingViews.vue";
import SidebarTrigger from "../src/sidebar/SidebarTrigger.vue";
import { useSidebar } from "../src/sidebar/context.js";

const mounted = [];

const mobile = (matches) =>
  vi.stubGlobal("matchMedia", (query) => ({ matches: query.includes("max-width") ? matches : false, addEventListener() {}, removeEventListener() {} }));

const mountSidebar = (children, providerProps = {}, sidebarProps = {}) => {
  const wrapper = mount(SidebarProvider, {
    props: { contained: true, ...providerProps },
    slots: { default: () => [h(Sidebar, sidebarProps, children), h("main", "Main")] },
    attachTo: document.body,
  });
  mounted.push(wrapper);
  return wrapper;
};

const menu = () => [
  h(SidebarContent, () =>
    h(SidebarGroup, () => [
      h(SidebarGroupLabel, () => "Overview"),
      h(SidebarMenu, () => [h(SidebarMenuButton, { active: true }, () => "Home"), h(SidebarMenuButton, { tooltip: "Domains" }, () => "Domains")]),
    ]),
  ),
  h(SidebarFooter, () => h(SidebarTrigger)),
];

const aside = (wrapper) => wrapper.find('[data-sidebar="sidebar"]');

afterEach(() => {
  mounted.splice(0).forEach((wrapper) => wrapper.unmount());
  vi.unstubAllGlobals();
});

describe("Sidebar on desktop", () => {
  it("renders an expanded aside with the footer outside the peek zone", async () => {
    const wrapper = mountSidebar(menu);
    await flushPromises();
    expect(aside(wrapper).element.tagName).toBe("ASIDE");
    expect(aside(wrapper).attributes("data-state")).toBe("expanded");
    expect(wrapper.find('[data-sidebar="peek-zone"] [data-sidebar="footer"]').exists()).toBe(false);
    expect(wrapper.find('[data-sidebar="content-container"] > [data-sidebar="footer"]').exists()).toBe(true);
  });

  it("wraps menu buttons in list items and marks the active one", async () => {
    const wrapper = mountSidebar(menu);
    await flushPromises();
    const buttons = wrapper.findAll('[data-sidebar="menu-button"]');
    expect(buttons.map((b) => b.element.parentElement.tagName)).toEqual(["LI", "LI"]);
    expect(buttons[0].attributes("data-active")).toBe("true");
    expect(buttons[1].attributes("data-active")).toBeUndefined();
    expect(buttons[0].find(".kv-sidebar__truncate").text()).toBe("Home");
  });

  it("collapses and expands from the trigger, emitting update:open", async () => {
    const wrapper = mountSidebar(menu);
    await flushPromises();
    const trigger = wrapper.find('[data-sidebar="trigger"]');
    expect(trigger.attributes("aria-label")).toBe("Collapse sidebar");
    await trigger.trigger("click");
    expect(aside(wrapper).attributes("data-state")).toBe("collapsed");
    expect(aside(wrapper).attributes("style")).toContain("var(--sidebar-width-icon)");
    expect(trigger.attributes("aria-expanded")).toBe("false");
    expect(wrapper.emitted("update:open")).toEqual([[false]]);
  });

  it("peeks on hover when peekable and collapsed", async () => {
    const wrapper = mountSidebar(menu, { peekable: true, defaultOpen: false });
    await flushPromises();
    await wrapper.find('[data-sidebar="peek-zone"]').trigger("mouseenter");
    expect(aside(wrapper).attributes("data-state")).toBe("peeking");
    await wrapper.find('[data-sidebar="peek-zone"]').trigger("mouseleave");
    expect(aside(wrapper).attributes("data-state")).toBe("collapsed");
  });

  it("renders a fixed sidebar when not collapsible", async () => {
    const wrapper = mountSidebar(menu, { collapsible: "none" });
    await flushPromises();
    expect(aside(wrapper).attributes("data-state")).toBe("expanded");
    expect(aside(wrapper).classes()).toContain("kv-sidebar--fixed");
  });

  it("resizes with the keyboard and collapses below the minimum", async () => {
    const wrapper = mountSidebar(() => [h(SidebarContent), h(SidebarResizeHandle)], { resizable: true, defaultWidth: 240, minWidth: 200, maxWidth: 260 });
    await flushPromises();
    const handle = wrapper.find('[data-sidebar="resize-handle"]');
    await handle.trigger("keydown", { key: "ArrowRight" });
    expect(wrapper.emitted("width-change").at(-1)).toEqual([250]);
    await handle.trigger("keydown", { key: "End" });
    expect(wrapper.emitted("width-change").at(-1)).toEqual([260]);
    await handle.trigger("keydown", { key: "Home" });
    expect(aside(wrapper).attributes("data-state")).toBe("collapsed");
  });

  it("hides the resize handle when not resizable", async () => {
    const wrapper = mountSidebar(() => [h(SidebarResizeHandle)]);
    await flushPromises();
    expect(wrapper.find('[data-sidebar="resize-handle"]').exists()).toBe(false);
  });
});

describe("Sidebar on mobile", () => {
  it("renders a closed sheet that opens from toggleSidebar and closes on Escape and the backdrop", async () => {
    mobile(true);
    const wrapper = mountSidebar(menu);
    await flushPromises();
    const nav = () => wrapper.find('nav[data-sidebar="sidebar"]');
    expect(nav().attributes("data-mobile")).toBe("true");
    expect(nav().attributes("aria-hidden")).toBe("true");
    expect(nav().attributes("inert")).toBeDefined();
    wrapper.vm.toggleSidebar();
    await nextTick();
    expect(nav().attributes("data-state")).toBe("expanded");
    expect(nav().attributes("inert")).toBeUndefined();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await nextTick();
    expect(nav().attributes("data-state")).toBe("collapsed");
    wrapper.vm.toggleSidebar();
    await nextTick();
    await wrapper.find("[data-sidebar-backdrop]").trigger("click");
    expect(nav().attributes("data-state")).toBe("collapsed");
  });
});

describe("SidebarCollapsible", () => {
  const collapsible = (props = {}) =>
    mountSidebar(() =>
      h(SidebarContent, () =>
        h(SidebarMenu, () =>
          h(SidebarMenuItem, () =>
            h(SidebarCollapsible, props, () => [
              h(SidebarCollapsibleTrigger, () => h(SidebarMenuButton, () => ["Compute", h(SidebarMenuChevron)])),
              h(SidebarCollapsibleContent, () => h(SidebarMenuSub, () => h(SidebarMenuSubButton, () => "Workers"))),
            ]),
          ),
        ),
      ),
    );

  it("wires the trigger to its content and toggles it", async () => {
    const wrapper = collapsible();
    await flushPromises();
    const trigger = wrapper.find('[data-sidebar="menu-button"]');
    const content = wrapper.find('[role="region"]');
    expect(wrapper.findAll('li[data-sidebar="menu-item"]')).toHaveLength(1);
    expect(trigger.attributes("aria-controls")).toBe(content.attributes("id"));
    expect(trigger.attributes("aria-expanded")).toBe("false");
    expect(content.attributes("inert")).toBeDefined();
    await trigger.trigger("click");
    expect(trigger.attributes("aria-expanded")).toBe("true");
    expect(content.classes()).toContain("kv-sidebar__collapsible-content--shown");
    expect(wrapper.find(".kv-sidebar__chevron").classes()).toContain("kv-sidebar__chevron--open");
  });

  it("starts open with default-open", async () => {
    const wrapper = collapsible({ defaultOpen: true });
    await flushPromises();
    expect(wrapper.find('[role="region"]').attributes("aria-hidden")).toBe("false");
  });
});

describe("Sidebar parts", () => {
  it("renders loading placeholders with a status role", async () => {
    const wrapper = mountSidebar(() => h(SidebarLoading));
    await flushPromises();
    expect(wrapper.find('[role="status"]').attributes("aria-label")).toBe("Loading");
    expect(wrapper.findAll(".kv-sidebar__loading-row")).toHaveLength(6);
  });

  it("renders a link through href", async () => {
    const wrapper = mountSidebar(() => h(SidebarMenu, () => h(SidebarMenuButton, { href: "/recents", target: "_blank" }, () => "Recents")));
    await flushPromises();
    const link = wrapper.find('[data-sidebar="menu-button"]');
    expect(link.element.tagName).toBe("A");
    expect(link.attributes("href")).toBe("/recents");
    expect(link.attributes("target")).toBe("_blank");
  });

  it("slides to the active view and makes the others inert", async () => {
    const active = ref("account");
    const Demo = defineComponent({
      setup: () => () =>
        h(SidebarProvider, { contained: true }, () =>
          h(Sidebar, () =>
            h(SidebarSlidingViews, { activeKey: active.value }, () => [h(SidebarSlidingView, { value: "account" }, () => "A"), h(SidebarSlidingView, { value: "zone" }, () => "Z")]),
          ),
        ),
    });
    const wrapper = mount(Demo, { attachTo: document.body });
    mounted.push(wrapper);
    await flushPromises();
    active.value = "zone";
    await nextTick();
    const views = wrapper.findAll('[data-sidebar="sliding-view"]');
    expect(views.map((v) => v.attributes("aria-hidden"))).toEqual(["true", "false"]);
    expect(wrapper.find(".kv-sidebar__sliding-track").attributes("style")).toContain("translateX(-100%)");
  });

  it("throws outside a provider", () => {
    const Probe = defineComponent({ setup: () => (useSidebar(), () => null) });
    expect(() => mount(Probe)).toThrow(/SidebarProvider/);
  });
});
