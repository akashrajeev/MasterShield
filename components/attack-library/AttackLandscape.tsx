"use client";

import { useMemo, useState } from "react";
import type { Attack } from "@/types/attack";
import { categoryLabel } from "@/data/attacks";

const colors: Record<string,string> = {identity:"#57c6ef","social-engineering":"#9a83ff","account-takeover":"#ef79bd",merchant:"#f2aa58","transaction-evasion":"#f06c7e","mule-aml":"#56dba3"};
export function AttackLandscape({ attacks, selectedId, onSelect }: { attacks: Attack[]; selectedId?: string; onSelect: (attack: Attack) => void }) {
  const [scale,setScale] = useState(1); const [offset,setOffset] = useState({x:0,y:0}); const [drag,setDrag] = useState<{x:number;y:number}|null>(null); const [hover,setHover] = useState<Attack|null>(null);
  const shown = attacks.slice(0, 18); const positions = useMemo(() => shown.map((attack,index) => { const angle = (index / shown.length) * Math.PI * 2 - .5; const ring = index % 3 === 0 ? 62 : index % 2 ? 91 : 115; return {attack,x:210 + Math.cos(angle)*ring,y:122 + Math.sin(angle)*ring}; }),[shown]);
  const selected = attacks.find(a => a.id === selectedId); const connections = selected ? new Set(selected.relatedAttackIds) : new Set<string>();
  return <section className="panel landscape"><div className="panel-head"><div><h2>Attack Landscape</h2><p>Relationship map across payment-fraud attack surfaces</p></div><div className="graph-key">{Object.entries(colors).map(([key,color]) => <span key={key}><i style={{background:color}}/>{categoryLabel[key as keyof typeof categoryLabel].split(" & ")[0]}</span>)}</div></div>
    <div className="graph-tools"><button onClick={() => setScale(s => Math.min(1.4,s+.1))}>+</button><button onClick={() => setScale(s => Math.max(.7,s-.1))}>−</button><button onClick={() => {setScale(1);setOffset({x:0,y:0})}}>Reset</button></div>
    <div className="graph-stage" onMouseDown={event => setDrag({x:event.clientX-offset.x,y:event.clientY-offset.y})} onMouseMove={event => drag && setOffset({x:event.clientX-drag.x,y:event.clientY-drag.y})} onMouseUp={() => setDrag(null)} onMouseLeave={() => {setDrag(null);setHover(null)}}>
      <svg viewBox="0 0 420 245" role="img" aria-label="Interactive attack relationship map" style={{transform:`translate(${offset.x}px, ${offset.y}px) scale(${scale})`}}>
        <g className="graph-lines">{positions.map((node,index) => index ? <line key={node.attack.id} x1="210" y1="122" x2={node.x} y2={node.y} className={selected && (connections.has(node.attack.id)||node.attack.id === selected.id) ? "connected" : ""}/> : null)}</g>
        <circle cx="210" cy="122" r="23" className="graph-core"/>
        <text x="210" y="125" textAnchor="middle">AI</text>
        {positions.map(node => <g key={node.attack.id} className={`graph-node ${selectedId === node.attack.id ? "selected" : ""} ${selected && !connections.has(node.attack.id) && node.attack.id !== selected.id ? "dim" : ""}`} transform={`translate(${node.x},${node.y})`} onClick={event => {event.stopPropagation();onSelect(node.attack)}} onMouseEnter={() => setHover(node.attack)} onMouseLeave={() => setHover(null)}><circle r={node.attack.severity === "critical" ? 11 : 8} fill={colors[node.attack.category]}/><circle r={node.attack.severity === "critical" ? 15 : 12} fill="none" stroke={colors[node.attack.category]} opacity=".3"/><text x="15" y="4">{node.attack.id}</text></g>)}
      </svg>{hover && <div className="graph-tooltip"><b>{hover.id} · {hover.name}</b><span>{categoryLabel[hover.category]} · {hover.severity}</span><span>{hover.simulationStatus === "ready" ? "Simulation ready" : "Research track"}</span></div>}</div>
    <div className="landscape-foot"><span>Click a node to inspect connected attack patterns.</span><span>{attacks.length} attacks shown across 6 surfaces</span></div>
  </section>;
}
