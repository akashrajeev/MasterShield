"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { listBackendAttacks, adaptBackendAttack } from "@/lib/api/attacks";
import { createSimulation, type SimulationConfig } from "@/lib/api/simulations";
import { detectSimulation } from "@/lib/api/detection";
import type { Attack } from "@/types/attack";

const presets = [
  { id: "top-hardest", name: "Top Hardest", events: 5000, fraud_rate: .20, difficulty: "very-high" as const, adaptation: "adversarial" as const },
  { id: "identity", name: "Identity Stress", events: 3500, fraud_rate: .25, difficulty: "high" as const, adaptation: "adaptive" as const },
  { id: "social", name: "Social Engineering", events: 4000, fraud_rate: .18, difficulty: "high" as const, adaptation: "adaptive" as const },
  { id: "landscape", name: "Full Landscape", events: 10000, fraud_rate: .15, difficulty: "very-high" as const, adaptation: "adaptive" as const },
];

export default function SimulatorPage() {
  const [attacks, setAttacks] = useState<Attack[]>([]); const [selected, setSelected] = useState("");
  const [preset, setPreset] = useState("top-hardest"); const [events, setEvents] = useState(5000);
  const [fraudRate, setFraudRate] = useState(.20); const [difficulty, setDifficulty] = useState<SimulationConfig["difficulty"]>("very-high");
  const [adaptation, setAdaptation] = useState<SimulationConfig["adaptation"]>("adversarial"); const [noise, setNoise] = useState<SimulationConfig["noise"]>("medium");
  const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null); const [detection, setDetection] = useState<any>(null);
  useEffect(() => {
    const attackFromUrl = new URLSearchParams(window.location.search).get("attack");
    listBackendAttacks().then(x => { const a=x.map(adaptBackendAttack); setAttacks(a); const requested=a.find(item=>item.id===attackFromUrl); setSelected(requested?.id || a[0]?.id || ""); }).catch(e => setError(e.message));
  }, []);
  const chosen = attacks.find(a => a.id === selected);
  const selectPreset = (presetId: string) => {
    const p = presets.find(item => item.id === presetId);
    if (!p) return;
    setPreset(p.id); setEvents(p.events); setFraudRate(p.fraud_rate); setDifficulty(p.difficulty); setAdaptation(p.adaptation);
    if (p.id === "identity") {
      const match = attacks.find(a => a.category === "identity"); if (match) setSelected(match.id);
    } else if (p.id === "social") {
      const match = attacks.find(a => a.category === "social-engineering"); if (match) setSelected(match.id);
    } else if (p.id === "top-hardest") {
      const match = [...attacks].filter(a => a.difficulty === "very-high").sort((a,b) => b.noveltyScore - a.noveltyScore)[0]; if (match) setSelected(match.id);
    }
  };
  const run = async () => {
    if (loading || !selected) return;
    setLoading(true); setError("");
    try {
      const config: SimulationConfig = { events, seed: 829134, attack_ids: preset === "landscape" ? null : [selected], fraud_rate: fraudRate, difficulty, adaptation, noise, threshold: .5 };
      const [sim, det] = await Promise.all([createSimulation(config), detectSimulation(config)]);
      setResult(sim); setDetection(det);
    } catch (e) { setError(e instanceof Error ? e.message : "Simulation failed"); }
    finally { setLoading(false); }
  };
  const sample = useMemo(() => result?.sample || [], [result]);
  return <AppShell title="Red Team Simulator"><div className="page-container">
    <div className="page-head"><div><p className="eyebrow">RED TEAM ATTACK GENERATION LAB · LIVE BACKEND</p><h1>Adversarial Payment Fraud Simulator</h1><p className="subtitle">Synthetic events are generated and scored by the MasterShield backend.</p></div><div className="head-actions"><Link href="/attack-library" className="date-select">Attack Library →</Link><button className="primary" onClick={run} disabled={loading || !selected}>{loading ? "Generating + Detecting…" : "⚡ Run Real Simulation"}</button></div></div>
    {error && <div className="panel" style={{padding:14,marginBottom:16,color:"#ff819c"}}>{error}</div>}
    <div className="responsive-split responsive-split-balanced">
      <section className="panel" style={{padding:18}}><div className="panel-head"><div><h2>Threat Configuration</h2><p>Select a backend attack definition and simulation profile.</p></div><span className="badge badge-purple">{attacks.length} ATTACKS</span></div>
        <label className="control-group"><span>Attack</span><select value={selected} onChange={e => {setSelected(e.target.value);setPreset("custom");}} disabled={!attacks.length}><option value="" disabled>Select an attack</option>{attacks.map(a=><option key={a.id} value={a.id}>{a.id} · {a.name}</option>)}</select></label>
        <div className="sim-presets">{presets.map(p=><button key={p.id} className={`preset-card ${preset===p.id?"active":""}`} onClick={()=>selectPreset(p.id)}><strong>{p.name}</strong><p>{p.events.toLocaleString()} events · {Math.round(p.fraud_rate*100)}% fraud</p></button>)}</div>
        <div className="sim-controls"><label className="control-group"><span>Events <b>{events.toLocaleString()}</b></span><input type="range" min="100" max="20000" step="100" value={events} onChange={e=>setEvents(+e.target.value)}/></label><label className="control-group"><span>Fraud rate <b>{Math.round(fraudRate*100)}%</b></span><input type="range" min=".05" max=".45" step=".05" value={fraudRate} onChange={e=>setFraudRate(+e.target.value)}/></label><label className="control-group"><span>Difficulty</span><select value={difficulty} onChange={e=>setDifficulty(e.target.value as any)}><option>low</option><option>medium</option><option>high</option><option>very-high</option></select></label><label className="control-group"><span>Adaptation</span><select value={adaptation} onChange={e=>setAdaptation(e.target.value as any)}><option value="static">Static</option><option value="adaptive">Adaptive</option><option value="adversarial">Adversarial</option></select></label><label className="control-group"><span>Noise</span><select value={noise} onChange={e=>setNoise(e.target.value as any)}><option>low</option><option>medium</option><option>high</option></select></label></div>
        {chosen && <div style={{marginTop:14,padding:12,background:"#0b1321",border:"1px solid #24344d",borderRadius:8}}><span className="mono">{chosen.id}</span><strong style={{display:"block",margin:"4px 0"}}>{chosen.name}</strong><p style={{margin:0,fontSize:10,color:"#8a97ae"}}>{chosen.description}</p></div>}
      </section>
      <section className="panel" style={{padding:18}}><div className="panel-head"><div><h2>Real Backend Results</h2><p>Generated counts and model evaluation come from FastAPI.</p></div>{result && <span className="badge badge-green">BACKEND VERIFIED</span>}</div>
        {!result ? <div className="attack-empty"><span>◌</span><h3>Ready</h3><p>Configure an attack and run the simulation.</p></div> : <><div className="metric-grid metric-grid-six" style={{marginTop:14}}>{[["Events",result.events_generated], ["Fraud",result.fraud_events], ["Attacks",result.attack_count], ["F1", detection ? `${(detection.metrics.f1*100).toFixed(1)}%` : "—"], ["Precision", detection ? `${(detection.metrics.precision*100).toFixed(1)}%` : "—"], ["Recall", detection ? `${(detection.metrics.recall*100).toFixed(1)}%` : "—"]].map(([k,v])=><div className="panel" style={{padding:12}} key={k as string}><span style={{fontSize:9,color:"#8a97ae"}}>{k}</span><strong style={{display:"block",fontSize:20,marginTop:5}}>{v as any}</strong></div>)}</div><div style={{marginTop:16}}><h3>Generated sample</h3><div style={{overflowX:"auto"}}><table className="matrix-table"><thead><tr><th>TXN</th><th>Rail</th><th>Amount</th><th>Fraud</th><th>Attack</th></tr></thead><tbody>{sample.slice(0,20).map((r:any)=><tr key={r.transaction_id}><td className="mono">{r.transaction_id}</td><td>{r.rail}</td><td>₹{Number(r.amount||0).toLocaleString()}</td><td>{r.ground_truth ? "YES" : "NO"}</td><td>{r.attack_id || "—"}</td></tr>)}</tbody></table></div></div><div style={{marginTop:14,display:"flex",gap:8}}><Link className="primary" href={`/generated-data?simulation=${encodeURIComponent(result.simulation_id)}`}>Open Generated Data →</Link>{sample[0]?.transaction_id && <Link className="date-select" href={`/investigation?transaction=${encodeURIComponent(sample[0].transaction_id)}`}>Investigate Sample →</Link>}</div></>}
      </section>
    </div>
  </div></AppShell>;
}
