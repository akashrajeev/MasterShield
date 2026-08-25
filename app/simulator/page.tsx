"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { attacks } from "@/data/attacks";
import { AppShell } from "@/components/layout/AppShell";
export default function SimulatorPage(){return <AppShell title="Red Team Simulator"><Suspense fallback={<div className="simulator-placeholder">Loading simulation profile…</div>}><SimulatorContent/></Suspense></AppShell>}
function SimulatorContent(){const id=useSearchParams().get("attack");const attack=attacks.find(a=>a.id===id);return <div className="simulator-placeholder"><p className="eyebrow">RED TEAM · GENERATE</p><h1>{attack ? `Simulation: ${attack.name}` : "Launch a simulation"}</h1><p>{attack ? `${attack.id} has been passed from the Attack Library and preselected for this simulation session.` : "Select an attack from the Attack Library to prefill its simulation profile."}</p><div>{attack ? <><span className="attack-id">{attack.id}</span><span className="ready-pill">Simulation ready</span></> : <Link className="primary" href="/attack-library">Choose an attack →</Link>}</div><Link href="/attack-library">← Return to Attack Library</Link></div>}
