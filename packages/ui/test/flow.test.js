import { afterEach, describe, expect, it } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref } from "vue";

import Flow from "../src/flow/Flow.vue";
import FlowAnchor from "../src/flow/FlowAnchor.vue";
import FlowList from "../src/flow/FlowList.vue";
import FlowNode from "../src/flow/FlowNode.vue";
import FlowParallel from "../src/flow/FlowParallel.vue";
import { createRoundedPath } from "../src/flow/connectors.js";
import { computeEdges } from "../src/flow/layout.js";

const node = (id) => ({ kind: "node", id });
const list = (children) => ({ kind: "list", children });
const parallel = (children) => ({ kind: "parallel", children });
const edgeSet = (tree) => new Set(computeEdges({ nodes: {}, tree, align: "start", orientation: "horizontal" }).map(([a, b]) => `${a}—${b}`));

const mounted = [];
const mountFlow = (children, props = {}) => {
  const wrapper = mount(Flow, { props, slots: { default: children }, attachTo: document.body });
  mounted.push(wrapper);
  return wrapper;
};
const settle = async () => {
  await flushPromises();
  await nextTick();
};

afterEach(() => mounted.splice(0).forEach((wrapper) => wrapper.unmount()));

describe("connector paths", () => {
  it("serializes horizontal path commands without commas", () => {
    const path = createRoundedPath({ x1: 0, y1: 17, x2: 56, y2: 71 }, { orientation: "horizontal", single: false });
    expect(path).toBe("M 0 17 L 32 17 L 32 63 Q 32 71 40 71 L 48 71");
  });

  it("rounds both corners for single vertical connector paths", () => {
    const path = createRoundedPath({ x1: 0, y1: 0, x2: 56, y2: 71 }, { orientation: "vertical", single: true });
    expect(path).toBe("M 0 0 L 0 31 Q 0 39 8 39 L 48 39 Q 56 39 56 47 L 56 63");
  });

  it("draws a straight line between nearly level anchors", () => {
    expect(createRoundedPath({ x1: 0, y1: 10, x2: 100, y2: 11 }, { orientation: "horizontal" })).toBe("M 0 10 L 92 11");
  });
});

describe("computeEdges", () => {
  it("connects adjacent nodes, and nothing for one node or none", () => {
    expect(edgeSet(list([node("A"), node("B"), node("C")]))).toEqual(new Set(["A—B", "B—C"]));
    expect(edgeSet(list([node("A")]))).toEqual(new Set());
    expect(edgeSet(list([]))).toEqual(new Set());
  });

  it("fans a node out to and in from every parallel branch", () => {
    expect(edgeSet(list([node("A"), parallel([node("B1"), node("B2")]), node("C")]))).toEqual(new Set(["A—B1", "A—B2", "B1—C", "B2—C"]));
  });

  it("does not connect adjacent parallel groups", () => {
    const tree = list([node("A"), parallel([node("B1"), node("B2")]), parallel([node("C1"), node("C2")]), node("D")]);
    expect(edgeSet(tree)).toEqual(new Set(["A—B1", "A—B2", "C1—D", "C2—D"]));
  });

  it("connects a list through its first and last children only", () => {
    const tree = list([node("A"), parallel([list([node("B1"), node("B2")]), node("C1")]), node("D")]);
    expect(edgeSet(tree)).toEqual(new Set(["A—B1", "A—C1", "B1—B2", "B2—D", "C1—D"]));
  });
});

