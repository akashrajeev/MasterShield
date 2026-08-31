"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { generateSyntheticTransactions } from "@/lib/simulation-engine";
import { categoryLabel, railBadges } from "@/data/attacks";
import type { AttackCategory, PaymentRail, SyntheticTransaction } from "@/types/attack";

export default function GeneratedDataPage() {
  const [transactions, setTransactions] = useState<SyntheticTransaction[]>([]);
  const [selectedTxn, setSelectedTxn] = useState<SyntheticTransaction | null>(null);
  const [search, setSearch] = useState("");
  const [railFilter, setRailFilter] = useState<string>("ALL");
  const [riskFilter, setRiskFilter] = useState<string>("ALL");
  const [truthFilter, setTruthFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "stream">("table");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamFeed, setStreamFeed] = useState<SyntheticTransaction[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Initialize initial synthetic dataset
  useEffect(() => {
    const data = generateSyntheticTransactions({
      volume: 1200,
      adaptationLevel: "adversarial-rl",
      noiseLevel: "medium",
      fraudRatio: 0.20,
      seed: 42,
    });
    setTransactions(data);
    setStreamFeed(data.slice(0, 15));
  }, []);

  // Live Stream Simulation Ticker
  useEffect(() => {
    if (!isStreaming || transactions.length === 0) return;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * transactions.length);
      const nextTxn = {
        ...transactions[randomIndex],
        id: `LIVE-${Math.floor(Math.random() * 90000 + 10000)}`,
        timestamp: new Date().toISOString(),
      };
      setStreamFeed(prev => [nextTxn, ...prev.slice(0, 19)]);
    }, 800);
    return () => clearInterval(interval);
  }, [isStreaming, transactions]);

  const filtered = useMemo(() => {
    const source = viewMode === "stream" ? streamFeed : transactions;
    return source.filter(t => {
      const matchesSearch =
        !search ||
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.accountId.toLowerCase().includes(search.toLowerCase()) ||
        t.merchantName.toLowerCase().includes(search.toLowerCase()) ||
        (t.syntheticAttackLabel && t.syntheticAttackLabel.toLowerCase().includes(search.toLowerCase()));

      const matchesRail = railFilter === "ALL" || t.paymentRail === railFilter;
      const matchesTruth =
        truthFilter === "ALL" ||
        (truthFilter === "FRAUD" && t.isFraud) ||
        (truthFilter === "BENIGN" && !t.isFraud);

      const matchesRisk =
        riskFilter === "ALL" ||
        (riskFilter === "HIGH" && t.modelRiskScore >= 75) ||
        (riskFilter === "MEDIUM" && t.modelRiskScore >= 45 && t.modelRiskScore < 75) ||
        (riskFilter === "LOW" && t.modelRiskScore < 45);

      return matchesSearch && matchesRail && matchesTruth && matchesRisk;
    });
  }, [transactions, streamFeed, search, railFilter, truthFilter, riskFilter, viewMode]);

  const paginated = useMemo(() => {
    if (viewMode === "stream") return filtered;
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, viewMode]);

  const handleExportCSV = () => {
    const headers = [
      "Transaction ID",
      "Timestamp",
      "Account ID",
      "Merchant",
      "Rail",
      "Amount (INR)",
      "Device Trust",
      "Behavior Deviation",
      "Velocity Score",
      "Graph Score",
      "Ground Truth",
      "Risk Score",
      "Decision",
      "Attack Label"
    ];

    const rows = filtered.map(t => [
      t.id,
      t.timestamp,
      t.accountId,
      `"${t.merchantName}"`,
      t.paymentRail,
      t.amount,
      t.deviceTrustScore,
      t.behavioralDeviation,
      t.velocityAnomalyScore,
      t.graphLinkageScore,
      t.isFraud ? "FRAUD" : "BENIGN",
      t.modelRiskScore,
      t.decision,
      `"${t.syntheticAttackLabel || "None"}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mastershield_synthetic_dataset_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell title="Generated Synthetic Data">
      <div className="page-container">
        <div className="page-head" style={{ padding: "0 0 20px" }}>
          <div>
            <p className="eyebrow">SYNTHETIC RESEARCH TELEMETRY · MASTERSHIELD</p>
            <h1>Synthetic Transaction Data Workspace</h1>
            <p className="subtitle">High-fidelity synthetic payment stream with ground truth labels and multi-signal feature attribution</p>
          </div>
          <div className="head-actions">
            <button className="date-select" onClick={handleExportCSV}>
              📥 Export CSV ({filtered.length})
            </button>
            <Link href="/detection-lab" className="primary" style={{ textDecoration: "none" }}>
              Run Detection Lab →
            </Link>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="panel" style={{ padding: "14px 18px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flex: "1 1 300px" }}>
            <label className="attack-search" style={{ width: "100%", maxWidth: "340px" }}>
              <span>⌕</span>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search transaction ID, account, merchant, attack..."
              />
            </label>

            <select
              style={{ background: "#111a2a", border: "1px solid #2b374d", borderRadius: "6px", color: "#aab6c7", font: "600 11px Manrope", padding: "8px 10px" }}
              value={railFilter}
              onChange={e => { setRailFilter(e.target.value); setPage(1); }}
            >
              <option value="ALL">All Payment Rails</option>
              <option value="UPI">UPI</option>
              <option value="Cards">Cards</option>
              <option value="Wallets">Wallets</option>
              <option value="RTGS">RTGS</option>
              <option value="NEFT">NEFT</option>
              <option value="BNPL">BNPL</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cross-border">Cross-border</option>
            </select>

            <select
              style={{ background: "#111a2a", border: "1px solid #2b374d", borderRadius: "6px", color: "#aab6c7", font: "600 11px Manrope", padding: "8px 10px" }}
              value={truthFilter}
              onChange={e => { setTruthFilter(e.target.value); setPage(1); }}
            >
              <option value="ALL">All Ground Truth</option>
              <option value="FRAUD">Fraud Only (Ground Truth)</option>
              <option value="BENIGN">Benign Only</option>
            </select>

            <select
              style={{ background: "#111a2a", border: "1px solid #2b374d", borderRadius: "6px", color: "#aab6c7", font: "600 11px Manrope", padding: "8px 10px" }}
              value={riskFilter}
              onChange={e => { setRiskFilter(e.target.value); setPage(1); }}
            >
              <option value="ALL">All Risk Scores</option>
              <option value="HIGH">High Risk (Score $\ge 75$)</option>
              <option value="MEDIUM">Medium Risk (Score 45–74)</option>
              <option value="LOW">Low Risk (Score &lt; 45)</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div className="view-toggle">
              <button
                className={viewMode === "table" ? "active" : ""}
                onClick={() => { setViewMode("table"); setIsStreaming(false); }}
              >
                ☷ Table View
              </button>
              <button
                className={viewMode === "stream" ? "active" : ""}
                onClick={() => { setViewMode("stream"); setIsStreaming(true); }}
              >
                ⚡ Live Stream
              </button>
            </div>

            {viewMode === "stream" && (
              <button
                onClick={() => setIsStreaming(!isStreaming)}
                className="date-select"
                style={{ background: isStreaming ? "#173d31" : "#34295d", color: isStreaming ? "#52df9d" : "#c4b8ff", borderColor: isStreaming ? "#27684e" : "#54468f" }}
              >
                {isStreaming ? "⏸ Pause Stream" : "▶ Resume Stream"}
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <section className="panel" style={{ padding: "18px" }}>
          <div className="panel-head">
            <div>
              <h2>
                Synthetic Transaction Stream <span>{filtered.length} Events</span>
              </h2>
              <p>Click any row to inspect full telemetry, signal attribution, and SHAP explainability</p>
            </div>
            <div className="legend">
              <span><i style={{ background: "#ff819c" }} /> Ground Truth: Fraud</span>
              <span><i style={{ background: "#52df9d" }} /> Ground Truth: Benign</span>
            </div>
          </div>

          <div className="table-wrap" style={{ marginTop: "14px" }}>
            <table>
              <thead>
                <tr>
                  <th>TRANSACTION</th>
                  <th>TIMESTAMP</th>
                  <th>ACCOUNT</th>
                  <th>MERCHANT</th>
                  <th>RAIL</th>
                  <th>AMOUNT</th>
                  <th>SIGNALS (DEV/BEH/VEL/GRP)</th>
                  <th>GROUND TRUTH</th>
                  <th>MODEL RISK</th>
                  <th>DECISION</th>
                  <th>ATTACK VECTOR</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(t => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTxn(t)}
                    style={{ cursor: "pointer", background: selectedTxn?.id === t.id ? "#1c263c" : undefined }}
                  >
                    <td className="mono">{t.id}</td>
                    <td style={{ color: "#8a96aa", fontSize: "9px" }}>
                      {new Date(t.timestamp).toLocaleTimeString()}
                    </td>
                    <td>{t.accountId}</td>
                    <td>{t.merchantName}</td>
                    <td>
                      <span
                        className="rail-badge"
                        style={{
                          background: `${railBadges[t.paymentRail]?.color || "#8073fc"}22`,
                          color: railBadges[t.paymentRail]?.color || "#8073fc",
                          border: `1px solid ${railBadges[t.paymentRail]?.color || "#8073fc"}44`
                        }}
                      >
                        {t.paymentRail}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: "#e3e8f4" }}>
                      ₹{t.amount.toLocaleString()}
                    </td>
                    <td>
                      <span style={{ fontSize: "9px", fontFamily: "DM Mono", color: "#9daec6" }}>
                        {t.deviceTrustScore} | {t.behavioralDeviation} | {t.velocityAnomalyScore} | {t.graphLinkageScore}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${t.isFraud ? "badge-pink" : "badge-green"}`}>
                        {t.isFraud ? "FRAUD" : "BENIGN"}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: "12px",
                          color: t.modelRiskScore >= 75 ? "#ff819c" : t.modelRiskScore >= 45 ? "#f9b558" : "#52df9d"
                        }}
                      >
                        {t.modelRiskScore}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          t.decision === "BLOCK"
                            ? "badge-pink"
                            : t.decision === "STEP_UP"
                            ? "badge-orange"
                            : t.decision === "MONITOR"
                            ? "badge-purple"
                            : "badge-green"
                        }`}
                      >
                        {t.decision}
                      </span>
                    </td>
                    <td style={{ color: t.syntheticAttackLabel ? "#c3b8ff" : "#748299", fontSize: "9px" }}>
                      {t.syntheticAttackLabel || "—"}
                    </td>
                    <td>
                      <button
                        className="text-btn"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedTxn(t);
                        }}
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {viewMode === "table" && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #1f2c42", fontSize: "10px", color: "#8a96aa" }}>
              <span>
                Showing {Math.min(filtered.length, (page - 1) * pageSize + 1)}–{Math.min(filtered.length, page * pageSize)} of {filtered.length} synthetic records
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="filter-button"
                  style={{ height: "30px", padding: "0 10px" }}
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span style={{ display: "grid", placeItems: "center", padding: "0 8px", fontWeight: 700 }}>
                  Page {page} of {Math.ceil(filtered.length / pageSize) || 1}
                </span>
                <button
                  className="filter-button"
                  style={{ height: "30px", padding: "0 10px" }}
                  disabled={page * pageSize >= filtered.length}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Slide-out Transaction Investigation Drawer */}
        {selectedTxn && (
          <div className="drawer-backdrop" onClick={() => setSelectedTxn(null)}>
            <div className="drawer-panel" onClick={e => e.stopPropagation()}>
              <div className="drawer-head">
                <div>
                  <span className="mono" style={{ fontSize: "11px" }}>{selectedTxn.id}</span>
                  <h2>Transaction Telemetry Triage</h2>
                  <p style={{ margin: "2px 0 0", color: "#8a97ae", fontSize: "10px" }}>
                    Account {selectedTxn.accountId} · {selectedTxn.paymentRail} Rail
                  </p>
                </div>
                <button className="drawer-close" onClick={() => setSelectedTxn(null)}>×</button>
              </div>

              {/* Status Bar */}
              <div className="metric-grid metric-grid-three">
                <div style={{ padding: "10px", background: "#0e1628", borderRadius: "6px", border: "1px solid #22324c" }}>
                  <span style={{ fontSize: "8px", color: "#7b8ba4", textTransform: "uppercase" }}>MODEL RISK</span>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: selectedTxn.modelRiskScore >= 75 ? "#ff819c" : "#52df9d" }}>
                    {selectedTxn.modelRiskScore} <span style={{ fontSize: "10px", color: "#748299" }}>/ 100</span>
                  </div>
                </div>

                <div style={{ padding: "10px", background: "#0e1628", borderRadius: "6px", border: "1px solid #22324c" }}>
                  <span style={{ fontSize: "8px", color: "#7b8ba4", textTransform: "uppercase" }}>DECISION</span>
                  <div style={{ marginTop: "4px" }}>
                    <span className={`badge ${selectedTxn.decision === "BLOCK" ? "badge-pink" : selectedTxn.decision === "STEP_UP" ? "badge-orange" : "badge-green"}`}>
                      {selectedTxn.decision}
                    </span>
                  </div>
                </div>

                <div style={{ padding: "10px", background: "#0e1628", borderRadius: "6px", border: "1px solid #22324c" }}>
                  <span style={{ fontSize: "8px", color: "#7b8ba4", textTransform: "uppercase" }}>GROUND TRUTH</span>
                  <div style={{ marginTop: "4px" }}>
                    <span className={`badge ${selectedTxn.isFraud ? "badge-pink" : "badge-green"}`}>
                      {selectedTxn.isFraud ? "ACTUAL FRAUD" : "BENIGN"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Human Explanation */}
              <div style={{ padding: "14px", background: "#151e33", borderRadius: "8px", border: "1px solid #2a3d5e" }}>
                <strong style={{ fontSize: "11px", color: "#c4b8ff", display: "flex", gap: "6px", alignItems: "center" }}>
                  ✦ AI Root Cause Explanation
                </strong>
                <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#d9e2f0", lineHeight: "1.5" }}>
                  {selectedTxn.explanation.primaryReason}
                </p>
                {selectedTxn.syntheticAttackLabel && (
                  <div style={{ marginTop: "10px", display: "flex", gap: "6px", alignItems: "center", fontSize: "10px", color: "#a59cff" }}>
                    <b>Predicted Threat Vector:</b> {selectedTxn.syntheticAttackLabel} ({selectedTxn.explanation.attackConfidence}% confidence)
                  </div>
                )}
              </div>

              {/* Feature Attribution (SHAP bars) */}
              <div>
                <strong style={{ fontSize: "11px", color: "#e2e8f5" }}>Feature Contribution Breakdown (SHAP Impact)</strong>
                <div style={{ display: "grid", gap: "10px", marginTop: "10px" }}>
                  {selectedTxn.explanation.featureContributions.map(fc => (
                    <div className="shap-bar" key={fc.feature}>
                      <div className="shap-label">
                        <span>{fc.feature}</span>
                        <b style={{ color: "#c4b8ff" }}>+{fc.impact} pts</b>
                      </div>
                      <div className="shap-track">
                        <div className="shap-fill" style={{ width: `${Math.min(100, fc.impact * 2.5)}%` }} />
                      </div>
                      <span style={{ fontSize: "8px", color: "#7d8da4" }}>{fc.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw Telemetry Matrix */}
              <div style={{ padding: "14px", background: "#0c1220", borderRadius: "8px", border: "1px solid #1e2c44" }}>
                <strong style={{ fontSize: "10px", color: "#7f8ea6", textTransform: "uppercase", letterSpacing: ".5px" }}>
                  Observed Raw Behavioral Telemetry
                </strong>
                <div className="metric-grid metric-grid-two" style={{ marginTop: "10px", fontSize: "10px" }}>
                  <div><span style={{ color: "#748299" }}>Amount:</span> <b style={{ color: "#e2e8f5" }}>₹{selectedTxn.amount.toLocaleString()}</b></div>
                  <div><span style={{ color: "#748299" }}>Merchant:</span> <b style={{ color: "#e2e8f5" }}>{selectedTxn.merchantName}</b></div>
                  <div><span style={{ color: "#748299" }}>Account Age:</span> <b style={{ color: "#e2e8f5" }}>{selectedTxn.accountAgeDays} days</b></div>
                  <div><span style={{ color: "#748299" }}>Beneficiary Novelty:</span> <b style={{ color: "#e2e8f5" }}>{(selectedTxn.beneficiaryNovelty * 100).toFixed(0)}%</b></div>
                  <div><span style={{ color: "#748299" }}>Device Trust:</span> <b style={{ color: "#e2e8f5" }}>{selectedTxn.deviceTrustScore} / 100</b></div>
                  <div><span style={{ color: "#748299" }}>Mule Graph Link:</span> <b style={{ color: "#e2e8f5" }}>{selectedTxn.graphLinkageScore} / 100</b></div>
                  <div><span style={{ color: "#748299" }}>Velocity Anomaly:</span> <b style={{ color: "#e2e8f5" }}>{selectedTxn.velocityAnomalyScore} / 100</b></div>
                  <div><span style={{ color: "#748299" }}>Geo Consistency:</span> <b style={{ color: "#e2e8f5" }}>{selectedTxn.geographicConsistency} / 100</b></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                <Link
                  href={`/investigation?txn=${selectedTxn.id}`}
                  className="primary"
                  style={{ flex: 1, textDecoration: "none", textAlign: "center", padding: "10px" }}
                >
                  Open in Investigation Center →
                </Link>
                <button
                  className="date-select"
                  onClick={() => setSelectedTxn(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

