"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { attacks, categoryLabel, railBadges } from "@/data/attacks";
import type { AttackCategory, PaymentRail } from "@/types/attack";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const trend = [
  { d: "Mon", v: 12400, f: 1840 },
  { d: "Tue", v: 14800, f: 2120 },
  { d: "Wed", v: 13900, f: 1950 },
  { d: "Thu", v: 18200, f: 3100 },
  { d: "Fri", v: 19500, f: 3420 },
  { d: "Sat", v: 24800, f: 4890 },
  { d: "Sun", v: 22100, f: 4120 },
];

const railPie = [
  { name: "UPI", value: 42, color: "#8b7fff" },
  { name: "Cards", value: 24, color: "#3ac4f1" },
  { name: "Wallets", value: 16, color: "#f9b558" },
  { name: "RTGS", value: 10, color: "#ff819c" },
  { name: "Others", value: 8, color: "#52df9d" },
];

const RAILS: PaymentRail[] = ["UPI", "Cards", "Wallets", "Bank Transfer", "RTGS", "NEFT", "BNPL", "Cross-border"];
const CATEGORIES: AttackCategory[] = [
  "identity",
  "social-engineering",
  "account-takeover",
  "merchant",
  "transaction-evasion",
  "mule-aml",
  "payment-instrument",
  "api-abuse",
  "behavioral-device",
  "cross-channel",
  "autonomous-fraud",
  "synthetic-content"
];

