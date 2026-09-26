import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { h, nextTick } from "vue";

import Pagination from "../src/pagination/Pagination.vue";
import PaginationControls from "../src/pagination/PaginationControls.vue";
import PaginationInfo from "../src/pagination/PaginationInfo.vue";
import PaginationSeparator from "../src/pagination/PaginationSeparator.vue";

const mountPagination = (props = {}, slots) =>
  mount(Pagination, {
    props: { page: 1, perPage: 10, totalCount: 100, "onUpdate:page": (page) => wrapper.setProps({ page }), ...props },
    slots,
    attachTo: document.body,
  });
let wrapper;

const button = (w, label) => w.find(`button[aria-label="${label}"]`);

describe("Pagination", () => {
  it("renders the default layout with info and full controls", () => {
    wrapper = mountPagination();
    expect(wrapper.find('[data-slot="pagination-info"]').text()).toBe("Showing 1-10 of 100");
    expect(wrapper.find('[data-slot="pagination-info"]').attributes("aria-live")).toBe("polite");
    expect(wrapper.find('nav[aria-label="Pagination"]').exists()).toBe(true);
    for (const label of ["First page", "Previous page", "Next page", "Last page"]) {
      expect(button(wrapper, label).exists()).toBe(true);
    }
    expect(wrapper.find('input[aria-label="Page number"]').element.value).toBe("1");
    wrapper.unmount();
  });

  it("disables first and previous on the first page, next and last on the last", async () => {
    wrapper = mountPagination();
    expect(button(wrapper, "First page").attributes("disabled")).toBeDefined();
    expect(button(wrapper, "Previous page").attributes("disabled")).toBeDefined();
    expect(button(wrapper, "Next page").attributes("disabled")).toBeUndefined();

    await button(wrapper, "Last page").trigger("click");
    expect(wrapper.emitted("update:page").at(-1)).toEqual([10]);
    await nextTick();
    expect(button(wrapper, "Next page").attributes("disabled")).toBeDefined();
    expect(button(wrapper, "Last page").attributes("disabled")).toBeDefined();
    expect(wrapper.find('[data-slot="pagination-info"]').text()).toBe("Showing 91-100 of 100");
    wrapper.unmount();
  });

  it("clamps a typed page on Enter", async () => {
    wrapper = mountPagination();
    const input = wrapper.find('input[aria-label="Page number"]');
    await input.setValue("42");
    await input.trigger("keydown", { key: "Enter" });
    expect(wrapper.emitted("update:page").at(-1)).toEqual([10]);
    wrapper.unmount();
  });

  it("shows only previous and next for simple controls", () => {
    wrapper = mountPagination({ controls: "simple" });
    expect(button(wrapper, "First page").exists()).toBe(false);
    expect(wrapper.find("input").exists()).toBe(false);
    expect(button(wrapper, "Next page").exists()).toBe(true);
    wrapper.unmount();
  });

  it("uses sequential controls for an unknown total", async () => {
    wrapper = mountPagination({ totalCount: undefined, perPage: undefined, hasNextPage: true }, { text: ({ page }) => `Page ${page}` });
    expect(wrapper.find('[data-slot="pagination-info"]').text()).toBe("Page 1");
    expect(button(wrapper, "First page").exists()).toBe(false);
    expect(button(wrapper, "Next page").attributes("disabled")).toBeUndefined();
    await wrapper.setProps({ hasNextPage: false });
    expect(button(wrapper, "Next page").attributes("disabled")).toBeDefined();
    wrapper.unmount();
  });

  it("localises the accessible labels", () => {
    wrapper = mountPagination({ labels: { nextPage: "Page suivante", navigation: "Pages" } });
    expect(button(wrapper, "Page suivante").exists()).toBe(true);
    expect(wrapper.find('nav[aria-label="Pages"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it("composes parts, with custom info text", () => {
    wrapper = mountPagination(
      {},
      {
        default: () => [
          h(PaginationInfo, null, { default: ({ page, totalCount }) => `Page ${page} of ${totalCount / 10}` }),
          h(PaginationSeparator),
          h(PaginationControls, { controls: "simple" }),
        ],
      },
    );
    expect(wrapper.find('[data-slot="pagination-info"]').text()).toBe("Page 1 of 10");
    expect(wrapper.find('[data-slot="pagination-info"]').attributes("aria-live")).toBeUndefined();
    expect(wrapper.find('[data-slot="pagination-separator"]').exists()).toBe(true);
    wrapper.unmount();
  });
});
