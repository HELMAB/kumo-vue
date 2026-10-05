// Ported from Cloudflare Kumo's Flow layout (MIT). See /NOTICE.

/** Edges between nodes: adjacent list entries connect, a parallel group fans out and in, adjacent groups do not. */
export function computeEdges(flowState) {
  const edges = [];
  collectEdges(flowState.tree, edges);
  return edges;
}

function entryIds(node) {
  if (node.kind === "node") return [node.id];
  if (node.kind === "parallel") return node.children.flatMap(entryIds);
  return node.children.length ? entryIds(node.children[0]) : [];
}

function exitIds(node) {
  if (node.kind === "node") return [node.id];
  if (node.kind === "parallel") return node.children.flatMap(exitIds);
  return node.children.length ? exitIds(node.children.at(-1)) : [];
}

function collectEdges(node, edges) {
  if (node.kind === "node") return;
  for (const child of node.children) collectEdges(child, edges);
  if (node.kind === "parallel") return;

  for (let i = 0; i < node.children.length - 1; i++) {
    const current = node.children[i];
    const next = node.children[i + 1];
    if (current.kind === "parallel" && next.kind === "parallel") continue;
    for (const from of exitIds(current)) {
      for (const to of entryIds(next)) edges.push([from, to]);
    }
  }
}

/** Top-left position of every node: lists run along the flow, parallel branches across it. */
export function computePositions(flowState, { columnGap = 64, rowGap = 16 } = {}) {
  const positions = {};
  const { align, orientation } = flowState;
  const vertical = orientation === "vertical";

  function layout(node, originX, originY, out) {
    if (node.kind === "node") {
      const measured = flowState.nodes[node.id];
      out[node.id] = { x: originX, y: originY };
      return { width: measured?.width ?? 0, height: measured?.height ?? 0 };
    }

    const sizes = () => node.children.map((child) => layout(child, 0, 0, {}));

    if (node.kind === "list") {
      if (align === "center") {
        const measured = sizes();
        const cross = Math.max(0, ...measured.map((s) => (vertical ? s.width : s.height)));
        let cursor = vertical ? originY : originX;
        node.children.forEach((child, i) => {
          const offset = (cross - (vertical ? measured[i].width : measured[i].height)) / 2;
          if (vertical) layout(child, originX + offset, cursor, out);
          else layout(child, cursor, originY + offset, out);
          cursor += (vertical ? measured[i].height : measured[i].width) + (i < node.children.length - 1 ? columnGap : 0);
        });
        return vertical ? { width: cross, height: cursor - originY } : { width: cursor - originX, height: cross };
      }

      let cursor = vertical ? originY : originX;
      let cross = 0;
      node.children.forEach((child, i) => {
        const size = vertical ? layout(child, originX, cursor, out) : layout(child, cursor, originY, out);
        cursor += (vertical ? size.height : size.width) + (i < node.children.length - 1 ? columnGap : 0);
        cross = Math.max(cross, vertical ? size.width : size.height);
      });
      return vertical ? { width: cross, height: cursor - originY } : { width: cursor - originX, height: cross };
    }

    if (node.align === "end") {
      const measured = sizes();
      const cross = Math.max(0, ...measured.map((s) => (vertical ? s.height : s.width)));
      let cursor = vertical ? originX : originY;
      node.children.forEach((child, i) => {
        if (vertical) layout(child, cursor, originY + cross - measured[i].height, out);
        else layout(child, originX + cross - measured[i].width, cursor, out);
        cursor += (vertical ? measured[i].width : measured[i].height) + (i < node.children.length - 1 ? rowGap : 0);
      });
      return vertical ? { width: cursor - originX, height: cross } : { width: cross, height: cursor - originY };
    }

    let cursor = vertical ? originX : originY;
    let cross = 0;
    node.children.forEach((child, i) => {
      const size = vertical ? layout(child, cursor, originY, out) : layout(child, originX, cursor, out);
      cursor += (vertical ? size.width : size.height) + (i < node.children.length - 1 ? rowGap : 0);
      cross = Math.max(cross, vertical ? size.height : size.width);
    });
    return vertical ? { width: cursor - originX, height: cross } : { width: cross, height: cursor - originY };
  }

  layout(flowState.tree, 0, 0, positions);
  return positions;
}

/** The bounding box of every placed node. */
export function computeDiagramRect(positions, flowState) {
  let width = 0;
  let height = 0;
  for (const [id, pos] of Object.entries(positions)) {
    const node = flowState.nodes[id];
    if (!node) continue;
    width = Math.max(width, pos.x + node.width);
    height = Math.max(height, pos.y + node.height);
  }
  return { width, height };
}