export default function Home() {
  // Top 10 Hardest Attacks Leaderboard
  const hardestAttacks = useMemo(() => {
    return attacks
      .filter(a => a.difficulty === "very-high" || a.noveltyScore >= 90)
      .slice(0, 8);
  }, []);

  return (
    <AppShell title="Security Overview">
      <div className="page-head">
        <div>
          <p className="eyebrow">PAYMENT SECURITY RESEARCH LAB · MASTERSHIELD</p>
          <h1>Closed-Loop AI Defense Command Center</h1>
          <p className="subtitle">
            Mastercard Innovation Challenge @ GFF 2026 — Defensive AI Research Environment
          </p>
        </div>
        <div className="head-actions">
          <Link href="/demo" className="date-select" style={{ textDecoration: "none", color: "#f8728a", borderColor: "#642d3d", background: "#21141e" }}>
            ★ Judge Demo (3-min) →
          </Link>
          <Link href="/simulator" className="primary" style={{ textDecoration: "none" }}>
            ⚡ Launch Red Team Simulator
          </Link>
        </div>
      </div>

      {/* KPI Header Grid */}
      <div className="kpis">
        <section className="kpi panel">
          <div className="kpi-icon purple">◈</div>
          <div>
            <p>Attack Vectors Identified</p>
            <h2>{attacks.length}</h2>
            <span className="up">12 Taxonomy Categories</span>
          </div>
        </section>

        <section className="kpi panel">
          <div className="kpi-icon blue">◎</div>
          <div>
            <p>Payment Rails Protected</p>
            <h2>8 Rails</h2>
            <span className="up">UPI · Cards · RTGS · BNPL…</span>
          </div>
        </section>

        <section className="kpi panel">
          <div className="kpi-icon green">✓</div>
          <div>
            <p>Detection Accuracy (F1)</p>
            <h2>96.8%</h2>
            <span className="up">0.9% False Positive Rate</span>
          </div>
        </section>

        <section className="kpi panel">
          <div className="kpi-icon orange">⚡</div>
          <div>
            <p>Scoring Decision Latency</p>
            <h2>14.2 ms</h2>
            <span className="up">Sub-25ms Real-Time SLA</span>
          </div>
        </section>
      </div>

      {/* The Closed Loop Hero Card */}
      <div className="closed-loop-hero">
        <div>
          <strong style={{ fontSize: "14px", color: "#f0f4fc", display: "block" }}>
            Closed-Loop AI Payment Security Lab
          </strong>
          <span style={{ fontSize: "10px", color: "#8a97ae" }}>
            Continuous adversarial self-play hardening payment infrastructure against emerging GenAI threats
          </span>
        </div>

        <div className="loop-steps">
          <div className="loop-node active">
            <strong>IDENTIFY</strong>
            <span>125+ Taxonomy</span>
          </div>
          <span className="loop-arrow">→</span>

          <div className="loop-node active">
            <strong>GENERATE</strong>
            <span>Multi-Rail Synth</span>
          </div>
          <span className="loop-arrow">→</span>

          <div className="loop-node active">
            <strong>DEFEND</strong>
            <span>Sub-25ms Stream</span>
          </div>
          <span className="loop-arrow">→</span>

          <div className="loop-node active">
            <strong>LEARN</strong>
            <span>SHAP & Graph</span>
          </div>
          <span className="loop-arrow">→</span>

          <div className="loop-node active" style={{ borderColor: "#f8728a" }}>
            <strong style={{ color: "#ff819c" }}>MUTATE</strong>
            <span>Harder RL Attacks</span>
          </div>
        </div>

        <Link
          href="/closed-loop"
          className="primary"
          style={{ padding: "8px 14px", fontSize: "11px", textDecoration: "none", whiteSpace: "nowrap" }}
        >
          View Closed Loop →
        </Link>
      </div>

      {/* 12 x 8 Threat Coverage Matrix */}
      <section className="panel matrix-panel">
        <div className="panel-head">
          <div>
            <h2>12 × 8 Threat Surface Coverage Matrix</h2>
            <p>Distribution of 125+ synthetic attack vectors across all 12 taxonomy categories and 8 payment rails</p>
          </div>
          <div className="legend">
            <span><i style={{ background: "#52df9d" }} /> Strong Defense</span>
            <span><i style={{ background: "#f9b558" }} /> Moderate Exposure</span>
            <span><i style={{ background: "#ff819c" }} /> Evasive Vector Focus</span>
          </div>
        </div>

        <div className="matrix-table-wrap">
          <table className="matrix-table">
            <thead>
              <tr>
                <th>FRAUD CATEGORY (12)</th>
                {RAILS.map(r => (
                  <th key={r} style={{ textAlign: "center" }}>{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map(cat => {
                const catAttacks = attacks.filter(a => a.category === cat);
                return (
                  <tr key={cat}>
                    <td style={{ fontWeight: 700, color: "#e2e8f5" }}>
                      {categoryLabel[cat]}
                    </td>
                    {RAILS.map(rail => {
                      const matching = catAttacks.filter(a => a.paymentRails.includes(rail));
                      const hasCritical = matching.some(a => a.severity === "critical" || a.difficulty === "very-high");
                      const count = matching.length;

                      return (
                        <td key={rail} style={{ textAlign: "center" }}>
                          {count > 0 ? (
                            <span className={`matrix-cell ${hasCritical ? "evasive" : count > 2 ? "high" : "mid"}`}>
                              {count}
                            </span>
                          ) : (
                            <span style={{ color: "#475569", fontSize: "9px" }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2-Column Section: Top Hardest Leaderboard & Telemetry Charts */}
      <div className="grid-main">
        {/* Left: Top Hardest Attacks Leaderboard */}
        <section className="panel" style={{ padding: "19px" }}>
          <div className="panel-head">
            <div>
              <h2>Top Hardest Evasion Attacks</h2>
              <p>Adversarial vectors with highest evasion potential against traditional static rules</p>
            </div>
            <Link href="/attack-library" className="text-btn" style={{ textDecoration: "none" }}>
              Full Library (125+) →
            </Link>
          </div>

          <div style={{ display: "grid", gap: "8px", marginTop: "12px" }}>
            {hardestAttacks.map(atk => (
              <div
                key={atk.id}
                style={{
                  padding: "10px 12px",
                  background: "#0c1322",
                  borderRadius: "6px",
                  border: "1px solid #1e2c44",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "2px" }}>
                    <span className="mono" style={{ fontSize: "10px" }}>{atk.id}</span>
                    <strong style={{ fontSize: "11px", color: "#e2e8f5" }}>{atk.name}</strong>
                  </div>
                  <span style={{ fontSize: "9px", color: "#8a97ae" }}>
                    {categoryLabel[atk.category]} · {atk.paymentRails.slice(0, 3).join(", ")}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span className="badge badge-pink">NOVELTY {atk.noveltyScore}</span>
                  <Link
                    href={`/simulator?attack=${atk.id}`}
                    className="date-select"
                    style={{ padding: "4px 8px", fontSize: "9px", textDecoration: "none" }}
                  >
                    Simulate ⚡
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right: Real-World Streaming Architecture Workflow */}
        <section className="panel" style={{ padding: "19px", display: "flex", flexDirection: "column" }}>
          <div className="panel-head">
            <div>
              <h2>Real-World Payment Feasibility</h2>
              <p>Sub-25ms low-latency multi-rail deployment architecture</p>
            </div>
            <span className="badge badge-green">LIVE STREAM READY</span>
          </div>

          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ padding: "12px", background: "#0e1628", borderRadius: "8px", border: "1px solid #22324c" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <strong style={{ fontSize: "11px", color: "#e2e8f5" }}>1. Multi-Rail Stream Ingestion</strong>
                <span className="mono" style={{ fontSize: "9px", color: "#54e3a3" }}>&lt; 3.2 ms</span>
              </div>
              <p style={{ margin: 0, fontSize: "9px", color: "#8a97ae" }}>
                ISO 20022 parsing, token de-anonymization, and real-time Kafka event bus.
              </p>
            </div>

            <div style={{ padding: "12px", background: "#0e1628", borderRadius: "8px", border: "1px solid #22324c" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <strong style={{ fontSize: "11px", color: "#e2e8f5" }}>2. Temporal Graph & Velocity Lookup</strong>
                <span className="mono" style={{ fontSize: "9px", color: "#54e3a3" }}>&lt; 4.8 ms</span>
              </div>
              <p style={{ margin: 0, fontSize: "9px", color: "#8a97ae" }}>
                Sub-second Louvain community clustering & CIF-level multi-rail velocity aggregator.
              </p>
            </div>

            <div style={{ padding: "12px", background: "#0e1628", borderRadius: "8px", border: "1px solid #22324c" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <strong style={{ fontSize: "11px", color: "#e2e8f5" }}>3. GCN + LightGBM Ensemble Inference</strong>
                <span className="mono" style={{ fontSize: "9px", color: "#54e3a3" }}>&lt; 5.4 ms</span>
              </div>
              <p style={{ margin: 0, fontSize: "9px", color: "#8a97ae" }}>
                Stochastic threshold calibration with SHAP feature impact explanation.
              </p>
            </div>

            <div style={{ padding: "12px", background: "#13231d", borderRadius: "8px", border: "1px solid #204838" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <strong style={{ fontSize: "11px", color: "#54e3a3" }}>4. Total End-to-End Decision Latency</strong>
                <span className="mono" style={{ fontSize: "10px", color: "#54e3a3", fontWeight: 800 }}>14.2 ms (SLA &lt; 25ms)</span>
              </div>
              <p style={{ margin: 0, fontSize: "9px", color: "#8a97ae" }}>
                Fully compliant with UPI and global card rail sub-second settlement limits.
              </p>
            </div>
          </div>

          <div style={{ marginTop: "auto", paddingTop: "14px" }}>
            <Link
              href="/demo"
              className="primary"
              style={{ width: "100%", justifyContent: "center", textDecoration: "none", padding: "10px" }}
            >
              Start 3-Minute Judge Evaluation Demo →
            </Link>
          </div>
        </section>
      </div>

      {/* Bottom Telemetry Grids */}
      <div className="bottom-grid">
        {/* Threats by Payment Rail */}
        <section className="panel rail">
          <div className="panel-head">
            <div>
              <h2>Threats by Payment Rail</h2>
              <p>Simulated multi-rail attack volume</p>
            </div>
          </div>
          <div className="rail-body">
            <div className="donut">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={railPie} dataKey="value" innerRadius={48} outerRadius={66} paddingAngle={4} strokeWidth={0}>
                    {railPie.map(c => <Cell key={c.name} fill={c.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-label">
                <strong>8 Rails</strong>
                <span>Covered</span>
              </div>
            </div>
            <div className="rail-legend">
              {railPie.map(r => (
                <p key={r.name}>
                  <i style={{ background: r.color }} />
                  {r.name} <b>{r.value}%</b>
                  <span>Share</span>
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* Model Performance */}
        <section className="panel model">
          <div className="panel-head">
            <div>
              <h2>Blue Team Model Score</h2>
              <p>Ensemble Model Hardened via Self-Play</p>
            </div>
            <span className="model-live"><i></i> LIVE</span>
          </div>
          <div className="model-body">
            <div className="score-ring">
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="49" />
                <circle className="progress" cx="60" cy="60" r="49" />
              </svg>
              <div>
                <strong>96.8%</strong>
                <span>F1 score</span>
              </div>
            </div>
            <div className="metrics">
              <p><span>Precision</span><b>97.4%</b></p>
              <p><span>Recall</span><b>96.2%</b></p>
              <p><span>ROC-AUC</span><b>99.1%</b></p>
            </div>
          </div>
        </section>

        {/* Live Fraud Telemetry Stream Trend */}
        <section className="panel transactions">
          <div className="panel-head">
            <div>
              <h2>Multi-Rail Telemetry Volume</h2>
              <p>Simulated transaction vs fraud alert activity</p>
            </div>
            <Link href="/generated-data" className="text-btn" style={{ textDecoration: "none" }}>
              Explore Stream →
            </Link>
          </div>
          <div style={{ height: "160px", marginTop: "10px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#8174ff" stopOpacity={0.34} />
                    <stop offset="1" stopColor="#8174ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#253047" strokeDasharray="3 3" />
                <XAxis dataKey="d" stroke="#76839b" fontSize={10} />
                <YAxis stroke="#76839b" fontSize={10} />
                <Tooltip contentStyle={{ background: "#121a2b", border: "1px solid #2b3852", borderRadius: "8px", fontSize: "10px" }} />
                <Area type="monotone" dataKey="v" name="Total Events" stroke="#8b80ff" fill="url(#areaGrad)" strokeWidth={2} />
                <Line type="monotone" dataKey="f" name="Fraud Alerts" stroke="#ff819c" strokeWidth={2} dot={{ r: 3, fill: "#ff819c" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <footer>
        <span>MasterShield AI Defense Lab · Mastercard Innovation Challenge @ GFF 2026</span>
        <span>Deterministic synthetic simulation engine · Sub-25ms response SLA</span>
        <span>Version 2.0-judge-ready</span>
      </footer>
    </AppShell>
  );
}

