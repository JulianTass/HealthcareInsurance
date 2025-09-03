import React from "react";
import type { Config } from "../types";

type Props = { a?:number; b?:number; h?:number; showDims?:boolean };

export default function AreaTrapezium({ a=160, b=100, h=80, showDims=true }:Props){
  const x=40,y=150; const offset=(a-b)/2;
  return (
    <svg width={300} height={210}>
      <polygon points={`${x},${y} ${x+a},${y} ${x+offset+b},${y-h} ${x+offset},${y-h}`}
               fill="#f9fafb" stroke="black" strokeWidth={2}/>
      {showDims && (
        <>
          <text x={x+a/2-10} y={y+16} fontSize={12}>a={a}</text>
          <text x={x+offset+b/2-10} y={y-h-6} fontSize={12}>b={b}</text>
          <line x1={x+offset} y1={y-h} x2={x+offset} y2={y} stroke="#111" strokeDasharray="4 4"/>
          <text x={x+offset+6} y={(y+y-h)/2} fontSize={12}>h={h}</text>
        </>
      )}
    </svg>
  );
}

export const config: Config = {
  title: "Area of Trapezium",
  fields: {
    a:{type:"number",label:"Base a",min:60,max:240,step:5,default:160},
    b:{type:"number",label:"Base b",min:40,max:200,step:5,default:100},
    h:{type:"number",label:"Height",min:30,max:140,step:5,default:80},
    showDims:{type:"boolean",label:"Show dimensions",default:true}
  },
  presets:[
    {label:"a=160 b=100 h=80",params:{a:160,b:100,h:80}}
  ]
};
