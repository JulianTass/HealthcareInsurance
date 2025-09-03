import React from "react";
import type { Config } from "../types";

type Props = { A?:number; B?:number; C?:number; D?:number; showValues?:boolean };

export default function AnglesQuadrilateral({ A=90,B=90,C=90,D=90,showValues=true }:Props){
  const W=260,H=180; const p=[{x:50,y:140},{x:210,y:130},{x:190,y:50},{x:60,y:60}];
  return (
    <svg width={W} height={H}>
      <polygon points={p.map(q=>`${q.x},${q.y}`).join(" ")} fill="#f9fafb" stroke="black" strokeWidth={2}/>
      {showValues && (
        <>
          <text x={p[0].x+4} y={p[0].y-6} fontSize={12}>{A}°</text>
          <text x={p[1].x-22} y={p[1].y-6} fontSize={12}>{B}°</text>
          <text x={p[2].x-18} y={p[2].y+18} fontSize={12}>{C}°</text>
          <text x={p[3].x+6} y={p[3].y+18} fontSize={12}>{D}°</text>
        </>
      )}
    </svg>
  );
}

export const config: Config = {
  title: "Quadrilateral Angles",
  fields: {
    A:{type:"number",label:"A°",min:10,max:170,step:1,default:90},
    B:{type:"number",label:"B°",min:10,max:170,step:1,default:90},
    C:{type:"number",label:"C°",min:10,max:170,step:1,default:90},
    D:{type:"number",label:"D°",min:10,max:170,step:1,default:90},
    showValues:{type:"boolean",label:"Show values",default:true}
  },
  presets:[
    {label:"Rectangle",params:{A:90,B:90,C:90,D:90}},
    {label:"Generic quad",params:{A:110,B:80,C:120,D:50}}
  ]
};
