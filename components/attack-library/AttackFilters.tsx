"use client";

import type { AttackCategory, EvidenceStatus, SimulationStatus } from "@/types/attack";
import { categoryLabel } from "@/data/attacks";

export type Filters = {
  categories: AttackCategory[];
  rails: string[];
  ai: string[];
  severity: string[];
  evidence: EvidenceStatus[];
  simulation: SimulationStatus[];
  difficulty: string[];
};

export const blankFilters: Filters = {
  categories: [],
  rails: [],
  ai: [],
  severity: [],
  evidence: [],
  simulation: [],
  difficulty: []
};

const groups: { key: keyof Filters; label: string; items: readonly string[] }[] = [
  { key: "categories", label: "Taxonomy Category (12)", items: Object.entries(categoryLabel).map(([value, label]) => `${value}|${label}`) },
  { key: "rails", label: "Payment Rail", items: ["UPI", "Cards", "Wallets", "Bank Transfer", "RTGS", "NEFT", "BNPL", "Cross-border"] },
  { key: "severity", label: "Severity Level", items: ["critical|Critical", "high|High", "medium|Medium", "low|Low"] },
  { key: "difficulty", label: "Attack Difficulty", items: ["very-high|Very High (RL/Multi-Stage)", "high|High", "medium|Medium", "low|Low"] },
  { key: "ai", label: "AI Capability", items: ["LLM", "Voice cloning", "Video/deepfake", "Image generation", "Reinforcement learning", "Behavioral modeling", "Multi-agent AI", "Autonomous agents", "Diffusion models"] },
  { key: "evidence", label: "Evidence Status", items: ["documented|Documented Precedent", "emerging|Emerging Threat", "research|Research-Stage", "hypothetical|Composite / Hypothetical"] },
  { key: "simulation", label: "Simulation Readiness", items: ["ready|Simulation Ready", "in-development|In Development", "research-only|Research Track"] },
];

const display = (item: string) => item.split("|")[1] || item;
const value = (item: string) => item.split("|")[0];

export function AttackFilters({
  filters,
  onChange,
  collapsed,
  onToggle,
  attackCount = 120
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
  collapsed: boolean;
  onToggle: () => void;
  attackCount?: number;
}) {
  const hasFilters = Object.values(filters).some(items => items.length);
  const toggle = (key: keyof Filters, item: string) => {
    const raw = value(item);
    const current = filters[key] as string[];
    onChange({
      ...filters,
      [key]: current.includes(raw) ? current.filter(i => i !== raw) : [...current, raw]
    });
  };

  if (collapsed) {
    return (
      <aside className="filter-collapsed">
        <button onClick={onToggle} title="Expand filters">
          ☷ <span>Filters ({Object.values(filters).flat().length})</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="filter-panel panel">
      <div className="filter-header">
        <div>
          <h2>Taxonomy Filters</h2>
          <p>Refine across {attackCount} attack scenarios</p>
        </div>
        <button onClick={onToggle} aria-label="Collapse filters">‹</button>
      </div>

      {hasFilters && (
        <div className="filter-active">
          <span>{Object.values(filters).flat().length} active filters</span>
          <button onClick={() => onChange(blankFilters)}>Reset all</button>
        </div>
      )}

      {groups.map(group => (
        <details key={group.key} open className="filter-group">
          <summary>
            {group.label}
            <span>⌄</span>
          </summary>
          <div>
            {group.items.map(item => {
              const selected = (filters[group.key] as string[]).includes(value(item));
              return (
                <label key={item}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggle(group.key, item)}
                  />
                  <i />
                  {display(item)}
                </label>
              );
            })}
          </div>
        </details>
      ))}
    </aside>
  );
}
