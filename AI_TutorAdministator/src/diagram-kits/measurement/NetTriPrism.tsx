import React from "react";
import type { Config } from "../types";

type Props = { a?: number; b?: number; c?: number; length?: number; showDims?: boolean };
// a,b,c are triangle side lengths (schematic, not to scale-perfect)

export default function NetTriPrism({
  a = 60, b = 60, c = 60, length = 100, showDims = true,
}: Props) {
  const x = 30, y = 120;
  // central rectangle + two side rectangles (using 'length')
  const rects = [
    { x, y, w: length, h: a },
    { x, y: y - b, w: length, h: b },
    { x, y: y + a, w: length, h: c },
  ];
  // two triangles at left/right of the central rectangle
  return (
    <svg width={360} height={240}>
      {rects.map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill="#fff" stroke="black" />)}
      {/* triangular ends (schematic) */}
      <polygon points={`${x},${y} ${x},${y + a} ${x - 40},${y + a / 2}`} fill="#fff" stroke="black" />
      <polygon points={`${x + length},${y} ${x + length},${y + a} ${x + length + 40},${y + a / 2}`} fill="#fff" stroke="black" />
      {/* fold lines */}
      <line x1={x} y1={y} x2={x} y2={y + a} stroke="#999" strokeDasharray="4 4" />
      <line x1={x + length} y1={y} x2={x + length} y2={y + a} stroke="#999" strokeDasharray="4 4" />
      {showDims && (
        <>
          <text x={x + length / 2 - 12} y={y - 6} fontSize={12}>b={b}</text>
          <text x={x + length / 2 - 12} y={y + a + 16} fontSize={12}>c={c}</text>
          <text x={x + length + 6} y={y + a / 2} fontSize={12}>a={a}</text>
          <text x={x + length / 2 - 12} y={y + a / 2} fontSize={12}>L={length}</text>
        </>
      )}
    </svg>
  );
}

export const config: Config = {
  title: "Net: Triangular Prism",
  fields: {
    a: { type: "number", label: "Tri side a", min: 30, max: 120, step: 2, default: 60 },
    b: { type: "number", label: "Tri side b", min: 30, max: 120, step: 2, default: 60 },
    c: { type: "number", label: "Tri side c", min: 30, max: 120, step: 2, default: 60 },
    length: { type: "number", label: "Prism length", min: 60, max: 160, step: 5, default: 100 },
    showDims: { type: "boolean", label: "Show labels", default: true },
  },
  presets: [
    { label: "Equilateral ends", params: { a: 60, b: 60, c: 60, length: 100 } },
    { label: "a=80, b=60, c=50", params: { a: 80, b: 60, c: 50 } },
  ],
};
