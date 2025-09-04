import React from "react";
import type { Config } from "../types";

type Datum = { label: string; count: number };
type Props = { data?: Datum[]; dotsPerRow?: number; showCounts?: boolean };

export default function DotPlot({
  data = [{ label: "A", count: 3 }, { label: "B", count: 6 }, { label: "C", count: 2 }],
  dotsPerRow = 10,
  showCounts = true,
}: Props) {
  const W = 380, H = 220, pad = 30, gapX = 90, r = 5, rowGap = 14;
  return (
    <svg width={W} height={H}>
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#111" />
      {data.map((d, i) => {
        const x0 = pad + i * gapX, yBase = H - pad;
        const rows = Math.ceil(d.count / dotsPerRow);
        return (
          <g key={i}>
            {[...Array(d.count)].map((_, k) => {
              const row = Math.floor(k / dotsPerRow);
              const col = k % dotsPerRow;
              const cx = x0 + col * (2 * r + 4);
              const cy = yBase - row * rowGap - 12;
              return <circle key={k} cx={cx} cy={cy} r={r} fill="#111" />;
            })}
            <text x={x0 - 4} y={yBase + 14} fontSize={12}>{d.label}</text>
            {showCounts && <text x={x0 + 2} y={yBase - rows * rowGap - 6} fontSize={12}>{d.count}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export const config: Config = {
  title: "Dot Plot",
  fields: {
    dotsPerRow: { type: "number", label: "Dots per row", min: 5, max: 20, step: 1, default: 10 },
    showCounts: { type: "boolean", label: "Show counts", default: true },
  },
  presets: [
    { label: "A=3, B=6, C=2", params: { data: [{ label: "A", count: 3 }, { label: "B", count: 6 }, { label: "C", count: 2 }] } },
    { label: "Scores 2/3/4/5", params: { data: [{ label: "2", count: 2 }, { label: "3", count: 5 }, { label: "4", count: 7 }, { label: "5", count: 3 }] } },
  ],
};
