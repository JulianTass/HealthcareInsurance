import React from "react";
import { DiagramRegistry } from "../diagram-kits/registry";

type Props = {
  kind: string;
  params: any;
  maxHeight?: number;
};

export default function DiagramThumb({ kind, params, maxHeight = 120 }: Props) {
  const Comp = DiagramRegistry[kind];
  if (!Comp) {
    return <div style={{ fontSize: 12, color: "#b91c1c" }}>Unknown diagram: {kind}</div>;
  }
  return (
    <div style={{ maxHeight, overflow: "hidden" }}>
      <Comp {...params} />
    </div>
  );
}
