import React from "react";
import type { Config } from "../types";

type Branch = { label: string; p: number };
type Props = {
  eventA?: Branch[]; // e.g. [{label:"H",p:0.5},{label:"T",p:0.5}]
  eventB?: Branch[]; // applies to each A branch (assume same distribution)
  showProbs?: boolean;
};

export default function TreeDiagram({
  eventA = [{ label: "A", p: 0.6 }, { label: "¬A", p: 0.4 }],
  eventB = [{ label: "B", p: 0.7 }, { label: "¬B", p: 0.3 }],
  showProbs = true,
}: Props) {
  const W = 420, H = 220, x0 = 30, y0 = 30, xStep = 160, yStep = 70;

  return (
    <svg width={W} height={H}>
      {/* First level (A) */}
      {eventA.map((a, i) => {
        const yA = y0 + i * yStep * Math.max(1, eventB.length);
        const xA = x0 + xStep;
        return (
          <g key={`A-${i}`}>
            <line x1={x0} y1={H / 2} x2={xA} y2={yA} stroke="#111" />
            <text x={xA - 60} y={yA - 6} fontSize={12}>{a.label}</text>
            {showProbs && <text x={xA - 60} y={yA + 10} fontSize={11}>P={a.p}</text>}

            {/* Second level (B given A) */}
            {eventB.map((b, j) => {
              const xB = xA + xStep, yB = yA + (j - (eventB.length - 1) / 2) * yStep;
              const joint = +(a.p * b.p).toFixed(3);
              return (
                <g key={`B-${i}-${j}`}>
                  <line x1={xA} y1={yA} x2={xB} y2={yB} stroke="#111" />
                  <text x={xB - 50} y={yB - 6} fontSize={12}>{b.label}</text>
                  {showProbs && (
                    <>
                      <text x={xB - 50} y={yB + 10} fontSize={11}>P={b.p}</text>
                      <text x={xB + 10} y={yB + 4} fontSize={11}>P({a.label}∩{b.label})={joint}</text>
                    </>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

export const config: Config = {
  title: "Tree Diagram (Two Events)",
  fields: {
    showProbs: { type: "boolean", label: "Show probabilities", default: true },
  },
  presets: [
    { label: "A/¬A then B/¬B", params: {
      eventA: [{ label: "A", p: 0.6 }, { label: "¬A", p: 0.4 }],
      eventB: [{ label: "B", p: 0.7 }, { label: "¬B", p: 0.3 }],
    } },
    { label: "Coin then die odd/even", params: {
      eventA: [{ label: "H", p: 0.5 }, { label: "T", p: 0.5 }],
      eventB: [{ label: "Odd", p: 0.5 }, { label: "Even", p: 0.5 }],
    } },
  ],
};
