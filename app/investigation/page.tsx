"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { generateSyntheticTransactions } from "@/lib/simulation-engine";
import { railBadges } from "@/data/attacks";
import type { SyntheticTransaction } from "@/types/attack";

export default function InvestigationPage() {
  return (
    <AppShell title="Investigation Center">
      <Suspense fallback={<div className="page-container">Loading investigation cases...</div>}>
        <InvestigationContent />
      </Suspense>
    </AppShell>
  );
}

function InvestigationContent() {
  const searchParams = useSearchParams();
  const targetTxnId = searchParams.get("txn");

  // Generate flagged case queue
  const flaggedCases: SyntheticTransaction[] = useMemo(() => {
    const raw = generateSyntheticTransactions({
      volume: 800,
      adaptationLevel: "adversarial-rl",
      noiseLevel: "medium",
      fraudRatio: 0.25,
      seed: 99,
    });
    // Filter for high/step-up risk
    return raw.filter(t => t.modelRiskScore >= 65);
  }, []);

  const [cases, setCases] = useState<SyntheticTransaction[]>(flaggedCases);
  const [selectedCase, setSelectedCase] = useState<SyntheticTransaction>(() => {
    if (targetTxnId) {
      const found = flaggedCases.find(c => c.id === targetTxnId);
      if (found) return found;
    }
    return flaggedCases[0];
  });

  const [triageAction, setTriageAction] = useState<string | null>(null);

  const handleAction = (action: string) => {
    setTriageAction(action);
    setTimeout(() => {
      // remove from active queue or mark updated
      setCases(prev => prev.filter(c => c.id !== selectedCase.id));
      if (cases.length > 1) {
        setSelectedCase(cases.find(c => c.id !== selectedCase.id) || cases[0]);
      }
      setTriageAction(null);
    }, 600);
  };

  return (
    <div className="page-container">
      <div className="page-head" style={{ padding: "0 0 20px" }}>
        <div>
          <p className="eyebrow">ANALYST CASE MANAGEMENT · MASTERSHIELD</p>
          <h1>Investigation & Explainability Center</h1>
          <p className="subtitle">
            Triage anomalous payment events with SHAP feature attributions, device telemetry, and graph linkages
          </p>
        </div>
        <div className="head-actions">
          <Link href="/detection-lab" className="date-select" style={{ textDecoration: "none" }}>
            ← Detection Lab
          </Link>
          <Link href="/closed-loop" className="primary" style={{ textDecoration: "none" }}>
            Send Feedback to Closed Loop →
          </Link>
        </div>
      </div>

      <div className="responsive-split responsive-split-narrow">
        {/* Left Column: Triage Queue */}
        <section className="panel" style={{ padding: "18px", minWidth: 0 }}>
          <div className="panel-head">
            <div>
              <h2>Flagged Triage Queue</h2>
              <p>{cases.length} priority anomalies pending review</p>
            </div>
            <span className="count">{cases.length} active</span>
          </div>

          <div style={{ display: "grid", gap: "8px", marginTop: "14px", maxHeight: "680px", overflowY: "auto" }}>
            {cases.map(item => {
              const isSelected = selectedCase?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedCase(item)}
                  style={{
                    padding: "12px",
                    background: isSelected ? "linear-gradient(135deg, #1b2046 0%, #121a30 100%)" : "#0d1424",
                    borderRadius: "8px",
                    border: isSelected ? "1px solid #8f82ff" : "1px solid #22324c",
                    cursor: "pointer",
                    transition: ".15s"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span className="mono" style={{ fontSize: "10px" }}>{item.id}</span>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: "12px",
                        color: item.modelRiskScore >= 80 ? "#ff819c" : "#f9b558"
                      }}
                    >
                      Risk: {item.modelRiskScore}
                    </span>
                  </div>

                  <strong style={{ fontSize: "11px", color: "#e2e8f5", display: "block", marginBottom: "3px" }}>
                    ₹{item.amount.toLocaleString()} · {item.merchantName}
                  </strong>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "9px" }}>
                    <span style={{ color: "#8a97ae" }}>{item.paymentRail} · {item.accountId}</span>
                    <span className={`badge ${item.decision === "BLOCK" ? "badge-pink" : "badge-orange"}`}>
                      {item.decision}
                    </span>
                  </div>
                </div>
              );
            })}

            {cases.length === 0 && (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#54e3a3" }}>
                <span style={{ fontSize: "24px" }}>✓</span>
                <h3 style={{ margin: "8px 0 4px", fontSize: "13px" }}>Triage Queue Empty</h3>
                <p style={{ margin: 0, fontSize: "10px", color: "#8a97ae" }}>All high-risk events have been evaluated.</p>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Case Deep Dive & Action Workbench */}
        {selectedCase ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
            {/* Header Card */}
            <section className="panel" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span className="mono" style={{ fontSize: "11px" }}>{selectedCase.id}</span>
                  <h2 style={{ fontSize: "20px", margin: "4px 0" }}>
                    ₹{selectedCase.amount.toLocaleString()} on {selectedCase.paymentRail} Rail
                  </h2>
                  <p style={{ margin: 0, color: "#8a97ae", fontSize: "10px" }}>
                    Timestamp: {selectedCase.timestamp} · Merchant: {selectedCase.merchantName} ({selectedCase.merchantCategory})
                  </p>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: selectedCase.modelRiskScore >= 80 ? "#ff819c" : "#f9b558" }}>
                    {selectedCase.modelRiskScore} <span style={{ fontSize: "11px", color: "#748299" }}>/ 100</span>
                  </div>
                  <span className="badge badge-pink">{selectedCase.decision} RECOMMENDED</span>
                </div>
              </div>

              {/* AI Explanation Banner */}
              <div style={{ marginTop: "14px", padding: "14px", background: "#151e33", borderRadius: "8px", border: "1px solid #2a3d5e" }}>
                <strong style={{ fontSize: "11px", color: "#c4b8ff", display: "flex", gap: "6px", alignItems: "center" }}>
                  ✦ AI Risk Rationale & Vector Attribution
                </strong>
                <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#d9e2f0", lineHeight: "1.5" }}>
                  {selectedCase.explanation.primaryReason}
                </p>
                {selectedCase.syntheticAttackLabel && (
                  <div style={{ marginTop: "8px", display: "flex", gap: "6px", alignItems: "center", fontSize: "10px", color: "#a59cff" }}>
                    <b>Predicted Pattern:</b> {selectedCase.syntheticAttackLabel} ({selectedCase.explanation.attackConfidence}% match confidence)
                  </div>
                )}
              </div>
            </section>

            {/* Feature Contribution Breakdown (SHAP Waterfall) */}
            <section className="panel" style={{ padding: "20px" }}>
              <div className="panel-head">
                <div>
                  <h2>Feature Contribution Waterfall (SHAP Explainability)</h2>
                  <p>Individual signal weights contributing to the elevated risk score</p>
                </div>
              </div>

              <div style={{ display: "grid", gap: "12px", marginTop: "14px" }}>
                {selectedCase.explanation.featureContributions.map(fc => (
                  <div key={fc.feature} className="shap-bar">
                    <div className="shap-label">
                      <span style={{ color: "#e2e8f5", fontWeight: 600 }}>{fc.feature}</span>
                      <b style={{ color: "#c4b8ff", fontFamily: "DM Mono" }}>+{fc.impact} pts risk</b>
                    </div>
                    <div className="shap-track" style={{ height: "8px" }}>
                      <div
                        className="shap-fill"
                        style={{
                          width: `${Math.min(100, fc.impact * 2.8)}%`,
                          background: fc.impact > 25 ? "linear-gradient(90deg, #7a6cfc, #f8728a)" : "linear-gradient(90deg, #50c8f5, #7a6cfc)"
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "9px", color: "#8a99b0" }}>{fc.description}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Analyst Action Bar */}
            <section className="panel" style={{ padding: "18px" }}>
              <div className="panel-head">
                <div>
                  <h2>Triage Decision Workbench</h2>
                  <p>Select an action to resolve case and reinforce model feedback loop</p>
                </div>
              </div>

              <div className="metric-grid metric-grid-four" style={{ marginTop: "14px" }}>
                <button
                  className="primary"
                  onClick={() => handleAction("BLOCK")}
                  style={{ background: "#4a2332", borderColor: "#823b53", color: "#ff90a6", justifyContent: "center" }}
                >
                  Confirm Block
                </button>

                <button
                  className="date-select"
                  onClick={() => handleAction("STEP_UP")}
                  style={{ background: "#3d2d18", borderColor: "#6b5129", color: "#fbb158", justifyContent: "center" }}
                >
                  Step-Up Challenge
                </button>

                <button
                  className="date-select"
                  onClick={() => handleAction("WHITELIST")}
                  style={{ background: "#173428", borderColor: "#28664e", color: "#58df9f", justifyContent: "center" }}
                >
                  Mark False Positive
                </button>

                <button
                  className="date-select"
                  onClick={() => handleAction("CLOSED_LOOP")}
                  style={{ background: "#26204d", borderColor: "#4b418a", color: "#c4b8ff", justifyContent: "center" }}
                >
                  Send to Self-Play Loop
                </button>
              </div>

              {triageAction && (
                <div style={{ marginTop: "12px", padding: "10px", background: "#152438", borderRadius: "6px", border: "1px solid #294568", color: "#54e3a3", fontSize: "10px", textAlign: "center" }}>
                  ✓ Decision logged: <b>{triageAction}</b>. Reinforcement feedback dispatched to Blue Team learning queue.
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="panel" style={{ padding: "40px", textAlign: "center" }}>
            <p style={{ color: "#8a97ae" }}>Select a flagged case from the left to begin triage.</p>
          </div>
        )}
      </div>
    </div>
  );
}

