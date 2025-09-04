import React from "react";
import type { Config } from "../types";

type Props = {
  mode?: "reflect" | "rotate" | "translate" | "scale";
  angleDeg?: number; tx?: number; ty?: number; k?: number;
  showMirror?: boolean;
};

export default function Transformation({
  mode="reflect", angleDeg=90, tx=60, ty=0, k=1.5, showMirror=true
}: Props) {
  const W=320,H=220, cx=160, cy=110;
  const base=[{x:-40,y:40},{x:0,y:-40},{x:40,y:40}]; // triangle
  const toStr=(p:{x:number;y:number}[])=>p.map(q=>`${q.x+cx},${q.y+cy}`).join(" ");

  const rot=(p:{x:number;y:number}[])=>{
    const a=(angleDeg*Math.PI)/180;
    return p.map(({x,y})=>({x: x*Math.cos(a)-y*Math.sin(a), y: x*Math.sin(a)+y*Math.cos(a)}));
  };
  const refl=(p:{x:number;y:number}[])=>{
    // mirror across vertical line through cx (x-> -x)
    return p.map(({x,y})=>({x:-x,y}));
  };
  const trans=(p:{x:number;y:number}[])=>p.map(({x,y})=>({x:x+tx,y:y+ty}));
  const scale=(p:{x:number;y:number}[])=>p.map(({x,y})=>({x:x*k,y:y*k}));

  let image=base;
  if (mode==="reflect") image=refl(base);
  if (mode==="rotate")  image=rot(base);
  if (mode==="translate") image=trans(base);
  if (mode==="scale") image=scale(base);

  return (
    <svg width={W} height={H}>
      <rect x="0" y="0" width={W} height={H} fill="#fff" stroke="#e5e7eb"/>
      {showMirror && <line x1={cx} y1={0} x2={cx} y2={H} stroke="#ddd" />}
      <polygon points={toStr(base)} fill="#eef2ff" stroke="black"/>
      <polygon points={toStr(image)} fill="#fde68a" stroke="black" opacity={0.9}/>
    </svg>
  );
}

export const config: Config = {
  title: "Transformations",
  fields: {
    mode:{type:"select",label:"Mode",options:[
      {label:"Reflect (vertical mirror)",value:"reflect"},
      {label:"Rotate (about centre)",value:"rotate"},
      {label:"Translate",value:"translate"},
      {label:"Scale (enlarge/reduce)",value:"scale"},
    ],default:"reflect"},
    angleDeg:{type:"number",label:"Angle° (rotate)",min:-180,max:180,step:5,default:90},
    tx:{type:"number",label:"Δx (translate)",min:-120,max:120,step:5,default:60},
    ty:{type:"number",label:"Δy (translate)",min:-120,max:120,step:5,default:0},
    k:{type:"number",label:"Scale k",min:0.5,max:2,step:0.1,default:1.5},
    showMirror:{type:"boolean",label:"Show mirror line",default:true}
  },
  presets:[
    {label:"Reflect in vertical line",params:{mode:"reflect"}},
    {label:"Rotate 90°",params:{mode:"rotate",angleDeg:90}},
    {label:"Translate (60, 30)",params:{mode:"translate",tx:60,ty:30}},
    {label:"Enlarge ×1.5",params:{mode:"scale",k:1.5}}
  ]
};
