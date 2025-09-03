import React from "react";
import type { Config } from "../types";

type Props = { gap?: number; length?: number; angleDeg?: number; labelA?: string; labelB?: string };

export default function ParallelLines({ gap = 30, length = 220, angleDeg = 0, labelA = "a", labelB = "b" }: Props) {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad) * length, dy = Math.sin(rad) * length;
  return (
    <svg width={300} height={160}>
      <g transform={`translate(30,80)`} stroke="black" strokeWidth={2}>
        <line x1={-dx/2} y1={-dy/2} x2={dx/2} y2={dy/2}/>
        <line x1={-dx/2} y1={-dy/2 + gap} x2={dx/2} y2={dy/2 + gap}/>
        <text x={dx/2 + 8} y={dy/2} fontSize={12}>{labelA}</text>
        <text x={dx/2 + 8} y={dy/2 + gap} fontSize={12}>{labelB}</text>
      </g>
    </svg>
  );
}

export const config: Config = {
  title: "Parallel Lines",
  fields: {
    gap:      { type: "number", label: "Gap",    min: 10, max: 100, step: 1, default: 30 },
    length:   { type: "number", label: "Length", min: 100, max: 260, step: 1, default: 220 },
    angleDeg: { type: "number", label: "Angle°", min: -45, max: 45,  step: 1, default: 0 },
    labelA:   { type: "text",   label: "Label A", default: "a" },
    labelB:   { type: "text",   label: "Label B", default: "b" },
  },
  presets: [
    { label: "Horizontal", params: { angleDeg: 0,  gap: 30 } },
    { label: "Slight tilt", params: { angleDeg: 15, gap: 30 } },
    { label: "Steeper",     params: { angleDeg: 30, gap: 30 } },
  ],
};
