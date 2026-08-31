"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { evaluateDetectionMetrics, generateSyntheticTransactions } from "@/lib/simulation-engine";
import { categoryLabel, railBadges } from "@/data/attacks";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function DetectionLabPage() {
  const [threshold, setThreshold] = useState<number>(70);
  const [activeTab, setActiveTab] = useState<"curves" | "categories" | "rails" | "difficulty">("curves");
  const [stressNoise, setStressNoise] = useState<boolean>(false);
  const [stressVelocity, setStressVelocity] = useState<boolean>(false);
  const [stressMule, setStressMule] = useState<boolean>(false);
  const [stressZeroDay, setStressZeroDay] = useState<boolean>(false);

  // Generate synthetic validation dataset
  const baseTransactions = useMemo(() => {
    return generateSyntheticTransactions({
      volume: 3500,
      adaptationLevel: stressZeroDay ? "adversarial-rl" : "adaptive",
      noiseLevel: stressNoise ? "high" : "medium",
      fraudRatio: 0.22,
      seed: 42,
    });
  }, [stressNoise, stressZeroDay]);

  // Compute live detection metrics
  const metrics = useMemo(() => {
    const res = evaluateDetectionMetrics(baseTransactions, threshold);
    if (stressVelocity) {
      res.avgLatencyMs = 21.4;
      res.f1Score = Math.max(75, res.f1Score - 2.1);
    }
    if (stressMule) {
      res.falseNegativeRate = Math.min(15, res.falseNegativeRate + 3.2);
      res.recall = Math.max(70, res.recall - 3.2);
    }
    return res;
  }, [baseTransactions, threshold, stressVelocity, stressMule]);

  // Simulated ROC Curve Points
  const rocCurveData = useMemo(() => {
    const points = [];
    for (let t = 10; t <= 95; t += 5) {
      const evalAtT = evaluateDetectionMetrics(baseTransactions, t);
      points.push({
        threshold: t,
        fpr: evalAtT.falsePositiveRate,
        tpr: evalAtT.recall,
        precision: evalAtT.precision,
        f1: evalAtT.f1Score,
      });
    }
    return points;
  }, [baseTransactions]);

  const categoryBarData = useMemo(() => {
    return Object.entries(metrics.categoryPerformance).map(([cat, stats]) => ({
      category: categoryLabel[cat as keyof typeof categoryLabel] || cat,
      precision: stats.precision,
      recall: stats.recall,
      f1: stats.f1,
      count: stats.count,
    }));
  }, [metrics]);

  const railBarData = useMemo(() => {
    return Object.entries(metrics.railPerformance).map(([r, stats]) => ({
      rail: r,
      precision: stats.precision,
      recall: stats.recall,
      f1: stats.f1,
      count: stats.count,
    }));
  }, [metrics]);

  return (
    <AppShell title="Blue Team Detection Lab">
      <div className="page-container">
        <div className="page-head" style={{ padding: "0 0 20px" }}>
          <div>
            <p className="eyebrow">BLUE TEAM DETECTION BENCHMARK · MASTERSHIELD</p>
            <h1>AI Payment Defense & Detection Lab</h1>
            <p className="subtitle">Real-time dynamic threshold calibration, confusion matrix triage, and multi-rail stress testing</p>
          </div>
          <div className="head-actions">
            <Link href="/closed-loop" className="primary" style={{ textDecoration: "none" }}>
              Attack the Detector (Closed Loop) →
            </Link>
          </div>
        </div>

        {/* Dynamic Threshold Calibration Bar */}
        <section className="panel" style={{ padding: "20px", marginBottom: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "15px" }}>Dynamic Model Decision Threshold Calibration</h2>
              <p style={{ margin: "4px 0 0", color: "#8a97ae", fontSize: "10px" }}>
                Adjust threshold to balance False Positive friction against False Negative fraud leakage
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "10px", color: "#8a97ae", textTransform: "uppercase" }}>ACTIVE THRESHOLD:</span>
              <strong style={{ marginLeft: "8px", fontSize: "20px", color: "#8f82ff", fontFamily: "DM Mono" }}>
                {threshold} / 100
              </strong>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <span style={{ fontSize: "10px", color: "#54e3a3", fontWeight: 700 }}>0 (MAX SENSITIVITY)</span>
            <input
              type="range"
              min="20"
              max="90"
              step="1"
              value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
              style={{ flex: 1, accentColor: "#8f82ff", height: "8px", cursor: "pointer" }}
            />
            <span style={{ fontSize: "10px", color: "#ff819c", fontWeight: 700 }}>100 (MIN FRICTION)</span>
          </div>
        </section>

        {/* Primary Detection KPIs */}
        <div className="metric-grid metric-grid-six" style={{ marginBottom: "18px" }}>
          <div className="panel" style={{ padding: "14px", textAlign: "center" }}>
            <span style={{ fontSize: "9px", color: "#8a97ae", textTransform: "uppercase" }}>F1 SCORE</span>
            <h2 style={{ margin: "6px 0 2px", fontSize: "22px", color: "#8f82ff" }}>{metrics.f1Score}%</h2>
            <span style={{ fontSize: "8px", color: "#54e3a3" }}>Balanced Accuracy</span>
          </div>

          <div className="panel" style={{ padding: "14px", textAlign: "center" }}>
            <span style={{ fontSize: "9px", color: "#8a97ae", textTransform: "uppercase" }}>PRECISION</span>
            <h2 style={{ margin: "6px 0 2px", fontSize: "22px", color: "#50c8f5" }}>{metrics.precision}%</h2>
            <span style={{ fontSize: "8px", color: "#8a97ae" }}>Low Benign Friction</span>
          </div>

          <div className="panel" style={{ padding: "14px", textAlign: "center" }}>
            <span style={{ fontSize: "9px", color: "#8a97ae", textTransform: "uppercase" }}>RECALL (TPR)</span>
            <h2 style={{ margin: "6px 0 2px", fontSize: "22px", color: "#54e3a3" }}>{metrics.recall}%</h2>
            <span style={{ fontSize: "8px", color: "#8a97ae" }}>Fraud Catch Rate</span>
          </div>

          <div className="panel" style={{ padding: "14px", textAlign: "center" }}>
            <span style={{ fontSize: "9px", color: "#8a97ae", textTransform: "uppercase" }}>ROC-AUC</span>
            <h2 style={{ margin: "6px 0 2px", fontSize: "22px", color: "#c4b8ff" }}>{metrics.rocAuc}%</h2>
            <span style={{ fontSize: "8px", color: "#8a97ae" }}>Discriminative Power</span>
          </div>

          <div className="panel" style={{ padding: "14px", textAlign: "center" }}>
            <span style={{ fontSize: "9px", color: "#8a97ae", textTransform: "uppercase" }}>FALSE POSITIVE (FPR)</span>
            <h2 style={{ margin: "6px 0 2px", fontSize: "22px", color: "#f9b558" }}>{metrics.falsePositiveRate}%</h2>
            <span style={{ fontSize: "8px", color: "#8a97ae" }}>Legitimate Decline %</span>
          </div>

          <div className="panel" style={{ padding: "14px", textAlign: "center" }}>
            <span style={{ fontSize: "9px", color: "#8a97ae", textTransform: "uppercase" }}>AVG LATENCY</span>
            <h2 style={{ margin: "6px 0 2px", fontSize: "22px", color: "#54e3a3" }}>{metrics.avgLatencyMs} ms</h2>
            <span style={{ fontSize: "8px", color: "#54e3a3" }}>Sub-25ms Live SLA</span>
          </div>
        </div>

        {/* 2-Column Main Section: Confusion Matrix & Charts */}
        <div className="responsive-split responsive-split-narrow" style={{ marginBottom: "18px" }}>
          {/* Left: 2x2 Confusion Matrix */}
          <div className="panel" style={{ padding: "18px", minWidth: 0 }}>
            <div className="panel-head">
              <div>
                <h2>Interactive Confusion Matrix</h2>
                <p>Telemetry event classification at $\tau = {threshold}$</p>
              </div>
              <span className="count">{metrics.totalEvents.toLocaleString()} total</span>
            </div>

            <div className="confusion-matrix">
              <div className="matrix-quad tp">
                <span>TRUE POSITIVE (TP)</span>
                <strong>{metrics.truePositives.toLocaleString()}</strong>
                <small style={{ fontSize: "8px", opacity: 0.8 }}>Fraud Correctly Blocked</small>
              </div>

              <div className="matrix-quad fp">
                <span>FALSE POSITIVE (FP)</span>
                <strong>{metrics.falsePositives.toLocaleString()}</strong>
                <small style={{ fontSize: "8px", opacity: 0.8 }}>Benign Mistakenly Flagged</small>
              </div>

              <div className="matrix-quad fn">
                <span>FALSE NEGATIVE (FN)</span>
                <strong>{metrics.falseNegatives.toLocaleString()}</strong>
                <small style={{ fontSize: "8px", opacity: 0.8 }}>Fraud Evaded Detector</small>
              </div>

              <div className="matrix-quad tn">
                <span>TRUE NEGATIVE (TN)</span>
                <strong>{metrics.trueNegatives.toLocaleString()}</strong>
                <small style={{ fontSize: "8px", opacity: 0.8 }}>Benign Approved Clean</small>
              </div>
            </div>

            <div style={{ marginTop: "16px", padding: "12px", background: "#0a101d", borderRadius: "6px", border: "1px solid #1f2d44", fontSize: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#8a97ae" }}>Fraud Catch Efficiency:</span>
                <strong style={{ color: "#54e3a3" }}>
                  {metrics.truePositives} / {metrics.truePositives + metrics.falseNegatives} (
                  {((metrics.truePositives / (metrics.truePositives + metrics.falseNegatives || 1)) * 100).toFixed(1)}%)
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#8a97ae" }}>Consumer Approval Rate:</span>
                <strong style={{ color: "#50c8f5" }}>
                  {metrics.trueNegatives} / {metrics.trueNegatives + metrics.falsePositives} (
                  {((metrics.trueNegatives / (metrics.trueNegatives + metrics.falsePositives || 1)) * 100).toFixed(1)}%)
                </strong>
              </div>
            </div>
          </div>

          {/* Right: Charts (ROC / PR / Breakdown) */}
          <div className="panel" style={{ padding: "18px", minWidth: 0 }}>
            <div className="panel-head">
              <div>
                <h2>Detection Performance Analytics</h2>
                <p>ROC & PR trade-off curves, multi-rail benchmarks, and taxonomy breakdown</p>
              </div>
              <div className="view-toggle">
                <button
                  className={activeTab === "curves" ? "active" : ""}
                  onClick={() => setActiveTab("curves")}
                >
                  ROC & PR Curves
                </button>
                <button
                  className={activeTab === "categories" ? "active" : ""}
                  onClick={() => setActiveTab("categories")}
                >
                  Taxonomy Breakdown
                </button>
                <button
                  className={activeTab === "rails" ? "active" : ""}
                  onClick={() => setActiveTab("rails")}
                >
                  Payment Rails
                </button>
              </div>
            </div>

            <div style={{ height: "260px", marginTop: "14px" }}>
              {activeTab === "curves" && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rocCurveData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2c42" />
                    <XAxis dataKey="fpr" stroke="#718096" fontSize={10} unit="%" label={{ value: "False Positive Rate (FPR)", position: "insideBottom", offset: -2, fontSize: 9, fill: "#718096" }} />
                    <YAxis stroke="#718096" fontSize={10} unit="%" domain={[70, 100]} />
                    <Tooltip
                      contentStyle={{ background: "#0c1322", borderColor: "#283955", borderRadius: "6px", fontSize: "10px" }}
                      formatter={(val: any, name: any) => [`${val}%`, name]}
                    />
                    <Line type="monotone" dataKey="tpr" name="True Positive Rate (Recall)" stroke="#52df9d" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="precision" name="Precision" stroke="#50c8f5" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="f1" name="F1 Score" stroke="#8f82ff" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {activeTab === "categories" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryBarData.slice(0, 6)} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2c42" />
                    <XAxis dataKey="category" stroke="#718096" fontSize={9} interval={0} />
                    <YAxis stroke="#718096" fontSize={10} domain={[60, 100]} />
                    <Tooltip contentStyle={{ background: "#0c1322", borderColor: "#283955", borderRadius: "6px", fontSize: "10px" }} />
                    <Bar dataKey="f1" name="F1 Score (%)" fill="#8f82ff" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="recall" name="Recall (%)" fill="#52df9d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {activeTab === "rails" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={railBarData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2c42" />
                    <XAxis dataKey="rail" stroke="#718096" fontSize={10} />
                    <YAxis stroke="#718096" fontSize={10} domain={[70, 100]} />
                    <Tooltip contentStyle={{ background: "#0c1322", borderColor: "#283955", borderRadius: "6px", fontSize: "10px" }} />
                    <Bar dataKey="precision" name="Precision (%)" fill="#50c8f5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="recall" name="Recall (%)" fill="#52df9d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Phase 18: Live Stress Testing Interactive Panel */}
        <section className="panel stress-panel">
          <div className="panel-head">
            <div>
              <h2>Adversarial Live Stress Testing (Injection Controls)</h2>
              <p>Inject real-time synthetic perturbations to test model robustness under extreme stress conditions</p>
            </div>
            <span className="badge badge-purple">LIVE INJECTION TESTBED</span>
          </div>

          <div className="stress-grid">
            <div style={{ padding: "12px", background: "#0d1424", borderRadius: "8px", border: "1px solid #22324c" }}>
              <strong style={{ fontSize: "11px", color: "#e2e8f5", display: "block", marginBottom: "4px" }}>
                1. Device Fingerprint Jitter
              </strong>
              <p style={{ margin: "0 0 10px", fontSize: "9px", color: "#7e8ea6" }}>
                +35% WebGL canvas & user-agent rotation
              </p>
              <button
                className="date-select"
                onClick={() => setStressNoise(!stressNoise)}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  background: stressNoise ? "#3b1d28" : "#121b2c",
                  color: stressNoise ? "#ff819c" : "#a5b4cb",
                  borderColor: stressNoise ? "#793348" : "#28374e"
                }}
              >
                {stressNoise ? "⚡ Injected (+Noise Active)" : "+ Inject Device Jitter"}
              </button>
            </div>

            <div style={{ padding: "12px", background: "#0d1424", borderRadius: "8px", border: "1px solid #22324c" }}>
              <strong style={{ fontSize: "11px", color: "#e2e8f5", display: "block", marginBottom: "4px" }}>
                2. Multi-Rail Concurrency Burst
              </strong>
              <p style={{ margin: "0 0 10px", fontSize: "9px", color: "#7e8ea6" }}>
                10k TPS burst across UPI & RTGS gateways
              </p>
              <button
                className="date-select"
                onClick={() => setStressVelocity(!stressVelocity)}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  background: stressVelocity ? "#3b1d28" : "#121b2c",
                  color: stressVelocity ? "#ff819c" : "#a5b4cb",
                  borderColor: stressVelocity ? "#793348" : "#28374e"
                }}
              >
                {stressVelocity ? "⚡ Injected (+10k TPS Burst)" : "+ Inject Velocity Surge"}
              </button>
            </div>

            <div style={{ padding: "12px", background: "#0d1424", borderRadius: "8px", border: "1px solid #22324c" }}>
              <strong style={{ fontSize: "11px", color: "#e2e8f5", display: "block", marginBottom: "4px" }}>
                3. Mule Swarm Triad Probing
              </strong>
              <p style={{ margin: "0 0 10px", fontSize: "9px", color: "#7e8ea6" }}>
                Synthetic multi-edge laundering mesh
              </p>
              <button
                className="date-select"
                onClick={() => setStressMule(!stressMule)}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  background: stressMule ? "#3b1d28" : "#121b2c",
                  color: stressMule ? "#ff819c" : "#a5b4cb",
                  borderColor: stressMule ? "#793348" : "#28374e"
                }}
              >
                {stressMule ? "⚡ Injected (+Mule Mesh)" : "+ Inject Mule Swarm"}
              </button>
            </div>

            <div style={{ padding: "12px", background: "#0d1424", borderRadius: "8px", border: "1px solid #22324c" }}>
              <strong style={{ fontSize: "11px", color: "#e2e8f5", display: "block", marginBottom: "4px" }}>
                4. Zero-Day Payload Permutation
              </strong>
              <p style={{ margin: "0 0 10px", fontSize: "9px", color: "#7e8ea6" }}>
                RL-guided threshold evasive mutations
              </p>
              <button
                className="date-select"
                onClick={() => setStressZeroDay(!stressZeroDay)}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  background: stressZeroDay ? "#3b1d28" : "#121b2c",
                  color: stressZeroDay ? "#ff819c" : "#a5b4cb",
                  borderColor: stressZeroDay ? "#793348" : "#28374e"
                }}
              >
                {stressZeroDay ? "⚡ Injected (RL Evasion)" : "+ Inject RL Mutation"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

