import React from "react";
import type { Config } from "../types";

type Sector = { label:string; value:number }; // values sum to 1 (or any sum; we normalise)
type Props = { sectors?: Sector[]; showLabels?:boolean };

export default function Spinner({ sectors=[{label:"A",value:1},{label:"B",value:1},{label:"C",value:1}], showLabels=true }:Props){
  const cx=120, cy=120, r=90; const sum=sectors.reduce((a,s)=>a+s.value,0) || 1;
  let start= -Math.PI/2;
  return (
    <svg width={240} height={240}>
      {sectors.map((s,i)=>{
        const ang=(s.value/sum)*2*Math.PI;
        const end=start+ang;
        const x1=cx+r*Math.cos(start), y1=cy+r*Math.sin(start);
        const x2=cx+r*Math.cos(end),   y2=cy+r*Math.sin(end);
        const large= ang>Math.PI?1:0;
        const mid=(start+end)/2;
        start=end;
        return (
          <g key={i}>
            <path d={`M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${large} 1 ${x2},${y2} Z`} fill={["#fde68a","#bfdbfe","#c7f9cc","#fecaca","#ddd"][i%5]} stroke="black"/>
            {showLabels && <text x={cx+ (r*0.6)*Math.cos(mid)-6} y={cy+ (r*0.6)*Math.sin(mid)+4} fontSize={12}>{s.label}</text>}
          </g>
        );
      })}
      {/* pointer */}
      <line x1={cx} y1={cy} x2={cx} y2={cy-r+8} stroke="black" strokeWidth={2}/>
      <polygon points={`${cx-6},${cy-r+8} ${cx+6},${cy-r+8} ${cx},${cy-r-8}`} fill="black"/>
    </svg>
  );
}

export const config: Config = {
  title:"Probability Spinner",
  fields:{
    showLabels:{type:"boolean",label:"Show labels",default:true}
  },
  presets:[
    {label:"Three equal",params:{sectors:[{label:"A",value:1},{label:"B",value:1},{label:"C",value:1}]}},
    {label:"Biased A",params:{sectors:[{label:"A",value:3},{label:"B",value:1},{label:"C",value:1}]}}
  ]
};
