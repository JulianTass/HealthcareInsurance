import React from "react";
import type { Config } from "../types";

type Datum = { label:string; value:number };
type Props = { data?: Datum[]; showValues?:boolean; max?:number };

export default function BarGraph({ data=[{label:"A",value:3},{label:"B",value:5},{label:"C",value:2}], showValues=true, max }:Props){
  const W=360,H=220,pad=30;
  const n=data.length; const gap=10;
  const barW=((W-2*pad)-(n-1)*gap)/n;
  const maxV = max ?? Math.max(1,...data.map(d=>d.value));
  const y=(v:number)=> H-pad- (v/maxV)*(H-2*pad);
  return (
    <svg width={W} height={H}>
      <line x1={pad} y1={H-pad} x2={W-pad} y2={H-pad} stroke="#111"/>
      {data.map((d,i)=>{
        const x=pad+i*(barW+gap); const top=y(d.value);
        return (
          <g key={i}>
            <rect x={x} y={top} width={barW} height={H-pad-top} fill="#dbeafe" stroke="#111"/>
            <text x={x+barW/2-3} y={H-pad+14} fontSize={11}>{d.label}</text>
            {showValues && <text x={x+barW/2-4} y={top-6} fontSize={11}>{d.value}</text>}
          </g>
        );
      })}
    </svg>
  );
}
export const config: Config = {
  title:"Bar Graph",
  fields:{
    showValues:{type:"boolean",label:"Show values",default:true},
    max:{type:"number",label:"Y max (optional)",min:1,max:100,step:1,default:0}
  },
  presets:[
    {label:"Apples/Oranges/Bananas",params:{data:[{label:"Apples",value:4},{label:"Oranges",value:7},{label:"Bananas",value:3}]}}
  ]
};
