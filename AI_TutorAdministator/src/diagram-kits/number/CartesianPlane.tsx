import React from "react";
import type { Config } from "../types";

type Props = {
  xMin?: number; xMax?: number; yMin?: number; yMax?: number;
  step?: number;
  points?: { x:number; y:number; label?:string }[];
  showLine?: boolean; m?: number; c?: number; // y=mx+c
};

export default function CartesianPlane({
  xMin=-5, xMax=5, yMin=-5, yMax=5, step=1,
  points = [{x:2,y:3,label:"A"}],
  showLine=false, m=1, c=0
}: Props) {
  const W=360, H=360, pad=30;
  const sx=(x:number)=> pad+(x-xMin)*((W-2*pad)/(xMax-xMin));
  const sy=(y:number)=> H-pad-(y-yMin)*((H-2*pad)/(yMax-yMin));

  const xs:number[]=[]; for(let x=xMin;x<=xMax+1e-9;x+=step) xs.push(+x.toFixed(6));
  const ys:number[]=[]; for(let y=yMin;y<=yMax+1e-9;y+=step) ys.push(+y.toFixed(6));

  // line endpoints (clipped to box)
  const x1=xMin, x2=xMax, y1=m*x1+c, y2=m*x2+c;

  return (
    <svg width={W} height={H}>
      {/* axes */}
      <rect x={pad} y={pad} width={W-2*pad} height={H-2*pad} fill="#fff" stroke="#e5e7eb"/>
      <line x1={sx(0)} y1={pad} x2={sx(0)} y2={H-pad} stroke="#111"/>
      <line x1={pad} y1={sy(0)} x2={W-pad} y2={sy(0)} stroke="#111"/>
      {/* grid */}
      {xs.map(x=><line key={`x${x}`} x1={sx(x)} y1={pad} x2={sx(x)} y2={H-pad} stroke="#f0f0f0"/>)}
      {ys.map(y=><line key={`y${y}`} x1={pad} y1={sy(y)} x2={W-pad} y2={sy(y)} stroke="#f0f0f0"/>)}
      {/* ticks */}
      {xs.map(x=><text key={`tx${x}`} x={sx(x)-3} y={sy(0)+12} fontSize={10}>{x}</text>)}
      {ys.map(y=><text key={`ty${y}`} x={sx(0)+4} y={sy(y)+4} fontSize={10}>{y}</text>)}
      {/* line */}
      {showLine && <line x1={sx(x1)} y1={sy(y1)} x2={sx(x2)} y2={sy(y2)} stroke="black"/>}
      {/* points */}
      {points.map((p,i)=>(
        <g key={i}>
          <circle cx={sx(p.x)} cy={sy(p.y)} r={4} fill="black"/>
          {p.label && <text x={sx(p.x)+6} y={sy(p.y)-6} fontSize={12}>{p.label}</text>}
        </g>
      ))}
    </svg>
  );
}

export const config: Config = {
  title: "Cartesian Plane",
  fields: {
    xMin:{type:"number",label:"x min",min:-20,max:0,step:1,default:-5},
    xMax:{type:"number",label:"x max",min:0,max:20,step:1,default:5},
    yMin:{type:"number",label:"y min",min:-20,max:0,step:1,default:-5},
    yMax:{type:"number",label:"y max",min:0,max:20,step:1,default:5},
    step:{type:"number",label:"Grid step",min:0.5,max:5,step:0.5,default:1},
    showLine:{type:"boolean",label:"Show y = mx + c",default:false},
    m:{type:"number",label:"m",min:-5,max:5,step:0.5,default:1},
    c:{type:"number",label:"c",min:-10,max:10,step:1,default:0}
  },
  presets:[
    {label:"Plot A(2,3)",params:{points:[{x:2,y:3,label:"A"}]}},
    {label:"Line y = 0.5x + 1",params:{showLine:true,m:0.5,c:1}}
  ]
};
