import React, { useMemo } from 'react';

type PlanNode = {
  id: string;
  label: string;
  term?: string; // e.g., "Year 1 - Fall" or "Semester 1"
  credits?: number;
  category?: string; // e.g., Core, Elective, Thesis
};

type PlanEdge = {
  from: string;
  to: string;
  type?: 'prereq' | 'coreq' | 'recommended';
};

export type DegreePlan = {
  level: 'bachelor' | 'master' | 'phd' | 'self-study' | string;
  title?: string;
  description?: string;
  lanes?: string[]; // explicit column order
  nodes: PlanNode[];
  edges?: PlanEdge[];
};

type PlanVisualizerProps = {
  plan: DegreePlan;
  className?: string;
};

type PositionedNode = PlanNode & {
  x: number;
  y: number;
  width: number;
  height: number;
  lane: string;
};

const laneDisplayOrder = (lanes: string[]): string[] => {
  // Try to order lanes sensibly if the caller didn't supply a fixed order
  const order = [...lanes];
  const parse = (s: string) => {
    // Extract year and term indices where possible
    const lower = s.toLowerCase();
    const yearMatch = /year\s*(\d+)/.exec(lower) || /y\s*(\d+)/.exec(lower);
    const semMatch = /semester\s*(\d+)/.exec(lower) || /sem\s*(\d+)/.exec(lower);
    const fall = /(fall|autumn)/.test(lower) ? 1 : undefined;
    const spring = /(spring)/.test(lower) ? 2 : undefined;
    const summer = /(summer)/.test(lower) ? 3 : undefined;
    const termOrder = semMatch ? parseInt(semMatch[1], 10) : (fall ?? spring ?? summer ?? 99);
    const yearOrder = yearMatch ? parseInt(yearMatch[1], 10) : 99;
    return { yearOrder, termOrder };
  };
  order.sort((a, b) => {
    const pa = parse(a);
    const pb = parse(b);
    if (pa.yearOrder !== pb.yearOrder) return pa.yearOrder - pb.yearOrder;
    if (pa.termOrder !== pb.termOrder) return pa.termOrder - pb.termOrder;
    return a.localeCompare(b);
  });
  return order;
};

export const PlanVisualizer: React.FC<PlanVisualizerProps> = ({ plan, className }) => {
  const { lanes, nodes, edges } = plan;

  const layout = useMemo(() => {
    const laneSet = new Set<string>();
    nodes.forEach(n => laneSet.add(n.term || 'Unassigned'));
    const laneList = lanes && lanes.length > 0 ? lanes : laneDisplayOrder(Array.from(laneSet));

    const colWidth = 260; // px
    const colGap = 40;
    const rowHeight = 88; // node height including spacing
    const nodeWidth = 220;
    const nodeHeight = 64;

    const laneYOffsets = new Map<string, number>();
    const positioned: Record<string, PositionedNode[]> = {};

    laneList.forEach((lane, laneIndex) => {
      const colX = laneIndex * (colWidth + colGap);
      const inLane = nodes.filter(n => (n.term || 'Unassigned') === lane);
      positioned[lane] = inLane.map((n, i): PositionedNode => ({
        ...n,
        x: colX,
        y: i * rowHeight,
        width: nodeWidth,
        height: nodeHeight,
        lane,
      }));
      laneYOffsets.set(lane, (inLane.length - 1) * rowHeight + nodeHeight);
    });

    const width = Math.max(1, laneList.length) * (colWidth + colGap) - colGap;
    const height = Math.max(
      400,
      ...Object.values(positioned).map(arr => (arr.length ? arr[arr.length - 1].y + nodeHeight : 0))
    ) + 40;

    const nodeIndex = new Map<string, PositionedNode>();
    for (const arr of Object.values(positioned)) {
      for (const n of arr) nodeIndex.set(n.id, n);
    }

    return { laneList, positioned, nodeIndex, width, height, nodeWidth, nodeHeight, colWidth };
  }, [lanes, nodes]);

  const arrowColor = '#94a3b8';

  return (
    <div className={className}>
      {plan.title && (
        <div className="text-sm font-medium mb-2">{plan.title}</div>
      )}
      <div className="relative w-full overflow-auto rounded-md border border-border bg-card">
        <svg width={Math.max(600, layout.width + 80)} height={Math.max(400, layout.height + 80)}>
          <defs>
            <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L12,6 L0,12 L3,6 z" fill={arrowColor} />
            </marker>
          </defs>

          {/* Background lanes headers */}
          {layout.laneList.map((lane, idx) => (
            <g key={lane} transform={`translate(${idx * (layout.colWidth + 40)}, 0)`}>
              <text x={16} y={28} fontSize={12} fill="#64748b">{lane}</text>
            </g>
          ))}

          {/* Edges underneath nodes */}
          {plan.edges?.map((e, i) => {
            const from = layout.nodeIndex.get(e.from);
            const to = layout.nodeIndex.get(e.to);
            if (!from || !to) return null;
            const startX = from.x + from.width + 16;
            const startY = from.y + from.height / 2 + 40; // +40 padding top
            const endX = to.x - 16;
            const endY = to.y + to.height / 2 + 40;

            const dx = Math.max(40, (endX - startX) / 2);
            const c1x = startX + dx;
            const c1y = startY;
            const c2x = endX - dx;
            const c2y = endY;
            const stroke = e.type === 'coreq' ? '#10b981' : e.type === 'recommended' ? '#eab308' : arrowColor;

            return (
              <path
                key={i}
                d={`M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`}
                fill="none"
                stroke={stroke}
                strokeWidth={1.75}
                markerEnd="url(#arrow)"
                opacity={0.9}
              />
            );
          })}

          {/* Nodes */}
          {layout.laneList.flatMap((lane) => (
            (layout.positioned[lane] || []).map((n) => (
              <g key={n.id} transform={`translate(${n.x + 16}, ${n.y + 40})`}>
                <rect
                  rx={10}
                  ry={10}
                  width={n.width}
                  height={n.height}
                  fill="#0f172a"
                  stroke="#1f2937"
                />
                <text x={12} y={22} fontSize={12} fill="#e5e7eb">{n.label}</text>
                {n.credits !== undefined && (
                  <text x={12} y={42} fontSize={11} fill="#94a3b8">{n.credits} credits</text>
                )}
                {n.category && (
                  <text x={n.width - 8} y={18} fontSize={10} fill="#93c5fd" textAnchor="end">{n.category}</text>
                )}
              </g>
            ))
          ))}
        </svg>
      </div>
    </div>
  );
};

export default PlanVisualizer;

