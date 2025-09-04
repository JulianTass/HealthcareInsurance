import React from "react";
import type { Config } from "../types";

type Props = { r?:number; h?:number; showDims?:boolean };

export default function VolumeCylinder({ r=40, h=120, showDims=true }:Props){
  const cx=80, cy=60, w=2*r;
  return (
    <svg width={240} height={220}>
      {/* top ellipse */}
      <ellipse cx={cx+r} cy={cy} rx={r} ry={12} fill="#fff" stroke="black"/>
      {/* body */}
      <rect x={cx} y={cy} width={w} height={h} fill="#fff" stroke="black"/>
      {/* bottom ellipse (hidden back arc dashed) */}
      <path d={`M ${cx},${cy+h} a ${r},12 0 1 0 ${2*r},0`} fill="none" stroke="black"/>
      <path d={`M ${cx+2*r},${cy+h} a ${r},12 0 0 0 ${-2*r},0`} fill="none" stroke="#888" strokeDasharray="4 4"/>
      {showDims && (
        <>
          <line x1={cx+r} y1={cy} x2={cx+r} y2={cy+h} stroke="#111" strokeDasharray="4 4"/>
          <text x={cx+r+6} y={(cy+cy+h)/2} fontSize={12}>h={h}</text>
          <line x1={cx+r} y1={cy} x2={cx+2*r} y2={cy} stroke="#111" strokeDasharray="4 4"/>
          <text x={cx+r+6} y={cy-6} fontSize={12}>r={r}</text>
        </>
      )}
    </svg>
  );
}

export const config: Config = {
  title: "Volume of Cylinder",
  fields: {
    r:{type:"number",label:"Radius r",min:20,max:80,step:2,default:40},
    h:{type:"number",label:"Height h",min:60,max:180,step:5,default:120},
    showDims:{type:"boolean",label:"Show dimensions",default:true}
  },
  presets:[
    {label:"r=40, h=120",params:{r:40,h:120}},
    {label:"r=30, h=160",params:{r:30,h:160}}
  ]
};