describe("Flow", () => {
  it("renders nodes as list items with indexes and ids", async () => {
    const wrapper = mountFlow(() => [h(FlowNode, () => "Step 1"), h(FlowNode, { id: "two" }, () => "Step 2")]);
    await settle();
    const nodes = wrapper.findAll("[data-node-id]");
    expect(nodes.map((n) => n.element.tagName)).toEqual(["LI", "LI"]);
    expect(nodes.map((n) => n.text())).toEqual(["Step 1", "Step 2"]);
    expect(nodes.map((n) => n.attributes("data-node-index"))).toEqual(["0", "1"]);
    expect(nodes[1].attributes("data-node-id")).toBe("two");
    expect(nodes[0].attributes("data-node-id")).toBeTruthy();
    expect(nodes[0].attributes("style")).toContain("position: absolute");
  });

  it("draws a connector per edge, greyed when a node is disabled", async () => {
    const wrapper = mountFlow(() => [
      h(FlowNode, { id: "a" }, () => "A"),
      h(FlowParallel, () => [h(FlowNode, { id: "b" }, () => "B"), h(FlowNode, { id: "c", disabled: true }, () => "C")]),
      h(FlowNode, { id: "d" }, () => "D"),
    ]);
    await settle();
    const ids = wrapper.findAll("path[data-testid]").map((p) => p.attributes("data-testid"));
    expect(new Set(ids)).toEqual(new Set(["a-b", "a-c", "b-d", "c-d"]));
    expect(wrapper.findAll(".kv-flow__connector--disabled path").map((p) => p.attributes("data-testid")).sort()).toEqual(["a-c", "c-d"]);
  });

  it("nests lists and parallels inside parallel branches", async () => {
    const wrapper = mountFlow(() => [
      h(FlowParallel, () => [
        h(FlowList, () => [h(FlowNode, { id: "b1" }, () => "B1"), h(FlowNode, { id: "b2" }, () => "B2")]),
        h(FlowList, () => [h(FlowParallel, () => [h(FlowNode, { id: "p1" }, () => "P1"), h(FlowNode, { id: "p2" }, () => "P2")]), h(FlowNode, { id: "c" }, () => "C")]),
      ]),
      h(FlowNode, { id: "end" }, () => "End"),
    ]);
    await settle();
    const ids = new Set(wrapper.findAll("path[data-testid]").map((p) => p.attributes("data-testid")));
    expect(ids).toEqual(new Set(["b1-b2", "p1-c", "p2-c", "b2-end", "c-end"]));
  });

  it("renders the child element with as-child and keeps its own attributes", async () => {
    const wrapper = mountFlow(() => [h(FlowNode, { asChild: true, id: "custom" }, () => h("li", { class: "dot" }, "worker"))]);
    await settle();
    const el = wrapper.find('[data-node-id="custom"]');
    expect(el.classes()).toContain("dot");
    expect(el.classes()).not.toContain("kv-flow__node");
    expect(el.attributes("data-node-index")).toBe("0");
  });

  it("orders a node added later by its place in the document", async () => {
    const show = ref(false);
    const Demo = defineComponent({
      setup: () => () => h(Flow, null, () => [h(FlowNode, { id: "start" }, () => "Start"), show.value ? h(FlowNode, { id: "mid" }, () => "Middle") : null, h(FlowNode, { id: "end" }, () => "End")]),
    });
    const wrapper = mount(Demo, { attachTo: document.body });
    mounted.push(wrapper);
    await settle();
    show.value = true;
    await settle();
    expect(wrapper.findAll("[data-node-id]").map((n) => n.attributes("data-node-index"))).toEqual(["0", "1", "2"]);
    expect(new Set(wrapper.findAll("path[data-testid]").map((p) => p.attributes("data-testid")))).toEqual(new Set(["start-mid", "mid-end"]));
  });

  it("stacks lists in a column when vertical", async () => {
    const wrapper = mountFlow(() => [h(FlowNode, () => "A")], { orientation: "vertical" });
    await settle();
    expect(wrapper.find(".kv-flow__list").classes()).toContain("kv-flow__list--vertical");
  });

  it("renders anchors inside a node and rejects them outside one", async () => {
    const wrapper = mountFlow(() => [h(FlowNode, () => [h(FlowAnchor, { type: "end" }, () => "in"), h(FlowAnchor, { type: "start" }, () => "out")])]);
    await settle();
    expect(wrapper.find("[data-node-id]").text()).toBe("inout");
    expect(() => mount(FlowAnchor)).toThrow(/FlowNode/);
  });
});
