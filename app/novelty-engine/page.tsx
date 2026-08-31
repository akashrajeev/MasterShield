"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { EMERGING_RESEARCH_CONCEPTS, generateNovelThreatFamily } from "@/lib/novelty-engine";
import { categoryLabel } from "@/data/attacks";
import type { AttackCategory, NovelThreatConcept, PaymentRail } from "@/types/attack";

export default function NoveltyEnginePage() {
  const [concepts, setConcepts] = useState<NovelThreatConcept[]>(EMERGING_RESEARCH_CONCEPTS);
  const [selectedConcept, setSelectedConcept] = useState<NovelThreatConcept>(EMERGING_RESEARCH_CONCEPTS[0]);

  // Synthesis Form State
  const [genCategory, setGenCategory] = useState<AttackCategory>("autonomous-fraud");
  const [genRail, setGenRail] = useState<PaymentRail>("UPI");
  const [genAiCap, setGenAiCap] = useState<string>("Multi-Agent AI");
  const [genFocus, setGenFocus] = useState<string>("Cross-Border Multi-Hop Routing");
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);

  const handleSynthesize = () => {
    setIsSynthesizing(true);
    setTimeout(() => {
      const newConcept = generateNovelThreatFamily({
        category: genCategory,
        rail: genRail,
        aiCapability: genAiCap,
        focusArea: genFocus,
      });
      setConcepts(prev => [newConcept, ...prev]);
      setSelectedConcept(newConcept);
      setIsSynthesizing(false);
    }, 800);
  };

  return (
    <AppShell title="Novelty & Threat Discovery">
      <div className="page-container">
        <div className="page-head" style={{ padding: "0 0 20px" }}>
          <div>
            <p className="eyebrow">NOVEL THREAT LAB · MASTERSHIELD</p>
            <h1>Emerging Threat Discovery & Synthesis Engine</h1>
            <p className="subtitle">
              Discover novel AI-assisted payment attack vectors before they manifest in live payment networks
            </p>
          </div>
          <div className="head-actions">
            <Link
              href={`/simulator?attack=${selectedConcept.id}`}
              className="primary"
              style={{ textDecoration: "none" }}
            >
              Simulate Selected Novel Vector ({selectedConcept.id}) →
            </Link>
          </div>
        </div>

        {/* 2-Column Layout: Discovery Feed & Active Novel Concept Deep Dive */}
        <div className="responsive-split responsive-split-wide">
          {/* Left Column: Feed & Generator Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
            {/* Interactive Threat Synthesizer */}
            <div className="panel" style={{ padding: "18px" }}>
              <div className="panel-head">
                <div>
                  <h2>Composite Threat Synthesizer</h2>
                  <p>Combine vectors into novel hypothetical attacks</p>
                </div>
                <span className="badge badge-purple">GENERATE</span>
              </div>

              <div style={{ display: "grid", gap: "10px", marginTop: "12px" }}>
                <div>
                  <label style={{ fontSize: "10px", color: "#8a97ae", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                    TAXONOMY CATEGORY
                  </label>
                  <select
                    style={{ width: "100%", background: "#0e1626", border: "1px solid #28374f", borderRadius: "6px", color: "#e3e9f5", padding: "7px 10px", font: "600 11px Manrope" }}
                    value={genCategory}
                    onChange={e => setGenCategory(e.target.value as AttackCategory)}
                  >
                    {Object.entries(categoryLabel).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "10px", color: "#8a97ae", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                    TARGET PAYMENT RAIL
                  </label>
                  <select
                    style={{ width: "100%", background: "#0e1626", border: "1px solid #28374f", borderRadius: "6px", color: "#e3e9f5", padding: "7px 10px", font: "600 11px Manrope" }}
                    value={genRail}
                    onChange={e => setGenRail(e.target.value as PaymentRail)}
                  >
                    <option value="UPI">UPI (Immediate Settlement)</option>
                    <option value="Cards">Cards (Credit / Debit / Tokenized)</option>
                    <option value="Wallets">Wallets (Prepaid Stored Value)</option>
                    <option value="RTGS">RTGS (High-Value Wholesale)</option>
                    <option value="NEFT">NEFT (Batch Clearing)</option>
                    <option value="BNPL">BNPL (Point of Sale)</option>
                    <option value="Cross-border">Cross-border ISO 20022</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "10px", color: "#8a97ae", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                    AI CAPABILITY STACK
                  </label>
                  <select
                    style={{ width: "100%", background: "#0e1626", border: "1px solid #28374f", borderRadius: "6px", color: "#e3e9f5", padding: "7px 10px", font: "600 11px Manrope" }}
                    value={genAiCap}
                    onChange={e => setGenAiCap(e.target.value)}
                  >
                    <option value="Multi-Agent AI">Multi-Agent Swarm AI</option>
                    <option value="Voice Cloning (Zero-Shot)">Zero-Shot Voice Cloning</option>
                    <option value="Reinforcement Learning">Reinforcement Learning Evasion</option>
                    <option value="Diffusion Document Rendering">Diffusion Document Rendering</option>
                    <option value="Physics-Based Behavioral Synth">Physics-Based Mouse / Sensor Synth</option>
                  </select>
                </div>

                <button
                  className="primary"
                  onClick={handleSynthesize}
                  disabled={isSynthesizing}
                  style={{ width: "100%", marginTop: "6px", justifyContent: "center", opacity: isSynthesizing ? 0.7 : 1 }}
                >
                  {isSynthesizing ? "Synthesizing Concept..." : "✦ Synthesize Novel Concept"}
                </button>
              </div>
            </div>

            {/* List of Concepts */}
            <div className="panel" style={{ padding: "18px" }}>
              <div className="panel-head">
                <div>
                  <h2>Discovery Feed</h2>
                  <p>Active novel research vectors ({concepts.length})</p>
                </div>
              </div>

              <div style={{ display: "grid", gap: "8px", marginTop: "12px" }}>
                {concepts.map(concept => {
                  const isSelected = selectedConcept.id === concept.id;
                  return (
                    <div
                      key={concept.id}
                      onClick={() => setSelectedConcept(concept)}
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
                        <span className="mono" style={{ fontSize: "10px" }}>{concept.id}</span>
                        <span className="badge badge-purple">Novelty {concept.noveltyScore}/100</span>
                      </div>
                      <strong style={{ fontSize: "11px", color: "#e2e8f5", display: "block", marginBottom: "3px" }}>
                        {concept.title}
                      </strong>
                      <span style={{ fontSize: "9px", color: "#8a97ae" }}>
                        {categoryLabel[concept.category]} · {concept.paymentRails.join(", ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Selected Concept Detail */}
          <div className="panel" style={{ padding: "22px", display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #24334d", paddingBottom: "14px" }}>
              <div>
                <span className="mono" style={{ fontSize: "11px" }}>{selectedConcept.id}</span>
                <h2 style={{ fontSize: "20px", margin: "4px 0" }}>{selectedConcept.title}</h2>
                <span style={{ fontSize: "11px", color: "#8a97ae" }}>
                  Target: {selectedConcept.targetSurface} · Rails: {selectedConcept.paymentRails.join(" / ")}
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className="badge badge-purple" style={{ fontSize: "10px", padding: "4px 8px" }}>
                  NOVELTY SCORE: {selectedConcept.noveltyScore}/100
                </span>
              </div>
            </div>

            {/* AI Capabilities Stack */}
            <div>
              <strong style={{ fontSize: "11px", color: "#8a97ae", textTransform: "uppercase" }}>AI Capabilities Deployed</strong>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                {selectedConcept.aiCapabilities.map(cap => (
                  <span key={cap} className="badge badge-blue">{cap}</span>
                ))}
              </div>
            </div>

            {/* Attack Chain */}
            <div style={{ padding: "14px", background: "#0c1322", borderRadius: "8px", border: "1px solid #1f2d46" }}>
              <strong style={{ fontSize: "11px", color: "#c4b8ff", display: "block", marginBottom: "8px" }}>
                Hypothetical Attack Execution Chain
              </strong>
              <div style={{ display: "grid", gap: "6px" }}>
                {selectedConcept.attackChain.map((step, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "10px", color: "#cbd5e1" }}>
                    <span style={{ color: "#8f82ff", fontWeight: 700, fontFamily: "DM Mono" }}>0{idx + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detection Weakness & Simulation Strategy */}
            <div className="metric-grid metric-grid-two">
              <div style={{ padding: "14px", background: "#1c1420", borderRadius: "8px", border: "1px solid #3d2334" }}>
                <strong style={{ fontSize: "11px", color: "#ff819c", display: "block", marginBottom: "4px" }}>
                  Expected Detector Blind Spot
                </strong>
                <p style={{ margin: 0, fontSize: "10px", color: "#d1d5db", lineHeight: "1.4" }}>
                  {selectedConcept.expectedDetectionWeakness}
                </p>
              </div>

              <div style={{ padding: "14px", background: "#122030", borderRadius: "8px", border: "1px solid #233e5c" }}>
                <strong style={{ fontSize: "11px", color: "#50c8f5", display: "block", marginBottom: "4px" }}>
                  Simulation Formulation
                </strong>
                <p style={{ margin: 0, fontSize: "10px", color: "#d1d5db", lineHeight: "1.4" }}>
                  {selectedConcept.simulationStrategy}
                </p>
              </div>
            </div>

            {/* Recommended Defense Hypothesis */}
            <div style={{ padding: "14px", background: "#13231d", borderRadius: "8px", border: "1px solid #204838" }}>
              <strong style={{ fontSize: "11px", color: "#54e3a3", display: "block", marginBottom: "4px" }}>
                Blue Team Defense Hypothesis
              </strong>
              <p style={{ margin: 0, fontSize: "10px", color: "#d1d5db", lineHeight: "1.4" }}>
                {selectedConcept.defenseHypothesis}
              </p>
            </div>

            <div style={{ marginTop: "auto", display: "flex", gap: "10px", paddingTop: "12px" }}>
              <Link
                href={`/simulator?attack=${selectedConcept.id}`}
                className="primary"
                style={{ flex: 1, textDecoration: "none", textAlign: "center", padding: "10px" }}
              >
                Send to Red Team Simulator →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

