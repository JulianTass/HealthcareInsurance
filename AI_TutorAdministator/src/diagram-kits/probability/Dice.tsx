import React from "react";
import type { Config } from "../types";

type Props = {
  mode?: "single" | "double";
  die1?: number; die2?: number;
  highlightSum?: number; showSumGrid?: boolean;
};

function Pip({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r={3} fill="black" />;
}

function Die({ n = 1, x = 0, y = 0 }: { n?: number; x?: number; y?: number }) {
  const cx = x + 18, cy = y + 18, s = 12;
  const map: Record<number, [number, number][]> = {
    1: [[cx, cy]],
    2: [[cx - s, cy - s], [cx + s, cy + s]],
    3: [[cx - s, cy - s], [cx, cy], [cx + s, cy + s]],
    4: [[cx - s, cy - s], [cx + s, cy - s], [cx - s, cy + s], [cx + s, cy + s]],
    5: [[cx - s, cy - s], [cx + s, cy - s], [cx, cy], [cx - s, cy + s], [cx + s, cy + s]],
    6: [[cx - s, cy - s], [cx + s, cy - s], [cx - s, cy], [cx + s, cy], [cx - s, cy + s], [cx + s, cy + s]],
  };
  return (
    <g>
      <rect x={x} y={y} width={36} height={36} rx={6} ry={6} fill="#fff" stroke="black" />
      {map[n].map(([px, py], i) => <Pip key={i} x={px} y={py} />)}
    </g>
  );
}

export default function Dice({
  mode = "single",
  die1 = 3,
  die2 = 4,
  highlightSum = 0,
  showSumGrid = true,
}: Props) {
  const W = 360, H = 220;

  return (
    <svg width={W} height={H}>
      {/* dice */}
      <g transform="translate(30, 24)">
        <Die n={die1} x={0} y={0} />
        {mode === "double" && <Die n={die2} x={60} y={0} />}
        <text x={0} y={64} fontSize={12}>Die 1: {die1}</text>
        {mode === "double" && <text x={60} y={64} fontSize={12}>Die 2: {die2}</text>}
        {mode === "double" && <text x={0} y={84} fontSize={12}>Sum: {die1 + die2}</text>}
      </g>

      {/* 6x6 sum grid */}
      {mode === "double" && showSumGrid && (
        <g transform="translate(150, 20)">
          <text x={0} y={-6} fontSize={12}>Sum grid</text>
          {[...Array(6)].map((_, r) =>
            [...Array(6)].map((__, c) => {
              const sum = (r + 1) + (c + 1);
              const x = c * 28, y = r * 28;
              const hit = highlightSum && sum === highlightSum;
              return (
                <g key={`${r}-${c}`}>
                  <rect x={x} y={y} width={26} height={26} fill={hit ? "#fde68a" : "#fff"} stroke="#111" />
                  <text x={x + 8} y={y + 16} fontSize={10}>{sum}</text>
                </g>
              );
            })
          )}
          {/* labels */}
          <text x={-20} y={14} fontSize={10}>6</text>
          <text x={-20} y={42} fontSize={10}>5</text>
          <text x={-20} y={70} fontSize={10}>4</text>
          <text x={-20} y={98} fontSize={10}>3</text>
          <text x={-20} y={126} fontSize={10}>2</text>
          <text x={-20} y={154} fontSize={10}>1</text>
          {[1,2,3,4,5,6].map((n,i)=><text key={i} x={i*28+8} y={176} fontSize={10}>{n}</text>)}
        </g>
      )}
    </svg>
  );
}

export const config: Config = {
  title: "Dice",
  fields: {
    mode: { type: "select", label: "Mode", options: [
      { label: "Single", value: "single" }, { label: "Double", value: "double" }
    ], default: "double" },
    die1: { type: "number", label: "Die 1", min: 1, max: 6, step: 1, default: 3 },
    die2: { type: "number", label: "Die 2", min: 1, max: 6, step: 1, default: 4 },
    highlightSum: { type: "number", label: "Highlight sum", min: 0, max: 12, step: 1, default: 7 },
    showSumGrid: { type: "boolean", label: "Show 6×6 grid", default: true },
  },
  presets: [
    { label: "Double dice, highlight 7", params: { mode: "double", die1: 3, die2: 4, highlightSum: 7 } },
    { label: "Single die", params: { mode: "single", die1: 5 } },
  ],
};
