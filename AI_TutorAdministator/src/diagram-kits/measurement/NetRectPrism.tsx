import React from "react";
import type { Config } from "../types";

type Props = { w?: number; h?: number; d?: number; showDims?: boolean };

export default function NetRectPrism({ w = 80, h = 50, d = 40, showDims = true }: Props) {
  // simple net: 4 side faces in a row, top above second, bottom below second
  const x = 20, y = 40;
  const faces = [
    { x: x, y, w: d, h },           // left side
    { x: x + d, y, w, h },          // front
    { x: x + d + w, y, w: d, h },   // right side
    { x: x + d + w + d, y, w, h },  // back
    { x: x + d, y: y - h, w, h: d },// top
    { x: x + d, y: y + h, w, h: d } // bottom
  ];
  return (
    <svg width={340} height={240}>
      {faces.map((f, i) => (
        <g key={i}>
          <rect x={f.x} y={f.y} width={f.w} height={f.h} fill="#fff" stroke="black" />
          {/* fold lines */}
          {i < 4 && i > 0 && <line x1={f.x} y1={f.y} x2={f.x} y2={f.y + f.h} stroke="#999" strokeDasharray="4 4" />}
        </g>
      ))}
      {showDims && (
        <>
          <text x={x + d + 10} y={y - 6} fontSize={12}>w={w}</text>
          <text x={x - 2} y={y + h + 14} fontSize={12}>d={d}</text>
          <text x={x + d - 22} y={y + h / 2} fontSize={12}>h={h}</text>
        </>
      )}
    </svg>
  );
}

export const config: Config = {
  title: "Net: Rectangular Prism",
  fields: {
    w: { type: "number", label: "Width (w)", min: 30, max: 140, step: 2, default: 80 },
    h: { type: "number", label: "Height (h)", min: 20, max: 120, step: 2, default: 50 },
    d: { type: "number", label: "Depth (d)", min: 20, max: 120, step: 2, default: 40 },
    showDims: { type: "boolean", label: "Show labels", default: true },
  },
  presets: [
    { label: "w=80, h=50, d=40", params: { w: 80, h: 50, d: 40 } },
    { label: "w=120, h=60, d=30", params: { w: 120, h: 60, d: 30 } },
  ],
};
