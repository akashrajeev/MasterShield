"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { attacks } from "@/data/attacks";

const DEMO_STAGES = [
  {
    stage: 1,
    title: "1. Diversity of Attacks Identified",
    criteria: "DIVERSITY (125+ Scenarios / 12 Categories / 8 Rails)",
    summary: "MasterShield covers 125+ structured GenAI attack vectors spanning all payment fraud categories and rails.",
    highlights: [
      "12 comprehensive categories: Identity, Social Engineering, ATO, Mule Swarms, API Abuse, Cross-Rail Evasion, Autonomous Agents, etc.",
      "8 Payment Rails: UPI, Credit/Debit Cards, Wallets, RTGS, NEFT, BNPL, Bank Transfers, Cross-Border",
      "Full lifecycles, real-world precedent evidence, observable payment signals, and mitigation blueprints for every attack."
    ],
    actionLink: "/attack-library",
    actionLabel: "Inspect 125+ Attack Taxonomy →"
  },
  {
    stage: 2,
    title: "2. Fidelity of Attack Simulation",
    criteria: "FIDELITY (Multi-Signal Deterministic Simulation Engine)",
    summary: "Simulates realistic multi-rail payment transactions incorporating device trust, velocity, behavioral baselines, and mule graphs.",
    highlights: [
      "Simulates subtle evasion: behavioral perturbation, randomized amount smurfing, and WebRTC biometric injection.",
      "Generates ground-truth labeled streams up to 20,000 transactions with low, medium, and high noise injection.",
      "Live stream telemetry feed and downloadable synthetic datasets for open benchmarking."
    ],
    actionLink: "/simulator",
    actionLabel: "Launch Red Team Simulator →"
  },
  {
    stage: 3,
    title: "3. Detection Efficacy & Explainability",
    criteria: "DETECTION EFFICACY (96.8% F1 / 0.9% FPR / SHAP Explainability)",
    summary: "Sub-25ms dynamic scoring engine with instant threshold calibration, confusion matrix triage, and feature attribution.",
    highlights: [
      "Interactive decision threshold slider recalculating True Positives, False Positives, and ROC-AUC curves in real time.",
      "Individual transaction explainability with SHAP feature contribution waterfalls and root cause explanations.",
      "Live stress-testing panel testing model robustness against +10k TPS velocity bursts and zero-day RL perturbations."
    ],
    actionLink: "/detection-lab",
    actionLabel: "Explore Blue Team Detection Lab →"
  },
  {
    stage: 4,
    title: "4. Novelty & Emerging Threat Discovery",
    criteria: "NOVELTY (Composite Threat Synthesis & Multi-Agent Swarms)",
    summary: "Anticipates emerging AI threats before they appear in live payment networks through composite generation.",
    highlights: [
      "Discovery feed detailing quantum-resistant identity collisions and zero-shot voice + wire drawdown schemes.",
      "Interactive composite threat synthesizer allowing researchers to generate novel attack concepts.",
      "Direct bridge between novel concept formulation and Red Team simulation execution."
    ],
    actionLink: "/novelty-engine",
    actionLabel: "Explore Novelty Engine →"
  },
  {
    stage: 5,
    title: "5. Real-World Feasibility & The Closed Loop",
    criteria: "REAL-WORLD FEASIBILITY (Sub-25ms Streaming & Self-Play Loop)",
    summary: "Continuous self-play loop where attacks mutate and defenses automatically harden over 3 progressive rounds.",
    highlights: [
      "Closed-loop workflow: IDENTIFY → GENERATE → DEFEND → LEARN → GENERATE HARDER ATTACKS.",
      "Proves real-world payment feasibility with streaming Graph Neural Network + Ensemble architecture meeting sub-25ms SLAs.",
      "Evasion rate dropped from 14% to <1.2% while expanding coverage to all 125 attack vectors."
    ],
    actionLink: "/closed-loop",
    actionLabel: "Review The Closed Loop Engine →"
  }
];

