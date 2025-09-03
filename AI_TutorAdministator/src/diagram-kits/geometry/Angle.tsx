import React from "react";
import type { Config } from "../types";

type Props = { r?: number; aDeg?: number; bDeg?: number; label?: string };

export default function Angle({ r = 60, aDeg = 0, bDeg = 45, label = "θ" }: Props) {
  const a = (aDeg * Math.PI)/180, b = (bDeg * Math.PI)/180;
  const ax = r*Math.cos(a), ay = -r*Math.sin(a);
  const bx = r*Math.cos(b), by = -r*Math.sin(b);

  return (
    <svg width={220} height={160}>
      <g transform="translate(90,110)" stroke="black" strokeWidth={2} fill="none">
        <line x1="0" y1="0" x2={ax} y2={ay}/>
        <line x1="0" y1="0" x2={bx} y2={by}/>
        {/* arc */}
        <path d={`M 20 0 A 20 20 0 ${bDeg-aDeg>180?1:0} 1 ${20*Math.cos(b-a)} ${-20*Math.sin(b-a)}`} />
        <text x="24" y="-6" fontSize={12}>{label}</text>
      </g>
    </svg>
  );
}

export const config: Config = {
  title: "Angle",
  fields: {
    aDeg: { type: "number", label: "Ray A (°)", min: -180, max: 180, step: 1, default: 0 },
    bDeg: { type: "number", label: "Ray B (°)", min: -180, max: 180, step: 1, default: 45 },
    r:    { type: "number", label: "Radius",  min: 20,   max: 120,  step: 1, default: 60 },
    label:{ type: "text",   label: "Label", default: "θ" },
  },
  presets: [
    { label: "Acute (30°/60°)",  params: { aDeg: 0, bDeg: 60,  r: 60, label: "θ" } },
    { label: "Right (0°/90°)",   params: { aDeg: 0, bDeg: 90,  r: 60, label: "θ" } },
    { label: "Obtuse (0°/120°)", params: { aDeg: 0, bDeg: 120, r: 60, label: "θ" } },
  ],
};
