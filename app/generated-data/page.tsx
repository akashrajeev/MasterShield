"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { getSimulationEvents } from "@/lib/api/simulations";

export default function GeneratedDataPage(){
 const [id,setId]=useState<string | null>(null); const [data,setData]=useState<any>(null); const [error,setError]=useState("");
 useEffect(()=>{const value=new URLSearchParams(window.location.search).get("simulation");setId(value);if(value)getSimulationEvents(value,100,0).then(setData).catch(e=>setError(e.message));},[]);
 return <AppShell title="Generated Data"><div className="page-container"><div className="page-head"><div><p className="eyebrow">SYNTHETIC PAYMENT EVENT WORKSPACE</p><h1>Generated Transaction Data</h1><p className="subtitle">Backend-generated records only. No real payment credentials or transactions are used.</p></div><Link href="/simulator" className="primary">New Simulation →</Link></div>{!id?<div className="panel attack-empty"><span>◌</span><h3>Select a simulation</h3><p>Run the Red Team Simulator first.</p></div>:error?<div className="panel" style={{padding:14,color:"#ff819c"}}>{error}</div>:!data?<div className="panel attack-empty"><span>◌</span><h3>Loading synthetic stream…</h3></div>:<section className="panel" style={{padding:18}}><div className="panel-head"><div><h2>{Number(data.total||0).toLocaleString()} generated events</h2><p>Showing first 100 records for investigation.</p></div><span className="badge badge-green">SYNTHETIC</span></div><div style={{overflowX:"auto",marginTop:12}}><table className="matrix-table"><thead><tr><th>Transaction</th><th>Timestamp</th><th>Rail</th><th>Amount</th><th>Velocity</th><th>Ground Truth</th><th>Attack</th></tr></thead><tbody>{data.events.map((r:any)=><tr key={r.transaction_id}><td className="mono">{r.transaction_id}</td><td>{new Date(r.timestamp).toLocaleString()}</td><td>{r.rail}</td><td>₹{Number(r.amount||0).toLocaleString()}</td><td>1h:{r.velocity_1h} · 24h:{r.velocity_24h}</td><td>{r.ground_truth?"FRAUD":"BENIGN"}</td><td>{r.attack_id||"—"}</td></tr>)}</tbody></table></div></section>}</div></AppShell>
}
