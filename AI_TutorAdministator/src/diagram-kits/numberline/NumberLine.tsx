import React from "react";
import type { Config } from "../types";

type Props = {
  from?: number;
  to?: number;
  step?: number;
  highlight?: number[];
  /** convenience: CSV string; parsed if provided */
  highlightCsv?: string;
  width?: number;
  height?: number;
  margin?: number;
  showArrows?: boolean;
  showZero?: boolean;
};

function parseCsv(csv?: string): number[] {
  if (!csv) return [];
  return csv
    .split(/[,\s]+/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n));
}

export default function NumberLine({
  from = -5,
  to = 5,
  step = 1,
  highlight,
  highlightCsv,
  width = 480,
  height = 90,
  margin = 30,
  showArrows = true,
  showZero = true,
}: Props) {
  // guards
  if (!Number.isFinite(from) || !Number.isFinite(to) || from === to) {
    return <svg width={width} height={height} />;
  }
  if (!Number.isFinite(step) || step === 0) step = 1;

  // allow CSV or array
  const hl = (highlight && highlight.length ? highlight : parseCsv(highlightCsv)) ?? [];

  const ascending = to > from;
  const s = ascending ? Math.abs(step) : -Math.abs(step);
  const span = to - from;
  const innerW = width - margin * 2;
  const midY = Math.round(height / 2);

  const scale = (x: number) => margin + ((x - from) / span) * innerW;

  // ticks (robust to rounding)
  const ticks: number[] = [];
  for (let x = from; ascending ? x <= to + 1e-9 : x >= to - 1e-9; x += s) {
    const snapped = Math.abs(x) < 1e-10 ? 0 : +x.toFixed(10);
    ticks.push(snapped);
    if (ticks.length > 2000) break; // safety
  }

  const validHl = hl.filter((x) => (ascending ? x >= from && x <= to : x <= from && x >= to));

  return (
    <svg width={width} height={height}>
      {/* baseline */}
      <line x1={margin} y1={midY} x2={width - margin} y2={midY} stroke="black" />

      {/* arrows */}
      {showArrows && (
        <>
          <path d={`M ${width - margin} ${midY} l -8 -5 l 0 10 z`} fill="black" />
          <path d={`M ${margin} ${midY} l 8 -5 l 0 10 z`} fill="black" />
        </>
      )}

      {/* ticks & labels */}
      {ticks.map((x) => {
        const cx = Math.round(scale(x));
        const isZero = x === 0;
        return (
          <g key={`t-${x}`}>
            <line
              x1={cx}
              y1={midY - (isZero ? 7 : 4)}
              x2={cx}
              y2={midY + (isZero ? 7 : 4)}
              stroke="black"
              strokeWidth={isZero ? 1.5 : 1}
            />
            <text x={cx - 3} y={midY + 18} fontSize={11}>
              {x}
            </text>
          </g>
        );
      })}

      {/* zero marker (optional accent beyond slightly bigger tick) */}
      {showZero && from < 0 && to > 0 && (
        <circle cx={scale(0)} cy={midY} r={2.5} fill="black" />
      )}

      {/* highlighted points */}
      {validHl.map((x, i) => (
        <circle key={`h-${i}-${x}`} cx={scale(x)} cy={midY} r={4} fill="black" />
      ))}
    </svg>
  );
}

/** Config for the builder UI */
export const config: Config = {
  title: "Number Line",
  fields: {
    from: { type: "number", label: "From", min: -100, max: 100, step: 1, default: -5 },
    to: { type: "number", label: "To", min: -100, max: 100, step: 1, default: 5 },
    step: { type: "number", label: "Step", min: 0.1, max: 20, step: 0.1, default: 1 },
    highlightCsv: { type: "text", label: "Highlights (CSV)", default: "" },
    showArrows: { type: "boolean", label: "Show arrows", default: true },
    showZero: { type: "boolean", label: "Emphasize zero", default: true },
  },
  presets: [
    { label: "−10 … 10 (step 1) | highlight −3,4", params: { from: -10, to: 10, step: 1, highlightCsv: "-3, 4" } },
    { label: "0 … 20 (step 2)", params: { from: 0, to: 20, step: 2, highlightCsv: "" } },
    { label: "−5 … 5 (step 1)", params: { from: -5, to: 5, step: 1, highlightCsv: "" } },
  ],
  // defaults are inferred from fields' default values
};
