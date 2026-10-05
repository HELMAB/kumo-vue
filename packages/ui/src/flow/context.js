import { computed, inject, onBeforeUnmount, onMounted, onUpdated, provide, shallowRef, useId } from "vue";

export const FLOW = Symbol("kv-flow");
export const GROUP = Symbol("kv-flow-group");
export const ANCHORS = Symbol("kv-flow-anchors");

export function useFlow(part) {
  const flow = inject(FLOW, null);
  if (!flow) throw new Error(`${part} must be used within a Flow.`);
  return flow;
}

const byDocumentOrder = (a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);

function createGroup(id, kind, align) {
  const entries = shallowRef([]);
  const sort = () => {
    const sorted = [...entries.value].sort(byDocumentOrder);
    if (sorted.some((entry, i) => entry !== entries.value[i])) entries.value = sorted;
  };
  return {
    id,
    kind,
    align,
    entries,
    register(entry) {
      entries.value = [...entries.value.filter((e) => e.id !== entry.id), entry].sort(byDocumentOrder);
    },
    unregister(entryId) {
      entries.value = entries.value.filter((e) => e.id !== entryId);
    },
    sort,
  };
}

/** Registers this node or group with the group around it, in document order. */
export function useEntry(kind, el, { id = useId(), group = null } = {}) {
  const parent = inject(GROUP, null);
  onMounted(() => parent?.register({ id, kind, el: el.value, group }));
  onBeforeUnmount(() => parent?.unregister(id));
  const index = computed(() => parent?.entries.value.findIndex((entry) => entry.id === id) ?? -1);
  return { id, parent, index };
}

/** A list or parallel group: collects its children and joins its own parent, if it has one. */
export function useGroup(kind, el, align) {
  const id = useId();
  const group = createGroup(id, kind, align);
  provide(GROUP, group);
  onUpdated(group.sort);
  const { parent, index } = useEntry(kind, el, { id, group });
  return { group, index, isRoot: !parent };
}

export function toTree(group) {
  return {
    kind: group.kind,
    align: group.align?.value,
    children: group.entries.value.map((entry) => (entry.kind === "node" ? { kind: "node", id: entry.id } : toTree(entry.group))),
  };
}
