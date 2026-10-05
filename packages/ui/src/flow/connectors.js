// Ported from Cloudflare Kumo's Flow connectors (MIT). See /NOTICE.
const FLAT_THRESHOLD = 2;

/** An SVG path between two anchors with rounded elbows, stopping short of the arrowhead. */
export function createRoundedPath(
  { x1, y1, x2, y2 },
  { cornerRadius: maxCornerRadius = 8, midOffset = 32, arrowheadOffset = 8, isBottom = false, single = false, orientation = "vertical" } = {},
) {
  const cornerRadius = Math.min(maxCornerRadius, Math.abs(orientation === "horizontal" ? (y2 - y1) / 2 : (x2 - x1) / 2));
  const xSign = x2 > x1 ? 1 : -1;
  const ySign = y2 > y1 ? 1 : -1;

  if (orientation === "horizontal") {
    if (Math.abs(y2 - y1) <= FLAT_THRESHOLD) return `M ${x1} ${y1} L ${x2 - arrowheadOffset} ${y2}`;
    const turnX = single || isBottom ? x2 - midOffset : x1 + midOffset;
    const firstEnd = turnX - xSign * cornerRadius;
    const turnStart = y1 + ySign * cornerRadius;
    const turnEnd = y2 - ySign * cornerRadius;
    const secondStart = turnX + xSign * cornerRadius;
    const bottom = [
      `L ${firstEnd} ${y1}`,
      `Q ${turnX} ${y1} ${turnX} ${turnStart}`,
      single ? `L ${turnX} ${turnEnd} Q ${turnX} ${y2} ${secondStart} ${y2}` : `L ${turnX} ${y2}`,
    ];
    const top = [
      single ? `L ${firstEnd} ${y1} Q ${turnX} ${y1} ${turnX} ${turnStart}` : `L ${turnX} ${y1}`,
      `L ${turnX} ${turnEnd}`,
      `Q ${turnX} ${y2} ${secondStart} ${y2}`,
    ];
    return [`M ${x1} ${y1}`, ...(isBottom ? bottom : top), `L ${x2 - xSign * arrowheadOffset} ${y2}`].join(" ");
  }

  if (Math.abs(x2 - x1) <= FLAT_THRESHOLD) return `M ${x1} ${y1} L ${x2} ${y2 - arrowheadOffset}`;
  const turnY = single || isBottom ? y2 - midOffset : y1 + midOffset;
  const firstEnd = turnY - cornerRadius;
  const turnStart = x1 + xSign * cornerRadius;
  const turnEnd = x2 - xSign * cornerRadius;
  const secondStart = turnY + cornerRadius;
  const bottom = [
    `L ${x1} ${firstEnd}`,
    `Q ${x1} ${turnY} ${turnStart} ${turnY}`,
    single ? `L ${turnEnd} ${turnY} Q ${x2} ${turnY} ${x2} ${secondStart}` : `L ${x2} ${turnY}`,
  ];
  const top = [
    single ? `L ${x1} ${firstEnd} Q ${x1} ${turnY} ${turnStart} ${turnY}` : `L ${x1} ${turnY}`,
    `L ${turnEnd} ${turnY}`,
    `Q ${x2} ${turnY} ${x2} ${secondStart}`,
  ];
  return [`M ${x1} ${y1}`, ...(isBottom ? bottom : top), `L ${x2} ${y2 - ySign * arrowheadOffset}`].join(" ");
}

/** One connector per edge, from each source's outgoing anchor to each target's incoming one; disabled ones first, so they sit beneath. */
export function buildConnectors(edges, positions, nodes, orientation) {
  const connectors = [];
  for (const [fromId, toId] of edges) {
    const from = positions[fromId];
    const to = positions[toId];
    const fromNode = nodes[fromId];
    const toNode = nodes[toId];
    if (!from || !to || !fromNode || !toNode) continue;
    const points =
      orientation === "vertical"
        ? { x1: from.x + fromNode.width / 2, y1: from.y + fromNode.height, x2: to.x + toNode.width / 2, y2: to.y }
        : {
            x1: from.x + fromNode.width,
            y1: from.y + (fromNode.startAnchorOffset ?? fromNode.height / 2),
            x2: to.x,
            y2: to.y + (toNode.endAnchorOffset ?? toNode.height / 2),
          };
    connectors.push({
      id: `${fromId}-${toId}`,
      disabled: Boolean(fromNode.disabled || toNode.disabled),
      path: createRoundedPath(points, { single: true, orientation }),
    });
  }
  return connectors.sort((a, b) => Number(b.disabled) - Number(a.disabled));
}
