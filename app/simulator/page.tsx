"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { attacks, categoryLabel } from "@/data/attacks";
import { generateSyntheticTransactions, PRESETS, type SimulationConfig } from "@/lib/simulation-engine";
import { AppShell } from "@/components/layout/AppShell";
import type { AdaptationLevel, AttackCategory, Difficulty, PaymentRail, Severity, SyntheticTransaction } from "@/types/attack";

export default function SimulatorPage() {
  return (
    <AppShell title="Red Team Simulator">
      <Suspense fallback={<div className="page-container">Loading simulation environment...</div>}>
        <SimulatorContent />
      </Suspense>
    </AppShell>
  );
}

function SimulatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedAttackId = searchParams.get("attack");

  const [activePreset, setActivePreset] = useState<string>("top-hardest");
  const [selectedAttackId, setSelectedAttackId] = useState<string>(preselectedAttackId || "T-01");
  const [selectedCategory, setSelectedCategory] = useState<AttackCategory | "ALL">("ALL");
  const [volume, setVolume] = useState<number>(5000);
  const [rail, setRail] = useState<PaymentRail | "ALL">("ALL");
  const [adaptationLevel, setAdaptationLevel] = useState<AdaptationLevel>("adversarial-rl");
  const [noiseLevel, setNoiseLevel] = useState<"low" | "medium" | "high">("medium");
  const [fraudRatio, setFraudRatio] = useState<number>(0.20);
  
  // Generation & Pipeline state
  const [isGenerating, setIsGenerating] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  const [simResults, setSimResults] = useState<SyntheticTransaction[] | null>(null);

  useEffect(() => {
    if (preselectedAttackId) {
      setSelectedAttackId(preselectedAttackId);
      setActivePreset("custom");
    }
  }, [preselectedAttackId]);

  const selectedAttack = attacks.find(a => a.id === selectedAttackId);

  const handleApplyPreset = (presetId: string) => {
    const p = PRESETS.find(item => item.id === presetId);
    if (!p) return;
    setActivePreset(presetId);
    setVolume(p.volume);
    setAdaptationLevel(p.adaptation);
    setFraudRatio(p.fraudRatio);
    if (p.attackIds.length === 1) {
      setSelectedAttackId(p.attackIds[0]);
    }
  };

  const handleStartSimulation = () => {
    setIsGenerating(true);
    setPipelineStep(1);
    setSimResults(null);

    // Fast deterministic pipeline animation sequence
    const t1 = setTimeout(() => setPipelineStep(2), 350);
    const t2 = setTimeout(() => setPipelineStep(3), 700);
    const t3 = setTimeout(() => setPipelineStep(4), 1050);
    const t4 = setTimeout(() => setPipelineStep(5), 1400);

    const t5 = setTimeout(() => {
      const config: SimulationConfig = {
        volume,
        rail,
        adaptationLevel,
        noiseLevel,
        fraudRatio,
        selectedAttackIds: activePreset === "custom" || !activePreset
          ? [selectedAttackId]
          : PRESETS.find(p => p.id === activePreset)?.attackIds || [selectedAttackId],
        seed: 42,
      };

      const data = generateSyntheticTransactions(config);
      setSimResults(data);
      setIsGenerating(false);
      setPipelineStep(6);
    }, 1600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  };

  const highRiskCount = useMemo(() => {
    return simResults ? simResults.filter(t => t.modelRiskScore >= 70).length : 0;
  }, [simResults]);

  const adaptiveVariantsCount = useMemo(() => {
    return simResults ? Math.round(simResults.filter(t => t.isFraud).length * (adaptationLevel === "adversarial-rl" ? 0.75 : 0.4)) : 0;
  }, [simResults, adaptationLevel]);

  return (
    <div className="page-container">
      <div className="page-head" style={{ padding: "0 0 20px" }}>
        <div>
          <p className="eyebrow">RED TEAM ATTACK GENERATION LAB</p>
          <h1>Adversarial Payment Fraud Simulator</h1>
          <p className="subtitle">Synthesize multi-rail adversarial transaction telemetry to stress-test Blue Team defenses</p>
        </div>
        <div className="head-actions">
          <Link href="/attack-library" className="date-select" style={{ textDecoration: "none" }}>
            Browse 125+ Attack Taxonomy →
          </Link>
          <button
            className="primary"
            onClick={handleStartSimulation}
            disabled={isGenerating}
            style={{ opacity: isGenerating ? 0.7 : 1 }}
          >
            {isGenerating ? "Synthesizing Event Stream..." : "⚡ Generate Synthetic Batch"}
          </button>
        </div>
      </div>

      <div className="sim-grid" style={{ padding: 0 }}>
        {/* Left Column: STEP 1 - Presets & Target Selection */}
        <div>
          <div className="panel" style={{ padding: "18px" }}>
            <div className="panel-head">
              <div>
                <h2>STEP 1 · Target Selection</h2>
                <p>Choose threat campaign or specific vector</p>
              </div>
              <span className="count">{PRESETS.length} presets</span>
            </div>

            <div className="sim-presets">
              {PRESETS.map(p => (
                <div
                  key={p.id}
                  className={`preset-card ${activePreset === p.id ? "active" : ""}`}
                  onClick={() => handleApplyPreset(p.id)}
                >
                  <strong>{p.name}</strong>
                  <p>{p.description}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #233148" }}>
              <label style={{ fontSize: "10px", color: "#8a98af", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                OR SELECT SINGLE ATTACK VECTOR
              </label>
              <select
                style={{ width: "100%", background: "#0e1626", border: "1px solid #28374f", borderRadius: "6px", color: "#e3e9f5", padding: "8px", font: "600 11px Manrope" }}
                value={selectedAttackId}
                onChange={e => {
                  setSelectedAttackId(e.target.value);
                  setActivePreset("custom");
                }}
              >
                {attacks.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.id} · {a.name} ({a.category})
                  </option>
                ))}
              </select>

              {selectedAttack && (
                <div style={{ marginTop: "10px", padding: "10px", background: "#0a101d", borderRadius: "6px", border: "1px solid #1e2c44", fontSize: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ color: "#a59cff", fontFamily: "DM Mono" }}>{selectedAttack.id}</span>
                    <span style={{ color: "#54e3a3", textTransform: "uppercase", fontSize: "8px" }}>{selectedAttack.simulationStatus}</span>
                  </div>
                  <strong style={{ color: "#e1e7f3", display: "block", marginBottom: "4px" }}>{selectedAttack.name}</strong>
                  <p style={{ margin: 0, color: "#8291a7", lineHeight: "1.4" }}>{selectedAttack.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: STEP 2 & STEP 3 - Configuration & Pipeline Output */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Configuration Card */}
          <div className="panel" style={{ padding: "18px" }}>
            <div className="panel-head">
              <div>
                <h2>STEP 2 · Simulation Parameters</h2>
                <p>Configure telemetry scale, rail coverage, and adversarial adaptation</p>
              </div>
              <span className="badge badge-purple">{adaptationLevel.toUpperCase()}</span>
            </div>

            <div className="sim-controls">
              <div className="control-group">
                <label>
                  <span>Synthetic Event Volume</span>
                  <b style={{ color: "#a59cff", fontFamily: "DM Mono" }}>{volume.toLocaleString()} txns</b>
                </label>
                <input
                  type="range"
                  min="500"
                  max="15000"
                  step="500"
                  value={volume}
                  onChange={e => setVolume(Number(e.target.value))}
                />
              </div>

              <div className="control-group">
                <label>
                  <span>Fraud Proportion (Ground Truth)</span>
                  <b style={{ color: "#ff819c", fontFamily: "DM Mono" }}>{Math.round(fraudRatio * 100)}% Fraud</b>
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.45"
                  step="0.05"
                  value={fraudRatio}
                  onChange={e => setFraudRatio(Number(e.target.value))}
                />
              </div>

              <div className="control-group">
                <label><span>Target Payment Rail</span></label>
                <select value={rail} onChange={e => setRail(e.target.value as any)}>
                  <option value="ALL">All Payment Rails (Cross-Rail Mixed)</option>
                  <option value="UPI">UPI (Immediate Settlement)</option>
                  <option value="Cards">Credit / Debit Cards (EMV & CNP)</option>
                  <option value="Wallets">Prepaid Digital Wallets</option>
                  <option value="RTGS">RTGS (High-Value Wholesale)</option>
                  <option value="NEFT">NEFT (Batch Clearing)</option>
                  <option value="BNPL">BNPL (Buy-Now-Pay-Later)</option>
                  <option value="Cross-border">Cross-Border Correspondent</option>
                </select>
              </div>

              <div className="control-group">
                <label><span>Adversarial Adaptation Level</span></label>
                <select value={adaptationLevel} onChange={e => setAdaptationLevel(e.target.value as any)}>
                  <option value="static">Static (Traditional un-mutated payloads)</option>
                  <option value="adaptive">Adaptive (Parameter-tuned evasion)</option>
                  <option value="adversarial-rl">Adversarial RL (Feedback-driven evasion)</option>
                </select>
              </div>
            </div>
          </div>

          {/* STEP 3 · Animated Pipeline Visualizer */}
          <div className="panel" style={{ padding: "18px" }}>
            <div className="panel-head">
              <div>
                <h2>STEP 3 · Synthetic Generation Pipeline</h2>
                <p>Deterministic telemetry generator $\to$ Blue Team detector stream</p>
              </div>
              <span className="live">
                <em /> {isGenerating ? "GENERATING STREAM..." : simResults ? "BATCH READY" : "IDLE"}
              </span>
            </div>

            <div className="pipeline-track">
              <div className="pipeline-stage">
                <div className={`stage-icon ${pipelineStep >= 1 ? "pulse" : ""}`}>◈</div>
                <strong>Threat Target</strong>
                <span>{activePreset === "custom" ? selectedAttackId : activePreset}</span>
              </div>
              <div className={`pipeline-connector ${pipelineStep >= 2 ? "active" : ""}`} />

              <div className="pipeline-stage">
                <div className={`stage-icon ${pipelineStep >= 2 ? "pulse" : ""}`}>⚙</div>
                <strong>Attack Model</strong>
                <span>{adaptationLevel}</span>
              </div>
              <div className={`pipeline-connector ${pipelineStep >= 3 ? "active" : ""}`} />

              <div className="pipeline-stage">
                <div className={`stage-icon ${pipelineStep >= 3 ? "pulse" : ""}`}>☷</div>
                <strong>Behavior Synth</strong>
                <span>Device/Graph/Geo</span>
              </div>
              <div className={`pipeline-connector ${pipelineStep >= 4 ? "active" : ""}`} />

              <div className="pipeline-stage">
                <div className={`stage-icon ${pipelineStep >= 4 ? "pulse" : ""}`}>▣</div>
                <strong>Event Stream</strong>
                <span>{volume.toLocaleString()} txns</span>
              </div>
              <div className={`pipeline-connector ${pipelineStep >= 5 ? "active" : ""}`} />

              <div className="pipeline-stage">
                <div className={`stage-icon ${pipelineStep >= 5 ? "pulse" : ""}`}>◌</div>
                <strong>Detector Intake</strong>
                <span>Sub-25ms scoring</span>
              </div>
            </div>

            {/* Live Counters */}
            <div className="counter-bar">
              <div className="counter-box">
                <span>Total Events</span>
                <strong>{simResults ? simResults.length.toLocaleString() : "0"}</strong>
              </div>
              <div className="counter-box">
                <span>Fraud Instances</span>
                <strong style={{ color: "#ff819c" }}>
                  {simResults ? simResults.filter(t => t.isFraud).length.toLocaleString() : "0"}
                </strong>
              </div>
              <div className="counter-box">
                <span>Adaptive Variants</span>
                <strong style={{ color: "#f9b558" }}>{adaptiveVariantsCount.toLocaleString()}</strong>
              </div>
              <div className="counter-box">
                <span>Flagged High-Risk</span>
                <strong style={{ color: "#a59cff" }}>{highRiskCount.toLocaleString()}</strong>
              </div>
              <div className="counter-box">
                <span>Simulated Accounts</span>
                <strong style={{ color: "#50c8f5" }}>
                  {simResults ? new Set(simResults.map(t => t.accountId)).size.toLocaleString() : "0"}
                </strong>
              </div>
              <div className="counter-box">
                <span>Avg Score Latency</span>
                <strong style={{ color: "#54e3a3" }}>14.2 ms</strong>
              </div>
            </div>

            {/* Quick Action Navigation after Generation */}
            {simResults && (
              <div style={{ marginTop: "18px", padding: "14px", background: "#111b2e", borderRadius: "8px", border: "1px solid #2d3e5e", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <strong style={{ color: "#54e3a3", display: "flex", alignItems: "center", gap: "6px" }}>
                    ✓ Synthetic Event Stream Successfully Generated
                  </strong>
                  <span style={{ fontSize: "10px", color: "#8a99b2" }}>
                    {simResults.length.toLocaleString()} events ready across {rail === "ALL" ? "8 payment rails" : rail}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <Link href="/generated-data" className="primary" style={{ padding: "8px 14px", textDecoration: "none", fontSize: "11px" }}>
                    Inspect Event Stream (Table) →
                  </Link>
                  <Link href="/detection-lab" className="date-select" style={{ padding: "8px 14px", textDecoration: "none", fontSize: "11px" }}>
                    Evaluate Blue Team Detector →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

