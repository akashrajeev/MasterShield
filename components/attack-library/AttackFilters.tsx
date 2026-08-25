"use client";

import type { AttackCategory, EvidenceStatus, SimulationStatus } from "@/types/attack";
import { categoryLabel } from "@/data/attacks";

export type Filters = { categories: AttackCategory[]; rails: string[]; ai: string[]; severity: string[]; evidence: EvidenceStatus[]; simulation: SimulationStatus[]; difficulty: string[] };
export const blankFilters: Filters = { categories: [], rails: [], ai: [], severity: [], evidence: [], simulation: [], difficulty: [] };
const groups: { key: keyof Filters; label: string; items: readonly string[] }[] = [
  {key:"categories",label:"Category",items:Object.entries(categoryLabel).map(([value,label]) => `${value}|${label}`)},
  {key:"rails",label:"Payment rail",items:["UPI","Cards","Wallets","Bank Transfer","RTGS","NEFT","BNPL","Cross-border"]},
  {key:"ai",label:"AI capability",items:["LLM","Voice cloning","Image generation","Video/deepfake","Reinforcement learning","Behavioral modeling","Multi-agent AI"]},
  {key:"severity",label:"Impact",items:["low","medium","high","critical"]},
  {key:"evidence",label:"Evidence status",items:["documented","emerging|Observed / Emerging","research|Research-stage","hypothetical"]},
  {key:"simulation",label:"Simulation status",items:["ready","in-development|In development","research-only|Research only","not-simulated|Not simulated"]},
  {key:"difficulty",label:"Difficulty",items:["low","medium","high","very-high|Very high"]},
];
const display = (item: string) => item.split("|")[1] || item;
const value = (item: string) => item.split("|")[0];

export function AttackFilters({ filters, onChange, collapsed, onToggle }: { filters: Filters; onChange: (filters: Filters) => void; collapsed: boolean; onToggle: () => void }) {
  const hasFilters = Object.values(filters).some(items => items.length);
  const toggle = (key: keyof Filters, item: string) => { const raw = value(item); const current = filters[key] as string[]; onChange({...filters,[key]: current.includes(raw) ? current.filter(i => i !== raw) : [...current, raw]}); };
  if (collapsed) return <aside className="filter-collapsed"><button onClick={onToggle} title="Expand filters">☷ <span>Filters</span></button></aside>;
  return <aside className="filter-panel panel"><div className="filter-header"><div><h2>Filters</h2><p>Refine the threat landscape</p></div><button onClick={onToggle} aria-label="Collapse filters">‹</button></div>{hasFilters && <div className="filter-active"><span>{Object.values(filters).flat().length} active</span><button onClick={() => onChange(blankFilters)}>Clear filters</button></div>}
    {groups.map(group => <details key={group.key} open className="filter-group"><summary>{group.label}<span>⌄</span></summary><div>{group.items.map(item => { const selected = (filters[group.key] as string[]).includes(value(item)); return <label key={item}><input type="checkbox" checked={selected} onChange={() => toggle(group.key,item)}/><i/>{display(item)}</label>; })}</div></details>)}
  </aside>;
}
