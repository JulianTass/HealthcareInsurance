import React from "react";
import type { Config } from "../types";

type Props = { w?: number; h?: number; showDims?: boolean };

export default function Perimeter({ w = 120, h = 70, showDims = true }: Props) {
  return (
    <svg width={260} height={180}>
      <g transform="translate(40,30)">
        <rect width={w} height={h} fill="#f9fafb" stroke="black" strokeWidth={2}/>
        {showDims && (
          <>
            <text x={w/2 - 10} y={-6} fontSize={12}>{w}</text>
            <text x={w + 6} y={h/2} fontSize={12}>{h}</text>
          </>
        )}
      </g>
    </svg>
  );
}

export const config: Config = {
  title: "Perimeter (Rectangle)",
  fields: {
    w: { type: "number", label: "Width",  min: 20, max: 200, step: 1, default: 120 },
    h: { type: "number", label: "Height", min: 20, max: 140, step: 1, default: 70  },
    showDims: { type: "boolean", label: "Show dimensions", default: true },
  },
  presets: [
    { label: "Square 80×80",    params: { w: 80,  h: 80 } },
    { label: "Wide 160×60",     params: { w: 160, h: 60 } },
    { label: "Tall 60×140",     params: { w: 60,  h: 140 } },
  ],
};
