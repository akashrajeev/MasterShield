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
  "mule-aml": "#56dba3",
  "payment-instrument": "#ffb300",
  "api-abuse": "#00d2d3",
  "behavioral-device": "#a29bfe",
  "cross-channel": "#ff7675",
  "autonomous-fraud": "#e056fd",
  "synthetic-content": "#48dbfb"
};

export function AttackLandscape({
  attacks,
  selectedId,
  onSelect
}: {
  attacks: Attack[];
  selectedId?: string;
  onSelect: (attack: Attack) => void;
}) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [hover, setHover] = useState<Attack | null>(null);

  const shown = useMemo(() => {
    if (attacks.length <= 24) return attacks;
    const map = new Map<string, Attack>();
    attacks.forEach(a => {
      if (!map.has(a.category) || map.size < 24) map.set(a.id, a);
    });
    return Array.from(map.values()).slice(0, 24);
  }, [attacks]);

  const positions = useMemo(() => {
    return shown.map((attack, index) => {
      const angle = (index / shown.length) * Math.PI * 2 - 0.5;
      const ring = index % 3 === 0 ? 68 : index % 2 ? 96 : 124;
      return {
        attack,
        x: 210 + Math.cos(angle) * ring,
        y: 122 + Math.sin(angle) * ring
      };
    });
  }, [shown]);

  const selected = attacks.find(a => a.id === selectedId);
  const connections = selected ? new Set(selected.relatedAttackIds) : new Set<string>();

  return (
    <section className="panel landscape">
      <div className="panel-head">
        <div>
          <h2>Attack Landscape</h2>
          <p>Relationship graph across 12 payment-fraud attack surfaces</p>
        </div>
        <div className="graph-key">
          {Object.entries(colors).slice(0, 8).map(([key, color]) => (
            <span key={key}>
              <i style={{ background: color }} />
              {categoryLabel[key as AttackCategory]?.split(" & ")[0]}
            </span>
          ))}
        </div>
      </div>

      <div className="graph-tools">
        <button onClick={() => setScale(s => Math.min(1.5, s + 0.1))}>+</button>
        <button onClick={() => setScale(s => Math.max(0.6, s - 0.1))}>−</button>
        <button onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}>Reset</button>
      </div>

      <div
        className="graph-stage"
        onMouseDown={event => setDrag({ x: event.clientX - offset.x, y: event.clientY - offset.y })}
        onMouseMove={event => drag && setOffset({ x: event.clientX - drag.x, y: event.clientY - drag.y })}
        onMouseUp={() => setDrag(null)}
        onMouseLeave={() => { setDrag(null); setHover(null); }}
      >
        <svg
          viewBox="0 0 420 245"
          role="img"
          aria-label="Interactive attack relationship map"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
        >
          <g className="graph-lines">
            {positions.map((node, index) =>
              index ? (
                <line
                  key={node.attack.id}
                  x1="210"
                  y1="122"
                  x2={node.x}
                  y2={node.y}
                  className={selected && (connections.has(node.attack.id) || node.attack.id === selected.id) ? "connected" : ""}
                />
              ) : null
            )}
          </g>
          <circle cx="210" cy="122" r="24" className="graph-core" />
          <text x="210" y="126" textAnchor="middle" fill="#c3b8ff" fontWeight="800" fontSize="10">AI DEFENSE</text>

          {positions.map(node => (
            <g
              key={node.attack.id}
              className={`graph-node ${selectedId === node.attack.id ? "selected" : ""} ${selected && !connections.has(node.attack.id) && node.attack.id !== selected.id ? "dim" : ""}`}
              transform={`translate(${node.x},${node.y})`}
              onClick={event => { event.stopPropagation(); onSelect(node.attack); }}
              onMouseEnter={() => setHover(node.attack)}
              onMouseLeave={() => setHover(null)}
            >
              <circle r={node.attack.severity === "critical" ? 10 : 7} fill={colors[node.attack.category] || "#8073fc"} />
              <circle r={node.attack.severity === "critical" ? 14 : 11} fill="none" stroke={colors[node.attack.category] || "#8073fc"} opacity=".35" />
              <text x="13" y="4" fontSize="7" fill="#cbd5e1">{node.attack.id}</text>
            </g>
          ))}
        </svg>

        {hover && (
          <div className="graph-tooltip">
            <b>{hover.id} · {hover.name}</b>
            <span>{categoryLabel[hover.category]} · {hover.severity.toUpperCase()}</span>
            <span>Difficulty: {hover.difficulty} · Novelty: {hover.noveltyScore}/100</span>
            <span>Rails: {hover.paymentRails.slice(0, 3).join(", ")}</span>
          </div>
        )}
      </div>

      <div className="landscape-foot">
        <span>Click node to highlight attack vectors and chain dependencies.</span>
        <span>{attacks.length} total attack scenarios across 12 taxonomies</span>
      </div>
    </section>
  );
}
