import React from "react";
import type { Config } from "../types";

type Sector = { label: string; value: number };
type Props = { sectors?: Sector[]; showLabels?: boolean; showLegend?: boolean };

export default function PieChart({
  sectors = [{ label: "A", value: 3 }, { label: "B", value: 2 }, { label: "C", value: 1 }],
  showLabels = true,
  showLegend = true,
}: Props) {
  const W = 360, H = 220, cx = 120, cy = 110, r = 80;
  const sum = sectors.reduce((a, s) => a + (s.value || 0), 0) || 1;
  let start = -Math.PI / 2;
  const palette = ["#fde68a", "#bfdbfe", "#c7f9cc", "#fecaca", "#ddd", "#e9d5ff", "#fbcfe8"];

  return (
    <svg width={W} height={H}>
      {sectors.map((s, i) => {
        const ang = (s.value / sum) * 2 * Math.PI;
        const end = start + ang;
        const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
        const x2 = cx + r * Math.cos(end),   y2 = cy + r * Math.sin(end);
        const large = ang > Math.PI ? 1 : 0; const mid = (start + end) / 2;
        start = end;
        return (
          <g key={i}>
            <path d={`M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${large} 1 ${x2},${y2} Z`} fill={palette[i % palette.length]} stroke="black" />
            {showLabels && <text x={cx + (r * 0.6) * Math.cos(mid) - 6} y={cy + (r * 0.6) * Math.sin(mid) + 4} fontSize={12}>{s.label}</text>}
          </g>
        );
      })}
      {showLegend && (
        <g transform="translate(230, 24)">
          {sectors.map((s, i) => (
            <g key={i} transform={`translate(0, ${i * 16})`}>
              <rect width="12" height="12" fill={palette[i % palette.length]} stroke="black" />
              <text x="16" y="10" fontSize={12}>{s.label} ({s.value})</text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

export const config: Config = {
  title: "Pie Chart",
  fields: {
    showLabels: { type: "boolean", label: "Show labels", default: true },
    showLegend: { type: "boolean", label: "Show legend", default: true },
  },
  presets: [
    { label: "A=3, B=2, C=1", params: { sectors: [{ label: "A", value: 3 }, { label: "B", value: 2 }, { label: "C", value: 1 }] } },
    { label: "Fruits", params: { sectors: [{ label: "Apples", value: 4 }, { label: "Oranges", value: 5 }, { label: "Bananas", value: 2 }] } },
  ],
};
