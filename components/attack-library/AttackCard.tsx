import Link from "next/link";
import type { Attack } from "@/types/attack";
import { categoryLabel } from "@/data/attacks";

const humanize = (value: string) => value.replaceAll("-", " ").replace(/\b\w/g, letter => letter.toUpperCase());
export function Badge({ value, kind }: { value: string; kind?: "severity" | "evidence" | "simulation" }) { return <span className={`attack-badge ${kind || ""} ${value}`}>{humanize(value)}</span>; }

export function AttackCard({ attack }: { attack: Attack }) {
  return <article className="attack-card">
    <div className="attack-card-top"><span className="attack-id">{attack.id}</span><Badge value={attack.severity} kind="severity" /></div>
    <Link href={`/attack-library/${attack.id}`} className="attack-card-title">{attack.name}</Link>
    <p className="attack-category">{categoryLabel[attack.category]}</p>
    <p className="attack-description">{attack.description}</p>
    <div className="attack-meta"><span><b>RAILS</b>{attack.paymentRails.slice(0, 3).join(" · ")}</span><span><b>AI CAPABILITY</b>{attack.aiCapabilities.slice(0, 2).join(" + ")}</span></div>
    <div className="attack-status"><span className={`evidence-dot ${attack.evidenceStatus}`}>● {attack.evidenceStatus === "documented" ? "Real precedent" : attack.evidenceStatus === "research" ? "Research-stage" : "Emerging"}</span><span className={`simulation-dot ${attack.simulationStatus}`}>{attack.simulationStatus === "ready" ? "● Simulation ready" : attack.simulationStatus === "in-development" ? "○ In development" : "— Research only"}</span></div>
    <p className="attack-defense"><b>DEFENSE</b>{attack.defenseStrategy[0]}</p>
    <div className="attack-card-actions"><Link href={`/attack-library/${attack.id}`}>View intelligence <span>→</span></Link>{attack.simulationStatus === "ready" && <Link href={`/simulator?attack=${attack.id}`} className="simulate-mini">Simulate</Link>}</div>
  </article>
}
