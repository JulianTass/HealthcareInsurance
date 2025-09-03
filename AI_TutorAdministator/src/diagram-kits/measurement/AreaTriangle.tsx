import React from "react";
import type { Config } from "../types";

type Props = { b?:number; h?:number; showDims?:boolean };

export default function AreaTriangle({ b=160, h=90, showDims=true }:Props){
  const x=40,y=140;
  return (
    <svg width={280} height={200}>
      <polygon points={`${x},${y} ${x+b},${y} ${x+b/2},${y-h}`} fill="#f9fafb" stroke="black" strokeWidth={2}/>
      {showDims && (
        <>
          <line x1={x+b/2} y1={y} x2={x+b/2} y2={y-h} stroke="#111" strokeDasharray="4 4"/>
          <text x={x+b/2+6} y={(y+y-h)/2} fontSize={12}>h={h}</text>
          <text x={x+b/2-14} y={y+14} fontSize={12}>b={b}</text>
        </>
      )}
    </svg>
  );
}

export const config: Config = {
  title: "Area of Triangle",
  fields: {
    b:{type:"number",label:"Base",min:40,max:220,step:5,default:160},
    h:{type:"number",label:"Height",min:30,max:140,step:5,default:90},
    showDims:{type:"boolean",label:"Show dimensions",default:true}
  },
  presets:[
    {label:"b=160, h=90",params:{b:160,h:90}},
    {label:"b=120, h=60",params:{b:120,h:60}}
  ]
};
