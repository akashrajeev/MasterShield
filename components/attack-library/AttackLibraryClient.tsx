"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { attacks } from "@/data/attacks";
import type { Attack } from "@/types/attack";
import { AttackCard } from "./AttackCard";
import { AttackFilters, blankFilters, type Filters } from "./AttackFilters";
import { AttackLandscape } from "./AttackLandscape";
import { AttackTable } from "./AttackTable";

const includes = (source: string[], values: string[]) =>
  !values.length || values.some(value => source.includes(value));

export function AttackLibraryClient() {
  const [rawSearch, setRawSearch] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(blankFilters);
  const [view, setView] = useState<"grid" | "table">("grid");
  const [sort, setSort] = useState("novelty");
  const [collapsed, setCollapsed] = useState(false);
  const [selected, setSelected] = useState<Attack | undefined>();
  const [visible, setVisible] = useState(12);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(rawSearch), 200);
    return () => clearTimeout(timer);
  }, [rawSearch]);

  const filtered = useMemo(() => {
    return attacks.filter(attack => {
      const haystack = [
        attack.id,
        attack.name,
        attack.description,
        attack.category,
        ...attack.paymentRails,
        ...attack.aiCapabilities,
        ...attack.target,
        ...attack.defenseStrategy,
        ...attack.tags
      ].join(" ").toLowerCase();

      return (
        (!search || haystack.includes(search.toLowerCase())) &&
        includes([attack.category], filters.categories) &&
        includes(attack.paymentRails, filters.rails) &&
        includes(attack.aiCapabilities, filters.ai) &&
        includes([attack.severity], filters.severity) &&
        includes([attack.evidenceStatus], filters.evidence) &&
        includes([attack.simulationStatus], filters.simulation) &&
        includes([attack.difficulty], filters.difficulty)
      );
    });
  }, [search, filters]);

  const ordered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sort === "novelty") return b.noveltyScore - a.noveltyScore;
      if (sort === "alphabetical") return a.name.localeCompare(b.name);
      if (sort === "simulation") return a.simulationStatus.localeCompare(b.simulationStatus);
      if (sort === "difficulty") {
        const diffWeight = { "very-high": 4, high: 3, medium: 2, low: 1 };
        return diffWeight[b.difficulty] - diffWeight[a.difficulty];
      }
      // severity
      const sevWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      return sevWeight[b.severity] - sevWeight[a.severity];
    });
  }, [filtered, sort]);

  const kpis = [
    { label: "Taxonomy Categories", value: "12 Surfaces", detail: "KYC · ATO · Evasion · Mule · Swarms", tone: "purple" },
    { label: "Total Attack Vectors", value: `${attacks.length}`, detail: `${attacks.filter(a => a.severity === "critical").length} Critical severity`, tone: "blue" },
    { label: "Very-High Difficulty", value: `${attacks.filter(a => a.difficulty === "very-high").length}`, detail: "RL Evasion & Swarms", tone: "amber" },
    { label: "Simulation Ready", value: `${attacks.filter(a => a.simulationStatus === "ready").length}`, detail: "Deterministic synthetic generators", tone: "green" },
  ];

  return (
    <>
      <div className="library-page-head">
        <div>
          <p className="eyebrow">PAYMENT SECURITY RESEARCH LAB · MASTERSHIELD</p>
          <h1>125+ GenAI Payment Attack Scenarios</h1>
          <p className="subtitle">Comprehensive synthetic threat taxonomy across 12 fraud categories and 8 payment rails</p>
        </div>
        <div className="library-actions">
          <label className="attack-search">
            <span>⌕</span>
            <input
              value={rawSearch}
              onChange={event => setRawSearch(event.target.value)}
              placeholder="Search attacks, payment rails, AI techniques..."
            />
          </label>
          <button className="filter-button" onClick={() => setCollapsed(!collapsed)}>
            ☷ Filters
          </button>
          <Link
            className="primary"
            href={selected ? `/simulator?attack=${selected.id}` : "/simulator"}
          >
            Launch Simulator <span>→</span>
          </Link>
        </div>
      </div>

      <div className="library-kpis">
        {kpis.map(kpi => (
          <section className="library-kpi panel" key={kpi.label}>
            <span className={`library-kpi-icon ${kpi.tone}`}>
              {kpi.tone === "purple" ? "◈" : kpi.tone === "blue" ? "◎" : kpi.tone === "green" ? "✓" : "ϟ"}
            </span>
            <div>
              <p>{kpi.label}</p>
              <h2>{kpi.value}</h2>
              <span>{kpi.detail}</span>
            </div>
          </section>
        ))}
      </div>

      <div className="library-workspace">
        <AttackFilters
          filters={filters}
          onChange={setFilters}
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />

        <div className="attack-intelligence">
          <AttackLandscape
            attacks={filtered}
            selectedId={selected?.id}
            onSelect={attack => setSelected(attack)}
          />

          <section className="panel attack-collection">
            <div className="collection-head">
              <div>
                <h2>
                  Attack Vectors <span>{filtered.length} of {attacks.length}</span>
                </h2>
                <p>
                  {selected ? (
                    <><b>{selected.id} · {selected.name}</b> selected in landscape</>
                  ) : (
                    "Inspect threats, view observable signals, or launch synthetic simulations"
                  )}
                </p>
              </div>

              <div className="collection-controls">
                <select
                  aria-label="Sort attack list"
                  value={sort}
                  onChange={event => setSort(event.target.value)}
                >
                  <option value="novelty">Sort by: Novelty Score (Highest)</option>
                  <option value="severity">Sort by: Severity (Critical → Low)</option>
                  <option value="difficulty">Sort by: Difficulty (Very High → Low)</option>
                  <option value="simulation">Sort by: Simulation Readiness</option>
                  <option value="alphabetical">Sort by: Name (A-Z)</option>
                </select>

                <div className="view-toggle">
                  <button
                    className={view === "grid" ? "active" : ""}
                    onClick={() => setView("grid")}
                  >
                    ▦ Grid
                  </button>
                  <button
                    className={view === "table" ? "active" : ""}
                    onClick={() => setView("table")}
                  >
                    ☷ Table
                  </button>
                </div>
              </div>
            </div>

            {filtered.length ? (
              view === "grid" ? (
                <>
                  <div className="attack-grid">
                    {ordered.slice(0, visible).map(attack => (
                      <AttackCard key={attack.id} attack={attack} />
                    ))}
                  </div>
                  {visible < filtered.length && (
                    <button
                      className="load-more"
                      onClick={() => setVisible(v => v + 12)}
                    >
                      Load More Attack Scenarios ({filtered.length - visible} remaining)
                    </button>
                  )}
                </>
              ) : (
                <AttackTable attacks={ordered} />
              )
            ) : (
              <div className="attack-empty">
                <span>◌</span>
                <h3>No attack vectors match these filters</h3>
                <p>Try clearing your active filters or adjusting the search term.</p>
                <button onClick={() => { setFilters(blankFilters); setRawSearch(""); }}>
                  Clear all filters
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

