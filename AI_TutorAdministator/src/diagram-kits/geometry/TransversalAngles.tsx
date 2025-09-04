import React from "react";
import type { Config } from "../types";

type Props = {
  gap?: number; angleDeg?: number;
  labelStyle?: "none" | "corresponding" | "alternate" | "cointerior";
};

function degToRad(d: number) { return (d * Math.PI) / 180; }

export default function TransversalAngles({
  gap = 50,
  angleDeg = 25,            // angle between transversal and top parallel
  labelStyle = "corresponding",
}: Props) {
  const W = 360, H = 220, cx = 40, y1 = 70, y2 = y1 + gap;
  const a = degToRad(angleDeg);
  const xA1 = cx, xA2 = W - 20;
  const tX1 = cx + 10, tY1 = y1 - Math.tan(a) * (tX1 - cx);
  const tX2 = W - 30,  tY2 = tY1 + (tX2 - tX1) * Math.tan(a);

  const arc = (x: number, y: number, r = 16, sweep = 0) =>
    `M ${x},${y} a ${r},${r} 0 0 ${sweep ? 1 : 0} ${r},${sweep ? r : -r}`;

  return (
    <svg width={W} height={H}>
      {/* parallel lines */}
      <line x1={xA1} y1={y1} x2={xA2} y2={y1} stroke="black" strokeWidth={2} />
      <line x1={xA1} y1={y2} x2={xA2} y2={y2} stroke="black" strokeWidth={2} />
      {/* transversal */}
      <line x1={tX1} y1={tY1} x2={tX2} y2={tY2} stroke="black" strokeWidth={2} />

      {/* angle markers */}
      {/* top intersection */}
      <path d={arc(tX1, y1, 16, 1)} fill="none" stroke="#111" />
      {/* bottom intersection */}
      <path d={arc(tX1, y2, 16, 0)} fill="none" stroke="#111" />

      {/* labels highlighting angle relationships */}
      {labelStyle === "corresponding" && (
        <>
          <text x={tX1 + 20} y={y1 - 6} fontSize={12}>∠1</text>
          <text x={tX1 + 20} y={y2 - 6} fontSize={12}>∠1′</text>
          <text x={tX1 + 60} y={y1 + 14} fontSize={12}>Corresponding angles equal</text>
        </>
      )}
      {labelStyle === "alternate" && (
        <>
          <text x={tX1 - 28} y={y1 + 14} fontSize={12}>∠2</text>
          <text x={tX1 + 22} y={y2 - 8} fontSize={12}>∠2′</text>
          <text x={tX1 + 60} y={y1 + 14} fontSize={12}>Alternate interior angles equal</text>
        </>
      )}
      {labelStyle === "cointerior" && (
        <>
          <text x={tX1 - 28} y={y1 + 14} fontSize={12}>∠3</text>
          <text x={tX1 - 28} y={y2 + 14} fontSize={12}>∠4</text>
          <text x={tX1 + 60} y={y1 + 14} fontSize={12}>Cointerior angles sum to 180°</text>
        </>
      )}
    </svg>
  );
}

export const config: Config = {
  title: "Transversal Angle Facts",
  fields: {
    gap: { type: "number", label: "Gap", min: 30, max: 120, step: 2, default: 50 },
    angleDeg: { type: "number", label: "Transversal angle°", min: -45, max: 45, step: 1, default: 25 },
    labelStyle: {
      type: "select",
      label: "Highlight",
      options: [
        { label: "None", value: "none" },
        { label: "Corresponding", value: "corresponding" },
        { label: "Alternate", value: "alternate" },
        { label: "Cointerior", value: "cointerior" },
      ],
      default: "corresponding",
    },
  },
  presets: [
    { label: "Corresponding", params: { labelStyle: "corresponding" } },
    { label: "Alternate interior", params: { labelStyle: "alternate" } },
    { label: "Cointerior (sum 180°)", params: { labelStyle: "cointerior" } },
  ],
};
