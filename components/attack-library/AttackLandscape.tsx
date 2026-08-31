"use client";

import { useMemo, useState } from "react";
import type { Attack, AttackCategory } from "@/types/attack";
import { categoryLabel } from "@/data/category-labels";

const colors: Record<AttackCategory, string> = {
  identity: "#57c6ef",
  "social-engineering": "#9a83ff",
  "account-takeover": "#ef79bd",
  merchant: "#f2aa58",
  "transaction-evasion": "#f06c7e",
  "mule-aml": "#7fd8b4",
  "payment-instrument": "#55a7ff",
  "api-abuse": "#d5a0ff",
  "behavioral-device": "#70d6e9",
  "cross-channel": "#ffa06e",
  "autonomous-fraud": "#ff78a7",
  "synthetic-content": "#cabd5e",
};

export function AttackLandscape({ attacks, selectedId, onSelect }: { attacks: Attack[]; selectedId?: string; onSelect: (attack?: Attack) => void }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const groups = useMemo(() => Object.entries(categoryLabel).map(([category, label]) => ({ category: category as AttackCategory, label, attacks: attacks.filter(a => a.category === category) })), [attacks]);
  return <section className="panel attack-landscape">
    <div className="landscape-head"><div><p className="eyebrow">ATTACK LANDSCAPE</p><h2>Threat Topology</h2><p>Click a node to inspect a backend-defined scenario.</p></div><div className="landscape-legend">{groups.map(g => <span key={g.category}><i style={{ background: colors[g.category] }} />{g.label}</span>)}</div></div>
    <div className="landscape-grid">{groups.map(group => <div className="landscape-column" key={group.category}>
      <header><span className="mono">{group.attacks.length.toString().padStart(2,"0")}</span><strong>{group.label}</strong></header>
      <div className="landscape-nodes">{group.attacks.slice(0, 16).map(attack => <button key={attack.id} className={`landscape-node ${selectedId===attack.id ? "selected" : ""}`} style={{ borderColor: colors[group.category] }} onMouseEnter={()=>setHovered(attack.id)} onMouseLeave={()=>setHovered(null)} onClick={()=>onSelect(attack)}><span>{attack.id}</span>{(hovered===attack.id || selectedId===attack.id) && <small>{attack.name}</small>}</button>)}</div>
    </div>)}</div>
  </section>;
}