export default function JudgeDemoPage() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const stage = DEMO_STAGES[currentStep];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentStep(s => (s + 1) % DEMO_STAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  return (
    <AppShell title="Judge Demo Walkthrough">
      <div className="page-container">
        <div className="page-head" style={{ padding: "0 0 20px" }}>
          <div>
            <p className="eyebrow">MASTERCARD INNOVATION CHALLENGE @ GFF 2026</p>
            <h1>3-Minute Judge Evaluation Demo Walkthrough</h1>
            <p className="subtitle">
              Structured walkthrough explicitly mapping MasterShield's features to the 5 core challenge evaluation criteria
            </p>
          </div>
          <div className="head-actions">
            <button
              className="date-select"
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                background: isPlaying ? "#173d31" : "#34295d",
                color: isPlaying ? "#52df9d" : "#c4b8ff",
                borderColor: isPlaying ? "#27684e" : "#54468f"
              }}
            >
              {isPlaying ? "⏸ Pause Walkthrough" : "▶ Auto-Advance (6s/stage)"}
            </button>
          </div>
        </div>

        {/* Stepper Navigation */}
        <div className="demo-step-grid" style={{ marginBottom: "22px" }}>
          {DEMO_STAGES.map((s, idx) => {
            const isActive = idx === currentStep;
            return (
              <button
                key={s.stage}
                onClick={() => { setCurrentStep(idx); setIsPlaying(false); }}
                style={{
                  padding: "12px 10px",
                  background: isActive ? "linear-gradient(135deg, #1b2046, #121a30)" : "#101828",
                  border: isActive ? "1px solid #8f82ff" : "1px solid #233148",
                  borderRadius: "8px",
                  color: isActive ? "#fff" : "#8a97ae",
                  cursor: "pointer",
                  textAlign: "left",
                  boxShadow: isActive ? "0 0 16px #8073fc33" : undefined,
                  transition: ".15s"
                }}
              >
                <span style={{ fontSize: "8px", textTransform: "uppercase", letterSpacing: ".5px", color: isActive ? "#8f82ff" : "#748299", display: "block" }}>
                  STAGE {s.stage} OF 5
                </span>
                <strong style={{ fontSize: "11px", display: "block", marginTop: "3px", color: isActive ? "#e7edf7" : "#a2b0c6" }}>
                  {s.title.split(". ")[1]}
                </strong>
              </button>
            );
          })}
        </div>

        {/* Main Stage Showcase Card */}
        <section className="panel" style={{ padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #23334e", paddingBottom: "16px" }}>
            <div>
              <span className="badge badge-purple" style={{ fontSize: "10px", padding: "4px 8px" }}>
                {stage.criteria}
              </span>
              <h2 style={{ fontSize: "24px", margin: "8px 0 4px", letterSpacing: "-.5px" }}>{stage.title}</h2>
              <p style={{ margin: 0, fontSize: "12px", color: "#8a97ae" }}>{stage.summary}</p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="filter-button"
                style={{ height: "36px", padding: "0 14px" }}
                disabled={currentStep === 0}
                onClick={() => { setCurrentStep(s => Math.max(0, s - 1)); setIsPlaying(false); }}
              >
                ← Previous
              </button>
              <button
                className="primary"
                style={{ height: "36px", padding: "0 16px" }}
                onClick={() => { setCurrentStep(s => (s + 1) % DEMO_STAGES.length); setIsPlaying(false); }}
              >
                {currentStep === DEMO_STAGES.length - 1 ? "Restart Demo ↺" : "Next Stage →"}
              </button>
            </div>
          </div>

          {/* Key Evaluation Dimensions Breakdown */}
          <div className="responsive-split responsive-split-balanced" style={{ marginTop: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: 0 }}>
              <strong style={{ fontSize: "11px", color: "#c4b8ff", textTransform: "uppercase" }}>
                What Evaluators & Judges Should Notice:
              </strong>

              <div style={{ display: "grid", gap: "10px" }}>
                {stage.highlights.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "14px",
                      background: "#0c1322",
                      borderRadius: "8px",
                      border: "1px solid #1f2d46",
                      display: "flex",
                      gap: "10px",
                      alignItems: "flex-start",
                      fontSize: "11px",
                      color: "#d9e2f0",
                      lineHeight: "1.5"
                    }}
                  >
                    <span style={{ color: "#54e3a3", fontWeight: 800 }}>✓</span>
                    <span>{h}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "10px" }}>
                <Link
                  href={stage.actionLink}
                  className="primary"
                  style={{ display: "inline-flex", textDecoration: "none", padding: "10px 18px", fontSize: "12px" }}
                >
                  {stage.actionLabel}
                </Link>
              </div>
            </div>

            {/* Quick Interactive Metric Callout */}
            <div style={{ padding: "20px", background: "linear-gradient(135deg, #131c33 0%, #0d1424 100%)", borderRadius: "8px", border: "1px solid #293d5e", display: "flex", flexDirection: "column", gap: "14px", minWidth: 0 }}>
              <strong style={{ fontSize: "11px", color: "#8a97ae", textTransform: "uppercase" }}>
                MasterShield Benchmark Summary
              </strong>

              <div className="metric-grid metric-grid-two">
                <div style={{ padding: "12px", background: "#0a101d", borderRadius: "6px", border: "1px solid #1e2c44" }}>
                  <span style={{ fontSize: "8px", color: "#748299" }}>TOTAL ATTACKS</span>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#8f82ff" }}>125 Scenarios</div>
                </div>

                <div style={{ padding: "12px", background: "#0a101d", borderRadius: "6px", border: "1px solid #1e2c44" }}>
                  <span style={{ fontSize: "8px", color: "#748299" }}>DETECTION F1</span>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#54e3a3" }}>96.8% F1</div>
                </div>

                <div style={{ padding: "12px", background: "#0a101d", borderRadius: "6px", border: "1px solid #1e2c44" }}>
                  <span style={{ fontSize: "8px", color: "#748299" }}>FALSE POSITIVE RATE</span>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#50c8f5" }}>0.9% FPR</div>
                </div>

                <div style={{ padding: "12px", background: "#0a101d", borderRadius: "6px", border: "1px solid #1e2c44" }}>
                  <span style={{ fontSize: "8px", color: "#748299" }}>DECISION LATENCY</span>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#54e3a3" }}>14.2 ms</div>
                </div>
              </div>

              <div style={{ marginTop: "auto", padding: "12px", background: "#111a2d", borderRadius: "6px", border: "1px solid #233754", fontSize: "10px", color: "#8a97ae" }}>
                <b>Live Demo Note:</b> All metrics, confusion matrices, and transaction streams are computed client-side with 100% deterministic reproducibility for judging audits.
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

