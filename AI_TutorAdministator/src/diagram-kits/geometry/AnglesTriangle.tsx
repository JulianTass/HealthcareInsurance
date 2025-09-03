import React from "react";
import type { Config } from "../types";

type Props = {
  a?: number; b?: number; c?: number; // vertices as angles (°) that should add to 180
  showValues?: boolean;
};

export default function AnglesTriangle({ a=60, b=60, c=60, showValues=true }: Props) {
  // simple triangle coordinates
  const W=260,H=180; const A={x:40,y:140}, B={x:220,y:140}, C={x:130,y:40};
  return (
    <svg width={W} height={H}>
      <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`} fill="#f9fafb" stroke="black" strokeWidth={2}/>
      {/* arcs (rough) */}
      <path d={`M ${A.x+16},${A.y} a 16,16 0 0 1 14,-10`} stroke="black" fill="none"/>
      <path d={`M ${B.x-16},${B.y} a 16,16 0 0 0 -14,-10`} stroke="black" fill="none"/>
      <path d={`M ${C.x},${C.y+16} a 16,16 0 0 0 10,14`} stroke="black" fill="none"/>
      {showValues && (
        <>
          <text x={A.x+8} y={A.y-6} fontSize={12}>{a}°</text>
          <text x={B.x-28} y={B.y-6} fontSize={12}>{b}°</text>
          <text x={C.x+8} y={C.y+28} fontSize={12}>{c}°</text>
        </>
      )}
    </svg>
  );
}

export const config: Config = {
  title: "Triangle Angles",
  fields: {
    a:{type:"number",label:"Angle A°",min:10,max:170,step:1,default:60},
    b:{type:"number",label:"Angle B°",min:10,max:170,step:1,default:60},
    c:{type:"number",label:"Angle C°",min:10,max:170,step:1,default:60},
    showValues:{type:"boolean",label:"Show values",default:true}
  },
  presets:[
    {label:"Equilateral",params:{a:60,b:60,c:60}},
    {label:"Right triangle",params:{a:90,b:45,c:45}}
  ]
};
