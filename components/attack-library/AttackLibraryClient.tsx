"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Attack } from "@/types/attack";
import { listBackendAttacks, adaptBackendAttack } from "@/lib/api/attacks";
import { AttackCard } from "./AttackCard";
import { AttackFilters, blankFilters, type Filters } from "./AttackFilters";
import { AttackLandscape } from "./AttackLandscape";
import { AttackTable } from "./AttackTable";

const includes = (source: string[], values: string[]) => !values.length || values.some(v => source.includes(v));

export function AttackLibraryClient() {
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rawSearch, setRawSearch] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(blankFilters);
  const [view, setView] = useState<"grid" | "table">("grid");
  const [sort, setSort] = useState("novelty");
  const [collapsed, setCollapsed] = useState(false);
  const [selected, setSelected] = useState<Attack | undefined>();
  const [visible, setVisible] = useState(12);

  useEffect(() => { listBackendAttacks().then(items => setAttacks(items.map(adaptBackendAttack))).catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);
  useEffect(() => { const timer = setTimeout(() => setSearch(rawSearch), 150); return () => clearTimeout(timer); }, [rawSearch]);

  const filtered = useMemo(() => attacks.filter(a => {
    const haystack = [a.id, a.name, a.description, a.category, ...a.paymentRails, ...a.aiCapabilities, ...a.target, ...a.defenseStrategy, ...a.tags].join(" ").toLowerCase();
    return (!search || haystack.includes(search.toLowerCase())) &&
      includes([a.category], filters.categories) && includes(a.paymentRails, filters.rails) &&
      includes(a.aiCapabilities, filters.ai) && includes([a.severity], filters.severity) &&
      includes([a.evidenceStatus], filters.evidence) && includes([a.simulationStatus], filters.simulation) &&
      includes([a.difficulty], filters.difficulty);
  }), [attacks, search, filters]);

  const ordered = useMemo(() => [...filtered].sort((a, b) => {
    if (sort === "novelty") return b.noveltyScore - a.noveltyScore;
    if (sort === "alphabetical") return a.name.localeCompare(b.name);
    const weight = { low: 1, medium: 2, high: 3, "very-high": 4 };
    if (sort === "difficulty") return weight[b.difficulty] - weight[a.difficulty];
    if (sort === "simulation") return a.simulationStatus.localeCompare(b.simulationStatus);
    const sev = { low: 1, medium: 2, high: 3, critical: 4 };
    return sev[b.severity] - sev[a.severity];
  }), [filtered, sort]);

  return <>
    <div className="library-page-head">
      <div><p className="eyebrow">PAYMENT SECURITY RESEARCH LAB · MASTERSHIELD</p><h1>{loading ? "Loading Attack Intelligence…" : `${attacks.length}+ GenAI Payment Attack Scenarios`}</h1><p className="subtitle">Backend-sourced threat taxonomy across payment rails, AI capabilities, and defensive signals</p></div>
      <div className="library-actions"><label className="attack-search"><span>⌕</span><input value={rawSearch} onChange={e => setRawSearch(e.target.value)} placeholder="Search attacks, rails, AI techniques..." /></label><button className="filter-button" onClick={() => setCollapsed(v => !v)}>☷ Filters</button><Link className="primary" href={selected ? `/simulator?attack=${selected.id}` : "/simulator"}>Launch Simulator <span>→</span></Link></div>
    </div>
    {error && <div className="panel" style={{ padding: 14, marginBottom: 16, color: "#ff819c" }}>Backend unavailable: {error}</div>}
    <div className="library-kpis">
      {[
        ["Taxonomy Categories", "12", "Backend attack families", "purple"],
        ["Total Attack Vectors", String(attacks.length), "Canonical backend catalog", "blue"],
        ["Very-High Difficulty", String(attacks.filter(a => a.difficulty === "very-high").length), "Adaptive / evasive focus", "amber"],
        ["Simulation Ready", String(attacks.filter(a => a.simulationStatus === "ready").length), "Generator-backed scenarios", "green"],
      ].map(([label, value, detail, tone]) => <section className="library-kpi panel" key={label}><span className={`library-kpi-icon ${tone}`}>◈</span><div><p>{label}</p><h2>{value}</h2><span>{detail}</span></div></section>)}
    </div>
    <div className="library-workspace">
      <AttackFilters filters={filters} onChange={setFilters} collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      <div className="attack-intelligence">
        <AttackLandscape attacks={filtered} selectedId={selected?.id} onSelect={setSelected} />
        <section className="panel attack-collection">
          <div className="collection-head"><div><h2>Attack Vectors <span>{filtered.length} of {attacks.length}</span></h2><p>{selected ? <><b>{selected.id} · {selected.name}</b> selected</> : "Live attack intelligence from the MasterShield backend"}</p></div><div className="collection-controls"><select aria-label="Sort attack list" value={sort} onChange={e => setSort(e.target.value)}><option value="novelty">Novelty</option><option value="severity">Severity</option><option value="difficulty">Difficulty</option><option value="simulation">Simulation readiness</option><option value="alphabetical">Name</option></select><div className="view-toggle"><button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")}>▦ Grid</button><button className={view === "table" ? "active" : ""} onClick={() => setView("table")}>☷ Table</button></div></div></div>
          {!loading && filtered.length ? view === "grid" ? <><div className="attack-grid">{ordered.slice(0, visible).map(a => <AttackCard key={a.id} attack={a} />)}</div>{visible < filtered.length && <button className="load-more" onClick={() => setVisible(v => v + 12)}>Load More ({filtered.length - visible} remaining)</button>}</> : <AttackTable attacks={ordered} /> : !loading ? <div className="attack-empty"><span>◌</span><h3>No attack vectors match</h3><button onClick={() => { setFilters(blankFilters); setRawSearch(""); }}>Clear all filters</button></div> : <div className="attack-empty"><span>◌</span><h3>Connecting to MasterShield backend…</h3></div>}
        </section>
      </div>
    </div>
  </>;
}
