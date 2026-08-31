"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { CLOSED_LOOP_ROUNDS } from "@/lib/simulation-engine";

export default function ClosedLoopPage() {
  const [activeRound, setActiveRound] = useState<number>(3);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [mutationSuccess, setMutationSuccess] = useState<boolean>(false);

  const currentRound = CLOSED_LOOP_ROUNDS[activeRound - 1];

  const handleTriggerMutation = () => {
    setIsMutating(true);
    setMutationSuccess(false);

    setTimeout(() => {
      setIsMutating(false);
      setMutationSuccess(true);
      if (activeRound < 3) {
        setActiveRound(r => r + 1);
      }
    }, 1200);
  };

  return (
    <AppShell title="The Closed Loop">
      <div className="page-container">
        <div className="page-head" style={{ padding: "0 0 20px" }}>
          <div>
            <p className="eyebrow">CONTINUOUS ADVERSARIAL HARDENING · MASTERSHIELD CORE</p>
            <h1>The Closed-Loop AI Defense Engine</h1>
            <p className="subtitle">
              IDENTIFY → GENERATE → DEFEND → LEARN → GENERATE HARDER ATTACKS
            </p>
          </div>
          <div className="head-actions">
            <button
              className="primary"
              onClick={handleTriggerMutation}
              disabled={isMutating}
              style={{ opacity: isMutating ? 0.7 : 1 }}
            >
              {isMutating ? "Mutating Attacks & Retesting..." : "⚔ Attack the Detector (Mutate)"}
            </button>
          </div>
        </div>

        {/* Hero Concept Workflow Graphic */}
        <div className="closed-loop-hero" style={{ margin: "0 0 20px" }}>
          <div>
            <strong style={{ fontSize: "14px", color: "#f0f4fc", display: "block" }}>
              Autonomous Self-Play Defense Loop
            </strong>
            <span style={{ fontSize: "10px", color: "#8a97ae" }}>
              Attacker agent discovers evasion $\to$ Blue Team auto-synthesizes mitigations
            </span>
          </div>

          <div className="loop-steps">
            <div className="loop-node active">
              <strong>1. IDENTIFY</strong>
              <span>125+ Threat Vectors</span>
            </div>
            <span className="loop-arrow">→</span>

            <div className="loop-node active">
              <strong>2. GENERATE</strong>
              <span>Synthetic Multi-Rail</span>
            </div>
            <span className="loop-arrow">→</span>

            <div className="loop-node active">
              <strong>3. DEFEND</strong>
              <span>Sub-25ms Detection</span>
            </div>
            <span className="loop-arrow">→</span>

            <div className="loop-node active">
              <strong>4. LEARN</strong>
              <span>SHAP & Graph Weights</span>
            </div>
            <span className="loop-arrow">→</span>

            <div className="loop-node active" style={{ borderColor: "#f8728a" }}>
              <strong style={{ color: "#ff819c" }}>5. MUTATE</strong>
              <span>Harder RL Attacks</span>
            </div>
          </div>
        </div>

        {/* Round Progression Selector */}
        <div className="metric-grid metric-grid-three" style={{ marginBottom: "20px" }}>
          {CLOSED_LOOP_ROUNDS.map(round => {
            const isSelected = activeRound === round.roundNumber;
            return (
              <div
                key={round.roundNumber}
                className="panel"
                onClick={() => setActiveRound(round.roundNumber)}
                style={{
                  padding: "16px",
                  cursor: "pointer",
                  border: isSelected ? "1px solid #8f82ff" : "1px solid #25334d",
                  background: isSelected
                    ? "linear-gradient(135deg, #1b2046 0%, #121a30 100%)"
                    : "#101828",
                  boxShadow: isSelected ? "0 0 20px #8073fc26" : undefined,
                  transition: ".15s"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span className="badge badge-purple">ROUND {round.roundNumber}</span>
                  <span style={{ fontSize: "9px", color: "#8a97ae" }}>{round.attacksCount} Attacks Evaluated</span>
                </div>
                <strong style={{ fontSize: "13px", color: "#f0f4fc", display: "block", marginBottom: "4px" }}>
                  {round.roundTitle}
                </strong>
                <div style={{ display: "flex", gap: "12px", marginTop: "10px", fontSize: "11px" }}>
                  <div>
                    <span style={{ color: "#748299", fontSize: "8px", textTransform: "uppercase" }}>F1 SCORE</span>
                    <div style={{ color: "#54e3a3", fontWeight: 800, fontSize: "16px" }}>{round.detectionF1}%</div>
                  </div>
                  <div>
                    <span style={{ color: "#748299", fontSize: "8px", textTransform: "uppercase" }}>FPR</span>
                    <div style={{ color: "#f9b558", fontWeight: 800, fontSize: "16px" }}>{round.fpr}%</div>
                  </div>
                  <div>
                    <span style={{ color: "#748299", fontSize: "8px", textTransform: "uppercase" }}>PRECISION</span>
                    <div style={{ color: "#50c8f5", fontWeight: 800, fontSize: "16px" }}>{round.precision}%</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Round Deep Dive */}
        <div className="responsive-split responsive-split-balanced">
          {/* Left Column: Mutated Attack Vectors & Countermeasures */}
          <section className="panel" style={{ padding: "18px", minWidth: 0 }}>
            <div className="panel-head">
              <div>
                <h2>Round {currentRound.roundNumber} Adversarial Mutations & Defenses</h2>
                <p>Evasion tactics injected by Red Team and corresponding Blue Team mitigations</p>
              </div>
              <span className="badge badge-purple">{currentRound.mutatedAttackFamilies.length} MUTATIONS</span>
            </div>

            <div style={{ display: "grid", gap: "12px", marginTop: "14px" }}>
              {currentRound.mutatedAttackFamilies.map(mut => (
                <div
                  key={mut.family}
                  style={{
                    padding: "14px",
                    background: "#0c1322",
                    borderRadius: "8px",
                    border: "1px solid #1f2d46"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    <strong style={{ fontSize: "12px", color: "#e2e8f5" }}>{mut.family}</strong>
                    <span className="badge badge-pink">{mut.evasionDelta}</span>
                  </div>

                  <div style={{ fontSize: "10px", color: "#8a97ae", margin: "4px 0 8px" }}>
                    <span style={{ color: "#ff819c" }}>⚔ Evasion Tactic:</span> {mut.tactic}
                  </div>

                  <div style={{ padding: "8px 10px", background: "#13231d", borderRadius: "6px", border: "1px solid #204838", fontSize: "10px", color: "#54e3a3" }}>
                    <b>🛡 Hardened Countermeasure:</b> {mut.countermeasure}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Right Column: Defense Adaptations & Evolution */}
          <section className="panel" style={{ padding: "18px", display: "flex", flexDirection: "column", minWidth: 0 }}>
            <div className="panel-head">
              <div>
                <h2>Blue Team Model Evolution</h2>
                <p>Architectural adjustments deployed in Round {currentRound.roundNumber}</p>
              </div>
              <span className="badge badge-green">HARDENED</span>
            </div>

            <div style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
              {currentRound.defenseAdaptations.map((adapt, index) => (
                <div
                  key={adapt}
                  style={{
                    padding: "12px",
                    background: "#0d1424",
                    borderRadius: "8px",
                    border: "1px solid #22324c",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px"
                  }}
                >
                  <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#2a2256", color: "#c4b8ff", display: "grid", placeItems: "center", fontSize: "10px", fontWeight: 800 }}>
                    {index + 1}
                  </span>
                  <span style={{ fontSize: "11px", color: "#dce3f0", fontWeight: 600 }}>{adapt}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "auto", paddingTop: "18px", borderTop: "1px solid #202d44" }}>
              <strong style={{ fontSize: "11px", color: "#8f82ff", display: "block", marginBottom: "4px" }}>
                Closed-Loop Evaluation Takeaway
              </strong>
              <p style={{ margin: 0, fontSize: "10px", color: "#8a97ae", lineHeight: "1.5" }}>
                Through continuous mutation cycles, MasterShield pushed the false positive rate down from 2.8% to 0.9% while increasing overall multi-rail detection F1 score to 96.8% across all 125 attack taxonomy scenarios.
              </p>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

