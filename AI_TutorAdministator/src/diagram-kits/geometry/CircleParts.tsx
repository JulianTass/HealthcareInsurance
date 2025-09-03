import React from "react";
import type { Config } from "../types";

type Props = { showRadius?:boolean; showDiameter?:boolean; showChord?:boolean; showSector?:boolean; angleDeg?:number };

export default function CircleParts({ showRadius=true, showDiameter=true, showChord=true, showSector=true, angleDeg=60 }:Props){
  const cx=140, cy=100, r=70;
  const rad=(angleDeg*Math.PI)/180;
  const sx=cx+r*Math.cos(rad), sy=cy-r*Math.sin(rad);
  const chordX=cx+ r*Math.cos(Math.PI/6), chordY=cy+ r*Math.sin(Math.PI/6);
  return (
    <svg width={280} height={200}>
      <circle cx={cx} cy={cy} r={r} fill="#fff" stroke="black" strokeWidth={2}/>
      {showSector && (
        <path d={`M ${cx},${cy} L ${cx+r},${cy} A ${r},${r} 0 ${angleDeg>180?1:0} 0 ${sx},${sy} Z`} fill="#eef2ff" stroke="black"/>
      )}
      {showRadius && (
        <line x1={cx} y1={cy} x2={cx+r} y2={cy} stroke="black"/>
      )}
      {showDiameter && (
        <line x1={cx-r} y1={cy} x2={cx+r} y2={cy} stroke="black"/>
      )}
      {showChord && (
        <line x1={chordX} y1={cy} x2={cx-r*Math.cos(Math.PI/6)} y2={cy} stroke="black"/>
      )}
      <text x={cx+6} y={cy-6} fontSize={12}>O</text>
    </svg>
  );
}

export const config: Config = {
  title: "Circle Parts",
  fields: {
    showRadius:{type:"boolean",label:"Radius",default:true},
    showDiameter:{type:"boolean",label:"Diameter",default:true},
    showChord:{type:"boolean",label:"Chord",default:true},
    showSector:{type:"boolean",label:"Sector",default:true},
    angleDeg:{type:"number",label:"Sector angle°",min:10,max:330,step:1,default:60}
  },
  presets:[
    {label:"Radius+Diameter",params:{showRadius:true,showDiameter:true,showChord:false,showSector:false}},
    {label:"Sector 120°",params:{showSector:true,angleDeg:120}}
  ]
};
